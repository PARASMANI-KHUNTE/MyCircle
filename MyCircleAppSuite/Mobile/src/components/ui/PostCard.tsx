import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Pressable,
    Share,
    Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Alert } from '../../utils/alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, Heart, Share2, ArrowRight } from 'lucide-react-native';
import { getAvatarUrl } from '../../utils/avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { formatPostPrice, reconcileLikes, resolveShareLink } from '../../utils/postInteractions';
import { getPlaceholderSuggestions } from '../../services/aiService';
import GenerativePlaceholder from './GenerativePlaceholder';
import TrustBadge from './TrustBadge';

interface PostCardProps {
    post: {
        _id: string;
        title: string;
        description: string;
        type: string;
        location: string;
        price?: number | string;
        createdAt: string;
        likes?: string[];
        shares?: number;
        user: {
            _id: string;
            displayName: string;
            avatar?: string;
            reputation?: {
                trustScore: number;
                isVerified: boolean;
            };
        };
        distance?: string;
        images?: string[];
        isUrgent?: boolean;
        subType?: string;
        budgetMin?: number;
        budgetMax?: number;
        availability?: string;
        duration?: number;
        acceptsBarter?: boolean;
    };
    onPress?: () => void;
    isOwnPost?: boolean;
    navigation?: any;
}

const PostCard = ({ post, onPress }: PostCardProps) => {
    const { user: currentUser } = useAuth();
    const { colors, isDark } = useTheme();
    const [likes, setLikes] = useState(post.likes || []);
    const likePendingRef = useRef(false);
    const [aiSuggestion, setAiSuggestion] = useState<{ icon: string; gifKeywords: string[] } | null>(null);

    const checkShared = useCallback(async () => {
        try {
            await AsyncStorage.getItem('sharedPosts');
        } catch {}
    }, []);

    useEffect(() => {
        if (!post.images || post.images.length === 0) {
            getPlaceholderSuggestions(post.title, post.description).then(setAiSuggestion);
        }
        checkShared();
    }, [post._id, post.title, post.description, post.images, checkShared]);

    const isLiked = currentUser && likes.includes(currentUser._id);

    const handleLike = async () => {
        if (!currentUser) {
            Alert.alert('Login Required', 'Please login to save favorite items.');
            return;
        }
        if (likePendingRef.current) return;

        likePendingRef.current = true;
        const previousLikes = likes;
        const optimisticLikes = isLiked
            ? likes.filter((id) => id !== currentUser._id)
            : [...likes, currentUser._id];
        setLikes(optimisticLikes);

        try {
            const response = await api.post(`/posts/${post._id}/like`);
            setLikes(reconcileLikes(previousLikes, currentUser._id, response.data, previousLikes));
        } catch {
            setLikes(previousLikes);
            Alert.alert('Error', 'Failed to update like');
        } finally {
            likePendingRef.current = false;
        }
    };

    const handleShare = async () => {
        const shareTitle = post.title || 'Check out this listing on MyCircle';
        let postUrl: string | null = null;

        try {
            const response = await api.post(`/posts/${post._id}/share`);
            postUrl = resolveShareLink(response.data, post._id);
            if (!postUrl) {
                Alert.alert('Error', 'Share link is unavailable.');
                return;
            }
        } catch {
            Alert.alert('Error', 'Failed to create share link.');
            return;
        }

        try {
            const shareMessage = `Check out "${shareTitle}" on MyCircle Marketplace: ${postUrl}`;
            await Share.share({
                title: shareTitle,
                message: Platform.OS === 'android' ? shareMessage : shareTitle,
                url: postUrl,
            });
        } catch (err: any) {
            if (err?.message && !err.message.includes('dismissed') && !err.message.includes('cancelled')) {
                try {
                    Clipboard.setString(postUrl);
                    Alert.alert('Link Copied', 'Listing link copied to clipboard!');
                } catch {
                    Alert.alert('Error', 'Failed to share');
                }
            }
        }
    };

    const getTypeBadgeColor = () => {
        switch (post.type) {
            case 'sell':
                return '#10b981'; // Emerald
            case 'rent':
                return '#3b82f6'; // Blue
            case 'service':
                return '#06b6d4'; // Cyan
            case 'job':
                return '#8b5cf6'; // Violet
            case 'barter':
                return '#f59e0b'; // Amber
            default:
                return colors.primary;
        }
    };

    const heroImage = post.images && post.images.length > 0 ? post.images[0] : null;

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.cardContainer,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.borderSoft,
                },
            ]}
        >
            {/* Top Product / Listing Image Container */}
            <View style={styles.imageContainer}>
                {heroImage ? (
                    <Image
                        source={{ uri: heroImage }}
                        style={styles.cardImage as any}
                        resizeMode="cover"
                    />
                ) : (
                    <GenerativePlaceholder
                        id={post._id}
                        type={post.type}
                        style={styles.cardImage}
                        iconSize={90}
                        aiIcon={aiSuggestion?.icon}
                        aiGifKeyword={aiSuggestion?.gifKeywords?.[0]}
                    />
                )}

                {/* Listing Type Tag */}
                <View
                    style={[
                        styles.typeBadge,
                        { backgroundColor: getTypeBadgeColor() },
                    ]}
                >
                    <Text style={styles.typeBadgeText}>
                        {(post.subType || post.type).toUpperCase()}
                    </Text>
                </View>

                {/* Urgent Tag if applicable */}
                {post.isUrgent && (
                    <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>URGENT</Text>
                    </View>
                )}

                {/* Action Buttons Overlay (Wishlist & Share) */}
                <View style={styles.topRightActions}>
                    <TouchableOpacity
                        onPress={handleLike}
                        style={[
                            styles.circleActionBtn,
                            {
                                backgroundColor: isDark
                                    ? 'rgba(15, 23, 42, 0.75)'
                                    : 'rgba(255, 255, 255, 0.85)',
                            },
                        ]}
                        activeOpacity={0.7}
                    >
                        <Heart
                            size={16}
                            color={isLiked ? '#ef4444' : isDark ? '#ffffff' : '#0f172a'}
                            fill={isLiked ? '#ef4444' : 'transparent'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleShare}
                        style={[
                            styles.circleActionBtn,
                            {
                                backgroundColor: isDark
                                    ? 'rgba(15, 23, 42, 0.75)'
                                    : 'rgba(255, 255, 255, 0.85)',
                                marginTop: 6,
                            },
                        ]}
                        activeOpacity={0.7}
                    >
                        <Share2 size={15} color={isDark ? '#ffffff' : '#0f172a'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Marketplace Information Details */}
            <View style={styles.contentBody}>
                {/* Price and Category Tag */}
                <View style={styles.priceRow}>
                    <Text style={[styles.priceText, { color: colors.primary }]}>
                        {formatPostPrice(post)}
                    </Text>
                    {post.distance && (
                        <View style={styles.distanceTag}>
                            <MapPin size={12} color={colors.textSecondary} />
                            <Text
                                style={[
                                    styles.distanceText,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                {post.distance}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Listing Title */}
                <Text
                    style={[styles.listingTitle, { color: colors.text }]}
                    numberOfLines={2}
                >
                    {post.title}
                </Text>

                {/* Location Text */}
                {post.location && (
                    <View style={styles.locationContainer}>
                        <MapPin size={13} color={colors.textSecondary} />
                        <Text
                            style={[
                                styles.locationText,
                                { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}
                        >
                            {post.location.split(',')[0]}
                        </Text>
                    </View>
                )}

                {/* Divider */}
                <View
                    style={[
                        styles.cardDivider,
                        { backgroundColor: colors.borderSoft },
                    ]}
                />

                {/* Seller / Author Row & Inquire CTA */}
                <View style={styles.cardFooter}>
                    <View style={styles.sellerInfo}>
                        <Image
                            source={{ uri: getAvatarUrl(post.user) }}
                            style={[styles.sellerAvatar as any, { borderColor: colors.borderSoft }]}
                        />
                        <View style={styles.sellerTextGroup}>
                            <Text
                                style={[styles.sellerName, { color: colors.text }]}
                                numberOfLines={1}
                            >
                                {post.user?.displayName || 'Neighbor'}
                            </Text>
                            <TrustBadge
                                score={post.user?.reputation?.trustScore ?? 50}
                                isVerified={Boolean(post.user?.reputation?.isVerified)}
                                size="small"
                            />
                        </View>
                    </View>

                    <View style={styles.inquireButton}>
                        <Text style={[styles.inquireButtonText, { color: colors.primary }]}>
                            Details
                        </Text>
                        <ArrowRight size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 16,
        marginHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    imageContainer: {
        width: '100%',
        height: 180,
        position: 'relative',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
    },
    cardImage: {
        width: '100%',
        height: 180,
    },
    typeBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    typeBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    urgentBadge: {
        position: 'absolute',
        top: 12,
        left: 90,
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
    },
    urgentBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    topRightActions: {
        position: 'absolute',
        top: 12,
        right: 12,
        alignItems: 'center',
    },
    circleActionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    contentBody: {
        padding: 16,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    priceText: {
        fontSize: 20,
        fontWeight: '800',
    },
    distanceTag: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '500',
    },
    listingTitle: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 22,
        marginBottom: 6,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    locationText: {
        fontSize: 13,
        marginLeft: 4,
    },
    cardDivider: {
        height: 1,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    sellerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
    },
    sellerTextGroup: {
        marginLeft: 8,
        flex: 1,
    },
    sellerName: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 1,
    },
    inquireButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
    },
    inquireButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
});

export default PostCard;
