import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera, X } from 'lucide-react-native';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const CreatePostScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
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
                        {['job', 'service', 'sell', 'rent'].map((t) => (
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
                        <Text style={[styles.label, themeStyles.textSecondary]}>Location</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder="Area / City"
                            placeholderTextColor={colors.textSecondary}
                            value={location}
                            onChangeText={setLocation}
                        />
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
});

export default CreatePostScreen;
