import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, Modal, Dimensions } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Check, X, Camera, Briefcase, Wrench, ShoppingBag, Package, Handshake, Save, ArrowLeft } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import ThemedAlert from '../components/ui/ThemedAlert';
import GlassView from '../components/ui/GlassView';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EditPostScreen = ({ navigation, route }: any) => {
    const { post } = route.params;
    const { colors } = useTheme();

    // Form State
    const [title, setTitle] = useState(post.title);
    const [description, setDescription] = useState(post.description);
    const [type, setType] = useState(post.type);
    const [location, setLocation] = useState(post.location);
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(
        post.latitude && post.longitude ? { lat: post.latitude, lng: post.longitude } : null
    );
    const [price, setPrice] = useState(post.price?.toString() || '');
    const [acceptsBarter, setAcceptsBarter] = useState(post.acceptsBarter || false);
    const [duration, setDuration] = useState(post.duration || 40320);

    const [images, setImages] = useState<any[]>(post.images ? post.images.map((img: any) => ({ uri: img })) : []);
    const [newImages, setNewImages] = useState<any[]>([]);

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
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
            selectionLimit: 5 - (images.length + newImages.length),
        });

        if (result.assets) {
            const assets = result.assets.map(asset => ({
                uri: asset.uri,
                name: asset.fileName || `image_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
                isNew: true
            }));
            setNewImages([...newImages, ...assets]);
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
        if (!title || !description || (!acceptsBarter && !price) || !location) {
            return showAlert('Missing Fields', 'Please fill in all required fields.');
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            formData.append('price', price || '0');
            formData.append('acceptsBarter', acceptsBarter ? 'true' : 'false');
            formData.append('location', location);
            formData.append('duration', duration.toString());

            if (coordinates) {
                formData.append('latitude', coordinates.lat.toString());
                formData.append('longitude', coordinates.lng.toString());
            }

            formData.append('existingImages', JSON.stringify(images.map(img => img.uri)));

            newImages.forEach((image) => {
                formData.append('images', image as any);
            });

            await api.put(`/posts/${post._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

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
        } catch (error: any) {
            console.error(error);
            showAlert('Error', 'Failed to update post.');
        } finally {
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <GlassView intensity={20} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnGlass}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Post</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={loading} style={styles.saveBtnNeon}>
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <Save size={20} color="#fff" />}
                </TouchableOpacity>
            </GlassView>

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
                                    <GlassView
                                        intensity={isSelected ? 40 : 5}
                                        borderRadius={20}
                                        style={[
                                            styles.categoryCardGlass,
                                            isSelected ? { borderColor: '#af25f4', borderWidth: 1.5 } : {}
                                        ]}
                                    >
                                        <Icon size={20} color={isSelected ? '#af25f4' : 'rgba(255,255,255,0.4)'} />
                                        <Text style={[styles.categoryLabel, { color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)' }]}>{cat.label}</Text>
                                    </GlassView>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Title</Text>
                    <GlassView intensity={5} borderRadius={16} style={styles.inputWrapperGlass}>
                        <TextInput
                            style={styles.inputGlass}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Post title"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />
                    </GlassView>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <GlassView intensity={5} borderRadius={16} style={[styles.inputWrapperGlass, { height: 120, alignItems: 'flex-start', paddingTop: 12 }]}>
                        <TextInput
                            style={[styles.inputGlass, { height: 100, textAlignVertical: 'top' }]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            placeholder="Describe your post..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />
                    </GlassView>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Price / Budget</Text>
                    <GlassView intensity={5} borderRadius={16} style={styles.inputWrapperGlass}>
                        <TextInput
                            style={styles.inputGlass}
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />
                    </GlassView>
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
                                <TouchableOpacity key={d.value} onPress={() => setDuration(d.value)}>
                                    <GlassView
                                        intensity={isSelected ? 40 : 5}
                                        borderRadius={20}
                                        style={[styles.durationChip, isSelected ? { borderColor: '#af25f4', borderWidth: 1 } : {}]}
                                    >
                                        <Text style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: '700' }}>{d.label}</Text>
                                    </GlassView>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Location</Text>
                    <View style={styles.locationRow}>
                        <GlassView intensity={5} borderRadius={16} style={[styles.inputWrapperGlass, { flex: 1 }]}>
                            <TextInput
                                style={styles.inputGlass}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="City / Area"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                            />
                        </GlassView>
                        <TouchableOpacity onPress={() => setShowMapModal(true)}>
                            <GlassView intensity={20} borderRadius={16} style={styles.mapBtnGlass}>
                                <MapPin size={22} color="#af25f4" />
                            </GlassView>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Images</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                        <TouchableOpacity onPress={pickImage}>
                            <GlassView intensity={5} borderRadius={20} style={styles.addImageBtnGlass}>
                                <Camera size={24} color="rgba(255,255,255,0.4)" />
                            </GlassView>
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
                        <GlassView intensity={20} style={styles.header}>
                            <Text style={styles.headerTitle}>Pin Location</Text>
                            <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.backBtnGlass}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </GlassView>
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
        backgroundColor: '#09090b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backBtnGlass: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    saveBtnNeon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#af25f4',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 100 },
    inputGroup: { marginBottom: 28 },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapperGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    inputGlass: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCardGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
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
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    locationRow: {
        flexDirection: 'row',
        gap: 12,
    },
    mapBtnGlass: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    imagesScroll: { flexDirection: 'row' },
    addImageBtnGlass: {
        width: 100,
        height: 100,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
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
        borderColor: '#09090b',
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
    newBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' }
});

export default EditPostScreen;
