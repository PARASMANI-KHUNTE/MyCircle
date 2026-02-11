import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import ThemedAlert from '../components/ui/ThemedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Settings, LogOut, MessageCircle, Star, User, Edit3, Clock, Edit, Trash2, Wallet } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getPostInsights, getPostExplanation, getPlaceholderSuggestions } from '../services/aiService';
import api from '../services/api';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';
import GlassView from '../components/ui/GlassView';
import GenerativePlaceholder from '../components/ui/GenerativePlaceholder';
import TrustBadge from '../components/ui/TrustBadge';
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FloatingShape = ({ delay = 0, color, size, top, left }: any) => {
    const translationY = useSharedValue(0);
    const translationX = useSharedValue(0);

    useEffect(() => {
        translationY.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.sin) })),
                withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
        translationX.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(-15, { duration: 4000, easing: Easing.inOut(Easing.sin) })),
                withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translationY.value }, { translateX: translationX.value }],
    }));

    return (
        <Animated.View
            style={[
                styles.floatingShape,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    top,
                    left,
                },
                animatedStyle,
            ]}
        />
    );
};


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
        <SafeAreaView style={styles.container} edges={['top']}>
            <FloatingShape color="rgba(175, 37, 244, 0.2)" size={400} top={-200} left={-150} delay={0} />
            <FloatingShape color="rgba(59, 130, 246, 0.15)" size={300} top={SCREEN_HEIGHT * 0.4} left={SCREEN_WIDTH - 150} delay={1000} />

            <GlassView intensity={20} borderRadius={0} style={styles.headerGlass}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassCircleBtn}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleMain}>Profile</Text>
                    <View style={styles.headerRight}>
                        {isOwnProfile && (
                            <>
                                <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.iconButtonGlass}>
                                    <Edit size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={[styles.iconButtonGlass, { marginLeft: 12 }]}>
                                    <Wallet size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.iconButtonGlass, { marginLeft: 12 }]}>
                                    <Settings size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleLogout} style={[styles.iconButtonGlass, { marginLeft: 12, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                                    <LogOut size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </GlassView>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileSection}>
                    <GlassView intensity={15} style={styles.profileCard}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.displayName}` }}
                                style={styles.avatar}
                            />
                            <View style={styles.onlineBadge} />
                        </View>
                        <Text style={styles.name}>{user.displayName}</Text>
                        <Text style={styles.email}>{user.email}</Text>
                        <View style={{ marginTop: 16 }}>
                            <TrustBadge
                                score={user.reputation?.trustScore || 50}
                                isVerified={user.reputation?.isVerified}
                                showLabel
                            />
                        </View>
                    </GlassView>
                </Animated.View>

                <View style={styles.statsLayout}>
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statWrapper}>
                        <GlassView intensity={10} style={[styles.statTile, { borderColor: 'rgba(175, 37, 244, 0.4)' }]}>
                            <Text style={styles.statValue}>{stats.posts}</Text>
                            <Text style={[styles.statLabel, { color: '#af25f4' }]}>POSTS</Text>
                        </GlassView>
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.statWrapper}>
                        <GlassView intensity={10} style={[styles.statTile, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
                            <Text style={styles.statValue}>{stats.requests}</Text>
                            <Text style={[styles.statLabel, { color: '#3b82f6' }]}>REQUESTS</Text>
                        </GlassView>
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.statWrapper}>
                        <GlassView intensity={10} style={[styles.statTile, { borderColor: 'rgba(34, 197, 94, 0.4)' }]}>
                            <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.rating}</Text>
                            <Text style={[styles.statLabel, { color: '#22c55e' }]}>RATING</Text>
                        </GlassView>
                    </Animated.View>
                </View>

                <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.bioSection}>
                    <GlassView intensity={5} style={styles.bioCard}>
                        <Text style={styles.sectionTitleSmall}>Bio</Text>
                        <Text style={styles.sectionContent}>
                            {user.bio || "No bio added yet."}
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitleSmall}>Skills & Interests</Text>
                        <Text style={[styles.sectionContent, { fontStyle: user.skills?.length ? 'normal' : 'italic' }]}>
                            {user.skills && user.skills.length > 0 ? user.skills.join(', ') : "No skills listed."}
                        </Text>
                    </GlassView>
                </Animated.View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitleSmall}>My Posts</Text>
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
                            style={styles.messageBtnNeon}
                        >
                            <GlassView intensity={30} style={styles.messageBtnInner}>
                                <MessageCircle size={20} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.btnTextNeon}>Message</Text>
                            </GlassView>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleBlock}
                            style={styles.blockBtnGlass}
                        >
                            <Text style={styles.blockBtnText}>Block User</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#09090b',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090b',
    },
    headerGlass: {
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    glassCircleBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitleMain: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButtonGlass: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileSection: {
        paddingHorizontal: 24,
        marginTop: 20,
        marginBottom: 20,
    },
    profileCard: {
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
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
        borderColor: '#af25f4',
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
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
        letterSpacing: -1,
    },
    email: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
    },
    statsLayout: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 24,
    },
    statWrapper: {
        flex: 1,
    },
    statTile: {
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    bioSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    bioCard: {
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sectionTitleSmall: {
        fontSize: 14,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    sectionContent: {
        fontSize: 16,
        color: '#fff',
        lineHeight: 24,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 20,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
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
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
    },
    gridItem: {
        width: '48%',
    },
    gridCard: {
        borderRadius: 20,
        height: 160,
        overflow: 'hidden',
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
    gridTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    gridFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridActionBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridPrice: {
        fontSize: 12,
        fontWeight: '900',
    },
    listContainer: {
        paddingHorizontal: 24,
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
        borderWidth: 1,
    },
    listImage: {
        width: 70,
        height: 70,
        borderRadius: 14,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    listActionArea: {
        flexDirection: 'row',
        gap: 8,
    },
    listActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
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
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 20,
        gap: 12,
    },
    messageBtnNeon: {
        flex: 2,
    },
    messageBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: '#af25f4',
    },
    btnTextNeon: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    blockBtnGlass: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    blockBtnText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: 'bold',
    },
    floatingShape: {
        position: 'absolute',
        opacity: 0.5,
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
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
    },
    typeLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 2,
    }
});

export default ProfileScreen;
