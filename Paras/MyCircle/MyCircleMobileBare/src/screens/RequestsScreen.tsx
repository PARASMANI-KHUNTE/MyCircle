import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../services/api';
import { X, Check, MessageCircle, Trash2 } from 'lucide-react-native';
import { getAvatarUrl } from '../utils/avatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ThemedAlert from '../components/ui/ThemedAlert';
import { useNotifications } from '../context/NotificationContext';

const RequestsScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const { notifications, markAsRead } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        isDestructive: boolean;
    }>({
        visible: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: () => { },
        isDestructive: false,
    });

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
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Failed to fetch requests',
                confirmText: 'OK',
                isDestructive: false,
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRequests();

            // Mark related notifications as read
            const relatedNotifications = notifications.filter(n =>
                !n.read && (n.type === 'request' || n.type === 'approval' || n.type === 'request_received' || n.type === 'request_approved')
            );
            relatedNotifications.forEach(n => markAsRead(n._id));
        }, [notifications])
    );

    const handleAction = async (id: string, status: string) => {
        try {
            await api.put(`/contacts/${id}/status`, { status });
            setAlertConfig({
                visible: true,
                title: 'Success',
                message: `Request ${status} successfully`,
                confirmText: 'Great',
                isDestructive: false,
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    fetchRequests();
                }
            });
        } catch (error) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Failed to update status',
                confirmText: 'OK',
                isDestructive: false,
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
            });
        }
    };

    const handleDelete = (id: string, type: 'withdraw' | 'clear') => {
        setAlertConfig({
            visible: true,
            title: type === 'withdraw' ? 'Withdraw Request' : 'Clear Request',
            message: type === 'withdraw'
                ? 'Are you sure you want to withdraw this contact request?'
                : 'Are you sure you want to clear this request from your list?',
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                try {
                    await api.delete(`/contacts/${id}`);
                    fetchRequests();
                } catch (error) {
                    setAlertConfig({
                        visible: true,
                        title: 'Error',
                        message: 'Failed to delete request',
                        confirmText: 'OK',
                        isDestructive: false,
                        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                    });
                }
            }
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderReceivedItem = ({ item }: any) => {
        if (!item.post) return null; // Skip if post is deleted (cascade delete handles new ones, this hides old orphans)

        return (
            <View style={[styles.requestCard, themeStyles.card]}>
                <View style={styles.cardHeader}>
                    {item.post.images && item.post.images[0] ? (
                        <Image source={{ uri: item.post.images[0] }} style={styles.postThumbnail} />
                    ) : (
                        <View style={[styles.postThumbnail, styles.placeholderThumbnail]}>
                            <Image source={require('../assets/logo.png')} style={{ width: 24, height: 24, opacity: 0.5 }} />
                        </View>
                    )}
                    <View style={styles.headerText}>
                        <TouchableOpacity onPress={() => navigation.navigate('PostDetails', { id: item.post._id })}>
                            <Text style={[styles.postTitle, themeStyles.text]} numberOfLines={1}>{item.post.title}</Text>
                        </TouchableOpacity>
                        <View style={styles.metaRow}>
                            <Text style={[styles.postType, themeStyles.textSecondary]}>{item.post.type}</Text>
                            <Text style={[styles.dateText, themeStyles.textSecondary]}>• {formatDate(item.createdAt)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDelete(item._id, 'clear')}
                        style={styles.deleteIcon}
                    >
                        <Trash2 size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.divider, themeStyles.divider]} />

                <View style={styles.requesterSection}>
                    <Image
                        source={{ uri: getAvatarUrl(item.requester) }}
                        style={[styles.avatar, themeStyles.avatarBg]}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.userName, themeStyles.text]}>{item.requester?.displayName}</Text>
                        <Text style={[styles.requestContext, themeStyles.textSecondary]}>wants to contact you</Text>
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
                    <View>
                        <View style={[
                            styles.statusBadge,
                            item.status === 'approved' ? styles.approvedBadge : styles.rejectedBadge,
                            { marginTop: 12 }
                        ]}>
                            <Text style={[
                                styles.statusText,
                                item.status === 'approved' ? styles.approvedText : styles.rejectedText
                            ]}>Request {item.status}</Text>
                        </View>
                        {item.status === 'approved' && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ChatWindow', { recipient: item.requester })}
                                style={[styles.chatButton, { backgroundColor: colors.primary }]}
                            >
                                <MessageCircle size={18} color="white" />
                                <Text style={styles.chatButtonText}>Chat</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderSentItem = ({ item }: any) => {
        if (!item.post) return null;

        return (
            <View style={[styles.requestCard, themeStyles.card]}>
                <View style={styles.cardHeader}>
                    {item.post.images && item.post.images[0] ? (
                        <Image source={{ uri: item.post.images[0] }} style={styles.postThumbnail} />
                    ) : (
                        <View style={[styles.postThumbnail, styles.placeholderThumbnail]}>
                            <Image source={require('../assets/logo.png')} style={{ width: 24, height: 24, opacity: 0.5 }} />
                        </View>
                    )}
                    <View style={styles.headerText}>
                        <Text style={[styles.postTitleLarge, themeStyles.text]} numberOfLines={1}>{item.post?.title}</Text>
                        <View style={styles.metaRow}>
                            <Text style={[styles.sentToText, themeStyles.textSecondary]}>To: <Text style={{ fontWeight: 'bold', color: colors.text }}>{item.recipient?.displayName}</Text></Text>
                            <Text style={[styles.dateText, themeStyles.textSecondary]}>• {formatDate(item.createdAt)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDelete(item._id, 'withdraw')}
                        style={styles.deleteIcon}
                    >
                        <Trash2 size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.divider, themeStyles.divider]} />

                <View style={styles.footerRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.statusLabel, themeStyles.textSecondary, { marginRight: 8 }]}>Status:</Text>
                        <View style={[
                            styles.statusChip,
                            item.status === 'approved' ? styles.approvedBadge :
                                item.status === 'rejected' ? styles.rejectedBadge : styles.pendingBadge
                        ]}>
                            <Text style={[
                                styles.statusText,
                                item.status === 'approved' ? styles.approvedText :
                                    item.status === 'rejected' ? styles.rejectedText : styles.pendingText,
                                { fontSize: 12 }
                            ]}>{item.status}</Text>
                        </View>
                    </View>

                    {item.status === 'approved' && (
                        <View style={styles.contactActions}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ChatWindow', { recipient: item.recipient })}
                                style={[styles.iconButton, { backgroundColor: colors.primary }]}
                            >
                                <MessageCircle size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

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

            <ThemedAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                isDestructive={alertConfig.isDestructive}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
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
        marginBottom: 12,
    },
    postThumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#27272a',
        marginRight: 12,
    },
    placeholderThumbnail: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerText: {
        flex: 1,
        justifyContent: 'center',
    },
    deleteIcon: {
        padding: 4,
        marginLeft: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    dateText: {
        fontSize: 12,
        marginLeft: 6,
    },
    requesterSection: {
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
    statusChip: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    pendingBadge: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)', // yellow-500/10
        borderColor: 'rgba(234, 179, 8, 0.2)',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
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
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 12,
        gap: 8,
    },
    chatButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
});

export default RequestsScreen;
