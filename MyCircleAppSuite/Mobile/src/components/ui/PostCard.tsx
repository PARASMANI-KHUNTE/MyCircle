import React, { useState, useRef, useEffect } from 'react';

import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Pressable, Clipboard, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, Heart, MessageCircle, Share2, Star } from 'lucide-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {


    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { getAvatarUrl } from '../../utils/avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../context/ThemeContext';
import api, { BASE_URL } from '../../services/api';
import { getPlaceholderSuggestions } from '../../services/aiService';
import GlassView from './GlassView';

import GenerativePlaceholder from './GenerativePlaceholder';
import { Palette } from '../../constants/design';
import TrustBadge from './TrustBadge';


interface PostCardProps {
    post: {
        _id: string;
        title: string;
        description: string;
        type: string;
        location: string;
        price?: number;
        createdAt: string;
        likes?: string[];
        shares?: number;
        user: {
            _id: string;
            displayName: string;
            avatar: string;
            reputation?: { // Added reputation to type definition
                trustScore: number;
                isVerified: boolean;
            };
        };
        distance?: string;
        images?: string[];
        isUrgent?: boolean;
        subType?: string;
    };
    onPress?: () => void;
    isOwnPost?: boolean;
    navigation?: any;
}

const PostCard = ({ post, onPress }: PostCardProps) => {
    const { user: currentUser } = useAuth();
    const { success, error } = useToast();
    const { colors } = useTheme();
    const [likes, setLikes] = useState(post.likes || []);
    const [hasShared, setHasShared] = useState(false);
    const lastTapRef = useRef<number>(0);
    const [aiSuggestion, setAiSuggestion] = useState<{ icon: string; gifKeywords: string[] } | null>(null);

    useEffect(() => {
        if (!post.images || post.images.length === 0) {
            getPlaceholderSuggestions(post.title, post.description).then(setAiSuggestion);
        }
        checkShared();
    }, [post._id]);

    const checkShared = async () => {
        try {
            const sharedPosts = JSON.parse(await AsyncStorage.getItem('sharedPosts') || '[]');
            setHasShared(sharedPosts.includes(post._id));
        } catch {}
    };

    const handleShare = async () => {
        if (hasShared) {
            Alert.alert("Already Shared", "Link already copied!");
            return;
        }
        try {
            const sharedPosts = JSON.parse(await AsyncStorage.getItem('sharedPosts') || '[]');
            sharedPosts.push(post._id);
            await AsyncStorage.setItem('sharedPosts', JSON.stringify(sharedPosts));
            setHasShared(true);
            await api.post(`/posts/${post._id}/share`);
            const serverBase = (BASE_URL || '').replace(/\/api\/?$/, '');
            Clipboard.setString(`${serverBase}/post/${post._id}`);
            Alert.alert("Copied", "Post link copied!");
        } catch {
            Alert.alert("Error", "Failed to share");
        }
    };


    const isLiked = currentUser && likes.includes(currentUser._id);
    const scale = useSharedValue(1);
    const heartScale = useSharedValue(0);

    const handlePressIn = () => {
        scale.value = withSpring(0.97);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const animatedHeartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
        opacity: heartScale.value,
    }));

    const triggerHeartAnimation = () => {
        heartScale.value = 1;
        heartScale.value = withSequence(
            withSpring(1.5),
            withTiming(0, { duration: 500 })
        );
    };

    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            handleLike();
            triggerHeartAnimation();
        } else {
            setTimeout(() => { // Single tap delay check
                if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) {
                    if (onPress) onPress();
                }
            }, DOUBLE_TAP_DELAY);
        }
        lastTapRef.current = now;
    };

    const getPostImage = (post: any) => {
        if (post.images && post.images.length > 0) return post.images[0];
        return null;
    };



    const handleLike = async () => {
        if (!currentUser) return error("Please login to like");
        const newLikes = isLiked
            ? likes.filter(id => id !== currentUser._id)
            : [...likes, currentUser._id];
        setLikes(newLikes);
        triggerHeartAnimation(); // Always pop heart on dedicated like button too

        try {
            await api.post(`/posts/${post._id}/like`);
        } catch (err) {
            console.error(err);
            setLikes(likes);
            error("Failed to like post");
        }
    };

    const getTypeColor = () => {
        switch (post.type) {
            case 'job': return Palette.info; // Blue
            case 'service': return Palette.cyan[500]; // Teal/Cyan
            case 'sell':
            case 'rent': return Palette.warning; // Orange/Amber
            default: return Palette.pink[500];
        }
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleDoubleTap}
            style={styles.cardContainer}
        >
            <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
                {/* Full Background Image or Generative Alternative */}
                {getPostImage(post) ? (
                    <Image
                        source={{ uri: getPostImage(post)! }}
                        style={styles.backgroundImage}
                        resizeMode="cover"
                    />
                ) : (
                    <GenerativePlaceholder
                        id={post._id}
                        type={post.type}
                        style={styles.backgroundImage}
                        iconSize={120}
                        aiIcon={aiSuggestion?.icon}
                        aiGifKeyword={aiSuggestion?.gifKeywords?.[0]}
                    />

                )}



                {/* Dark Gradient Overlay - Refined for Neon Dark */}
                <Svg style={StyleSheet.absoluteFill}>
                    <Defs>
                        <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="#000" stopOpacity="0.4" />
                            <Stop offset="0.4" stopColor="#000" stopOpacity="0" />
                            <Stop offset="0.7" stopColor="#af25f4" stopOpacity="0.1" />
                            <Stop offset="1" stopColor="#000" stopOpacity="0.95" />
                        </SvgLinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#grad)" />
                </Svg>


                {/* Floating Top Elements */}
                <View style={styles.topRow}>
                    <GlassView intensity={30} borderRadius={16} style={styles.typeBadge}>
                        <View style={[styles.typeDot, { backgroundColor: getTypeColor() }]} />
                        <Text style={styles.typeText}>{post.subType || post.type}</Text>
                    </GlassView>

                    <GlassView intensity={30} borderRadius={20} style={styles.likeButtonContainer}>
                        <TouchableOpacity onPress={handleLike} hitSlop={10} style={styles.likeButton}>
                            <Heart
                                size={20}
                                color={isLiked ? "#ef4444" : "#fff"}
                                fill={isLiked ? "#ef4444" : "transparent"}
                            />
                        </TouchableOpacity>
                    </GlassView>
                    <GlassView intensity={30} borderRadius={20} style={styles.likeButtonContainer}>
                        <TouchableOpacity onPress={handleShare} hitSlop={10} style={styles.likeButton}>
                            <Share2
                                size={20}
                                color={hasShared ? "#3b82f6" : "#fff"}
                            />
                        </TouchableOpacity>
                    </GlassView>
                </View>

                {/* Big Heart Animation Overlay */}
                <View style={[StyleSheet.absoluteFill, styles.centered]} pointerEvents="none">
                    <Animated.View style={animatedHeartStyle}>
                        <Heart size={100} color="#fff" fill="#fff" />
                    </Animated.View>
                </View>

                {/* Bottom Content Area */}
                <View style={styles.contentOverlay}>
                    <View style={styles.mainInfo}>
                        <Text style={styles.title} numberOfLines={2}>
                            {post.title}
                        </Text>

                        <View style={styles.locationRow}>
                            <MapPin size={14} color={colors.textSecondary} />
                            <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                                {post.location.split(',')[0]} • {post.distance || '2km'} away
                            </Text>
                        </View>
                    </View>

                    <View style={styles.footerRow}>
                        <View style={styles.userSection}>
                            <Image source={{ uri: getAvatarUrl(post.user) }} style={styles.avatar} />
                            <View>
                                <Text style={styles.userName}>{post.user.displayName}</Text>
                                {post.user.reputation && (
                                    <View style={{ marginTop: 2 }}>
                                        <TrustBadge
                                            score={post.user.reputation.trustScore}
                                            isVerified={post.user.reputation.isVerified}
                                            size="small"
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        {post.price != null && (
                            <View style={styles.priceTag}>
                                <Text style={[styles.priceSymbol, { color: colors.primary }]}>₹</Text>
                                <Text style={styles.priceValue}>{post.price.toLocaleString()}</Text>
                            </View>
                        )}
                    </View>
                </View>

            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 20,
        width: '100%',
    },
    cardWrapper: {
        width: '100%',
        height: 480,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        width: '100%',
        zIndex: 10,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    typeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    typeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    likeButtonContainer: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    likeButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
    },
    mainInfo: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 10,
        fontFamily: 'Plus Jakarta Sans',
        lineHeight: 32,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationText: {
        color: '#a1a1aa',
        fontSize: 14,
        fontWeight: '600',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 8,
        paddingRight: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#fff',
        marginRight: 12,
    },
    userName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(175, 37, 244, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(175, 37, 244, 0.3)',
    },
    priceSymbol: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 2,
    },
    priceValue: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
    }
});

export default PostCard;
