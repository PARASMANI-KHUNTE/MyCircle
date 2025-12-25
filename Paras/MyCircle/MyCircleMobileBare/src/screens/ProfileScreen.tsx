import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import ThemedAlert from '../components/ui/ThemedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Settings, LogOut, MessageCircle, Star, User, Edit3, Clock, Edit, Trash2 } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const ProfileScreen = ({ navigation, route }: any) => {
    const { user: authUser, logout } = useAuth();
    const { colors } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ posts: 0, requests: 0, rating: 0 });
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [myPosts, setMyPosts] = useState<any[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
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

    const userId = route.params?.userId || authUser?._id || authUser?.id;
    const isOwnProfile = userId === (authUser?._id || authUser?.id);

    const fetchProfile = async () => {
        try {
            const endpoint = isOwnProfile ? '/user/profile' : `/user/${userId}`;
            const res = await api.get(endpoint);
            setUser(res.data);

            if (isOwnProfile) {
                const statsRes = await api.get('/user/stats');
                setStats({
                    posts: statsRes.data.stats.totalPosts || 0,
                    requests: statsRes.data.stats.receivedRequests || 0,
                    rating: statsRes.data.rating || 5.0
                });
                fetchMyPosts();
            } else {
                setStats({
                    posts: res.data.postsCount || 0,
                    requests: res.data.requestsCount || 0,
                    rating: res.data.rating || 5.0
                });
            }
        } catch (error) {
            console.error(error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Failed to load profile',
                confirmText: 'OK',
                isDestructive: false,
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    navigation.goBack();
                }
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchMyPosts = async () => {
        if (!isOwnProfile) return;
        try {
            setPostsLoading(true);
            const res = await api.get('/posts/my-posts');
            setMyPosts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setPostsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [userId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const handleLogout = () => {
        setAlertConfig({
            visible: true,
            title: "Logout",
            message: "Are you sure you want to logout?",
            confirmText: "Logout",
            isDestructive: true,
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                await logout();
            }
        });
    };

    const handleBlock = () => {
        setAlertConfig({
            visible: true,
            title: "Block User",
            message: "Are you sure you want to block this user?",
            confirmText: "Block",
            isDestructive: true,
            onConfirm: async () => {
                try {
                    await api.post(`/user/block/${userId}`);
                    setAlertConfig({
                        visible: true,
                        title: "Blocked",
                        message: "User has been blocked",
                        confirmText: "OK",
                        isDestructive: false,
                        onConfirm: () => {
                            setAlertConfig(prev => ({ ...prev, visible: false }));
                            navigation.goBack();
                        }
                    });
                } catch (error) {
                    setAlertConfig({
                        visible: true,
                        title: "Error",
                        message: "Failed to block user",
                        confirmText: "OK",
                        isDestructive: false,
                        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
                    });
                }
            }
        });
    };

    const handleDeletePost = (postId: string) => {
        setAlertConfig({
            visible: true,
            title: "Delete Post",
            message: "Are you sure you want to delete this post? This action cannot be undone.",
            confirmText: "Delete",
            isDestructive: true,
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                try {
                    await api.delete(`/posts/${postId}`);
                    fetchMyPosts();
                    fetchProfile();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const formatTimeLeft = (expiresAt: string) => {
        const diff = new Date(expiresAt).getTime() - now.getTime();
        if (diff <= 0) return 'Expired';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h ${mins}m left`;
        return `${mins}m left`;
    };

    const getTypeColor = (type: string) => {
        if (!type) return colors.primary;
        switch (type.toLowerCase()) {
            case 'job': return '#3b82f6'; // Blue
            case 'service': return '#06b6d4'; // Cyan
            case 'sell': return '#f59e0b'; // Amber
            case 'rent': return '#8b5cf6'; // Violet
            case 'barter': return '#ec4899'; // Pink
            default: return colors.primary;
        }
    };

    const getPostImage = (post: any) => {
        if (!post) return null;
        if (post.images && post.images.length > 0) {
            const img = post.images[0];
            return typeof img === 'string' ? img : img.uri;
        }
        const keywords: Record<string, string> = {
            job: 'workspace,office',
            service: 'tools,work',
            sell: 'product,tech',
            rent: 'key,house',
            barter: 'deal,handshake'
        };
        const keyword = keywords[post.type?.toLowerCase()] || 'abstract';
        return `https://loremflickr.com/400/400/${keyword}?lock=${post._id ? post._id.substring(post._id.length - 4) : '0000'}`;
    };

    const getProgress = (createdAt: string, expiresAt: string, durationMinutes: number) => {
        const total = durationMinutes * 60000;
        const remaining = new Date(expiresAt).getTime() - now.getTime();
        const progress = Math.max(0, Math.min(1, remaining / total));
        return progress;
    };

    const renderExpirationBar = (post: any) => {
        if (post.status === 'archived' || !post.expiresAt) return null;

        const timeLeft = formatTimeLeft(post.expiresAt);
        const progress = getProgress(post.createdAt, post.expiresAt, post.duration || 40320);
        const typeColor = getTypeColor(post.type);
        const isUrgent = progress < 0.1; // Less than 10% time left

        return (
            <View style={styles.expirationContainer}>
                <View style={styles.expirationHeader}>
                    <Clock size={10} color={isUrgent ? '#ef4444' : (viewMode === 'grid' ? '#fff' : colors.textSecondary)} />
                    <Text style={[styles.expirationText, { color: isUrgent ? '#ef4444' : (viewMode === 'grid' ? '#fff' : colors.textSecondary) }]}>
                        {timeLeft}
                    </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: viewMode === 'grid' ? 'rgba(255,255,255,0.2)' : colors.border }]}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${progress * 100}%`,
                                backgroundColor: isUrgent ? '#ef4444' : typeColor
                            }
                        ]}
                    />
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>User not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                <View style={styles.headerRight}>
                    {isOwnProfile && (
                        <>
                            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={[styles.iconButton, { marginRight: 15 }]}>
                                <Edit size={22} color={colors.text} />
                                <Text style={[styles.headerIconLabel, { color: colors.textSecondary }]}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.iconButton, { marginRight: 15 }]}>
                                <Settings size={22} color={colors.text} />
                                <Text style={[styles.headerIconLabel, { color: colors.textSecondary }]}>Prefs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                                <LogOut size={22} color="#ef4444" />
                                <Text style={[styles.headerIconLabel, { color: '#ef4444' }]}>Exit</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                <View style={styles.profileHeader}>
                    <Image
                        source={{ uri: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.displayName}` }}
                        style={styles.avatar}
                    />
                    <Text style={[styles.name, { color: colors.text }]}>{user.displayName}</Text>
                    <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.posts}</Text>
                        <Text style={[styles.statLabel, { color: colors.primary }]}>POSTS</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.requests}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>REQUESTS</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.rating}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>RATING</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Bio</Text>
                    <Text style={[styles.sectionContent, { color: colors.text }]}>
                        {user.bio || "No bio added yet."}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Skills & Interests</Text>
                    <Text style={[styles.sectionContent, { color: colors.text, fontStyle: user.skills?.length ? 'normal' : 'italic' }]}>
                        {user.skills && user.skills.length > 0 ? user.skills.join(', ') : "No skills listed."}
                    </Text>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>My Posts</Text>
                    {isOwnProfile && (
                        <View style={styles.viewModeToggle}>
                            <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.viewModeBtn, viewMode === 'list' && { backgroundColor: colors.primary }]}>
                                <Text style={{ color: viewMode === 'list' ? '#fff' : colors.textSecondary, fontSize: 10 }}>LIST</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setViewMode('grid')} style={[styles.viewModeBtn, viewMode === 'grid' && { backgroundColor: colors.primary }]}>
                                <Text style={{ color: viewMode === 'grid' ? '#fff' : colors.textSecondary, fontSize: 10 }}>GRID</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {isOwnProfile && myPosts.length > 0 ? (
                    <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                        {myPosts.map((post) => (
                            <TouchableOpacity
                                key={post._id}
                                style={viewMode === 'grid' ? styles.gridItem : styles.listItem}
                                onPress={() => navigation.navigate('PostDetails', { id: post._id })}
                            >
                                {viewMode === 'grid' ? (
                                    <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: getTypeColor(post.type), borderWidth: 1.5 }]}>
                                        <Image
                                            source={{ uri: getPostImage(post) || undefined }}
                                            style={styles.gridImage}
                                            defaultSource={require('../assets/logo.png')}
                                        />
                                        <View style={styles.gridOverlay}>
                                            <View style={[styles.typeTag, { backgroundColor: getTypeColor(post.type) }]}>
                                                <Text style={styles.typeTagText}>{post.type?.toUpperCase()}</Text>
                                            </View>
                                            <Text style={[styles.gridTitle, { color: '#fff' }]} numberOfLines={2}>{post.title}</Text>
                                            <View style={styles.gridFooter}>
                                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                                    <TouchableOpacity onPress={() => navigation.navigate('EditPost', { post })} style={styles.gridActionBtn}>
                                                        <Edit3 size={12} color="#fff" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDeletePost(post._id)} style={[styles.gridActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.6)' }]}>
                                                        <Trash2 size={12} color="#fff" />
                                                    </TouchableOpacity>
                                                </View>
                                                <Text style={[styles.gridPrice, { color: '#fff' }]}>₹{post.price}</Text>
                                            </View>
                                            {renderExpirationBar(post)}
                                        </View>
                                    </View>
                                ) : (
                                    <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: getTypeColor(post.type), borderLeftWidth: 4 }]}>
                                        <Image source={{ uri: getPostImage(post) }} style={styles.listImage} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                <Text style={[styles.typeLabel, { color: getTypeColor(post.type) }]}>{post.type.toUpperCase()}</Text>
                                                <Text style={[styles.listTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>{post.title}</Text>
                                            </View>
                                            {renderExpirationBar(post)}
                                        </View>
                                        <View style={styles.listActionArea}>
                                            <TouchableOpacity onPress={() => navigation.navigate('EditPost', { post })} style={styles.listActionBtn}>
                                                <Edit3 size={16} color={colors.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeletePost(post._id)} style={styles.listActionBtn}>
                                                <Trash2 size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : isOwnProfile && (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You haven't posted anything yet.</Text>
                )}

                {!isOwnProfile && (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ChatWindow', { recipient: user })}
                            style={[styles.actionButtonMain, styles.messageButton]}
                        >
                            <MessageCircle size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={[styles.editButtonText, { color: '#ffffff' }]}>Message</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleBlock}
                            style={[styles.actionButtonMain, styles.blockButton, { backgroundColor: colors.card }]}
                        >
                            <Text style={[styles.editButtonText, { color: '#ef4444' }]}>Block</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 6,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionContent: {
        fontSize: 16,
        lineHeight: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 30,
        gap: 12,
    },
    actionButtonMain: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    postsButton: {
        borderWidth: 1,
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    messageButton: {
        backgroundColor: '#8b5cf6',
    },
    blockButton: {
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20,
        padding: 15,
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    viewModeToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 2,
    },
    viewModeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        gap: 10,
    },
    gridItem: {
        width: '48%',
    },
    gridCard: {
        borderRadius: 16,
        borderWidth: 1,
        height: 140,
        overflow: 'hidden',
    },
    gridImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        resizeMode: 'cover',
    },
    gridImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        justifyContent: 'flex-end',
    },
    gridTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    gridFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridActionBtn: {
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 6,
    },
    listActionArea: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listActionBtn: {
        padding: 10,
    },
    gridPrice: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    listContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    listItem: {
        width: '100%',
    },
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    listImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        resizeMode: 'cover',
    },
    listTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
    expirationContainer: {
        marginTop: 6,
    },
    expirationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    expirationText: {
        fontSize: 10,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    typeTag: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeTagText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    typeLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    }
});

export default ProfileScreen;
