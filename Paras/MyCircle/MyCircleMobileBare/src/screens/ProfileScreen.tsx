import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, StatusBar, Dimensions } from 'react-native';
import ThemedAlert from '../components/ui/ThemedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Settings, LogOut, MessageCircle, Clock, Edit, Trash2, Wallet } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import GenerativePlaceholder from '../components/ui/GenerativePlaceholder';
import TrustBadge from '../components/ui/TrustBadge';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


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
        return null;
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
            <View style={[styles.loadingContainer, { backgroundColor: '#0a0a0a' }]}>
                <ActivityIndicator size="large" color="#af25f4" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: '#0a0a0a' }]}>
                <Text style={{ color: '#fff' }}>User not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Subtle Grid Pattern */}
            <View style={styles.gridPattern}>
                {[...Array(12)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.gridLine,
                            {
                                left: (i % 4) * (SCREEN_WIDTH / 4),
                                top: Math.floor(i / 4) * (SCREEN_HEIGHT / 3),
                                width: 1,
                                height: SCREEN_HEIGHT / 3,
                            }
                        ]}
                    />
                ))}
            </View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={styles.headerRight}>
                        {isOwnProfile && (
                            <>
                                <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.iconButton}>
                                    <Edit size={20} color="#ffffff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={[styles.iconButton, { marginLeft: 8 }]}>
                                    <Wallet size={20} color="#ffffff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.iconButton, { marginLeft: 8 }]}>
                                    <Settings size={20} color="#ffffff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleLogout} style={[styles.iconButton, { marginLeft: 8, borderColor: 'rgba(239, 68, 68, 0.5)' }]}>
                                    <LogOut size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#af25f4" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} style={styles.profileSection}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.displayName}` }}
                                style={styles.avatar}
                            />
                            <View style={styles.onlineBadge} />
                        </View>
                        <Text style={styles.name}>{user.displayName}</Text>
                        <Text style={styles.email}>{user.email}</Text>
                        <View style={styles.trustBadgeContainer}>
                            <TrustBadge
                                score={user.reputation?.trustScore || 50}
                                isVerified={user.reputation?.isVerified}
                                showLabel
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* Stats Section */}
                <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} style={styles.statsSection}>
                    <View style={styles.statsLayout}>
                        <View style={styles.statTile}>
                            <Text style={styles.statValue}>{stats.posts}</Text>
                            <Text style={[styles.statLabel, { color: '#af25f4' }]}>POSTS</Text>
                        </View>
                        <View style={styles.statTile}>
                            <Text style={styles.statValue}>{stats.requests}</Text>
                            <Text style={[styles.statLabel, { color: '#3b82f6' }]}>REQUESTS</Text>
                        </View>
                        <View style={styles.statTile}>
                            <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.rating.toFixed(1)}</Text>
                            <Text style={[styles.statLabel, { color: '#22c55e' }]}>RATING</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Bio Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(800).springify()} style={styles.bioSection}>
                    <View style={styles.bioCard}>
                        <Text style={styles.sectionTitle}>Bio</Text>
                        <Text style={styles.sectionContent}>
                            {user.bio || "No bio added yet."}
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitle}>Skills & Interests</Text>
                        <Text style={styles.sectionContent}>
                            {user.skills && user.skills.length > 0 ? user.skills.join(', ') : "No skills listed."}
                        </Text>
                    </View>
                </Animated.View>

                {/* My Posts Section */}
                <Animated.View entering={FadeInDown.delay(500).duration(800).springify()} style={styles.postsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>My Posts</Text>
                        {isOwnProfile && (
                            <View style={styles.viewModeToggle}>
                                <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.viewModeBtn, viewMode === 'list' && { backgroundColor: '#af25f4' }]}>
                                    <Text style={{ color: viewMode === 'list' ? '#fff' : '#94a3b8', fontSize: 10 }}>LIST</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setViewMode('grid')} style={[styles.viewModeBtn, viewMode === 'grid' && { backgroundColor: '#af25f4' }]}>
                                    <Text style={{ color: viewMode === 'grid' ? '#fff' : '#94a3b8', fontSize: 10 }}>GRID</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {isOwnProfile && myPosts.length > 0 ? (
                        <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                            {myPosts.map((post, index) => (
                                <TouchableOpacity
                                    key={post._id}
                                    style={viewMode === 'grid' ? styles.gridItem : styles.listItem}
                                    onPress={() => navigation.navigate('PostDetails', { id: post._id })}
                                >
                                    {viewMode === 'grid' ? (
                                        <View style={[styles.gridCard, { borderColor: getTypeColor(post.type) }]}>
                                            {getPostImage(post) ? (
                                                <Image
                                                    source={{ uri: getPostImage(post)! }}
                                                    style={styles.gridImage}
                                                    defaultSource={require('../assets/logo.png')}
                                                />
                                            ) : (
                                                <GenerativePlaceholder
                                                    id={post._id}
                                                    type={post.type}
                                                    style={styles.gridImage}
                                                    showIcon={false}
                                                    title={post.title}
                                                    description={post.description}
                                                />
                                            )}
                                            <View style={styles.gridOverlay}>
                                                <View style={[styles.typeTag, { backgroundColor: getTypeColor(post.type) }]}>
                                                    <Text style={styles.typeTagText}>{post.type?.toUpperCase()}</Text>
                                                </View>
                                                <Text style={styles.gridTitle} numberOfLines={2}>{post.title}</Text>
                                                <View style={styles.gridFooter}>
                                                    <Text style={styles.gridPrice}>₹{post.price}</Text>
                                                </View>
                                                {renderExpirationBar(post)}
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={[styles.listCard, { borderLeftColor: getTypeColor(post.type) }]}>
                                            {getPostImage(post) ? (
                                                <Image source={{ uri: getPostImage(post)! }} style={styles.listImage} />
                                            ) : (
                                                <GenerativePlaceholder
                                                    id={post._id}
                                                    type={post.type}
                                                    style={styles.listImage}
                                                    showIcon={false}
                                                    title={post.title}
                                                    description={post.description}
                                                />
                                            )}
                                            <View style={styles.listContent}>
                                                <Text style={[styles.typeLabel, { color: getTypeColor(post.type) }]}>{post.type.toUpperCase()}</Text>
                                                <Text style={styles.listTitle} numberOfLines={1}>{post.title}</Text>
                                                {renderExpirationBar(post)}
                                            </View>
                                            <View style={styles.listActionArea}>
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
                        <Text style={styles.emptyText}>You haven't posted anything yet.</Text>
                    )}
                </Animated.View>

                {/* Message & Block Buttons for Other Profiles */}
                {!isOwnProfile && (
                    <Animated.View entering={FadeInUp.delay(600).duration(800).springify()} style={styles.actionSection}>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ChatWindow', { recipient: user })}
                                style={styles.messageBtn}
                            >
                                <MessageCircle size={20} color="#ffffff" style={{ marginRight: 10 }} />
                                <Text style={styles.btnText}>Message</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleBlock}
                                style={styles.blockBtn}
                            >
                                <Text style={styles.blockBtnText}>Block User</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
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
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
    },
    gridLine: {
        position: 'absolute',
        backgroundColor: '#af25f4',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileSection: {
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
    },
    profileCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#18181b',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#22c55e',
        borderWidth: 3,
        borderColor: '#18181b',
    },
    name: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 4,
        letterSpacing: -1,
    },
    email: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '600',
    },
    trustBadgeContainer: {
        marginTop: 16,
    },
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    statsLayout: {
        flexDirection: 'row',
        gap: 12,
    },
    statTile: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#94a3b8',
    },
    bioSection: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    bioCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    sectionContent: {
        fontSize: 16,
        color: '#ffffff',
        lineHeight: 24,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 20,
    },
    postsSection: {
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewModeToggle: {
        flexDirection: 'row',
        gap: 6,
    },
    viewModeBtn: {
        width: 44,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emptyText: {
        color: '#94a3b8',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: '48%',
    },
    gridCard: {
        borderRadius: 20,
        height: 160,
        overflow: 'hidden',
        borderWidth: 2,
    },
    gridImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    gridOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        justifyContent: 'flex-end',
    },
    typeTag: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeTagText: {
        color: '#ffffff',
        fontSize: 9,
        fontWeight: '700',
    },
    gridTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 6,
    },
    gridFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridPrice: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    listContainer: {
        gap: 12,
    },
    listItem: {
        width: '100%',
    },
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderLeftWidth: 4,
    },
    listImage: {
        width: 70,
        height: 70,
        borderRadius: 14,
    },
    listContent: {
        flex: 1,
        marginLeft: 12,
    },
    typeLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    listActionArea: {
        flexDirection: 'row',
        gap: 8,
    },
    listActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    expirationContainer: {
        marginTop: 8,
    },
    expirationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    expirationText: {
        fontSize: 11,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 3,
        borderRadius: 2,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    actionSection: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    messageBtn: {
        flex: 2,
        backgroundColor: '#af25f4',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    btnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    blockBtn: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ef4444',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    blockBtnText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default ProfileScreen;
