import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera, X } from 'lucide-react-native';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreatePostScreen = ({ navigation }: any) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('job');
    const [location, setLocation] = useState('');
    const [price, setPrice] = useState('');
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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
            formData.append('location', location);
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>New Post</Text>
                {loading && <ActivityIndicator color="#8b5cf6" />}
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="What are you posting?"
                        placeholderTextColor="#52525b"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScrollContent}>
                        {['job', 'service', 'sell', 'rent'].map((t) => (
                            <TouchableOpacity
                                key={t}
                                onPress={() => setType(t)}
                                style={[
                                    styles.typeButton,
                                    type === t ? styles.typeButtonActive : styles.typeButtonInactive
                                ]}
                            >
                                <Text style={[
                                    styles.typeText,
                                    type === t ? styles.typeTextActive : styles.typeTextInactive
                                ]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe your post in detail..."
                        placeholderTextColor="#52525b"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={styles.row}>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Area / City"
                            placeholderTextColor="#52525b"
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Price (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor="#52525b"
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                        />
                    </View>
                </View>

                <View style={styles.imageSection}>
                    <Text style={styles.label}>Images</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScrollContent}>
                        <TouchableOpacity
                            onPress={pickImage}
                            style={styles.addPhotoButton}
                        >
                            <Camera size={24} color="#71717a" />
                            <Text style={styles.addPhotoText}>Add Photo</Text>
                        </TouchableOpacity>

                        {images.map((img, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri: img.uri }} style={styles.imagePreview} />
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
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleCreate}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Posting...' : 'Create Post'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
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
        color: '#ffffff',
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
        color: '#a1a1aa', // zinc-400
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#18181b', // zinc-900
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#ffffff',
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
    typeTextActive: {
        color: '#ffffff',
    },
    typeTextInactive: {
        color: '#a1a1aa',
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
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addPhotoText: {
        color: '#71717a',
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
        backgroundColor: '#27272a',
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
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default CreatePostScreen;
