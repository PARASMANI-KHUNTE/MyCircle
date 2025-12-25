import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getCurrentLocation } from '../utils/location';
import { MapPin, ChevronDown, Check, Map, Crosshair, X, Camera, Briefcase, Wrench, ShoppingBag, Package, Trash2, Handshake, Clock, Save, ArrowLeft } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import ThemedAlert from '../components/ui/ThemedAlert';

const EditPostScreen = ({ navigation, route }: any) => {
    const { post } = route.params;
    const { colors } = useTheme();
    const searchTimeout = React.useRef<any>(null);

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

    // Duration options
    const durations = [
        { label: '15 Mins', value: 15 },
        { label: '3 Hours', value: 180 },
        { label: '7 Days', value: 10080 },
        { label: '28 Days', value: 40320 },
    ];
    const [duration, setDuration] = useState(post.duration || 40320);

    const [images, setImages] = useState<any[]>(post.images ? post.images.map((img: any) => ({ uri: img })) : []);
    const [newImages, setNewImages] = useState<any[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
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
                isDestructive: false,
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    navigation.goBack();
                }
            });
        } catch (error: any) {
            console.error(error);
            showAlert('Error', 'Failed to update post. ' + (error.response?.data?.msg || error.message));
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
            isDestructive: false,
            onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Post</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Save size={24} color={colors.primary} />}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                    <View style={styles.categoryGrid}>
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = type === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryCard,
                                        { backgroundColor: isSelected ? colors.primary + '20' : colors.card, borderColor: isSelected ? colors.primary : colors.border }
                                    ]}
                                    onPress={() => setType(cat.id)}
                                >
                                    <Icon size={20} color={isSelected ? colors.primary : colors.textSecondary} />
                                    <Text style={[styles.categoryLabel, { color: isSelected ? colors.primary : colors.text }]}>{cat.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Post title"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        placeholder="Describe your post..."
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Price / Budget</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity
                        style={styles.barterRow}
                        onPress={() => setAcceptsBarter(!acceptsBarter)}
                    >
                        <View style={[styles.checkbox, { borderColor: acceptsBarter ? colors.primary : colors.textSecondary, backgroundColor: acceptsBarter ? colors.primary : 'transparent' }]}>
                            {acceptsBarter && <Check size={14} color="#fff" />}
                        </View>
                        <Handshake size={20} color={acceptsBarter ? colors.primary : colors.textSecondary} />
                        <Text style={{ color: colors.text, marginLeft: 10 }}>Open to Barter / Favour</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (Auto-disable post after)</Text>
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
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
                    <View style={styles.locationWrapper}>
                        <TextInput
                            style={[styles.input, { flex: 1, backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="City / Area"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <TouchableOpacity onPress={() => setShowMapModal(true)} style={[styles.mapBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <MapPin size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Images</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                        <TouchableOpacity onPress={pickImage} style={[styles.addImageBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            <Camera size={24} color={colors.textSecondary} />
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
                </View>
            </ScrollView>

            <Modal visible={showMapModal} animationType="slide" onRequestClose={() => setShowMapModal(false)}>
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Pin Location</Text>
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
                                setShowMapModal(false);
                            } catch (e) { console.error(e); }
                        }}
                    />
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
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContainer: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    input: { borderRadius: 12, padding: 12, fontSize: 16, borderWidth: 1 },
    textArea: { height: 120, textAlignVertical: 'top' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1, gap: 8 },
    categoryLabel: { fontSize: 14, fontWeight: 'bold' },
    barterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    locationWrapper: { flexDirection: 'row', gap: 10 },
    mapBtn: { padding: 12, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
    imagesScroll: { flexDirection: 'row' },
    addImageBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    imageWrapper: { width: 80, height: 80, marginRight: 12, position: 'relative' },
    image: { width: '100%', height: '100%', borderRadius: 12 },
    removeBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: 'red', borderRadius: 10, padding: 2 },
    newBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#22c55e', paddingHorizontal: 4, borderRadius: 4 },
    newBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' }
});

export default EditPostScreen;
