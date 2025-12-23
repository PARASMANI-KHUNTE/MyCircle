import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../src/services/api';
import { Phone, MessageCircle, X, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Requests() {
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const [receivedRes, sentRes] = await Promise.all([
                api.get('/contacts/received'),
                api.get('/contacts/sent')
            ]);
            setReceivedRequests(receivedRes.data);
            setSentRequests(sentRes.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRequests();
        }, [])
    );

    const handleAction = async (id, status) => {
        try {
            await api.post(`/contacts/${id}/status`, { status });
            Alert.alert('Success', `Request ${status}`);
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleWhatsApp = (number) => {
        Linking.openURL(`whatsapp://send?phone=${number}`);
    };

    const handleCall = (number) => {
        Linking.openURL(`tel:${number}`);
    };

    const renderReceivedItem = ({ item }) => (
        <View className="bg-zinc-900 mb-3 p-4 rounded-xl border border-white/10">
            <View className="flex-row items-center gap-3 mb-3">
                <Image
                    source={{ uri: item.requester?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${item.requester?._id}` }}
                    className="w-10 h-10 rounded-full bg-zinc-800"
                />
                <View className="flex-1">
                    <Text className="text-white font-bold">{item.requester?.displayName}</Text>
                    <Text className="text-zinc-400 text-xs">wants to contact regarding your post:</Text>
                    <Text className="text-blue-400 font-medium">{item.post?.title}</Text>
                </View>
            </View>

            {item.status === 'pending' ? (
                <View className="flex-row gap-3 mt-2">
                    <TouchableOpacity
                        onPress={() => handleAction(item._id, 'rejected')}
                        className="flex-1 bg-red-500/10 border border-red-500/20 py-2 rounded-lg flex-row justify-center items-center gap-2"
                    >
                        <X size={16} color="#ef4444" />
                        <Text className="text-red-500 font-bold text-sm">Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleAction(item._id, 'approved')}
                        className="flex-1 bg-green-500/10 border border-green-500/20 py-2 rounded-lg flex-row justify-center items-center gap-2"
                    >
                        <Check size={16} color="#22c55e" />
                        <Text className="text-green-500 font-bold text-sm">Approve</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View className={`py-2 rounded-lg items-center border ${item.status === 'approved' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                    }`}>
                    <Text className={`font-bold capitalize ${item.status === 'approved' ? 'text-green-500' : 'text-red-500'
                        }`}>{item.status}</Text>
                </View>
            )}
        </View>
    );

    const renderSentItem = ({ item }) => (
        <View className="bg-zinc-900 mb-3 p-4 rounded-xl border border-white/10">
            <View className="mb-2">
                <Text className="text-zinc-400 text-xs">Request sent to <Text className="text-white font-bold">{item.recipient?.displayName}</Text></Text>
                <Text className="text-white font-bold text-lg">{item.post?.title}</Text>
                <Text className="text-zinc-500 text-xs capitalize">{item.post?.type}</Text>
            </View>

            <View className="my-2 h-[1px] bg-white/5" />

            <View className="flex-row justify-between items-center">
                <View>
                    <Text className="text-zinc-500 text-xs mb-1">Status</Text>
                    <Text className={`font-bold capitalize ${item.status === 'approved' ? 'text-green-500' :
                        item.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                        }`}>{item.status}</Text>
                </View>

                {item.status === 'approved' && (
                    <View className="flex-row gap-2">
                        {item.post?.contactWhatsapp && (
                            <TouchableOpacity onPress={() => handleWhatsApp(item.post.contactWhatsapp)} className="bg-green-600 p-2 rounded-full">
                                <MessageCircle size={20} color="white" />
                            </TouchableOpacity>
                        )}
                        {item.post?.contactPhone && (
                            <TouchableOpacity onPress={() => handleCall(item.post.contactPhone)} className="bg-blue-600 p-2 rounded-full">
                                <Phone size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4">
                <Text className="text-3xl font-bold text-white mb-4">Requests</Text>

                {/* Tabs */}
                <View className="flex-row bg-zinc-900 p-1 rounded-xl mb-4 border border-white/10">
                    <TouchableOpacity
                        onPress={() => setActiveTab('received')}
                        className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'received' ? 'bg-zinc-800' : ''}`}
                    >
                        <Text className={`font-bold ${activeTab === 'received' ? 'text-white' : 'text-zinc-500'}`}>Received</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('sent')}
                        className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'sent' ? 'bg-zinc-800' : ''}`}
                    >
                        <Text className={`font-bold ${activeTab === 'sent' ? 'text-white' : 'text-zinc-500'}`}>Sent</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator color="#8b5cf6" className="mt-10" />
                ) : (
                    <FlatList
                        data={activeTab === 'received' ? receivedRequests : sentRequests}
                        keyExtractor={item => item._id}
                        renderItem={activeTab === 'received' ? renderReceivedItem : renderSentItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <Text className="text-zinc-500 text-center mt-20">No requests found</Text>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
