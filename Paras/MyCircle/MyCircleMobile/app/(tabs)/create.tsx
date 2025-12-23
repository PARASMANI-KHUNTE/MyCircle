import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, X } from 'lucide-react-native';
import api from '../../src/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function CreatePost() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('job');
    const [location, setLocation] = useState('');
    const [price, setPrice] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!title || !description || !location || !price) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            // Validate and prepare FormData
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            formData.append('location', location);
            formData.append('price', price);

            images.forEach((imageUri, index) => {
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                formData.append('images', { uri: imageUri, name: filename, type });
            });

            await api.post('/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Post created successfully!');
            // Reset form
            setTitle('');
            setDescription('');
            setLocation('');
            setPrice('');
            setImages([]);
            router.push('/(tabs)');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create post. ' + (error.response?.data?.msg || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4 border-b border-white/10 flex-row justify-between items-center">
                <Text className="text-xl font-bold text-white">New Post</Text>
                {loading && <ActivityIndicator />}
            </View>

            <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
                {/* Title */}
                <View className="mb-4">
                    <Text className="text-zinc-400 mb-2 ml-1">Title</Text>
                    <TextInput
                        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white"
                        placeholder="What are you posting?"
                        placeholderTextColor="#52525b"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Type Selection */}
                <View className="mb-4">
                    <Text className="text-zinc-400 mb-2 ml-1">Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                        {['job', 'service', 'sell', 'rent'].map((t) => (
                            <TouchableOpacity
                                key={t}
                                onPress={() => setType(t)}
                                className={`px-4 py-2 rounded-full border ${type === t ? 'bg-indigo-600 border-indigo-500' : 'bg-zinc-900 border-white/10'}`}
                            >
                                <Text className={`capitalize font-bold ${type === t ? 'text-white' : 'text-zinc-400'}`}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Description */}
                <View className="mb-4">
                    <Text className="text-zinc-400 mb-2 ml-1">Description</Text>
                    <TextInput
                        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white h-32"
                        placeholder="Describe your post in detail..."
                        placeholderTextColor="#52525b"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Location & Price */}
                <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                        <Text className="text-zinc-400 mb-2 ml-1">Location</Text>
                        <TextInput
                            className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white"
                            placeholder="Area / City"
                            placeholderTextColor="#52525b"
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-zinc-400 mb-2 ml-1">Price (₹)</Text>
                        <TextInput
                            className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white"
                            placeholder="0"
                            placeholderTextColor="#52525b"
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                        />
                    </View>
                </View>

                {/* Images */}
                <View className="mb-6">
                    <Text className="text-zinc-400 mb-2 ml-1">Images</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                        <TouchableOpacity
                            onPress={pickImage}
                            className="w-24 h-24 bg-zinc-900 border border-white/10 border-dashed rounded-xl justify-center items-center"
                        >
                            <Camera size={24} color="#71717a" />
                            <Text className="text-zinc-500 text-xs mt-1">Add Photo</Text>
                        </TouchableOpacity>

                        {images.map((img, index) => (
                            <View key={index} className="w-24 h-24 relative">
                                <Image source={{ uri: img }} className="w-full h-full rounded-xl bg-zinc-800" />
                                <TouchableOpacity
                                    onPress={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                                >
                                    <X size={12} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    className="bg-white py-4 rounded-xl mb-10 active:opacity-90"
                    onPress={handleCreate}
                    disabled={loading}
                >
                    <Text className="text-black text-center font-bold text-lg">
                        {loading ? 'Posting...' : 'Create Post'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
