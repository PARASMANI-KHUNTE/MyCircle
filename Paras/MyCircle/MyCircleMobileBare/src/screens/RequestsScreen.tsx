import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import api from '../services/api';
import { X, Check, Phone, MessageCircle, ArrowLeft } from 'lucide-react-native';
import { getAvatarUrl } from '../utils/avatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const RequestsScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

    const themeStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        border: { borderColor: colors.border },
        highlight: { backgroundColor: colors.primary + '10' },
        activeTab: { backgroundColor: colors.input },
        inactiveTab: { backgroundColor: colors.card },
        avatarBg: { backgroundColor: colors.input },
        divider: { backgroundColor: colors.border }
    };

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

    const handleAction = async (id: string, status: string) => {
        try {
            await api.put(`/contacts/${id}/status`, { status });
            Alert.alert('Success', `Request ${status}`);
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleWhatsApp = (number: string) => {
        // Remove non-numeric characters for WhatsApp link (except + if needed, usually WhatsApp prefers just digits with country code)
        // If number doesn't have country code (assuming India +91 default if missing for now, or handle broadly)
        let formattedCheck = number.replace(/[^\d+]/g, '');

        // Remove leading 0 if present
        if (formattedCheck.startsWith('0')) formattedCheck = formattedCheck.substring(1);

        // If no country code (length 10 for India), add 91
        if (formattedCheck.length === 10) {
            formattedCheck = '91' + formattedCheck;
        } else if (formattedCheck.startsWith('+')) {
            formattedCheck = formattedCheck.substring(1); // WhatsApp API usually takes '9198...' not '+91...'
        }

        Linking.openURL(`whatsapp://send?phone=${formattedCheck}`);
    };

    const handleCall = (number: string) => {
        // Ensure the number is treated as a phone URI
        Linking.openURL(`tel:${number}`);
    };

    const renderReceivedItem = ({ item }: any) => (
        <View style={[styles.requestCard, themeStyles.card]}>
            <View style={styles.cardHeader}>
                <Image
                    source={{ uri: getAvatarUrl(item.requester) }}
                    style={[styles.avatar, themeStyles.avatarBg]}
                />
                <View style={styles.headerText}>
                    <Text style={[styles.userName, themeStyles.text]}>{item.requester?.displayName}</Text>
                    <Text style={[styles.requestContext, themeStyles.textSecondary]}>wants to contact regarding your post:</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('PostDetails', { id: item.post._id })}>
                        <Text style={[styles.postTitle, { textDecorationLine: 'underline' }]}>{item.post?.title}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {item.status === 'pending' ? (
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        onPress={() => handleAction(item._id, 'rejected')}
                        style={[styles.actionButton, styles.rejectButton]}
                    >
                        <X size={16} color="#ef4444" />
                        <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleAction(item._id, 'approved')}
                        style={[styles.actionButton, styles.approveButton]}
                    >
                        <Check size={16} color="#22c55e" />
                        <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={[
                    styles.statusBadge,
                    item.status === 'approved' ? styles.approvedBadge : styles.rejectedBadge
                ]}>
                    <Text style={[
                        styles.statusText,
                        item.status === 'approved' ? styles.approvedText : styles.rejectedText
                    ]}>{item.status}</Text>
                </View>
            )}
        </View>
    );

    const renderSentItem = ({ item }: any) => (
        <View style={[styles.requestCard, themeStyles.card]}>
            <View style={styles.cardHeader}>
                <View style={styles.headerText}>
                    <Text style={[styles.sentToText, themeStyles.textSecondary]}>Request sent to <Text style={{ fontWeight: 'bold', color: colors.text }}>{item.recipient?.displayName}</Text></Text>
                    <Text style={[styles.postTitleLarge, themeStyles.text]}>{item.post?.title}</Text>
                    <Text style={[styles.postType, themeStyles.textSecondary]}>{item.post?.type}</Text>
                </View>
            </View>

            <View style={[styles.divider, themeStyles.divider]} />

            <View style={styles.footerRow}>
                <View>
                    <Text style={[styles.statusLabel, themeStyles.textSecondary]}>Status</Text>
                    <Text style={[
                        styles.statusTextLarge,
                        item.status === 'approved' ? styles.approvedText :
                            item.status === 'rejected' ? styles.rejectedText : styles.pendingText
                    ]}>{item.status}</Text>
                </View>

                {item.status === 'approved' && (
                    <View style={styles.contactActions}>
                        {item.post?.contactWhatsapp && (
                            <TouchableOpacity
                                onPress={() => handleWhatsApp(item.post.contactWhatsapp)}
                                style={styles.whatsappButton}
                            >
                                <MessageCircle size={20} color="white" />
                                <Text style={styles.actionButtonLabel}>WhatsApp</Text>
                            </TouchableOpacity>
                        )}
                        {item.post?.contactPhone && (
                            <TouchableOpacity
                                onPress={() => handleCall(item.post.contactPhone)}
                                style={styles.callButton}
                            >
                                <Phone size={20} color="white" />
                                <Text style={styles.actionButtonLabel}>Call</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top']}>
            <View style={styles.innerContainer}>
                <Text style={[styles.headerTitle, themeStyles.text]}>Requests</Text>

                <View style={[styles.tabsContainer, themeStyles.inactiveTab, themeStyles.border]}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('received')}
                        style={[styles.tab, activeTab === 'received' ? themeStyles.activeTab : null]}
                    >
                        <Text style={[styles.tabText, activeTab === 'received' ? { color: colors.text } : themeStyles.textSecondary]}>Received</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('sent')}
                        style={[styles.tab, activeTab === 'sent' ? themeStyles.activeTab : null]}
                    >
                        <Text style={[styles.tabText, activeTab === 'sent' ? { color: colors.text } : themeStyles.textSecondary]}>Sent</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={colors.primary} size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={activeTab === 'received' ? receivedRequests : sentRequests}
                        keyExtractor={item => item._id}
                        renderItem={activeTab === 'received' ? renderReceivedItem : renderSentItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, themeStyles.textSecondary]}>No requests found</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    innerContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    tab: {
        flex: 1,
        borderRadius: 8,
        alignItems: 'center',
        paddingVertical: 10,
    },
    activeTab: {
        backgroundColor: '#27272a', // zinc-800
    },
    tabText: {
        color: '#71717a', // zinc-500
        fontWeight: 'bold',
    },
    activeTabText: {
        color: '#ffffff',
    },
    listContent: {
        paddingBottom: 20,
    },
    requestCard: {
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#27272a',
    },
    headerText: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    requestContext: {
        color: '#a1a1aa',
        fontSize: 12,
    },
    postTitle: {
        color: '#60a5fa', // blue-400
        fontWeight: '500',
        fontSize: 14,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    rejectButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500/10
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginRight: 8,
    },
    approveButton: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)', // green-500/10
        borderColor: 'rgba(34, 197, 94, 0.2)',
        marginLeft: 8,
    },
    rejectText: {
        color: '#ef4444',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    approveText: {
        color: '#22c55e',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    statusBadge: {
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    approvedBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    rejectedBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    statusText: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    approvedText: {
        color: '#22c55e',
    },
    rejectedText: {
        color: '#ef4444',
    },
    pendingText: {
        color: '#eab308', // yellow-500
    },
    sentToText: {
        color: '#a1a1aa',
        fontSize: 12,
    },
    boldWhite: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    postTitleLarge: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 20,
        marginTop: 4,
    },
    postType: {
        color: '#71717a',
        fontSize: 12,
        textTransform: 'capitalize',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 12,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        color: '#71717a',
        fontSize: 11,
        marginBottom: 2,
    },
    statusTextLarge: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
        fontSize: 16,
    },
    contactActions: {
        flexDirection: 'row',
    },
    whatsappButton: {
        backgroundColor: '#16a34a', // green-600
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    callButton: {
        backgroundColor: '#2563eb', // blue-600
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionButtonLabel: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    callButtonText: { // Keeping for fallback if logic changes
        color: 'white',
    },
    loadingContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 80,
        alignItems: 'center',
    },
    emptyText: {
        color: '#71717a',
        fontSize: 16,
    },
});

export default RequestsScreen;
