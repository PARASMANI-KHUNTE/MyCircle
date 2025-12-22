import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Modal, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import PostCard from '../components/ui/PostCard';
import { Trash, Repeat, EyeOff, Eye, ArrowLeft, BarChart2, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const MyPostsScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive', 'sold'

    // Analytics State
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [currentPostTitle, setCurrentPostTitle] = useState('');

    const fetchMyPosts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/posts/my-posts');
            setPosts(res.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch your posts');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMyPosts();
        }, [])
    );

    const handleStatusChange = async (postId: string, newStatus: string) => {
        try {
            await api.patch(`/posts/${postId}/status`, { status: newStatus });
            fetchMyPosts();
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleDelete = async (postId: string) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/posts/${postId}`);
                            setPosts(posts.filter((p: any) => p._id !== postId));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete post');
                        }
                    }
                }
            ]
        );
    };

    const handleShowAnalytics = async (post: any) => {
        setCurrentPostTitle(post.title);
        setAnalyticsLoading(true);
        setShowAnalytics(true);
        try {
            const res = await api.get(`/posts/${post._id}/analytics`);
            setAnalyticsData(res.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch analytics');
            setShowAnalytics(false);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const filteredPosts = posts.filter((post: any) => {
        if (filter === 'all') return true;
        return post.status === filter;
    });

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.postCardWrapper}>
            <PostCard post={item} isOwnPost={true} navigation={navigation} />

            <View style={[styles.actionsToolbar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.actionGroup}>
                    <TouchableOpacity
                        onPress={() => handleShowAnalytics(item)}
                        style={[styles.actionButton, styles.analyticsButton]}
                    >
                        <BarChart2 size={14} color="#8b5cf6" />
                        <Text style={styles.analyticsText}>Stats</Text>
                    </TouchableOpacity>

                    {item.status === 'active' ? (
                        <>
                            <TouchableOpacity
                                onPress={() => handleStatusChange(item._id, 'inactive')}
                                style={[styles.actionButton, styles.inactiveButton]}
                            >
                                <EyeOff size={14} color="#eab308" />
                                <Text style={styles.inactiveText}>Disable</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            onPress={() => handleStatusChange(item._id, 'active')}
                            style={[styles.actionButton, styles.activeButton]}
                        >
                            <Eye size={14} color="#22c55e" />
                            <Text style={styles.activeText}>{item.status === 'sold' ? 'Relist' : 'Enable'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => handleDelete(item._id)}
                    style={[styles.actionButton, styles.deleteButton]}
                >
                    <Trash size={14} color="#ef4444" />
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.innerContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.card }]}>
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>My Posts</Text>
                </View>

                <View style={styles.filtersContainer}>
                    {['all', 'active', 'inactive', 'sold'].map(f => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            style={[
                                styles.filterItem,
                                filter === f
                                    ? [styles.activeFilter, { backgroundColor: colors.primary, borderColor: colors.primary }]
                                    : [styles.inactiveFilter, { backgroundColor: colors.card, borderColor: colors.border }]
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === f
                                    ? [styles.activeFilterText, { color: '#ffffff' }]
                                    : [styles.inactiveFilterText, { color: colors.textSecondary }]
                            ]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={colors.primary} size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredPosts}
                        keyExtractor={item => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts found with this status.</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Analytics Modal */}
            <Modal
                visible={showAnalytics}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAnalytics(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowAnalytics(false)}
                >
                    <Pressable style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{currentPostTitle}</Text>
                            <TouchableOpacity onPress={() => setShowAnalytics(false)}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {analyticsLoading ? (
                            <View style={styles.modalLoading}>
                                <ActivityIndicator color={colors.primary} />
                            </View>
                        ) : analyticsData && (
                            <View style={styles.analyticsGrid}>
                                <View style={styles.analyticsItem}>
                                    <View style={[styles.statBadge, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                        <Text style={[styles.statValue, { color: '#a78bfa' }]}>{analyticsData.views}</Text>
                                    </View>
                                    <Text style={styles.statLabel}>Views</Text>
                                </View>
                                <View style={styles.analyticsItem}>
                                    <View style={[styles.statBadge, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                                        <Text style={[styles.statValue, { color: '#f472b6' }]}>{analyticsData.likes}</Text>
                                    </View>
                                    <Text style={styles.statLabel}>Likes</Text>
                                </View>
                                <View style={styles.analyticsItem}>
                                    <View style={[styles.statBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                        <Text style={[styles.statValue, { color: '#60a5fa' }]}>{analyticsData.shares}</Text>
                                    </View>
                                    <Text style={styles.statLabel}>Shares</Text>
                                </View>
                                <View style={styles.analyticsItem}>
                                    <View style={[styles.statBadge, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
                                        <Text style={[styles.statValue, { color: '#facc15' }]}>{analyticsData.daysActive}</Text>
                                    </View>
                                    <Text style={styles.statLabel}>Days</Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.closeModalButton, { backgroundColor: colors.text }]}
                            onPress={() => setShowAnalytics(false)}
                        >
                            <Text style={[styles.closeModalButtonText, { color: colors.background }]}>Close Analytics</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backButton: {
        padding: 10,
        backgroundColor: '#18181b', // zinc-900
        borderRadius: 20,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    filtersContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 8,
    },
    filterItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    activeFilter: {
        backgroundColor: '#ffffff',
        borderColor: '#ffffff',
    },
    inactiveFilter: {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
    },
    filterText: {
        textTransform: 'capitalize',
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeFilterText: {
        color: '#000000',
    },
    inactiveFilterText: {
        color: '#71717a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 40,
    },
    postCardWrapper: {
        marginBottom: 24,
    },
    actionsToolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // backgroundColor: '#18181b', // Removed hardcoded
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        // borderColor: '#27272a', // Removed hardcoded
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        padding: 12,
        marginTop: -16,
        marginHorizontal: 4,
    },
    actionGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
    },
    analyticsButton: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    analyticsText: {
        color: '#8b5cf6',
        fontSize: 12,
        fontWeight: 'bold',
    },
    inactiveButton: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderColor: 'rgba(234, 179, 8, 0.2)',
    },
    inactiveText: {
        color: '#eab308',
        fontSize: 12,
        fontWeight: 'bold',
    },
    soldButton: {
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        borderColor: 'rgba(96, 165, 250, 0.2)',
    },
    soldText: {
        color: '#60a5fa',
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeButton: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    activeText: {
        color: '#22c55e',
        fontSize: 12,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    deleteText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        marginTop: 80,
        alignItems: 'center',
    },
    emptyText: {
        color: '#71717a',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#18181b',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 12,
    },
    modalLoading: {
        padding: 40,
        alignItems: 'center',
    },
    analyticsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
        marginBottom: 24,
    },
    analyticsItem: {
        width: '50%',
        padding: 8,
        alignItems: 'center',
    },
    statBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#71717a',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    closeModalButton: {
        backgroundColor: '#ffffff',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    closeModalButtonText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default MyPostsScreen;
