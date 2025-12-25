import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Clipboard, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MapPin, Clock, ArrowUpRight, MessageCircle, Heart, Share2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { getAvatarUrl } from '../../utils/avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

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
        };
        distance?: string;
        images?: string[];
    };
    isOwnPost?: boolean;
    onPress?: () => void;
    onRequestContact?: () => void;
}

const PostCard = ({ post, isOwnPost, onPress, onRequestContact, navigation }: PostCardProps & { navigation?: any }) => {
    const { user: currentUser } = useAuth();
    const { success, error } = useToast();
    const { colors } = useTheme();
    const [likes, setLikes] = useState(post.likes || []);
    const [shares, setShares] = useState(post.shares || 0);
    const [expanded, setExpanded] = useState(false);
    const lastTapRef = useRef<number>(0);

    const isLiked = currentUser && likes.includes(currentUser._id);

    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // Double tap detected
            handleLike();
        } else {
            // Single tap - delayed action
            setTimeout(() => {
                if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) {
                    onPress?.();
                }
            }, DOUBLE_TAP_DELAY);
        }
        lastTapRef.current = now;
    };

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'job': return '#3b82f6'; // Blue
            case 'service': return '#06b6d4'; // Cyan
            case 'sell': return '#f59e0b'; // Amber
            case 'rent': return '#8b5cf6'; // Violet
            case 'barter': return '#ec4899'; // Pink
            default: return colors.primary;
        }
    };

    const getPostImage = (post: any) => {
        if (post.images && post.images.length > 0) return post.images[0];
        const keywords: Record<string, string> = {
            job: 'workspace,office',
            service: 'tools,work',
            sell: 'product,tech',
            rent: 'key,house',
            barter: 'deal,handshake'
        };
        const keyword = keywords[post.type] || 'abstract';
        return `https://loremflickr.com/400/400/${keyword}?lock=${post._id.substring(post._id.length - 4)}`;
    };

    const handleLike = async () => {
        if (!currentUser) {
            error("Please login to like posts");
            return;
        }
        try {
            await api.post(`/posts/${post._id}/like`);
            if (isLiked) {
                setLikes(likes.filter(id => id !== currentUser._id));
            } else {
                setLikes([...likes, currentUser._id]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async () => {
        try {
            await api.post(`/posts/${post._id}/share`);
            setShares(shares + 1);
            // In a real environment, we'd use a deep link or the web URL
            const shareUrl = `https://mycircle.social/post/${post._id}`;
            Clipboard.setString(shareUrl);
            success("Link copied to clipboard!");
        } catch (err) {
            console.error(err);
        }
    };

    // Dynamic styles
    const themeStyles = {
        card: {
            backgroundColor: colors.card,
            borderColor: colors.border,
        },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        divider: { backgroundColor: colors.border },
        icon: colors.textSecondary,
    };

    return (
        <TouchableOpacity
            onPress={handleDoubleTap}
            activeOpacity={0.9}
            style={[styles.card, themeStyles.card, { borderLeftColor: getTypeColor(post.type), borderLeftWidth: 4 }]}
        >
            <View style={styles.header}>
                <Image
                    source={{ uri: getAvatarUrl(post.user as any) }}
                    style={styles.avatar}
                />
                <TouchableOpacity onPress={() => (navigation as any).navigate('UserProfile', { userId: post.user._id })} style={{ flex: 1 }}>
                    <View style={styles.userInfo}>
                        <Text style={[styles.displayName, themeStyles.text]}>{post.user.displayName}</Text>
                        <Text style={[styles.type, { color: getTypeColor(post.type) }]}>
                            {post.type}
                        </Text>
                    </View>
                </TouchableOpacity>
                {post.price != null && (
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>₹{post.price}</Text>
                    </View>
                )}
                {isOwnPost && (post as any).applicationCount > 0 && (
                    <View style={styles.requestBadge}>
                        <MessageCircle size={12} color="#ffffff" fill="#ffffff" />
                        <Text style={styles.requestBadgeText}>{(post as any).applicationCount}</Text>
                    </View>
                )}
            </View>

            <Text style={[styles.title, themeStyles.text]} numberOfLines={1}>
                {post.title}
            </Text>

            <Text style={[styles.description, themeStyles.textSecondary]} numberOfLines={expanded ? undefined : 2}>
                {post.description}
            </Text>

            {expanded && (
                <Image
                    source={{ uri: getPostImage(post) }}
                    style={[styles.expandedImage, { borderColor: getTypeColor(post.type) }]}
                />
            )}

            {expanded && (
                <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, themeStyles.textSecondary]}>{post.distance || post.location}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, themeStyles.textSecondary]}>{formatDate(post.createdAt)}</Text>
                    </View>
                </View>
            )}

            {/* Social Actions Section - Always visible but compact */}
            <View style={styles.socialActions}>
                <View style={styles.socialLeft}>
                    <TouchableOpacity onPress={handleLike} style={styles.socialButton}>
                        <Heart size={18} color={isLiked ? "#ef4444" : colors.textSecondary} fill={isLiked ? "#ef4444" : "transparent"} />
                        <Text style={[styles.socialCount, themeStyles.textSecondary, isLiked && { color: "#ef4444" }]}>{likes.length}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleShare} style={styles.socialButton}>
                        <Share2 size={18} color={colors.textSecondary} />
                        <Text style={[styles.socialCount, themeStyles.textSecondary]}>{shares}</Text>
                    </TouchableOpacity>
                </View>

                {/* Collapsible toggle */}
                <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
                    {expanded ? <ChevronUp size={20} color={colors.textSecondary} /> : <ChevronDown size={20} color={colors.textSecondary} />}
                </TouchableOpacity>
            </View>

            {expanded && (
                <>
                    <View style={[styles.divider, themeStyles.divider]} />

                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={onPress}
                            style={styles.detailsButton}
                        >
                            <Text style={[styles.detailsText, themeStyles.textSecondary]}>Full View</Text>
                            <ArrowUpRight size={14} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {!isOwnPost && (
                            <TouchableOpacity
                                onPress={onRequestContact}
                                style={styles.contactButton}
                            >
                                <MessageCircle size={14} color={colors.primary} />
                                <Text style={[styles.contactButtonText, { color: colors.primary }]}>Request Contact</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20, // Slightly reduced
        padding: 16, // Reduced from 20
        marginBottom: 16, // Reduced from 20
        borderWidth: 1,
        // shadowColor: "#000",
        // shadowOffset: {
        // 	width: 0,
        // 	height: 1,
        // },
        // shadowOpacity: 0.1,
        // shadowRadius: 2,
        // elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12, // Reduced from 16
    },
    avatar: {
        width: 36, // Reduced from 40
        height: 36,
        borderRadius: 18,
        backgroundColor: '#27272a',
    } as any,
    userInfo: {
        marginLeft: 10,
        flex: 1,
    },
    displayName: {
        fontWeight: 'bold',
        fontSize: 15, // Reduced from 16
    },
    type: {
        fontSize: 9, // Reduced from 10
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    priceTag: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    priceText: {
        color: '#3b82f6',
        fontWeight: 'bold',
        fontSize: 13,
    },
    title: {
        fontSize: 18, // Reduced from 20
        fontWeight: 'bold',
        marginBottom: 6,
        lineHeight: 22,
    },
    description: {
        fontSize: 13, // Reduced from 14
        marginBottom: 12,
        lineHeight: 18,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    metaText: {
        fontSize: 11,
        marginLeft: 4,
    },
    socialActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 0, // Removed bottom margin when collapsed
    },
    socialLeft: {
        flexDirection: 'row',
        gap: 20,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    socialCount: {
        fontSize: 13,
        fontWeight: '600',
    },
    expandButton: {
        padding: 4,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsText: {
        fontSize: 13,
        fontWeight: '500',
        marginRight: 4,
    },
    contactButton: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)', // violet-600/10
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactButtonText: {
        fontWeight: 'bold',
        fontSize: 13,
        marginLeft: 6,
    },
    requestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        marginLeft: 8,
        gap: 4,
    },
    requestBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    expandedImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        resizeMode: 'contain',
    },
});

export default PostCard;
