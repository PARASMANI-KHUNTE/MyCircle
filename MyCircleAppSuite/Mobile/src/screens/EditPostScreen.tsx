import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, Modal, StatusBar } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Check, X, Camera, Briefcase, Wrench, ShoppingBag, Package, Handshake, Save, ArrowLeft } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import ThemedAlert from '../components/ui/ThemedAlert';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DARK_TILE_URL, LABELS_TILE_URL, MAP_ATTRIBUTION, MAP_MAX_NATIVE_ZOOM } from '../constants/mapTiles';
import { formatErrorMessage } from '../utils/errorMessage';
import {
    DESCRIPTION_MAX_LENGTH,
    MAX_POST_IMAGES,
    TITLE_MAX_LENGTH,
    validatePostDraft,
} from '../utils/postValidation';

type EditFormValues = {
    title: string;
    description: string;
    type: string;
    location: string;
    coordinates: { lat: number; lng: number } | null;
    price: string;
    acceptsBarter: boolean;
    duration: number;
    durationChanged: boolean;
    images: any[];
    newImages: any[];
};

const formSnapshot = (values: EditFormValues) => JSON.stringify({
    title: values.title.trim(),
    description: values.description.trim(),
    type: values.type,
    location: values.location.trim(),
    coordinates: values.coordinates ? `${values.coordinates.lat},${values.coordinates.lng}` : '',
    price: values.price,
    acceptsBarter: values.acceptsBarter,
    duration: values.duration,
    durationChanged: values.durationChanged,
    images: values.images.map((image: any) => image.uri).join('|'),
    newImages: values.newImages.map((image: any) => image.uri).join('|'),
});

const EditPostScreen = ({ navigation, route }: any) => {
    const postId = route.params?.id || route.params?.post?._id;
    const loadRequestRef = useRef(0);
    const isSubmittingRef = useRef(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('job');
    const [location, setLocation] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null);
    const [price, setPrice] = useState('');
    const [acceptsBarter, setAcceptsBarter] = useState(false);
    const [duration, setDuration] = useState(40320);
    const [durationChanged, setDurationChanged] = useState(false);

    const [images, setImages] = useState<any[]>([]);
    const [newImages, setNewImages] = useState<any[]>([]);

    // Load / discard state
    const [loadingPost, setLoadingPost] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

    // UI State
    const [loading, setLoading] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState<any>({
        visible: false,
        title: '',
        message: '',
        confirmText: 'OK',
        onConfirm: () => { },
    });

    const currentSnapshot = useMemo(() => formSnapshot({
        title, description, type, location, coordinates, price,
        acceptsBarter, duration, durationChanged, images, newImages,
    }), [title, description, type, location, coordinates, price, acceptsBarter, duration, durationChanged, images, newImages]);

    const hasUnsavedChanges = savedSnapshot !== null && currentSnapshot !== savedSnapshot;

    const loadPost = useCallback(async () => {
        const requestId = ++loadRequestRef.current;

        if (!postId) {
            setLoadError('This post could not be identified. Go back and try again.');
            setLoadingPost(false);
            return;
        }

        setLoadingPost(true);
        setLoadError(null);
        try {
            const res = await api.get(`/posts/${postId}`);
            if (requestId !== loadRequestRef.current) return;

            const post = res.data || {};
            const coords = post.locationCoords?.coordinates?.length === 2
                ? { lat: Number(post.locationCoords.coordinates[1]), lng: Number(post.locationCoords.coordinates[0]) }
                : null;
            const existingImages = (post.images || []).map((image: any) => ({ uri: typeof image === 'string' ? image : image?.uri })).filter((image: any) => image.uri);
            const values: EditFormValues = {
                title: post.title || '',
                description: post.description || '',
                type: post.type || 'job',
                location: post.location || '',
                coordinates: coords,
                price: post.price?.toString() || '',
                acceptsBarter: !!post.acceptsBarter,
                duration: post.duration || 40320,
                durationChanged: false,
                images: existingImages,
                newImages: [],
            };

            setTitle(values.title);
            setDescription(values.description);
            setType(values.type);
            setLocation(values.location);
            setCoordinates(values.coordinates);
            setPrice(values.price);
            setAcceptsBarter(values.acceptsBarter);
            setDuration(values.duration);
            setDurationChanged(false);
            setImages(values.images);
            setNewImages([]);
            setSavedSnapshot(formSnapshot(values));
        } catch (error) {
            if (requestId === loadRequestRef.current) {
                setLoadError(formatErrorMessage(error, 'We could not load this post. It may have been removed.'));
            }
        } finally {
            if (requestId === loadRequestRef.current) setLoadingPost(false);
        }
    }, [postId]);

    useEffect(() => {
        void loadPost();
    }, [loadPost]);

    const promptDiscardConfirmation = useCallback((onConfirmDiscard: () => void) => {
        setAlertConfig({
            visible: true,
            title: 'Discard Changes?',
            message: 'You have unsaved changes. Are you sure you want to discard them?',
            confirmText: 'Discard',
            isDestructive: true,
            onConfirm: () => {
                setAlertConfig((prev: any) => ({ ...prev, visible: false }));
                onConfirmDiscard();
            },
            onCancel: () => setAlertConfig((prev: any) => ({ ...prev, visible: false })),
        });
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
            if (!hasUnsavedChanges || isSubmittingRef.current) return;
            event.preventDefault();
            promptDiscardConfirmation(() => navigation.dispatch(event.data.action));
        });
        return unsubscribe;
    }, [navigation, hasUnsavedChanges, promptDiscardConfirmation]);

    const durations = [
        { label: '15 Mins', value: 15 },
        { label: '3 Hours', value: 180 },
        { label: '7 Days', value: 10080 },
        { label: '28 Days', value: 40320 },
    ];

    const categories = [
        { id: 'job', label: 'Post a Job', icon: Briefcase },
        { id: 'service', label: 'Offer Service', icon: Wrench },
        { id: 'sell', label: 'Sell Item', icon: ShoppingBag },
        { id: 'rent', label: 'Rent Item', icon: Package },
    ];

    const pickImage = async () => {
        const remaining = MAX_POST_IMAGES - (images.length + newImages.length);
        if (remaining <= 0) {
            showAlert('Photos', `You can add up to ${MAX_POST_IMAGES} photos.`);
            return;
        }

        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
            selectionLimit: remaining,
        });

        if (result.assets?.length) {
            const assets = result.assets.slice(0, remaining).map(asset => ({
                uri: asset.uri,
                name: asset.fileName || `image_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
                isNew: true
            }));
            setNewImages(prev => [...prev, ...assets].slice(0, MAX_POST_IMAGES - images.length));
        }
    };

    const removeImage = (uri: string, isNew: boolean) => {
        if (isNew) {
            setNewImages(newImages.filter(img => img.uri !== uri));
        } else {
            setImages(images.filter(img => img.uri !== uri));
        }
    };

    const handleUpdate = async () => {
        if (!postId || loadingPost) return;

        const detailsError = validatePostDraft('details', { title, description });
        const exchangeError = validatePostDraft('exchange', {
            price,
            duration: durationChanged ? duration : undefined,
        });
        const validationError = detailsError || exchangeError;

        if (validationError || !location.trim()) {
            return showAlert(
                'Check Your Post',
                validationError?.message || 'Please add a location before saving.'
            );
        }

        isSubmittingRef.current = true;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('type', type);
            const cleanPrice = String(price || '').replace(/[^0-9.]/g, '');
            const parsedPrice = parseFloat(cleanPrice);
            const validPrice = (!isNaN(parsedPrice) && parsedPrice >= 0) ? String(parsedPrice) : '0';
            formData.append('price', validPrice);
            formData.append('acceptsBarter', acceptsBarter ? 'true' : 'false');
            formData.append('location', location.trim());

            // Keep the original expiry unless the user explicitly changed duration.
            if (durationChanged) formData.append('duration', duration.toString());

            if (coordinates) {
                formData.append('latitude', coordinates.lat.toString());
                formData.append('longitude', coordinates.lng.toString());
            }

            formData.append('existingImages', JSON.stringify(images.map(img => img.uri)));

            newImages.forEach((image) => {
                formData.append('images', image as any);
            });

            await api.put(`/posts/${postId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Treat this state as saved so the discard guard does not fire after success.
            setSavedSnapshot(currentSnapshot);
            setAlertConfig({
                visible: true,
                title: 'Success',
                message: 'Post updated successfully!',
                confirmText: 'Great',
                onConfirm: () => {
                    setAlertConfig((prev: any) => ({ ...prev, visible: false }));
                    navigation.goBack();
                }
            });
        } catch (error) {
            showAlert('Error', formatErrorMessage(error, 'Failed to update post.'));
        } finally {
            isSubmittingRef.current = false;
            setLoading(false);
        }
    };

    const showAlert = (title: string, message: string) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            confirmText: 'OK',
            onConfirm: () => setAlertConfig((prev: any) => ({ ...prev, visible: false }))
        });
    };

    if (loadingPost) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.stateContainer}>
                    <ActivityIndicator size="large" color="#af25f4" />
                    <Text style={styles.stateText}>Loading post...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (loadError || savedSnapshot === null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>{loadError || 'This post is no longer available.'}</Text>
                    <TouchableOpacity onPress={() => void loadPost()} style={styles.stateButton}>
                        <Text style={styles.stateButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.stateSecondaryButton}>
                        <Text style={styles.stateText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Modern Gradient Background */}
            <View pointerEvents="none" style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Post</Text>
                <TouchableOpacity 
                    onPress={handleUpdate} 
                    disabled={loading}
                    style={[styles.saveButton, loading && styles.disabledButton]}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Save size={20} color="#ffffff" />
                    )}
                </TouchableOpacity>
            </Animated.View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.categoryGrid}>
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = type === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setType(cat.id)}
                                >
                                <View
                                        style={[
                                            styles.categoryCard,
                                            isSelected ? { borderColor: '#af25f4', backgroundColor: 'rgba(175, 37, 244, 0.1)' } : {}
                                        ]}
                                    >
                                        <Icon size={20} color={isSelected ? '#af25f4' : '#94a3b8'} />
                                        <Text style={[styles.categoryLabel, { color: isSelected ? '#ffffff' : '#94a3b8' }]}>{cat.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Title</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Post title"
                            placeholderTextColor="#64748b"
                            maxLength={TITLE_MAX_LENGTH}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <View style={[styles.inputWrapper, { height: 120, alignItems: 'flex-start', paddingTop: 12 }]}>
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            placeholder="Describe your post..."
                            placeholderTextColor="#64748b"
                            maxLength={DESCRIPTION_MAX_LENGTH}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Price / Budget</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={price}
                            onChangeText={(text) => {
                                const clean = text.replace(/[^0-9.]/g, '');
                                const parts = clean.split('.');
                                const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
                                setPrice(sanitized);
                            }}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor="#64748b"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.barterRowGlass}
                        onPress={() => setAcceptsBarter(!acceptsBarter)}
                    >
                        <View style={[styles.checkboxGlass, { borderColor: acceptsBarter ? '#af25f4' : 'rgba(255,255,255,0.2)', backgroundColor: acceptsBarter ? '#af25f4' : 'transparent' }]}>
                            {acceptsBarter && <Check size={14} color="#fff" />}
                        </View>
                        <Handshake size={20} color={acceptsBarter ? '#af25f4' : 'rgba(255,255,255,0.4)'} />
                        <Text style={{ color: '#fff', marginLeft: 10, fontWeight: '600' }}>Open to Barter / Favour</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Duration</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {durations.map((d) => {
                            const isSelected = duration === d.value;
                            return (
                    <TouchableOpacity key={d.value} onPress={() => { setDuration(d.value); setDurationChanged(true); }}>
                                    <View style={[styles.durationChip, isSelected ? { borderColor: '#af25f4', backgroundColor: 'rgba(175, 37, 244, 0.1)' } : {}]}>
                                        <Text style={{ color: isSelected ? '#ffffff' : '#94a3b8', fontWeight: '700' }}>{d.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Location</Text>
                    <View style={styles.locationRow}>
                        <View style={[styles.inputWrapper, { flex: 1 }]}>
                            <TextInput
                                style={styles.input}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="City / Area"
                                placeholderTextColor="#64748b"
                            />
                        </View>
                        <TouchableOpacity onPress={() => setShowMapModal(true)}>
                            <View style={styles.mapBtn}>
                                <MapPin size={22} color="#af25f4" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Images</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                        <TouchableOpacity onPress={pickImage}>
                            <View style={styles.addImageBtn}>
                                <Camera size={24} color="#64748b" />
                            </View>
                        </TouchableOpacity>
                        {[...images, ...newImages].map((img, i) => (
                            <View key={i} style={styles.imageWrapper}>
                                <Image source={{ uri: img.uri || img }} style={styles.image} />
                                <TouchableOpacity onPress={() => removeImage(img.uri || img, !!img.isNew)} style={styles.removeBtn}>
                                    <X size={12} color="#fff" />
                                </TouchableOpacity>
                                {img.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
                            </View>
                        ))}
                    </ScrollView>
                </Animated.View>
            </ScrollView>

            <Modal visible={showMapModal} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Pin Location</Text>
                            <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.backBtn}>
                                <X size={24} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                        <WebView
                            originWhitelist={['*']}
                            source={{
                                html: `
                                <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>body { margin: 0; padding: 0; } #map { height: 100vh; width: 100vw; }</style></head><body><div id="map"></div><script>
                                    var map = L.map('map').setView([${coordinates?.lat ?? 28.6139}, ${coordinates?.lng ?? 77.2090}], 13);
                                    L.tileLayer('${DARK_TILE_URL}', { attribution: '${MAP_ATTRIBUTION}', maxNativeZoom: ${MAP_MAX_NATIVE_ZOOM}, maxZoom: 19 }).addTo(map);
                                    L.tileLayer('${LABELS_TILE_URL}', { maxNativeZoom: ${MAP_MAX_NATIVE_ZOOM}, maxZoom: 19 }).addTo(map);
                                    var marker; ${coordinates ? `marker = L.marker([${coordinates.lat}, ${coordinates.lng}]).addTo(map);` : ''}
                                    map.on('click', function(e) { if (marker) map.removeLayer(marker); marker = L.marker(e.latlng).addTo(map); window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng })); });
                                </script></body></html>
                            `}}
                            onMessage={(event) => {
                                try {
                                    const data = JSON.parse(event.nativeEvent.data);
                                    setCoordinates({ lat: data.lat, lng: data.lng });
                                    setShowMapModal(false);
                                } catch (e) { console.error(e); }
                            }}
                            style={{ flex: 1 }}
                        />
                    </SafeAreaView>
                </View>
            </Modal>

            <ThemedAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig((prev: any) => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#af25f4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
    },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 100 },
    inputGroup: { marginBottom: 28 },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    barterRowGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    checkboxGlass: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    durationChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    locationRow: {
        flexDirection: 'row',
        gap: 12,
    },
    mapBtn: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(175, 37, 244, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(175, 37, 244, 0.3)',
    },
    imagesScroll: { flexDirection: 'row' },
    addImageBtn: {
        width: 100,
        height: 100,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    imageWrapper: { width: 100, height: 100, marginRight: 12, position: 'relative' },
    image: { width: '100%', height: '100%', borderRadius: 20 },
    removeBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0a0a0a',
    },
    newBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#10b981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    newBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '700' },
    stateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
    },
    stateText: {
        color: '#ffffff',
        fontSize: 15,
        textAlign: 'center',
    },
    stateButton: {
        backgroundColor: '#af25f4',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    stateButtonText: {
        color: '#ffffff',
        fontWeight: '700',
    },
    stateSecondaryButton: {
        paddingVertical: 8,
    },
});

export default EditPostScreen;
