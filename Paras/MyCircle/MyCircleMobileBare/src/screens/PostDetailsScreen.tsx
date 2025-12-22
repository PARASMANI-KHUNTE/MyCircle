import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Linking, StyleSheet, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, MessageCircle, ArrowLeft, Trash2, Shield, Calendar, Tag, ChevronLeft, ChevronRight, User, Share2, Heart, MoreVertical } from 'lucide-react-native';
import { Clipboard } from 'react-native';
import { getAvatarUrl } from '../utils/avatar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostDetailsScreen = ({ route, navigation }: any) => {
    const { id } = route.params;
    const auth = useAuth() as any;
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [likes, setLikes] = useState<string[]>([]);
    const [shares, setShares] = useState(0);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    const isLiked = auth?.user?._id && likes.includes(auth.user._id);

    useEffect(() => {
        fetchPostDetails();
    }, [id]);

    const fetchPostDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/posts/${id}`);
            setPost(res.data);
            setLikes(res.data.likes || []);
            setShares(res.data.shares || 0);
            setComments(res.data.comments || []);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not fetch post details.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!commentText.trim()) return;

        setPostingComment(true);
        try {
            const res = await api.post(`/posts/${id}/comment`, { text: commentText });
            setComments([...comments, res.data]);
            setCommentText('');
            Alert.alert("Success", "Comment posted!");
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to post comment");
        } finally {
            setPostingComment(false);
        }
    };

    const handleLike = async () => {
        if (!auth.user) {
            Alert.alert("Login Required", "Please login to like posts");
            return;
        }
        try {
            await api.post(`/posts/${id}/like`);
            if (isLiked) {
                setLikes(likes.filter(uid => uid !== auth.user._id));
            } else {
                setLikes([...likes, auth.user._id]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async () => {
        try {
            await api.post(`/posts/${id}/share`);
            setShares(shares + 1);
            const shareUrl = `https://mycircle.social/post/${id}`;
            Clipboard.setString(shareUrl);
            Alert.alert("Link Copied", "Post link copied to clipboard!");
        } catch (err) {
            console.error(err);
        }
    };

    const handleRequestContact = async () => {
        try {
            await api.post(`/contacts/${id}`);
            Alert.alert("Success", "Contact Request Sent!");
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.msg || "Failed to send request");
        }
    };

    const handleMessage = async () => {
        try {
            const res = await api.get(`/chat/conversation/${post.user._id}`);
            navigation.navigate('ChatWindow', { id: res.data._id, recipient: post.user });
        } catch (err) {
            Alert.alert("Chat", "Starting a new conversation...");
            navigation.navigate('ChatWindow', { recipient: post.user });
        }
    };

    const handleReportPost = () => {
        Alert.alert(
            "Report Post",
            "Select a reason:",
            [
                { text: "Spam", onPress: () => submitReport("Spam") },
                { text: "Inappropriate Content", onPress: () => submitReport("Inappropriate") },
                { text: "Scam/Fraud", onPress: () => submitReport("Scam") },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const submitReport = async (reason: string) => {
        try {
            await api.post('/user/report', {
                reportedUserId: post.user._id,
                reason,
                contentType: 'post',
                contentId: id
            });
            Alert.alert("Reported", "Thank you for reporting.");
        } catch (err) {
            Alert.alert("Error", "Failed to submit report");
        }
    };

    const handleBlockUser = () => {
        Alert.alert(
            "Block User",
            "Are you sure? You won't see their posts.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Block",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.post(`/user/block/${post.user._id}`);
                            Alert.alert("Blocked", "User blocked");
                            navigation.goBack();
                        } catch (err) {
                            Alert.alert("Error", "Failed to block user");
                        }
                    }
                }
            ]
        );
    };

    const showMenu = () => {
        if (isOwnPost) {
            Alert.alert(
                "Options",
                undefined,
                [
                    { text: "Delete Post", style: 'destructive', onPress: handleDeletePost }, // Assuming handleDeletePost exists or need to add
                    { text: "Cancel", style: "cancel" }
                ]
            );
        } else {
            Alert.alert(
                "Options",
                undefined,
                [
                    { text: "Report Post", onPress: handleReportPost },
                    { text: "Block Author", onPress: handleBlockUser, style: 'destructive' },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        }
    };

    // Quick fix: Add handleDeletePost if it doesn't exist in original (it likely does or I should add it)
    // I will check original file content first. For now, assume it might not exist in this scope if I didn't see it.
    // Actually, looking at imports `Trash2` implies delete capability.
    // Let's add handleDeletePost just in case or use existing.

    // Wait, I see `Trash2` imported but didn't see `handleDelete` in previous `view_file`... 
    // Ah, I missed it or it wasn't there? 
    // Let's look at lines 125-137. It has a Share button but no Delete button shown in header. 
    // The previous view_file `PostDetailsScreen` didn't show `handleDelete`.

    const handleDeletePost = async () => {
        try {
            await api.delete(`/posts/${id}`);
            Alert.alert("Deleted", "Post removed");
            navigation.goBack();
        } catch (err) {
            Alert.alert("Error", "Failed to delete post");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    if (!post) return null;

    const isOwnPost = auth?.user?._id === post.user?._id;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={handleLike} style={styles.headerButton}>
                        <Heart size={24} color={isLiked ? "#ef4444" : "white"} fill={isLiked ? "#ef4444" : "transparent"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                        <Share2 size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={showMenu} style={styles.headerButton}>
                        <MoreVertical size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollView}>
                {post.images && post.images.length > 0 ? (
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
                        {post.images.map((img: string, idx: number) => (
                            <Image key={idx} source={{ uri: img }} style={styles.postImage} resizeMode="cover" />
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.placeholderContainer}>
                        {/* Note: require('../assets/logo.png') might fail if logo doesn't exist, using fallback */}
                        <View style={styles.placeholderLogo} />
                        <Text style={styles.placeholderText}>No images provided</Text>
                    </View>
                )}

                <View style={styles.contentPadding}>
                    <View style={styles.typePriceRow}>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeText}>{post.type}</Text>
                        </View>
                        {post.price && (
                            <Text style={styles.priceText}>₹{post.price}</Text>
                        )}
                    </View>

                    <Text style={styles.postTitle}>{post.title}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <MapPin size={16} color="#71717a" />
                            <Text style={styles.metaText}>{post.location}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Clock size={16} color="#71717a" />
                            <Text style={styles.metaText}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>

                    <View style={styles.userCard}>
                        <Image
                            source={{ uri: getAvatarUrl(post.user) }}
                            style={styles.userAvatar}
                        />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{post.user?.displayName}</Text>
                            <View style={styles.verifiedRow}>
                                <Shield size={12} color="#22c55e" />
                                <Text style={styles.verifiedText}>Verified Local Provider</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('UserProfile', { userId: post.user?._id })}
                            style={styles.viewProfileButton}
                        >
                            <Text style={styles.viewProfileText}>View Profile</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.descriptionContainer}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descriptionText}>{post.description}</Text>
                    </View>

                    {/* Comments Section */}
                    <View style={styles.commentsContainer}>
                        <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

                        {comments.map((comment: any, index: number) => (
                            <View key={index} style={styles.commentCard}>
                                <Image
                                    source={{ uri: getAvatarUrl(comment.user) }}
                                    style={styles.commentAvatar}
                                />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUser}>{comment.user?.displayName}</Text>
                                    <Text style={styles.commentText}>{comment.text}</Text>
                                    <Text style={styles.commentTime}>
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {comments.length === 0 && (
                            <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            {!isOwnPost && (
                <>
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Write a comment..."
                            placeholderTextColor="#52525b"
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handlePostComment}
                            disabled={postingComment || !commentText.trim()}
                            style={[styles.sendButton, (!commentText.trim() || postingComment) && styles.sendButtonDisabled]}
                        >
                            {postingComment ? (
                                <ActivityIndicator size="small" color="#8b5cf6" />
                            ) : (
                                <MessageCircle size={20} color="#8b5cf6" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bottomBar}>
                        <TouchableOpacity
                            onPress={handleMessage}
                            style={styles.messageButton}
                        >
                            <View style={styles.buttonInner}>
                                <MessageCircle size={20} color="#8b5cf6" />
                                <Text style={styles.messageButtonText}>Message</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleRequestContact}
                            style={styles.requestButton}
                        >
                            <Text style={styles.requestButtonText}>Request Contact</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerButton: {
        padding: 8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    imageGallery: {
        height: 320,
        backgroundColor: '#18181b',
    },
    postImage: {
        width: SCREEN_WIDTH,
        height: 320,
    },
    placeholderContainer: {
        height: 240,
        backgroundColor: '#18181b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderLogo: {
        width: 80,
        height: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 40,
    },
    placeholderText: {
        color: '#3f3f46',
        marginTop: 8,
    },
    contentPadding: {
        padding: 24,
    },
    typePriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    typeBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    typeText: {
        color: '#a78bfa',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    priceText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginLeft: 'auto',
    },
    postTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 16,
        lineHeight: 34,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    metaText: {
        color: '#a1a1aa',
        fontSize: 14,
        marginLeft: 4,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#18181b',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#27272a',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    verifiedText: {
        color: 'rgba(34, 197, 94, 0.8)',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    viewProfileButton: {
        backgroundColor: '#27272a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    viewProfileText: {
        color: '#d4d4d8',
        fontWeight: 'bold',
        fontSize: 12,
    },
    descriptionContainer: {
        marginBottom: 32,
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    descriptionText: {
        color: '#a1a1aa',
        fontSize: 16,
        lineHeight: 28,
    },
    commentsContainer: {
        marginTop: 24,
        marginBottom: 32,
    },
    commentCard: {
        flexDirection: 'row',
        marginTop: 16,
        padding: 12,
        backgroundColor: '#18181b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#27272a',
    },
    commentContent: {
        flex: 1,
        marginLeft: 12,
    },
    commentUser: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    commentText: {
        color: '#d4d4d8',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    commentTime: {
        color: '#71717a',
        fontSize: 11,
    },
    noCommentsText: {
        color: '#71717a',
        textAlign: 'center',
        marginTop: 16,
        fontSize: 14,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: '#0a0a0a',
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#18181b',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: '#ffffff',
        maxHeight: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    sendButton: {
        marginLeft: 8,
        padding: 10,
        backgroundColor: '#18181b',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    bottomBar: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: '#0a0a0a',
        flexDirection: 'row',
    },
    messageButton: {
        flex: 1,
        backgroundColor: '#18181b',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginRight: 12,
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    messageButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    requestButton: {
        flex: 1.5,
        backgroundColor: '#ffffff',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    requestButtonText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default PostDetailsScreen;
