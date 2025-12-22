import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { MapPin, Clock, ArrowLeft, MessageCircle, Repeat, Share2, Heart } from 'lucide-react-native';

export default function PostDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPostDetails();
    }, [id]);

    const fetchPostDetails = async () => {
        try {
            const res = await api.get(`/posts/${id}`);
            setPost(res.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load post details');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestContact = async () => {
        try {
            await api.post(`/contacts/${id}`);
            Alert.alert("Success", "Contact Request Sent!");
        } catch (err) {
            Alert.alert("Notice", err.response?.data?.msg || "Failed to send request");
        }
    };

    if (loading) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#8b5cf6" /></View>;
    if (!post) return <View className="flex-1 bg-black justify-center items-center"><Text className="text-white">Post not found</Text></View>;

    return (
        <ScrollView className="flex-1 bg-black" contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Header Image */}
            <View className="h-72 relative">
                {post.images && post.images.length > 0 ? (
                    <Image source={{ uri: post.images[0] }} className="w-full h-full object-cover" />
                ) : (
                    <View className="w-full h-full bg-zinc-900 justify-center items-center">
                        <Text className="text-zinc-600">No Image</Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-4 w-10 h-10 bg-black/50 rounded-full justify-center items-center backdrop-blur-md"
                >
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>

                <View className="absolute bottom-4 left-4 flex-row gap-2">
                    <View className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                        <Text className="text-white text-xs font-bold uppercase">{post.type}</Text>
                    </View>
                    {post.acceptsBarter && (
                        <View className="bg-pink-500/80 px-3 py-1 rounded-full backdrop-blur-md flex-row items-center gap-1">
                            <Repeat size={10} color="white" />
                            <Text className="text-white text-xs font-bold">Barter Accepted</Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="px-5 py-6">
                {/* Title & Price */}
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-2xl font-bold text-white flex-1 mr-4">{post.title}</Text>
                    <Text className="text-2xl font-bold text-green-400">₹{post.price || 0}</Text>
                </View>

                {/* Meta Info */}
                <View className="flex-row items-center gap-4 mb-6">
                    <View className="flex-row items-center gap-1">
                        <MapPin size={14} color="#a1a1aa" />
                        <Text className="text-zinc-400 text-sm">{post.location}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Clock size={14} color="#a1a1aa" />
                        <Text className="text-zinc-400 text-sm">{new Date(post.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* User Info */}
                <View className="flex-row items-center gap-3 mb-6 bg-zinc-900 p-3 rounded-xl border border-white/5">
                    <Image
                        source={{ uri: post.user?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${post.user?.displayName}` }}
                        className="w-12 h-12 rounded-full bg-zinc-800"
                    />
                    <View>
                        <Text className="text-white font-bold">{post.user?.displayName}</Text>
                        <Text className="text-zinc-500 text-xs">Posted by member</Text>
                    </View>
                </View>

                {/* Description */}
                <Text className="text-zinc-300 leading-6 text-base mb-8">
                    {post.description}
                </Text>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={handleRequestContact}
                        className="flex-1 bg-violet-600 py-4 rounded-xl flex-row justify-center items-center gap-2 active:bg-violet-700"
                    >
                        <MessageCircle color="white" size={20} />
                        <Text className="text-white font-bold text-lg">Request Contact</Text>
                    </TouchableOpacity>

                    {post.user?._id !== (user?.id || user?._id) && (
                        <TouchableOpacity
                            onPress={async () => {
                                try {
                                    const res = await api.post(`/chat/init/${post.user._id}`);
                                    router.push(`/chat/${res.data._id}` as any);
                                } catch (err) {
                                    Alert.alert('Notice', 'Conversation already exists or failed to start');
                                }
                            }}
                            className="bg-zinc-800 w-14 rounded-xl justify-center items-center border border-white/10"
                        >
                            <MessageCircle color="#8b5cf6" size={24} />
                        </TouchableOpacity>
                    )}
                </View>

                <View className="mt-6 flex-row justify-center gap-6">
                    <TouchableOpacity className="items-center gap-1">
                        <Heart size={24} color="#ef4444" />
                        <Text className="text-zinc-400 text-xs">Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center gap-1">
                        <Share2 size={24} color="#fff" />
                        <Text className="text-zinc-400 text-xs">Share</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
}
