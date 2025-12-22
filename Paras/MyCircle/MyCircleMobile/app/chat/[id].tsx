import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useSocket } from '../../src/context/SocketContext';
import api from '../../src/services/api';
import { ArrowLeft, Send } from 'lucide-react-native';
import clsx from 'clsx';

export default function ChatWindow() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { socket } = useSocket();

    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchMessages();

        if (socket) {
            socket.emit('join_conversation', id);

            socket.on('receive_message', (data: any) => {
                if (data.conversationId === id) {
                    setMessages(prev => [...prev, data.message]);
                    // Auto-read
                    socket.emit('read_messages', id);
                }
            });

            socket.on('messages_read', (data: any) => {
                if (data.conversationId === id) {
                    setMessages(prev => prev.map(m => ({ ...m, status: 'read' })));
                }
            });
        }

        return () => {
            if (socket) {
                socket.emit('leave_conversation', id);
                socket.off('receive_message');
                socket.off('messages_read');
            }
        };
    }, [id, socket]);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/chat/messages/${id}`);
            setMessages(res.data.messages);
            setConversation(res.data.conversation);
            setLoading(false);
            // Mark as read
            if (socket) socket.emit('read_messages', id);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!inputText.trim() || !socket) return;

        const messageData = {
            conversationId: id,
            text: inputText.trim()
        };

        socket.emit('send_message', messageData);
        setInputText('');
    };

    const otherUser = conversation?.participants.find((p: any) => p._id !== user?._id);

    if (loading) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#8b5cf6" /></View>;

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            {/* Header */}
            <View className="px-4 py-3 border-b border-white/10 flex-row items-center bg-zinc-900/50">
                <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Image
                    source={{ uri: otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.displayName}` }}
                    className="w-10 h-10 rounded-full"
                />
                <View className="ml-3">
                    <Text className="text-white font-bold text-lg">{otherUser?.displayName}</Text>
                    <Text className="text-green-500 text-xs font-medium">Online</Text>
                </View>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item._id || Math.random().toString()}
                    renderItem={({ item }) => {
                        const isMe = item.sender === (user?._id || user?.id);
                        return (
                            <View className={clsx("flex-row mb-3 px-4", isMe ? "justify-end" : "justify-start")}>
                                <View className={clsx(
                                    "max-w-[80%] px-4 py-2.5 rounded-2xl",
                                    isMe ? "bg-violet-600 rounded-tr-none" : "bg-zinc-800 rounded-tl-none"
                                )}>
                                    <Text className="text-white text-base">{item.text}</Text>
                                    <View className="flex-row justify-end items-center mt-1 gap-1">
                                        <Text className="text-[10px] text-zinc-400">
                                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        {isMe && (
                                            <Text className="text-[10px] text-zinc-500">
                                                {item.status === 'read' ? '✓✓' : '✓'}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    className="flex-1 pt-4"
                />

                {/* Input */}
                <View className="px-4 py-3 border-t border-white/10 bg-zinc-900/80 flex-row items-center gap-3">
                    <TextInput
                        className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-2xl border border-white/5"
                        placeholder="Type a message..."
                        placeholderTextColor="#71717a"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                        className={clsx(
                            "w-12 h-12 rounded-full items-center justify-center",
                            inputText.trim() ? "bg-violet-600" : "bg-zinc-800"
                        )}
                    >
                        <Send color="white" size={20} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
