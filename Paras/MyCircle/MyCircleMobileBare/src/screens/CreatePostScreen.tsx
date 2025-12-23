import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getCurrentLocation } from '../utils/location';
import { MapPin, ChevronDown, Check, Map, Crosshair, X, Camera } from 'lucide-react-native';
import { Modal } from 'react-native';
import { WebView } from 'react-native-webview';


const CreatePostScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('job');
    const [location, setLocation] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null);
    const [price, setPrice] = useState('');

    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

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
        if (!title || !description || !location || !price) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            if (type === 'barter') {
                formData.append('acceptsBarter', 'true');
            }
            formData.append('location', location);
            if (coordinates) {
                formData.append('latitude', coordinates.lat.toString());
                formData.append('longitude', coordinates.lng.toString());
            }
            formData.append('price', price);

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
        active: { backgroundColor: colors.primary, borderColor: colors.primary },
        inactive: { backgroundColor: colors.card, borderColor: colors.border },
        activeText: { color: '#ffffff' },
        inactiveText: { color: colors.textSecondary }
    };

    return (
        <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top']}>
            <View style={[styles.header, themeStyles.border]}>
                <Text style={[styles.headerTitle, themeStyles.text]}>New Post</Text>
                {loading && <ActivityIndicator color={colors.primary} />}
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, themeStyles.textSecondary]}>Title</Text>
                    <TextInput
                        style={[styles.input, themeStyles.input]}
                        placeholder="What are you posting?"
                        placeholderTextColor={colors.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, themeStyles.textSecondary]}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScrollContent}>
                        {['job', 'service', 'sell', 'rent', 'barter'].map((t) => (
                            <TouchableOpacity
                                key={t}
                                onPress={() => setType(t)}
                                style={[
                                    styles.typeButton,
                                    type === t ? themeStyles.active : themeStyles.inactive
                                ]}
                            >
                                <Text style={[
                                    styles.typeText,
                                    type === t ? themeStyles.activeText : themeStyles.inactiveText
                                ]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, themeStyles.textSecondary]}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, themeStyles.input]}
                        placeholder="Describe your post in detail..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>


                <View style={styles.row}>
                    <View style={styles.flex1}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={[styles.label, themeStyles.textSecondary, { marginBottom: 0 }]}>Location</Text>
                            <TouchableOpacity onPress={handleGetLocation} disabled={locationLoading}>
                                {locationLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <MapPin size={16} color={colors.primary} />}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.locationInputWrapper}>
                            <TextInput
                                style={[styles.input, themeStyles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                                placeholder="Area / City"
                                placeholderTextColor={colors.textSecondary}
                                value={location}
                                onChangeText={setLocation}
                            />
                            <TouchableOpacity
                                style={[styles.selectCityButton, { borderColor: colors.border, backgroundColor: colors.input }]}
                                onPress={() => setShowCityModal(true)}
                            >
                                <ChevronDown size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' }}>
                            *Pin location to appear on the Feed Map
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <TouchableOpacity
                                onPress={() => setShowMapModal(true)}
                                style={[styles.pinMapButton, { borderColor: colors.primary, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}
                            >
                                <Map size={16} color={colors.primary} />
                                <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: 6 }}>Pin on Map</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.flex1}>
                        <Text style={[styles.label, themeStyles.textSecondary]}>Price (₹)</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                        />
                    </View>
                </View>

                <View style={styles.imageSection}>
                    <Text style={[styles.label, themeStyles.textSecondary]}>Images</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScrollContent}>
                        <TouchableOpacity
                            onPress={pickImage}
                            style={[styles.addPhotoButton, { backgroundColor: colors.input, borderColor: colors.border }]}
                        >
                            <Camera size={24} color={colors.textSecondary} />
                            <Text style={[styles.addPhotoText, themeStyles.textSecondary]}>Add Photo</Text>
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

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled, { backgroundColor: colors.text }]}
                    onPress={handleCreate}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                    <Text style={[styles.submitButtonText, { color: colors.background }]}>
                        {loading ? 'Posting...' : 'Create Post'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Search Location Modal */}
            <Modal
                visible={showCityModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowCityModal(false)}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.background, flex: 1, width: '100%', padding: 0, borderWidth: 0 }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { fontSize: 18, color: colors.text }]}>Search Location</Text>
                        <TouchableOpacity onPress={() => setShowCityModal(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ padding: 16 }}>
                        <TextInput
                            style={[styles.input, themeStyles.input, { marginBottom: 16 }]}
                            placeholder="Type a city, area, or colony..."
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                            onChangeText={async (text) => {
                                if (text.length > 2) {
                                    try {
                                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=5`, {
                                            headers: { 'User-Agent': 'MyCircleApp/1.0' }
                                        });
                                        const data = await response.json();
                                        setSearchResults(data);
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }
                            }}
                        />
                        <ScrollView keyboardShouldPersistTaps="handled">
                            {searchResults.map((item: any, idx: number) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                                    onPress={() => {
                                        let display = item.display_name;
                                        const parts = display.split(', ');
                                        if (parts.length > 2) {
                                            display = `${parts[0]}, ${parts[1]}`;
                                        }

                                        setLocation(display);
                                        if (item.lat && item.lon) {
                                            setCoordinates({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
                                        }
                                        setShowCityModal(false);
                                        setSearchResults([]);
                                    }}
                                >
                                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{item.display_name.split(',')[0]}</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.display_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Pin on Map Modal */}
            <Modal
                visible={showMapModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowMapModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { fontSize: 18, color: colors.text }]}>Pin Location</Text>
                        <TouchableOpacity onPress={() => setShowMapModal(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        originWhitelist={['*']}
                        source={{
                            html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                                <style>body { margin: 0; padding: 0; } #map { height: 100vh; width: 100vw; }</style>
                            </head>
                            <body>
                                <div id="map"></div>
                                <script>
                                    var map = L.map('map').setView([${coordinates?.lat || 28.6139}, ${coordinates?.lng || 77.2090}], 13);
                                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                                        attribution: '&copy; OpenStreetMap contributors'
                                    }).addTo(map);

                                    var marker;
                                    ${coordinates ? `marker = L.marker([${coordinates.lat}, ${coordinates.lng}]).addTo(map);` : ''}

                                    map.on('click', function(e) {
                                        if (marker) map.removeLayer(marker);
                                        marker = L.marker(e.latlng).addTo(map);
                                        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
                                    });
                                </script>
                            </body>
                            </html>
                        `}}
                        onMessage={(event) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                setCoordinates({ lat: data.lat, lng: data.lng });
                                Alert.alert("Location Pinned", "Coordinates updated!");
                                setShowMapModal(false);
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    typeScrollContent: {
        paddingBottom: 4,
    },
    typeButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        marginRight: 10,
    },
    typeButtonActive: {
        backgroundColor: '#4f46e5', // indigo-600
        borderColor: '#6366f1', // indigo-500
    },
    typeButtonInactive: {
        backgroundColor: '#18181b',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    typeText: {
        textTransform: 'capitalize',
        fontWeight: 'bold',
        fontSize: 14,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    flex1: {
        flex: 1,
    },
    imageSection: {
        marginBottom: 32,
    },
    photoScrollContent: {
        paddingBottom: 8,
    },
    addPhotoButton: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addPhotoText: {
        fontSize: 12,
        marginTop: 6,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        marginRight: 12,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    removeImageButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 12,
        padding: 4,
        zIndex: 10,
        borderWidth: 2,
        borderColor: '#000000',
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    locationInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectCityButton: {
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopRightRadius: 14,
        borderBottomRightRadius: 14,
        height: 50, // Match typical input height
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    modalItemText: {
        fontSize: 16,
    },
    pinMapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignSelf: 'flex-start'
    }
});

export default CreatePostScreen;
