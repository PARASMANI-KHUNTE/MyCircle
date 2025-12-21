import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Settings, LogOut, MapPin } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/services/api';

export default function Profile() {
    const { logout } = useAuth();
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/user/profile');
            setUser(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: logout }
        ]);
    };

    if (!user) return <View className="flex-1 bg-black justify-center items-center"><Text className="text-white">Loading...</Text></View>;

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <ScrollView className="flex-1 px-4 py-4">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-3xl font-bold text-white">Profile</Text>
                    <TouchableOpacity onPress={handleLogout} className="p-2 bg-zinc-900 rounded-full">
                        <LogOut size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View className="items-center mb-8">
                    <View className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden mb-4">
                        <Image
                            source={{ uri: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.displayName}` }}
                            className="w-full h-full"
                        />
                    </View>
                    <Text className="text-2xl font-bold text-white">{user.displayName}</Text>
                    <Text className="text-zinc-400">{user.email}</Text>

                    {user.location && (
                        <View className="flex-row items-center gap-1 mt-2">
                            <MapPin size={14} color="#a1a1aa" />
                            <Text className="text-zinc-500">{user.location}</Text>
                        </View>
                    )}
                </View>

                {/* Statistics */}
                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-zinc-900 p-4 rounded-2xl border border-white/5 items-center">
                        <Text className="text-2xl font-bold text-white">{user.stats?.totalPosts || 0}</Text>
                        <Text className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Posts</Text>
                    </View>
                    <View className="flex-1 bg-zinc-900 p-4 rounded-2xl border border-white/5 items-center">
                        <Text className="text-2xl font-bold text-purple-500">{user.stats?.requestsReceived || 0}</Text>
                        <Text className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Requests</Text>
                    </View>
                    <View className="flex-1 bg-zinc-900 p-4 rounded-2xl border border-white/5 items-center">
                        <Text className="text-2xl font-bold text-green-500">{user.stats?.rating?.toFixed(1) || '5.0'}</Text>
                        <Text className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Rating</Text>
                    </View>
                </View>

                {/* Bio */}
                <View className="mb-6">
                    <Text className="text-zinc-400 mb-2 font-medium">Bio</Text>
                    <Text className="text-zinc-300 leading-6">
                        {user.bio || "No bio added yet."}
                    </Text>
                </View>

                {/* Skills */}
                <View className="mb-6">
                    <Text className="text-zinc-400 mb-2 font-medium">Skills & Interests</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {user.skills && user.skills.length > 0 ? (
                            user.skills.map((skill, index) => (
                                <View key={index} className="bg-zinc-900 px-3 py-1.5 rounded-lg border border-white/5">
                                    <Text className="text-zinc-300 text-sm">{skill}</Text>
                                </View>
                            ))
                        ) : (
                            <Text className="text-zinc-300 italic">No skills listed.</Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity className="bg-white py-3 rounded-xl items-center mt-4">
                    <Text className="font-bold text-black">Edit Profile</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}
