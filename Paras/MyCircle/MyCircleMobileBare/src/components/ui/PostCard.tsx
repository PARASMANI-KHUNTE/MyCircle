import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Clipboard, Alert } from 'react-native';
import { MapPin, Clock, ArrowUpRight, MessageCircle, Heart, Share2 } from 'lucide-react-native';
import { getAvatarUrl } from '../../utils/avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import api from '../../services/api';

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
    };
    isOwnPost?: boolean;
    onPress?: () => void;
    onRequestContact?: () => void;
}

const PostCard = ({ post, isOwnPost, onPress, onRequestContact, navigation }: PostCardProps & { navigation?: any }) => {
    const { user: currentUser } = useAuth();
    const { success, error } = useToast();
    const [likes, setLikes] = useState(post.likes || []);
    const [shares, setShares] = useState(post.shares || 0);

    const isLiked = currentUser && likes.includes(currentUser._id);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'job': return '#60a5fa'; // blue-400
            case 'service': return '#c084fc'; // purple-400
            case 'sell': return '#4ade80'; // green-400
            case 'rent': return '#fb923c'; // orange-400
            default: return '#a1a1aa'; // zinc-400
        }
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

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.card}
        >
            <View style={styles.header}>
                <Image
                    source={{ uri: getAvatarUrl(post.user as any) }}
                    style={styles.avatar}
                />
                <TouchableOpacity onPress={() => (navigation as any).navigate('UserProfile', { userId: post.user._id })}>
                    <View style={styles.userInfo}>
                        <Text style={styles.displayName}>{post.user.displayName}</Text>
                        <Text style={[styles.type, { color: getTypeColor(post.type) }]}>
                            {post.type}
                        </Text>
                    </View>
                </TouchableOpacity>
                {post.price && (
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

            <Text style={styles.title}>
                {post.title}
            </Text>

            <Text style={styles.description} numberOfLines={3}>
                {post.description}
            </Text>

            <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                    <MapPin size={14} color="#71717a" />
                    <Text style={styles.metaText}>{post.location}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Clock size={14} color="#71717a" />
                    <Text style={styles.metaText}>{formatDate(post.createdAt)}</Text>
                </View>
            </View>

            {/* Social Actions Section */}
            <View style={styles.socialActions}>
                <TouchableOpacity onPress={handleLike} style={styles.socialButton}>
                    <Heart size={18} color={isLiked ? "#ef4444" : "#71717a"} fill={isLiked ? "#ef4444" : "transparent"} />
                    <Text style={[styles.socialCount, isLiked && { color: "#ef4444" }]}>{likes.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleShare} style={styles.socialButton}>
                    <Share2 size={18} color="#71717a" />
                    <Text style={styles.socialCount}>{shares}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onPress} style={styles.socialButton}>
                    <MessageCircle size={18} color="#71717a" />
                    <Text style={styles.socialCount}>Details</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={onPress}
                    style={styles.detailsButton}
                >
                    <Text style={styles.detailsText}>Full View</Text>
                    <ArrowUpRight size={14} color="#71717a" />
                </TouchableOpacity>

                {!isOwnPost && (
                    <TouchableOpacity
                        onPress={onRequestContact}
                        style={styles.contactButton}
                    >
                        <MessageCircle size={14} color="#8b5cf6" />
                        <Text style={styles.contactButtonText}>Request Contact</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(24, 24, 27, 0.8)', // zinc-900 with opacity
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#27272a',
    } as any,
    userInfo: {
        marginLeft: 12,
        flex: 1,
    },
    displayName: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    type: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    priceTag: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    priceText: {
        color: '#a78bfa',
        fontWeight: 'bold',
        fontSize: 14,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        lineHeight: 24,
    },
    description: {
        color: '#a1a1aa', // zinc-400
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    metaText: {
        color: '#71717a', // zinc-500
        fontSize: 12,
        marginLeft: 4,
    },
    socialActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 16,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    socialCount: {
        color: '#71717a',
        fontSize: 13,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        width: '100%',
        marginBottom: 16,
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
        color: '#a1a1aa',
        fontSize: 14,
        fontWeight: '500',
        marginRight: 4,
    },
    contactButton: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)', // violet-600/20
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactButtonText: {
        color: '#a78bfa', // violet-400
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
    requestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
        gap: 4,
    },
    requestBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default PostCard;
