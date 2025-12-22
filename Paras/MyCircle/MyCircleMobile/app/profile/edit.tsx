import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, User, MapPin, Briefcase } from 'lucide-react-native';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user: authUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        skills: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/user/profile');
            const { displayName, bio, location, skills } = res.data;
            setFormData({
                displayName: displayName || '',
                bio: bio || '',
                location: location || '',
                skills: skills ? skills.join(', ') : ''
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
            };
            await api.put('/user/profile', payload);
            Alert.alert("Success", "Profile updated successfully!");
            router.back();
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#8b5cf6" /></View>;

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4 border-b border-white/10 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-white">Edit Profile</Text>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#8b5cf6" /> : <Text className="text-violet-500 font-bold text-lg">Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Avatar Section */}
                <View className="items-center my-8">
                    <View className="relative">
                        <View className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-900 overflow-hidden">
                            <Image
                                source={{ uri: authUser?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${authUser?.displayName}` }}
                                className="w-full h-full"
                            />
                        </View>
                        <TouchableOpacity className="absolute bottom-0 right-0 bg-violet-600 p-2 rounded-full border-2 border-black">
                            <Camera size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-zinc-500 mt-2 text-xs">Change Profile Picture</Text>
                </View>

                {/* Form Fields */}
                <View className="gap-6 pb-10">
                    <View>
                        <Text className="text-zinc-400 mb-2 ml-1 font-medium">Display Name</Text>
                        <View className="flex-row items-center bg-zinc-900 rounded-2xl border border-white/5 px-4 py-3">
                            <User size={20} color="#71717a" className="mr-3" />
                            <TextInput
                                className="flex-1 text-white ml-2 text-base"
                                value={formData.displayName}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                                placeholder="Enter display name"
                                placeholderTextColor="#3f3f46"
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-zinc-400 mb-2 ml-1 font-medium">Bio</Text>
                        <View className="bg-zinc-900 rounded-2xl border border-white/5 px-4 py-3 min-h-[120px]">
                            <TextInput
                                className="text-white text-base"
                                value={formData.bio}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor="#3f3f46"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-zinc-400 mb-2 ml-1 font-medium">Location</Text>
                        <View className="flex-row items-center bg-zinc-900 rounded-2xl border border-white/5 px-4 py-3">
                            <MapPin size={20} color="#71717a" className="mr-3" />
                            <TextInput
                                className="flex-1 text-white ml-2 text-base"
                                value={formData.location}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                                placeholder="City, Country"
                                placeholderTextColor="#3f3f46"
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-zinc-400 mb-2 ml-1 font-medium">Skills (comma separated)</Text>
                        <View className="flex-row items-center bg-zinc-900 rounded-2xl border border-white/5 px-4 py-3">
                            <Briefcase size={20} color="#71717a" className="mr-3" />
                            <TextInput
                                className="flex-1 text-white ml-2 text-base"
                                value={formData.skills}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, skills: text }))}
                                placeholder="e.g. Design, React, Painting"
                                placeholderTextColor="#3f3f46"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
