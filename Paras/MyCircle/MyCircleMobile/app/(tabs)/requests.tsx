import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import api from '../../src/services/api';
import { Check, X, Phone, MessageCircle } from 'lucide-react-native';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'received' ? '/contact/received' : '/contact/sent';
            const res = await api.get(endpoint);
            setRequests(res.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            await api.put(`/contact/${requestId}/status`, { status });
            Alert.alert("Success", `Request ${status}`);
            fetchRequests();
        } catch (err: any) {
            Alert.alert("Error", "Action failed");
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isReceived = activeTab === 'received';

        return (
            <View className="bg-card mb-4 p-4 rounded-2xl border border-white/10">
                <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-10 h-10 rounded-full bg-secondary/50 items-center justify-center">
                        <Text className="text-white font-bold text-lg">
                            {isReceived ? item.requester?.displayName?.charAt(0) : item.recipient?.displayName?.charAt(0)}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-white font-bold">
                            {isReceived ? item.requester?.displayName : item.recipient?.displayName}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                            On: <Text className="text-primary">{item.post?.title}</Text>
                        </Text>
                    </View>
                </View>

                {item.message && (
                    <Text className="text-gray-500 italic text-sm mb-3">"{item.message}"</Text>
                )}

                {/* Status or Actions */}
                <View className="flex-row justify-between items-center mt-2 border-t border-white/5 pt-3">
                    <View className={`px-2 py-1 rounded-md border ${item.status === 'approved' ? 'bg-green-500/10 border-green-500/30' :
                            item.status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                                'bg-yellow-500/10 border-yellow-500/30'
                        }`}>
                        <Text className={`text-xs capitalize font-bold ${item.status === 'approved' ? 'text-green-400' :
                                item.status === 'rejected' ? 'text-red-400' :
                                    'text-yellow-400'
                            }`}>{item.status}</Text>
                    </View>

                    {/* Actions for Received Pending */}
                    {isReceived && item.status === 'pending' && (
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => handleAction(item._id, 'approved')}
                                className="bg-primary p-2 rounded-full"
                            >
                                <Check size={16} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleAction(item._id, 'rejected')}
                                className="bg-red-500/20 p-2 rounded-full"
                            >
                                <X size={16} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Contact Info REVEAL for Approved Sent Requests */}
                    {!isReceived && item.status === 'approved' && item.post && (
                        <View className="flex-row gap-3">
                            {item.post.contactPhone && (
                                <TouchableOpacity className="flex-row items-center gap-1">
                                    <Phone size={14} color="#a1a1aa" />
                                    <Text className="text-gray-300 text-xs">{item.post.contactPhone}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background pt-10 px-4">
            <Text className="text-2xl font-bold text-white mb-6">Requests</Text>

            {/* Tabs */}
            <View className="flex-row mb-6 bg-secondary/30 p-1 rounded-xl">
                <TouchableOpacity
                    className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'received' ? 'bg-primary' : ''}`}
                    onPress={() => setActiveTab('received')}
                >
                    <Text className={`font-bold ${activeTab === 'received' ? 'text-white' : 'text-gray-400'}`}>Received</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'sent' ? 'bg-primary' : ''}`}
                    onPress={() => setActiveTab('sent')}
                >
                    <Text className={`font-bold ${activeTab === 'sent' ? 'text-white' : 'text-gray-400'}`}>My Apps</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color="#8b5cf6" />
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item: any) => item._id}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text className="text-gray-500 text-center mt-10">No requests found.</Text>
                    }
                />
            )}
        </View>
    );
};

export default Requests;
