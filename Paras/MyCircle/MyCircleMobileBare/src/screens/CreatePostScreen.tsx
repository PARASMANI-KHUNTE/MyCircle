import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import ThemedAlert from '../components/ui/ThemedAlert';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getCurrentLocation } from '../utils/location';
import { MapPin, ChevronDown, Check, Map, Crosshair, X, Camera, Briefcase, Wrench, ShoppingBag, Package, ArrowRight, ArrowLeft, Handshake, Clock, User, Zap, MessageCircle, ShoppingCart, Key } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import Stepper from '../components/ui/Stepper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GlassView from '../components/ui/GlassView';

const CreatePostScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const searchTimeout = React.useRef<any>(null);
    const webviewRef = React.useRef<any>(null);

    // Wizard State
    const [step, setStep] = useState(1);
    const steps = ['Category', 'Details', 'Location', 'Exchange', 'Review'];

    // Form Data
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('job');
    const [subType, setSubType] = useState(''); // hiring/seeking, offering/requesting, sell/rent
    const [location, setLocation] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null);
    const [price, setPrice] = useState('');
    const [acceptsBarter, setAcceptsBarter] = useState(false);
    // Duration in minutes. Default 28 days (40320)
    const durations = [
        { label: '15 Mins', value: 15 },
        { label: '3 Hours', value: 180 },
        { label: '7 Days', value: 10080 },
        { label: '28 Days', value: 40320 },
    ];
    const [duration, setDuration] = useState(40320); // Default to 28 days
    const [isUrgent, setIsUrgent] = useState(false);
    const [exchangePreference, setExchangePreference] = useState<'money' | 'barter' | 'flexible'>('money');
    // 'search' | 'detect' | 'pin'
    const [locationMethod, setLocationMethod] = useState<'search' | 'detect' | 'pin'>('search');
    const [images, setImages] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        isDestructive: boolean;
    }>({
        visible: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: () => { },
        isDestructive: false,
    });

    const categories = [
        { id: 'job', label: 'Job Post', sub: 'Hire help for tasks', icon: Briefcase },
        { id: 'service', label: 'Offering Services', sub: 'Share your skills', icon: Package },
        { id: 'sell', label: 'Sell or Rent', sub: 'List items, homes, etc.', icon: ShoppingBag },
    ];

    const pickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
            selectionLimit: 5,
        });

        if (result.assets) {
            const newImages = result.assets.map(asset => ({
                uri: asset.uri,
                name: asset.fileName || `image_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
            }));
            setImages([...images, ...newImages]);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`, { headers: { 'User-Agent': 'MyCircleApp/1.0' } });
            const data = await response.json();
            if (data.display_name) {
                let display = data.display_name;
                const parts = display.split(', ');
                if (parts.length > 3) {
                    return `${parts[0]}, ${parts[1]}`;
                }
                return display;
            }
        } catch (e) {
            console.error('Reverse Geocode Error:', e);
        }
        return `Pinned Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
    };

    const handleGetLocation = async () => {
        setLocationLoading(true);
        const loc = await getCurrentLocation();
        if (loc) {
            setCoordinates({ lat: loc.latitude, lng: loc.longitude });
            const address = await reverseGeocode(loc.latitude, loc.longitude);
            setLocation(address);
        }
        setLocationLoading(false);
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            if (subType) {
                formData.append('subType', subType);
            }
            if (acceptsBarter) {
                formData.append('acceptsBarter', 'true');
            }
            // Fallback for location text if only coordinates are provided
            formData.append('location', location || (coordinates ? `Pinned Location (${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)})` : 'Unknown Location'));

            if (coordinates) {
                formData.append('latitude', coordinates.lat.toString());
                formData.append('longitude', coordinates.lng.toString());
            }
            // Default price to 0 if barter or empty
            formData.append('price', price || '0');
            formData.append('duration', duration.toString());
            formData.append('isUrgent', isUrgent.toString());
            formData.append('exchangePreference', exchangePreference);

            images.forEach((image) => {
                formData.append('images', image as any);
            });

            await api.post('/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setAlertConfig({
                visible: true,
                title: 'Success',
                message: 'Post created successfully!',
                confirmText: 'Great',
                isDestructive: false,
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    // Reset all form state
                    setStep(1);
                    setTitle('');
                    setDescription('');
                    setSubType('');
                    setType('job');
                    setLocation('');
                    setCoordinates(null);
                    setPrice('');
                    setAcceptsBarter(false);
                    setDuration(40320);
                    setIsUrgent(false);
                    setExchangePreference('money');
                    setImages([]);
                    navigation.navigate('Feed');
                }
            });
        } catch (error: any) {
            console.error(error);
            const serverMsg = error?.response?.data?.msg || error?.response?.data?.error;
            const reason = error?.response?.data?.reason;
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Failed to create post. ' + (reason || serverMsg || error.message),
                confirmText: 'OK',
                isDestructive: false,
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    const themeStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        input: { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
        border: { borderColor: colors.border },
        active: { backgroundColor: colors.primary + '20', borderColor: colors.primary }, // 20 opacity
        inactive: { backgroundColor: colors.card, borderColor: colors.border },
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, themeStyles.text]}>Select a Category</Text>
            <View style={styles.grid}>
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = type === cat.id;
                    return (
                        <TouchableOpacity
                            key={cat.id}
                            style={{ width: '48%', marginBottom: 12 }}
                            onPress={() => setType(cat.id)}
                            activeOpacity={0.8}
                        >
                            <GlassView
                                intensity={isSelected ? 30 : 10}
                                style={[
                                    styles.card,
                                    {
                                        width: '100%',
                                        borderColor: isSelected ? colors.primary : colors.border,
                                        backgroundColor: isSelected ? colors.primary + '20' : undefined
                                    }
                                ]}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: isSelected ? colors.primary : colors.input }]}>
                                    <Icon size={24} color={isSelected ? '#fff' : colors.textSecondary} />
                                </View>
                                <Text style={[styles.cardTitle, themeStyles.text, isSelected && { color: colors.primary }]}>{cat.label}</Text>
                                <Text style={[styles.cardSub, themeStyles.textSecondary]}>{cat.sub}</Text>
                            </GlassView>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const getPlaceholders = () => {
        const isSeeking = subType === 'seeking' || subType === 'requesting' || subType === 'rent';

        switch (type) {
            case 'job':
                return {
                    title: isSeeking ? "e.g. Graphic Designer seeking remote work" : "e.g. Need a Web Developer, Delivery Driver",
                    description: isSeeking ? "Describe your skills, experience, and what kind of role you are looking for..." : "Describe the role, requirements, and any specific details for applicants..."
                };
            case 'service':
                return {
                    title: isSeeking ? "e.g. Looking for a Mathematics Tutor" : "e.g. Professional Electrician, Yoga Trainer",
                    description: isSeeking ? "Describe what service you need, what's your budget, and when you need it..." : "List your services, experience, tools you bring, and availability..."
                };
            case 'sell':
                return {
                    title: subType === 'rent' ? "e.g. 2BHK Flat for Rent in Delhi" : "e.g. Selling Honda City, iPhone 15",
                    description: subType === 'rent' ? "Details about rent, security deposit, amenities, and location..." : "Details about condition, age, features, and any terms for sale..."
                };
            default:
                return {
                    title: "E.g., Need a plumber, Selling iPhone 15",
                    description: "Describe what you need or what you are offering..."
                };
        }
    };

    const getSubTypes = () => {
        switch (type) {
            case 'job':
                return [
                    { id: 'hiring', label: 'I am Hiring', icon: Briefcase },
                    { id: 'seeking', label: 'I am Seeking a Job', icon: User }
                ];
            case 'service':
                return [
                    { id: 'offering', label: 'Offering a Service', icon: Zap },
                    { id: 'requesting', label: 'Requesting a Service', icon: MessageCircle }
                ];
            case 'sell':
                return [
                    { id: 'sell', label: 'For Sale', icon: ShoppingCart },
                    { id: 'rent', label: 'For Rent', icon: Key }
                ];
            default:
                return [];
        }
    };

    const placeholders = getPlaceholders();
    const subTypes = getSubTypes();

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, themeStyles.text]}>Post Details</Text>

            {/* Sub-type Selection */}
            <View style={{ marginBottom: 24 }}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Specifically, are you...</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {subTypes.map((st) => (
                        <TouchableOpacity
                            key={st.id}
                            onPress={() => setSubType(st.id)}
                            style={[
                                styles.subTypePill,
                                {
                                    backgroundColor: subType === st.id ? colors.primary : colors.input,
                                    borderColor: subType === st.id ? colors.primary : colors.border
                                }
                            ]}
                        >
                            <Text style={{
                                color: subType === st.id ? '#fff' : colors.text,
                                fontWeight: subType === st.id ? 'bold' : 'normal',
                                fontSize: 13
                            }}>
                                {st.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>


            <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.label, themeStyles.textSecondary]}>Title</Text>
                    <Text style={{ fontSize: 12, color: title.length > 90 ? '#f59e0b' : colors.textSecondary }}>
                        {title.length}/100
                    </Text>
                </View>
                <TextInput
                    style={[styles.input, themeStyles.input]}
                    placeholder={placeholders.title}
                    placeholderTextColor={colors.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />
            </View>

            <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.label, themeStyles.textSecondary]}>Description</Text>
                    <Text style={{ fontSize: 12, color: description.length > 900 ? '#f59e0b' : colors.textSecondary }}>
                        {description.length}/1000
                    </Text>
                </View>
                <TextInput
                    style={[styles.input, styles.textArea, themeStyles.input]}
                    placeholder={placeholders.description}
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                    maxLength={1000}
                />
            </View>

            <View style={styles.imageSection}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Images (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScrollContent}>
                    <TouchableOpacity
                        onPress={pickImage}
                        style={[styles.addPhotoButton, { backgroundColor: colors.input, borderColor: colors.border }]}
                    >
                        <Camera size={24} color={colors.textSecondary} />
                        <Text style={[styles.addPhotoText, themeStyles.textSecondary]}>Add</Text>
                    </TouchableOpacity>

                    {images.map((img, index) => (
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri: img.uri }} style={[styles.imagePreview, { backgroundColor: colors.input }]} />
                            <TouchableOpacity
                                onPress={() => removeImage(index)}
                                style={styles.removeImageButton}
                            >
                                <X size={12} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, themeStyles.text]}>Post Location</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Selection Method</Text>
                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    {['search', 'detect', 'pin'].map((method) => {
                        const isActive = locationMethod === method;
                        return (
                            <TouchableOpacity
                                key={method}
                                onPress={() => {
                                    setLocationMethod(method as any);
                                }}
                                style={[
                                    styles.methodTab,
                                    isActive ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border }
                                ]}
                            >
                                <Text style={{ color: isActive ? 'white' : colors.textSecondary, fontWeight: isActive ? 'bold' : 'normal', textTransform: 'capitalize' }}>
                                    {method === 'detect' ? 'Detect GPS' : method}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {locationMethod === 'search' && (
                    <View style={{ marginBottom: 16, zIndex: 10 }}>
                        <View style={styles.locationInputWrapper}>
                            <TextInput
                                style={[styles.input, themeStyles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                                placeholder="Search City / Area"
                                placeholderTextColor={colors.textSecondary}
                                value={location}
                                onChangeText={(text) => {
                                    setLocation(text);
                                    if (searchTimeout.current) clearTimeout(searchTimeout.current);
                                    if (text.length > 2) {
                                        searchTimeout.current = setTimeout(async () => {
                                            try {
                                                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=5`, { headers: { 'User-Agent': 'MyCircleApp/1.0' } });
                                                const data = await response.json();
                                                setSearchResults(data);
                                            } catch (e) { console.error(e); }
                                        }, 500);
                                    } else {
                                        setSearchResults([]);
                                    }
                                }}
                            />
                            <TouchableOpacity
                                style={[styles.selectCityButton, { borderColor: colors.border, backgroundColor: colors.input }]}
                                onPress={() => { }}
                            >
                                <ChevronDown size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {searchResults.length > 0 && (
                            <View style={[styles.suggestionsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                {searchResults.map((item: any, idx: number) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                                        onPress={() => {
                                            let display = item.display_name;
                                            const parts = display.split(', ');
                                            if (parts.length > 2) display = `${parts[0]}, ${parts[1]}`;
                                            setLocation(display);
                                            if (item.lat && item.lon) setCoordinates({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
                                            setSearchResults([]);
                                        }}
                                    >
                                        <MapPin size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: colors.text, fontWeight: 'bold' }}>{item.display_name.split(',')[0]}</Text>
                                            <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>{item.display_name}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {locationMethod === 'detect' && (
                    <View style={{ alignItems: 'center', padding: 20, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}>
                        <TouchableOpacity onPress={handleGetLocation} disabled={locationLoading} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '20', padding: 12, borderRadius: 8 }}>
                            {locationLoading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <>
                                    <Crosshair size={20} color={colors.primary} />
                                    <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: 8 }}>Detect Current Location</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        {location ? (
                            <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.input, borderRadius: 8, width: '100%', alignItems: 'center', flexDirection: 'row' }}>
                                <Check size={16} color={colors.primary} />
                                <Text style={[themeStyles.text, { marginLeft: 8, flex: 1 }]}>{location}</Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {locationMethod === 'pin' && (
                    <View>
                        <TouchableOpacity
                            onPress={() => setShowMapModal(true)}
                            style={[styles.pinMapButton, { borderColor: colors.primary, backgroundColor: colors.primary + '10', justifyContent: 'center', paddingVertical: 16 }]}
                        >
                            <Map size={24} color={colors.primary} />
                            <Text style={{ color: colors.primary, marginLeft: 8, fontWeight: 'bold', fontSize: 16 }}>
                                {coordinates ? 'Update Pin' : 'Open Map'}
                            </Text>
                        </TouchableOpacity>
                        {coordinates && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'center', backgroundColor: colors.primary + '10', padding: 8, borderRadius: 8 }}>
                                <Check size={16} color={colors.primary} />
                                <Text style={{ color: colors.primary, marginLeft: 6, fontWeight: '500' }}>Location Pinned Successfully</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ marginTop: 24, padding: 16, backgroundColor: colors.primary + '05', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.primary }}>
                    <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}>
                        <Text style={{ fontWeight: 'bold' }}>Why is this important?</Text>{'\n'}
                        Accurate location helps nearby users find your post on the map and ensures you get relevant responses.
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, themeStyles.text]}>Exchange & Details</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Price / Budget ({type === 'job' ? '₹ Budget' : '₹ Price'})</Text>
                <TextInput
                    style={[styles.input, themeStyles.input]}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                />
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}
                    onPress={() => setAcceptsBarter(!acceptsBarter)}
                >
                    <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: acceptsBarter ? colors.primary : colors.textSecondary, alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: acceptsBarter ? colors.primary : 'transparent' }}>
                        {acceptsBarter && <Check size={16} color="white" />}
                    </View>
                    <Handshake size={20} color={acceptsBarter ? colors.primary : colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={{ color: colors.text, fontSize: 16 }}>Open to Barter / Favour</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Exchange Preference</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['money', 'barter', 'flexible'] as const).map((pref) => {
                        const isSelected = exchangePreference === pref;
                        const labels = { money: '💵 Money', barter: '🤝 Barter', flexible: '🔄 Flexible' };
                        return (
                            <TouchableOpacity
                                key={pref}
                                onPress={() => setExchangePreference(pref)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    backgroundColor: isSelected ? colors.primary : colors.card,
                                    borderColor: isSelected ? colors.primary : colors.border,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ color: isSelected ? 'white' : colors.text, fontWeight: isSelected ? 'bold' : 'normal' }}>
                                    {labels[pref]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Post Visibility & Boost</Text>
                <TouchableOpacity
                    onPress={() => setIsUrgent(!isUrgent)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: isUrgent ? colors.primary + '20' : colors.card, borderRadius: 12, borderWidth: 1, borderColor: isUrgent ? colors.primary : colors.border }}
                >
                    <Clock size={20} color={isUrgent ? colors.primary : colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={{ color: colors.text, fontSize: 16, flex: 1 }}>Urgent Post (Highlight & Boost)</Text>
                    {isUrgent && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Duration (Auto-disable after)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8 }}>
                    {durations.map((d) => {
                        const isSelected = duration === d.value;
                        return (
                            <TouchableOpacity
                                key={d.value}
                                onPress={() => setDuration(d.value)}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    backgroundColor: isSelected ? colors.primary : colors.card,
                                    borderColor: isSelected ? colors.primary : colors.border,
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}
                            >
                                {isSelected && <Check size={14} color="white" style={{ marginRight: 6 }} />}
                                <Text style={{ color: isSelected ? 'white' : colors.textSecondary, fontWeight: isSelected ? 'bold' : 'normal' }}>
                                    {d.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );

    const renderStep5 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, themeStyles.text]}>Preview Your Post</Text>

            {/* Styled Preview Card */}
            <GlassView intensity={15} style={[styles.previewCard, { borderColor: colors.border }]}>
                {/* Header with badges */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ backgroundColor: getCategoryColor(type), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>{subType || type}</Text>
                        </View>
                        {isUrgent && (
                            <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>🔥 URGENT</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                            {exchangePreference === 'money' ? '💵 Money' : exchangePreference === 'barter' ? '🤝 Barter' : '🔄 Flexible'}
                        </Text>
                    </View>
                </View>

                {/* Images Preview */}
                {images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {images.map((img, i) => (
                            <Image key={i} source={{ uri: img.uri }} style={{ width: 100, height: 100, borderRadius: 12, marginRight: 8, backgroundColor: colors.input }} />
                        ))}
                    </ScrollView>
                )}

                {/* Title */}
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{title || 'No title'}</Text>

                {/* Description */}
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 12 }} numberOfLines={3}>
                    {description || 'No description'}
                </Text>

                {/* Price & Barter */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: colors.primary, fontSize: 20, fontWeight: 'bold' }}>₹ {price || '0'}</Text>
                    {acceptsBarter && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                            <Handshake size={14} color={colors.textSecondary} />
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>Open to Barter</Text>
                        </View>
                    )}
                </View>

                {/* Meta info */}
                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MapPin size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={1}>{location || 'No location set'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Clock size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Expires in {durations.find(d => d.value === duration)?.label}</Text>
                    </View>
                </View>
            </GlassView>

            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
                This is how your post will appear to others
            </Text>
        </View >
    );

    const getCategoryColor = (catId: string) => {
        switch (catId) {
            case 'job': return '#3b82f6';
            case 'service': return '#06b6d4';
            case 'sell': return '#f59e0b';
            case 'rent': return '#8b5cf6';
            default: return '#fb7185'; // pink-400
        }
    };

    const showAlert = (title: string, message: string) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            confirmText: 'OK',
            isDestructive: false,
            onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
    };

    const goNext = () => {
        if (step === 1 && !type) return showAlert('Error', 'Please select a category');
        if (step === 2 && (!title || !description)) return showAlert('Error', 'Please fill in title and description');
        if (step === 3 && !location && !coordinates) return showAlert('Error', 'Please select a location');
        if (step === 4) {
            // Price is optional if Barter is accepted
            if (!acceptsBarter && !price) {
                return showAlert('Error', 'Please enter a price or enable Barter');
            }
        }

        if (step < 5) setStep(step + 1);
        else handleCreate();
    };

    const goBack = () => {
        if (step > 1) setStep(step - 1);
        else navigation.goBack();
    };

    return (
        <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top', 'bottom']}>
            <View style={[styles.header, themeStyles.border]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, themeStyles.text]}>Create New Post</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={{ padding: 16 }}>
                <Stepper currentStep={step} steps={steps} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {step === 1 && (
                        <Animated.View entering={FadeInDown.springify()}>
                            {renderStep1()}
                        </Animated.View>
                    )}
                    {step === 2 && (
                        <Animated.View entering={FadeInDown.springify()}>
                            {renderStep2()}
                        </Animated.View>
                    )}
                    {step === 3 && (
                        <Animated.View entering={FadeInDown.springify()}>
                            {renderStep3()}
                        </Animated.View>
                    )}
                    {step === 4 && (
                        <Animated.View entering={FadeInDown.springify()}>
                            {renderStep4()}
                        </Animated.View>
                    )}
                    {step === 5 && (
                        <Animated.View entering={FadeInDown.springify()}>
                            {renderStep5()}
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Text style={{ color: colors.text }}>{step === 1 ? 'Cancel' : 'Back'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={goNext} style={[styles.nextButton, { backgroundColor: colors.primary }]}>
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{step === 5 ? 'Create Post' : 'Next Step'}</Text>
                            {step < 5 && <ArrowRight size={18} color="white" style={{ marginLeft: 8 }} />}
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modals for Location (Existing logic reused) */}
            <Modal visible={showCityModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCityModal(false)}>
                <View style={[styles.modalContent, { backgroundColor: colors.background, flex: 1, width: '100%', padding: 0 }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { fontSize: 18, color: colors.text }]}>Search Location</Text>
                        <TouchableOpacity onPress={() => setShowCityModal(false)}><X size={24} color={colors.text} /></TouchableOpacity>
                    </View>
                    <View style={{ padding: 16 }}>
                        <TextInput
                            style={[styles.input, themeStyles.input, { marginBottom: 16 }]}
                            placeholder="Type a city..."
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                            onChangeText={async (text) => {
                                if (text.length > 2) {
                                    try {
                                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=5`, { headers: { 'User-Agent': 'MyCircleApp/1.0' } });
                                        const data = await response.json();
                                        setSearchResults(data);
                                    } catch (e) { console.error(e); }
                                }
                            }}
                        />
                        <ScrollView keyboardShouldPersistTaps="handled">
                            {searchResults.map((item: any, idx: number) => (
                                <TouchableOpacity key={idx} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => {
                                    let display = item.display_name;
                                    const parts = display.split(', ');
                                    if (parts.length > 2) display = `${parts[0]}, ${parts[1]}`;
                                    setLocation(display);
                                    if (item.lat && item.lon) setCoordinates({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
                                    setShowCityModal(false);
                                    setSearchResults([]);
                                }}>
                                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{item.display_name.split(',')[0]}</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.display_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showMapModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMapModal(false)}>
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { fontSize: 18, color: colors.text }]}>Pin Location</Text>
                        <TouchableOpacity onPress={() => setShowMapModal(false)}><X size={24} color={colors.text} /></TouchableOpacity>
                    </View>
                    <WebView
                        originWhitelist={['*']}
                        source={{
                            html: `
                            <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>
                                body { margin: 0; padding: 0; background: #09090b; } 
                                #map { height: 100vh; width: 100vw; }
                                .locate-btn {
                                    position: absolute;
                                    bottom: 30px;
                                    right: 20px;
                                    width: 50px;
                                    height: 50px;
                                    background: #8b5cf6;
                                    border-radius: 25px;
                                    z-index: 1000;
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                                    color: white;
                                    border: none;
                                }
                                .crosshair { width: 24px; height: 24px; border: 2px solid white; border-radius: 12px; position: relative; }
                                .crosshair::after { content: ''; position: absolute; top: 10px; left: 10px; width: 4px; height: 4px; background: white; border-radius: 2px; }
                            </style></head><body>
                                <div id="map"></div>
                                <button class="locate-btn" onclick="requestLoc()">
                                    <div class="crosshair"></div>
                                </button>
                                <script>
                                    var map = L.map('map', { zoomControl: false }).setView([${coordinates?.lat || 28.6139}, ${coordinates?.lng || 77.2090}], 15);
                                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
                                    var marker; 
                                    if (${!!coordinates}) {
                                        marker = L.marker([${coordinates?.lat || 0}, ${coordinates?.lng || 0}]).addTo(map);
                                    }
                                    
                                    map.on('click', function(e) { 
                                        if (marker) map.removeLayer(marker); 
                                        marker = L.marker(e.latlng).addTo(map); 
                                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location', lat: e.latlng.lat, lng: e.latlng.lng })); 
                                    });

                                    window.requestLoc = function() {
                                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestLoc' }));
                                    };

                                    window.updateCenter = function(lat, lng) {
                                        map.flyTo([lat, lng], 16);
                                        if (marker) map.removeLayer(marker);
                                        marker = L.marker([lat, lng]).addTo(map);
                                    };
                                </script></body></html>
                        `}}
                        ref={webviewRef}
                        onMessage={async (event) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                if (data.type === 'location') {
                                    const coords = { lat: data.lat, lng: data.lng };
                                    setCoordinates(coords);
                                    const address = await reverseGeocode(data.lat, data.lng);
                                    setLocation(address);
                                } else if (data.type === 'requestLoc') {
                                    const loc = await getCurrentLocation();
                                    if (loc) {
                                        const coords = { lat: loc.latitude, lng: loc.longitude };
                                        setCoordinates(coords);
                                        const address = await reverseGeocode(loc.latitude, loc.longitude);
                                        setLocation(address);
                                        // Inject back into webview
                                        webviewRef.current?.injectJavaScript(`window.updateCenter(${loc.latitude}, ${loc.longitude})`);
                                    }
                                }
                            } catch (e) { console.error(e); }
                        }}
                    />
                    <View style={{ padding: 20, backgroundColor: colors.background }}>
                        <TouchableOpacity
                            style={[styles.nextButton, { backgroundColor: colors.primary, width: '100%' }]}
                            onPress={() => {
                                if (coordinates) {
                                    showAlert("Location Set", "Post location has been updated.");
                                    setShowMapModal(false);
                                } else {
                                    showAlert("No Location", "Please tap on map to pin location.");
                                }
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm Pin Location</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ThemedAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                isDestructive={alertConfig.isDestructive}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 24 }, // Reduced padding as footer is no longer absolute
    stepContainer: { flex: 1 },
    stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
    cardSub: { fontSize: 12, textAlign: 'center' },
    footer: { padding: 16, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, // removed position absolute
    backButton: { padding: 16 },
    nextButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    inputGroup: { marginBottom: 20 },
    label: { marginBottom: 8, fontSize: 14, marginLeft: 4 },
    input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
    textArea: { height: 120, paddingTop: 12 },
    imageSection: { marginBottom: 24 },
    photoScrollContent: { paddingVertical: 8 },
    addPhotoButton: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    addPhotoText: { fontSize: 10, marginTop: 4 },
    imageWrapper: { width: 80, height: 80, marginRight: 12, position: 'relative' },
    imagePreview: { width: '100%', height: '100%', borderRadius: 12 },
    removeImageButton: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, padding: 2 },
    locationInputWrapper: { flexDirection: 'row', alignItems: 'center' },
    selectCityButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderLeftWidth: 0, borderTopRightRadius: 12, borderBottomRightRadius: 12 },
    pinMapButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
    previewCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
    methodTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderRadius: 8, marginHorizontal: 2 },
    suggestionsList: { position: 'absolute', top: 55, left: 0, right: 0, borderRadius: 12, borderWidth: 1, zIndex: 1000, elevation: 5 },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
    modalContent: { padding: 16 },
    typePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    subTypePill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CreatePostScreen;
