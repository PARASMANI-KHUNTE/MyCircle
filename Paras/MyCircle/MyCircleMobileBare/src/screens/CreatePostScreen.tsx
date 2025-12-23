import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getCurrentLocation } from '../utils/location';
import { MapPin, ChevronDown, Check, Map, Crosshair, X, Camera, Briefcase, Wrench, ShoppingBag, Package, ArrowRight, ArrowLeft, Handshake, Clock } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import Stepper from '../components/ui/Stepper';

const CreatePostScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const searchTimeout = React.useRef<any>(null);

    // Wizard State
    const [step, setStep] = useState(1);
    const steps = ['Category', 'Details', 'Exchange', 'Review'];

    // Form Data
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('job');
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
    // 'search' | 'detect' | 'pin'
    const [locationMethod, setLocationMethod] = useState<'search' | 'detect' | 'pin'>('search');
    const [images, setImages] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const categories = [
        { id: 'job', label: 'Post a Job', sub: 'Hire help for tasks', icon: Briefcase },
        { id: 'service', label: 'Offer Service', sub: 'Share your skills', icon: Wrench },
        { id: 'sell', label: 'Sell Item', sub: 'Declutter your home', icon: ShoppingBag },
        { id: 'rent', label: 'Rent Item', sub: 'Lend out equipment', icon: Package },
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

    const handleGetLocation = async () => {
        setLocationLoading(true);
        const loc = await getCurrentLocation();
        if (loc) {
            setLocation(loc.address);
            setCoordinates({ lat: loc.latitude, lng: loc.longitude });
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

            images.forEach((image) => {
                formData.append('images', image as any);
            });

            await api.post('/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Post created successfully!');
            navigation.navigate('Feed');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to create post. ' + (error.response?.data?.msg || error.message));
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
                            style={[
                                styles.card,
                                isSelected ? themeStyles.active : themeStyles.inactive,
                            ]}
                            onPress={() => setType(cat.id)}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: isSelected ? colors.primary : colors.input }]}>
                                <Icon size={24} color={isSelected ? '#fff' : colors.textSecondary} />
                            </View>
                            <Text style={[styles.cardTitle, themeStyles.text, isSelected && { color: colors.primary }]}>{cat.label}</Text>
                            <Text style={[styles.cardSub, themeStyles.textSecondary]}>{cat.sub}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, themeStyles.text]}>Post Details</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Title</Text>
                <TextInput
                    style={[styles.input, themeStyles.input]}
                    placeholder="E.g., Need a plumber, Selling iPhone 13"
                    placeholderTextColor={colors.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea, themeStyles.input]}
                    placeholder="Describe what you need or what you are offering..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
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
            <Text style={[styles.stepTitle, themeStyles.text]}>Exchange & Location</Text>

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
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 32, marginTop: 4 }}>
                    Enable this if you are willing to exchange goods/services instead of money.
                </Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Duration (Auto-disable post after)</Text>
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

            <View style={styles.inputGroup}>
                <Text style={[styles.label, themeStyles.textSecondary]}>Location Method</Text>
                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    {['search', 'detect', 'pin'].map((method) => {
                        const isActive = locationMethod === method;
                        return (
                            <TouchableOpacity
                                key={method}
                                onPress={() => {
                                    setLocationMethod(method as any);
                                    // Optional: Clear location when switching to avoid confusion?
                                    // For now, let's keep it to allow correcting a wrong pick without retyping if switching back.
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
                            {/* Keep Chevron as visual indicator or manual trigger if needed, but for now it just focuses or does nothing special */}
                            <TouchableOpacity
                                style={[styles.selectCityButton, { borderColor: colors.border, backgroundColor: colors.input }]}
                                onPress={() => { }}
                            >
                                <ChevronDown size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Suggestions Dropdown */}
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
                            <Text style={[themeStyles.text, { marginTop: 12, textAlign: 'center' }]}>Detected: {location}</Text>
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'center' }}>
                                <Check size={16} color={colors.success} />
                                <Text style={{ color: colors.success, marginLeft: 6 }}>Location Pinned Successfully</Text>
                            </View>
                        )}
                    </View>
                )}

                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 12, fontStyle: 'italic', textAlign: 'center' }}>
                    *Please use a valid location to list your post on the Feed Map
                </Text>

            </View>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, themeStyles.text]}>Review</Text>

            <View style={[styles.reviewCard, themeStyles.card]}>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Type</Text>
                    <Text style={[styles.reviewValue, themeStyles.text]}>{categories.find(c => c.id === type)?.label}</Text>
                </View>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Title</Text>
                    <Text style={[styles.reviewValue, themeStyles.text]}>{title}</Text>
                </View>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Price/Budget</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.reviewValue, { color: colors.primary, fontWeight: 'bold' }]}>₹ {price}</Text>
                        {acceptsBarter && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <Handshake size={12} color={colors.textSecondary} />
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>Barter/Favour</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Duration</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Clock size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.reviewValue, themeStyles.text]}>{durations.find(d => d.value === duration)?.label}</Text>
                    </View>
                </View>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Location</Text>
                    <Text style={[styles.reviewValue, themeStyles.text]} numberOfLines={1}>{location}</Text>
                </View>

                <View style={{ marginTop: 16 }}>
                    <Text style={styles.reviewLabel}>Description</Text>
                    <Text style={[styles.reviewValue, themeStyles.text, { marginTop: 4, lineHeight: 20 }]}>{description}</Text>
                </View>

                {images.length > 0 && (
                    <View style={{ marginTop: 16 }}>
                        <Text style={styles.reviewLabel}>Images ({images.length})</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                            {images.map((img, i) => (
                                <Image key={i} source={{ uri: img.uri }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 8, backgroundColor: colors.input }} />
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );

    const goNext = () => {
        if (step === 1 && !type) return Alert.alert('Error', 'Please select a category');
        if (step === 2 && (!title || !description)) return Alert.alert('Error', 'Please fill in title and description');

        if (step === 3) {
            // Price is optional if Barter is accepted
            if (!acceptsBarter && !price) {
                return Alert.alert('Error', 'Please enter a price or enable Barter');
            }
            // Location is valid if text exists OR coordinates are pinned
            if (!location && !coordinates) {
                return Alert.alert('Error', 'Please select a location');
            }
        }

        if (step < 4) setStep(step + 1);
        else handleCreate();
    };

    const goBack = () => {
        if (step > 1) setStep(step - 1);
        else navigation.goBack();
    };

    return (
        <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top']}>
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

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </ScrollView>

            <View style={[styles.footer, themeStyles.border]}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Text style={{ color: colors.textSecondary }}>{step === 1 ? 'Cancel' : 'Back'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={goNext} style={[styles.nextButton, { backgroundColor: colors.primary }]}>
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{step === 4 ? 'Create Post' : 'Next Step'}</Text>
                            {step < 4 && <ArrowRight size={18} color="white" style={{ marginLeft: 8 }} />}
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
                            <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>body { margin: 0; padding: 0; } #map { height: 100vh; width: 100vw; }</style></head><body><div id="map"></div><script>
                                var map = L.map('map').setView([${coordinates?.lat || 28.6139}, ${coordinates?.lng || 77.2090}], 13);
                                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
                                var marker; ${coordinates ? `marker = L.marker([${coordinates.lat}, ${coordinates.lng}]).addTo(map);` : ''}
                                map.on('click', function(e) { if (marker) map.removeLayer(marker); marker = L.marker(e.latlng).addTo(map); window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng })); });
                            </script></body></html>
                        `}}
                        onMessage={(event) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                setCoordinates({ lat: data.lat, lng: data.lng });
                                Alert.alert("Location Pinned", "Coordinates updated!");
                                setShowMapModal(false);
                            } catch (e) { console.error(e); }
                        }}
                    />
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    stepContainer: { flex: 1 },
    stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
    cardSub: { fontSize: 12, textAlign: 'center' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000' }, // dark bg for footer
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
    reviewCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    reviewLabel: { color: '#71717a', fontSize: 14 },
    reviewValue: { fontSize: 16, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
    modalContent: { flex: 1, backgroundColor: '#000' },
    methodTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, marginRight: 8 },
    suggestionsList: { maxHeight: 200, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden' },
    suggestionItem: { padding: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' }
});

export default CreatePostScreen;
