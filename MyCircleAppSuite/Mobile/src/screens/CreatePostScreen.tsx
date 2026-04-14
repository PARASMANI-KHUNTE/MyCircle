import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, Modal, KeyboardAvoidingView, Platform, Dimensions, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { launchImageLibrary } from 'react-native-image-picker';
import { MapPin, ChevronDown, Check, Map, Crosshair, X, Camera, Briefcase, Wrench, ShoppingBag, Package, ArrowRight, ArrowLeft, Handshake, Clock, User, Zap, MessageCircle, ShoppingCart, Key, Info, Send } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import api from '../services/api';
import { getCurrentLocation } from '../utils/location';
import ThemedAlert from '../components/ui/ThemedAlert';
import Stepper from '../components/ui/Stepper';

const CreatePostScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const webviewRef = useRef<any>(null);

    // Wizard State
    const [step, setStep] = useState(1);
    const steps = ['Category', 'Details', 'Location', 'Exchange', 'Review'];

    // Form Data
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('job');
    const [subType, setSubType] = useState('');
    const [location, setLocation] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null);
    const [price, setPrice] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [availability, setAvailability] = useState('');
    const [acceptsBarter, setAcceptsBarter] = useState(false);
    const [duration, setDuration] = useState(40320); // 28 days
    const [isUrgent, setIsUrgent] = useState(false);
    const [exchangePreference, setExchangePreference] = useState<'money' | 'barter' | 'flexible'>('money');
    const [locationMethod, setLocationMethod] = useState<'detect' | 'pin'>('detect');
    const [images, setImages] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState<any>({
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

    const durations = [
        { label: '15 Mins', value: 15 },
        { label: '3 Hours', value: 180 },
        { label: '7 Days', value: 10080 },
        { label: '28 Days', value: 40320 },
    ];

    const pickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
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
                if (parts.length > 2) return `${parts[0]}, ${parts[1]}`;
                return display;
            }
        } catch (e) { console.error(e); }
        return `Pinned Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            if (subType) formData.append('subType', subType);
            formData.append('location', location || (coordinates ? `Pinned (${coordinates.lat.toFixed(2)}, ${coordinates.lng.toFixed(2)})` : ''));
            if (coordinates) {
                formData.append('latitude', coordinates.lat.toString());
                formData.append('longitude', coordinates.lng.toString());
            }
            formData.append('price', price || '0');
            if (budgetMin) formData.append('budgetMin', budgetMin);
            if (budgetMax) formData.append('budgetMax', budgetMax);
            if (availability.trim()) formData.append('availability', availability.trim());
            formData.append('duration', duration.toString());
            formData.append('isUrgent', isUrgent.toString());
            formData.append('exchangePreference', exchangePreference);
            formData.append('acceptsBarter', acceptsBarter.toString());

            images.forEach((image) => {
                formData.append('images', image as any);
            });

            await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            showAlert('Success', 'Post created successfully!', () => {
                navigation.navigate('Feed');
            });
        } catch (error: any) {
            console.error(error);
            showAlert('Error', error?.response?.data?.msg || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (title: string, message: string, onConfirm?: () => void) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            confirmText: 'OK',
            onConfirm: onConfirm || (() => setAlertConfig((p: any) => ({ ...p, visible: false }))),
            isDestructive: false,
        });
    };

    const getSubTypes = () => {
        switch (type) {
            case 'job': return [{ id: 'hiring', label: 'Hiring' }, { id: 'seeking', label: 'Seeking' }];
            case 'service': return [{ id: 'offering', label: 'Offering' }, { id: 'requesting', label: 'Requesting' }];
            case 'sell': return [{ id: 'sell', label: 'Selling' }, { id: 'rent', label: 'Renting' }];
            default: return [];
        }
    };

    const renderStep1 = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Category</Text>
            <View style={styles.grid}>
                {categories.map((cat) => (
                    <TouchableOpacity key={cat.id} onPress={() => { setType(cat.id); setSubType(''); }} style={styles.cardWrapper}>
                        <View style={[styles.categoryCard, type === cat.id && styles.activeCard]}>
                            <View style={[styles.iconCircle, { backgroundColor: type === cat.id ? '#af25f4' : 'rgba(255,255,255,0.05)' }]}>
                                <cat.icon size={24} color={type === cat.id ? '#ffffff' : '#94a3b8'} />
                            </View>
                            <Text style={[styles.cardTitle, type === cat.id && styles.activeCardText]}>{cat.label}</Text>
                            <Text style={styles.cardSub}>{cat.sub}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.stepTitle, { marginTop: 32, fontSize: 18 }]}>Type</Text>
            <View style={styles.subTypeGrid}>
                {getSubTypes().map((st) => (
                    <TouchableOpacity key={st.id} onPress={() => setSubType(st.id)} style={[styles.subTypePill, subType === st.id && styles.activePill]}>
                        <Text style={[styles.pillText, subType === st.id && styles.activePillText]}>{st.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Post Details</Text>
            <View style={styles.inputCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.glassInput}
                        placeholder="What are you offering?"
                        placeholderTextColor="#64748b"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>
                <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.glassInput, styles.textArea]}
                        placeholder="Describe your post..."
                        placeholderTextColor="#64748b"
                        value={description}
                        multiline
                        onChangeText={setDescription}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Availability</Text>
                    <TextInput
                        style={[styles.glassInput, styles.textAreaSmall]}
                        placeholder="Weekday evenings, weekends, 2 hours/day..."
                        placeholderTextColor="#64748b"
                        value={availability}
                        multiline
                        onChangeText={setAvailability}
                    />
                </View>
                <View style={[styles.dualInputRow, { marginBottom: 0 }]}>
                    <View style={[styles.inputGroup, styles.dualInput]}>
                        <Text style={styles.label}>Budget Min</Text>
                        <TextInput
                            style={styles.glassInput}
                            keyboardType="numeric"
                            placeholder="300"
                            placeholderTextColor="#64748b"
                            value={budgetMin}
                            onChangeText={setBudgetMin}
                        />
                    </View>
                    <View style={[styles.inputGroup, styles.dualInput]}>
                        <Text style={styles.label}>Budget Max</Text>
                        <TextInput
                            style={styles.glassInput}
                            keyboardType="numeric"
                            placeholder="1200"
                            placeholderTextColor="#64748b"
                            value={budgetMax}
                            onChangeText={setBudgetMax}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.imageSection}>
                <Text style={styles.stepTitleSmall}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScrollContent}>
                    <TouchableOpacity onPress={pickImage} style={styles.addPhotoButtonGlass}>
                        <Camera size={24} color="#af25f4" />
                        <Text style={styles.addPhotoText}>Add Photo</Text>
                    </TouchableOpacity>
                    {images.map((img, idx) => (
                        <View key={idx} style={styles.imageWrapper}>
                            <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                            <TouchableOpacity onPress={() => removeImage(idx)} style={styles.removeImageButton}>
                                <X size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </Animated.View>
    );

    const renderStep3 = () => (
        <Animated.View entering={FadeInRight} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Post Location</Text>
            <View style={styles.methodTabs}>
                {['detect', 'pin'].map((m) => (
                    <TouchableOpacity key={m} onPress={() => setLocationMethod(m as any)} style={[styles.methodTab, locationMethod === m && styles.activeMethodTab]}>
                        <Text style={[styles.methodTabText, locationMethod === m && styles.activeMethodTabText]}>{m === 'detect' ? 'DETECT GPS' : m.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.inputCard}>
                {locationMethod === 'detect' && (
                    <TouchableOpacity onPress={async () => {
                        setLocationLoading(true);
                        const loc = await getCurrentLocation();
                        if (loc) {
                            setCoordinates({ lat: loc.latitude, lng: loc.longitude });
                            const addr = await reverseGeocode(loc.latitude, loc.longitude);
                            setLocation(addr);
                        }
                        setLocationLoading(false);
                    }} style={styles.detectBtn}>
                        {locationLoading ? <ActivityIndicator color="#af25f4" /> : <><Crosshair size={20} color="#af25f4" /><Text style={styles.detectBtnText}>Detect My Location</Text></>}
                    </TouchableOpacity>
                )}
                {locationMethod === 'pin' && (
                    <TouchableOpacity onPress={() => setShowMapModal(true)} style={styles.detectBtn}>
                        <Map size={20} color="#af25f4" />
                        <Text style={styles.detectBtnText}>{coordinates ? 'Change Pin' : 'Pin on Map'}</Text>
                    </TouchableOpacity>
                )}
                {location ? <Text style={styles.locationConfirmation}><Check size={14} color="#10b981" /> {location}</Text> : null}
            </View>
        </Animated.View>
    );

    const renderStep4 = () => (
        <Animated.View entering={FadeInRight} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Exchange</Text>
            <View style={styles.inputCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Price / Budget (₹)</Text>
                    <TextInput style={styles.glassInput} keyboardType="numeric" value={price} onChangeText={setPrice} placeholder="0" placeholderTextColor="#64748b" />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Expected Duration</Text>
                    <View style={styles.durationGrid}>
                        {durations.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                onPress={() => setDuration(item.value)}
                                style={[styles.durationPill, duration === item.value && styles.activeDurationPill]}
                            >
                                <Text style={[styles.durationPillText, duration === item.value && styles.activeDurationPillText]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <TouchableOpacity onPress={() => setIsUrgent(!isUrgent)} style={[styles.checkboxRow, { marginBottom: 20 }]}>
                    <View style={[styles.checkbox, isUrgent && styles.checkboxActive]}>{isUrgent && <Check size={12} color="#ffffff" />}</View>
                    <Text style={styles.checkboxLabel}>Mark as urgent</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAcceptsBarter(!acceptsBarter)} style={styles.checkboxRow}>
                    <View style={[styles.checkbox, acceptsBarter && styles.checkboxActive]}>{acceptsBarter && <Check size={12} color="#ffffff" />}</View>
                    <Text style={styles.checkboxLabel}>Open to Barter / Favour</Text>
                </TouchableOpacity>

                <View style={[styles.inputGroup, { marginTop: 20 }]}>
                    <Text style={styles.label}>Exchange Preference</Text>
                    <View style={styles.prefGrid}>
                        {['money', 'barter', 'flexible'].map((p) => (
                            <TouchableOpacity key={p} onPress={() => setExchangePreference(p as any)} style={[styles.prefBtn, exchangePreference === p && styles.activePrefBtn]}>
                                <Text style={[styles.prefBtnText, exchangePreference === p && styles.activePrefBtnText]}>{p.toUpperCase()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Animated.View>
    );

    const renderStep5 = () => (
        <Animated.View entering={FadeInRight} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review</Text>
            <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                    <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{(subType || type).toUpperCase()}</Text></View>
                    {isUrgent && <View style={styles.urgentBadge}><Text style={styles.urgentBadgeText}>URGENT</Text></View>}
                    <Text style={styles.previewPrice}>₹ {price || '0'}</Text>
                </View>
                <Text style={styles.previewTitle}>{title}</Text>
                <Text style={styles.previewDesc} numberOfLines={4}>{description}</Text>
                {!!availability && (
                    <Text style={styles.previewMeta}>Availability: {availability}</Text>
                )}
                {(budgetMin || budgetMax) && (
                    <Text style={styles.previewMeta}>
                        Budget Range: ₹{budgetMin || '0'} - ₹{budgetMax || budgetMin || '0'}
                    </Text>
                )}
                <View style={styles.previewFooter}>
                    <View style={styles.footerInfo}><MapPin size={12} color="#94a3b8" /><Text style={styles.footerInfoText}>{location}</Text></View>
                    <View style={styles.footerInfo}><Clock size={12} color="#94a3b8" /><Text style={styles.footerInfoText}>{durations.find(d => d.value === duration)?.label}</Text></View>
                </View>
            </View>
        </Animated.View>
    );

    const goNext = () => {
        if (step === 1 && !subType) return showAlert('Error', 'Please select a type');
        if (step === 2 && (!title || !description)) return showAlert('Error', 'Details are required');
        if (step === 3 && !location) return showAlert('Error', 'Location is required');
        if (step < 5) setStep(step + 1);
        else handleCreate();
    };

    const goBack = () => {
        if (step > 1) setStep(step - 1);
        else navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.headerBackButton}>
                    <ArrowLeft size={20} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitleMain}>New Post</Text>
                <TouchableOpacity onPress={() => { }} style={styles.helpButton}>
                    <Info size={20} color="#94a3b8" />
                </TouchableOpacity>
            </Animated.View>

            <Stepper currentStep={step} steps={steps} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                    {step === 5 && renderStep5()}
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footerGlass}>
                <View style={styles.footerContent}>
                    <TouchableOpacity onPress={goBack} style={styles.footerBackButton}>
                        <Text style={styles.footerBackText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goNext} style={styles.nextButtonNeon}>
                        <View style={styles.nextButtonInner}>
                            {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.nextButtonText}>{step === 5 ? 'Launch' : 'Next'}</Text>{step === 5 ? <Send size={18} color="#fff" style={{ marginLeft: 8 }} /> : <ArrowRight size={18} color="#fff" style={{ marginLeft: 8 }} />}</>}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modals */}
            <Modal visible={showMapModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMapModal(false)}>
                <View style={{ flex: 1, backgroundColor: '#09090b' }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Pin Location</Text>
                        <TouchableOpacity onPress={() => setShowMapModal(false)}>
                            <X size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        originWhitelist={['*']}
                        source={{
                            html: `
                            <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" /><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>
                                body { margin: 0; background: #09090b; } #map { height: 100vh; width: 100vw; } .locate-btn { position: absolute; bottom: 30px; right: 20px; width: 50px; height: 50px; background: #af25f4; border-radius: 25px; z-index: 1000; border: none; color: white; display: flex; justify-content: center; align-items: center; }
                            </style></head><body>
                                <div id="map"></div><button class="locate-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'requestLoc'}))">GPS</button>
                                <script>
                                    var map = L.map('map', { zoomControl: false }).setView([${coordinates?.lat || 28.61}, ${coordinates?.lng || 77.20}], 15);
                                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
                                    var marker; map.on('click', function(e) { if(marker) map.removeLayer(marker); marker = L.marker(e.latlng).addTo(map); window.ReactNativeWebView.postMessage(JSON.stringify({type:'location', lat:e.latlng.lat, lng:e.latlng.lng})); });
                                    window.updateCenter = function(lat, lng) { map.flyTo([lat, lng], 16); if(marker) map.removeLayer(marker); marker = L.marker([lat, lng]).addTo(map); };
                                </script></body></html>
                            `}}
                        ref={webviewRef}
                        onMessage={async (e) => {
                            const data = JSON.parse(e.nativeEvent.data);
                            if (data.type === 'location') {
                                setCoordinates({ lat: data.lat, lng: data.lng });
                                const addr = await reverseGeocode(data.lat, data.lng);
                                setLocation(addr);
                            } else if (data.type === 'requestLoc') {
                                const l = await getCurrentLocation();
                                if (l) { webviewRef.current?.injectJavaScript(`window.updateCenter(${l.latitude}, ${l.longitude})`); }
                            }
                        }}
                    />
                    <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.confirmModalBtn}>
                        <Text style={styles.confirmModalBtnText}>Confirm Pin</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            <ThemedAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} confirmText={alertConfig.confirmText} onCancel={() => setAlertConfig({ ...alertConfig, visible: false })} onConfirm={alertConfig.onConfirm} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a'
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    headerBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    headerTitleMain: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff'
    },
    helpButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120
    },
    stepContainer: {
        paddingTop: 8
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 24
    },
    stepTitleSmall: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 16
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    cardWrapper: {
        width: '48%',
        marginBottom: 16
    },
    categoryCard: {
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    activeCard: {
        borderColor: '#af25f4',
        backgroundColor: 'rgba(175, 37, 244, 0.05)'
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 4
    },
    activeCardText: {
        color: '#ffffff'
    },
    cardSub: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center'
    },
    subTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    subTypePill: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.02)'
    },
    activePill: {
        borderColor: '#af25f4',
        backgroundColor: '#af25f4'
    },
    pillText: {
        color: '#94a3b8',
        fontWeight: '700'
    },
    activePillText: {
        color: '#ffffff'
    },
    inputCard: {
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 24
    },
    inputGroup: {
        marginBottom: 24
    },
    label: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 10,
        fontWeight: '600'
    },
    glassInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        color: '#ffffff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top'
    },
    textAreaSmall: {
        height: 88,
        textAlignVertical: 'top'
    },
    dualInputRow: {
        flexDirection: 'row',
        gap: 12
    },
    dualInput: {
        flex: 1
    },
    imageSection: {
        marginTop: 8
    },
    photoScrollContent: {
        gap: 12
    },
    addPhotoButtonGlass: {
        width: 100,
        height: 100,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#af25f4',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(175, 37, 244, 0.05)'
    },
    addPhotoText: {
        fontSize: 11,
        color: '#af25f4',
        marginTop: 6,
        fontWeight: '700'
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 20,
        overflow: 'hidden'
    },
    imagePreview: {
        width: '100%',
        height: '100%'
    },
    removeImageButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(255,0,0,0.8)',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    footerGlass: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20
    },
    footerBackButton: {
        padding: 12
    },
    footerBackText: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '600'
    },
    nextButtonNeon: {
        minWidth: 160
    },
    nextButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#af25f4'
    },
    nextButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700'
    },
    methodTabs: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20
    },
    methodTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    activeMethodTab: {
        borderColor: '#af25f4',
        backgroundColor: 'rgba(175, 37, 244, 0.1)'
    },
    methodTabText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 12
    },
    activeMethodTabText: {
        color: '#af25f4'
    },
    suggestionItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    suggestionText: {
        color: '#ffffff',
        fontSize: 14
    },
    detectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
        backgroundColor: 'rgba(175, 37, 244, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#af25f4'
    },
    detectBtnText: {
        color: '#af25f4',
        fontWeight: 'bold'
    },
    locationConfirmation: {
        marginTop: 16,
        color: '#10b981',
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center'
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxActive: {
        borderColor: '#af25f4',
        backgroundColor: '#af25f4'
    },
    checkboxLabel: {
        color: '#ffffff',
        fontSize: 16
    },
    prefGrid: {
        flexDirection: 'row',
        gap: 8
    },
    durationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    durationPill: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)'
    },
    activeDurationPill: {
        borderColor: '#af25f4',
        backgroundColor: 'rgba(175, 37, 244, 0.14)'
    },
    durationPillText: {
        color: '#94a3b8',
        fontWeight: '700',
        fontSize: 12
    },
    activeDurationPillText: {
        color: '#ffffff'
    },
    prefBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center'
    },
    activePrefBtn: {
        borderColor: '#af25f4',
        backgroundColor: '#af25f4'
    },
    prefBtnText: {
        color: '#94a3b8',
        fontWeight: '700',
        fontSize: 10
    },
    activePrefBtnText: {
        color: '#ffffff'
    },
    previewCard: {
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: '#af25f4'
    },
    typeBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900'
    },
    urgentBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: '#ef4444'
    },
    urgentBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900'
    },
    previewPrice: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff'
    },
    previewTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8
    },
    previewDesc: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
        marginBottom: 20
    },
    previewMeta: {
        fontSize: 13,
        color: '#cbd5e1',
        lineHeight: 18,
        marginBottom: 10
    },
    previewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 16
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    footerInfoText: {
        color: '#64748b',
        fontSize: 12
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700'
    },
    confirmModalBtn: {
        backgroundColor: '#af25f4',
        padding: 20,
        alignItems: 'center'
    },
    confirmModalBtnText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16
    },
});

export default CreatePostScreen;
