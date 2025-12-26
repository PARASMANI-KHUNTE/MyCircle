import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Linking, StyleSheet, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, MessageCircle, ArrowLeft, Trash2, Shield, Calendar, Tag, ChevronLeft, ChevronRight, User, Share2, Heart, MoreVertical, Sparkles, X } from 'lucide-react-native';
import { Clipboard } from 'react-native';
import { getAvatarUrl } from '../utils/avatar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getPostInsights, getPostExplanation } from '../services/aiService';
import ActionSheet, { ActionItem } from '../components/ui/ActionSheet';
import ImagePreviewModal from '../components/ui/ImagePreviewModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostDetailsScreen = ({ route, navigation }: any) => {
    const { id } = route.params;
    const auth = useAuth() as any;
    const { colors } = useTheme(); // Import Theme
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [contactRequestStatus, setContactRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | 'expired'>('none');
    const [likes, setLikes] = useState<string[]>([]);
    const [shares, setShares] = useState(0);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);

    // AI State
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiResult, setAiResult] = useState<{
        type: 'owner' | 'viewer',
        summary: string,
        details: string,
        listItems: string[]
    } | null>(null);

    // ActionSheet State
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [actionSheetConfig, setActionSheetConfig] = useState<{ title?: string; description?: string; actions: ActionItem[] }>({ actions: [] });

    // Image Preview State
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const isLiked = auth?.user?._id && likes.includes(auth.user._id);
    const isOwnPost = auth?.user?._id === post?.user?._id;

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
            setContactRequestStatus(res.data.contactRequestStatus || (res.data.hasRequested ? 'pending' : 'none'));
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Could not fetch post details.";
            Alert.alert("Error", errorMsg);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!commentText.trim()) return;

        setPostingComment(true);
        try {
            if (replyTo) {
                // Handle Reply
                const res = await api.post(`/posts/${id}/comment/${replyTo.id}/reply`, { text: commentText });

                // Update local state: Find parent comment and append reply
                const updatedComments = comments.map(c => {
                    if (c._id === replyTo.id) {
                        return {
                            ...c,
                            replies: [...(c.replies || []), res.data]
                        };
                    }
                    return c;
                });

                setComments(updatedComments);
                setReplyTo(null);
            } else {
                // Handle New Comment
                const res = await api.post(`/posts/${id}/comment`, { text: commentText });
                setComments([res.data, ...comments]); // Prepend new comment
            }
            setCommentText('');
            Alert.alert("Success", "Posted!");
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Failed to post.";
            Alert.alert("Error", errorMsg);
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

    const handleGetInsights = async () => {
        setIsGeneratingAI(true);
        try {
            if (isOwnPost) {
                // Owner View: Performance & Quality
                const insights = await getPostInsights(post);
                setAiResult({
                    type: 'owner',
                    summary: `Quality Score: ${insights.score}/100`,
                    details: insights.summary,
                    listItems: insights.tips
                });
            } else {
                // Public View: Explanation & Context
                const explanation = await getPostExplanation(post);

                const summary = explanation?.summary || "No summary available.";
                const context = explanation?.context || "No context provided.";
                const highlights = Array.isArray(explanation?.interestingFacts) ? explanation.interestingFacts : ["Check details manually"];

                setAiResult({
                    type: 'viewer',
                    summary,
                    details: context,
                    listItems: highlights
                });
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not analyze post.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleRequestContact = async () => {
        try {
            await api.post(`/contacts/${id}`);
            Alert.alert("Success", "Contact Request Sent!");
            setPost({ ...post, hasRequested: true });
            setContactRequestStatus('pending');
        } catch (err: any) {
            const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Failed to send request";
            Alert.alert("Error", errorMsg);
        }
    };

    const handleMessage = async () => {
        if (contactRequestStatus !== 'approved') {
            Alert.alert('Approval Required', 'Chat unlocks only after your request is approved.');
            return;
        }
        try {
            const res = await api.get(`/chat/conversation/${post.user._id}`);
            navigation.navigate('ChatWindow', { id: res.data._id, recipient: post.user });
        } catch (err) {
            Alert.alert("Chat", "Starting a new conversation...");
            navigation.navigate('ChatWindow', { recipient: post.user });
        }
    };

    const handleReportPost = () => {
        setActionSheetConfig({
            title: "Report Post",
            description: "Select a reason:",
            actions: [
                { label: "Spam", onPress: () => submitReport("Spam") },
                { label: "Inappropriate Content", onPress: () => submitReport("Inappropriate") },
                { label: "Scam/Fraud", onPress: () => submitReport("Scam") }
            ]
        });
        setActionSheetVisible(true);
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
        } catch (err: any) {
            const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Failed to submit report";
            Alert.alert("Error", errorMsg);
        }
    };

    const handleBlockUser = () => {
        setActionSheetConfig({
            title: "Block User",
            description: "Are you sure? You won't see their posts.",
            actions: [
                {
                    label: "Block",
                    isDestructive: true,
                    onPress: async () => {
                        try {
                            await api.post(`/user/block/${post.user._id}`);
                            Alert.alert("Blocked", "User blocked");
                            navigation.goBack();
                        } catch (err: any) {
                            const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Failed to block user";
                            Alert.alert("Error", errorMsg);
                        }
                    }
                }
            ]
        });
        setActionSheetVisible(true);
    };

    // Dynamic Menu Colors
    const showMenu = () => {
        if (isOwnPost) {
            setActionSheetConfig({
                title: "Options",
                actions: [
                    {
                        label: "Delete Post",
                        isDestructive: true,
                        onPress: () => {
                            setTimeout(handleDeletePost, 500);
                        }
                    }
                ]
            });
        } else {
            setActionSheetConfig({
                title: "Options",
                actions: [
                    {
                        label: "Report Post",
                        onPress: () => {
                            setTimeout(handleReportPost, 500);
                        }
                    },
                    {
                        label: "Block Author",
                        isDestructive: true,
                        onPress: () => {
                            setTimeout(handleBlockUser, 500);
                        }
                    }
                ]
            });
        }
        setActionSheetVisible(true);
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
        } catch (err: any) {
            const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Failed to delete post";
            Alert.alert("Error", errorMsg);
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

    const themeStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        border: { borderColor: colors.border },
        icon: colors.text,
        input: { backgroundColor: colors.input, color: colors.text, borderColor: colors.border },
        dimBackground: { backgroundColor: colors.card },
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top']}>
                <View style={[styles.header, themeStyles.border]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={handleLike} style={styles.headerButton}>
                            <Heart size={24} color={isLiked ? "#ef4444" : colors.text} fill={isLiked ? "#ef4444" : "transparent"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                            <Share2 size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleGetInsights} style={styles.headerButton}>
                            <Sparkles size={24} color="#8b5cf6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={showMenu} style={styles.headerButton}>
                            <MoreVertical size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.scrollView}>
                    {post.images && post.images.length > 0 ? (
                        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
                            {post.images.map((img: string, idx: number) => (
                                <TouchableOpacity
                                    key={idx}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        setSelectedImageIndex(idx);
                                        setImagePreviewVisible(true);
                                    }}
                                >
                                    <Image source={{ uri: img }} style={styles.postImage} resizeMode="cover" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={[styles.placeholderContainer, themeStyles.dimBackground]}>
                            {/* Note: require('../assets/logo.png') might fail if logo doesn't exist, using fallback */}
                            <View style={[styles.placeholderLogo, { backgroundColor: colors.border }]} />
                            <Text style={[styles.placeholderText, themeStyles.textSecondary]}>No images provided</Text>
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

                        <Text style={[styles.postTitle, themeStyles.text]}>{post.title}</Text>

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <MapPin size={16} color={colors.textSecondary} />
                                <Text style={[styles.metaText, themeStyles.textSecondary]}>{post.location}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Clock size={16} color="#71717a" />
                                <Text style={styles.metaText}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                            </View>
                        </View>

                        <View style={[styles.userCard, themeStyles.card]}>
                            <Image
                                source={{ uri: getAvatarUrl(post.user) }}
                                style={styles.userAvatar}
                            />
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, themeStyles.text]}>{post.user?.displayName}</Text>
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
                            <Text style={[styles.sectionTitle, themeStyles.text]}>Description</Text>
                            <Text style={[styles.descriptionText, themeStyles.textSecondary]}>{post.description}</Text>
                        </View>

                        {/* AI Insights Section (Inline) */}
                        {(isGeneratingAI || aiResult) && (
                            <View style={{
                                marginTop: 16,
                                padding: 16,
                                borderRadius: 16,
                                backgroundColor: aiResult?.type === 'owner' ? '#f0fdf4' : '#f5f3ff', // Green or Purple background
                                borderWidth: 1,
                                borderColor: aiResult?.type === 'owner' ? '#bbf7d0' : '#ddd6fe',
                                overflow: 'hidden'
                            }}>
                                {isGeneratingAI ? (
                                    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                                        <ActivityIndicator size="small" color="#7c3aed" />
                                        <Text style={{ marginTop: 12, color: '#7c3aed', fontWeight: '500', fontSize: 14 }}>
                                            Generating Insights...
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                            <Sparkles size={20} color={aiResult?.type === 'owner' ? '#16a34a' : '#7c3aed'} fill={aiResult?.type === 'owner' ? '#16a34a' : 'transparent'} />
                                            <Text style={{
                                                fontSize: 18,
                                                fontWeight: 'bold',
                                                marginLeft: 8,
                                                color: aiResult?.type === 'owner' ? '#16a34a' : '#7c3aed'
                                            }}>
                                                {aiResult?.type === 'owner' ? 'Performance Insights' : 'About this Post'}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => setAiResult(null)}
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                <X size={16} color={aiResult?.type === 'owner' ? '#16a34a' : '#7c3aed'} />
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 8, lineHeight: 22 }}>
                                            {aiResult?.summary}
                                        </Text>

                                        <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 16, lineHeight: 20 }}>
                                            {aiResult?.details}
                                        </Text>

                                        <View style={{ gap: 8 }}>
                                            {aiResult?.listItems.map((item, idx) => (
                                                <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                                    <Text style={{ color: aiResult?.type === 'owner' ? '#16a34a' : '#7c3aed', fontSize: 14, marginTop: 2 }}>{aiResult?.type === 'owner' ? '✔' : '✨'}</Text>
                                                    <Text style={{ fontSize: 14, color: '#374151', flex: 1, lineHeight: 20 }}>{item}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </>
                                )}
                            </View>
                        )}

                        {/* Comments Section */}
                        <View style={styles.commentsContainer}>
                            <Text style={[styles.sectionTitle, themeStyles.text]}>Comments ({comments.length})</Text>

                            {comments.map((comment: any, index: number) => (
                                <View key={index} style={[styles.commentCard, themeStyles.card]}>
                                    <View style={styles.commentMain}>
                                        <Image
                                            source={{ uri: getAvatarUrl(comment.user) }}
                                            style={styles.commentAvatar}
                                        />
                                        <View style={styles.commentContent}>
                                            <Text style={[styles.commentUser, themeStyles.text]}>{comment.user?.displayName}</Text>
                                            <Text style={[styles.commentText, themeStyles.textSecondary]}>{comment.text}</Text>
                                            <View style={styles.commentFooter}>
                                                <Text style={[styles.commentTime, themeStyles.textSecondary]}>
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </Text>
                                                {!isOwnPost && (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setReplyTo({ id: comment._id, username: comment.user?.displayName });
                                                            setCommentText(`@${comment.user?.displayName} `);
                                                        }}
                                                        style={styles.replyButton}
                                                    >
                                                        <Text style={styles.replyButtonText}>Reply</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Render Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <View style={styles.repliesContainer}>
                                            {comment.replies.map((reply: any, rIdx: number) => (
                                                <View key={rIdx} style={styles.replyItem}>
                                                    <Image
                                                        source={{ uri: getAvatarUrl(reply.user) }}
                                                        style={styles.replyAvatar}
                                                    />
                                                    <View style={styles.commentContent}>
                                                        <Text style={[styles.commentUser, themeStyles.text]}>{reply.user?.displayName}</Text>
                                                        <Text style={[styles.commentText, themeStyles.textSecondary]}>{reply.text}</Text>
                                                        <View style={styles.commentFooter}>
                                                            <Text style={[styles.commentTime, themeStyles.textSecondary]}>
                                                                {new Date(reply.createdAt).toLocaleDateString()}
                                                            </Text>
                                                            {!isOwnPost && (
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        setReplyTo({ id: comment._id, username: reply.user?.displayName });
                                                                        setCommentText(`@${reply.user?.displayName} `);
                                                                    }}
                                                                    style={styles.replyButton}
                                                                >
                                                                    <Text style={styles.replyButtonText}>Reply</Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))}

                            {comments.length === 0 && (
                                <Text style={[styles.noCommentsText, themeStyles.textSecondary]}>No comments yet. Be the first!</Text>
                            )}
                        </View>
                    </View>
                </ScrollView>

                {!isOwnPost && (
                    <>
                        <View style={[styles.commentInputContainer, themeStyles.container, themeStyles.border]}>
                            {replyTo && (
                                <View style={styles.replyingToBar}>
                                    <Text style={styles.replyingToText}>Replying to {replyTo.username}</Text>
                                    <TouchableOpacity onPress={() => setReplyTo(null)}>
                                        <X size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[styles.commentInput, themeStyles.input]}
                                    placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Write a comment..."}
                                    placeholderTextColor={colors.textSecondary}
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    multiline
                                />
                                <TouchableOpacity
                                    onPress={handlePostComment}
                                    disabled={postingComment || !commentText.trim()}
                                    style={[styles.sendButton, themeStyles.border, themeStyles.card, (!commentText.trim() || postingComment) && styles.sendButtonDisabled]}
                                >
                                    {postingComment ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <MessageCircle size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={[styles.bottomBar, themeStyles.container, themeStyles.border]}>
                            <TouchableOpacity
                                onPress={handleMessage}
                                disabled={contactRequestStatus !== 'approved'}
                                style={[
                                    styles.messageButton,
                                    themeStyles.card,
                                    themeStyles.border,
                                    contactRequestStatus !== 'approved' && styles.messageButtonDisabled
                                ]}
                            >
                                <View style={styles.buttonInner}>
                                    <MessageCircle size={20} color={colors.primary} />
                                    <Text style={[styles.messageButtonText, { color: colors.text }]}>
                                        {contactRequestStatus === 'approved' ? 'Message' : (contactRequestStatus === 'pending' ? 'Awaiting Approval' : 'Message (After Approval)')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleRequestContact}
                                disabled={contactRequestStatus !== 'none'}
                                style={[
                                    styles.requestButton,
                                    { backgroundColor: contactRequestStatus !== 'none' ? colors.border : colors.primary }
                                ]}
                            >
                                <Text style={[
                                    styles.requestButtonText,
                                    { color: contactRequestStatus !== 'none' ? colors.textSecondary : '#ffffff' }
                                ]}>
                                    {contactRequestStatus === 'approved' ? 'Approved' : (contactRequestStatus === 'pending' ? 'Request Sent' : 'Request Contact')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <ImagePreviewModal
                    visible={imagePreviewVisible}
                    images={post?.images || []}
                    initialIndex={selectedImageIndex}
                    onClose={() => setImagePreviewVisible(false)}
                />

                <ActionSheet
                    visible={actionSheetVisible}
                    onClose={() => setActionSheetVisible(false)}
                    title={actionSheetConfig.title}
                    description={actionSheetConfig.description}
                    actions={actionSheetConfig.actions}
                />
            </SafeAreaView>
        </KeyboardAvoidingView>
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
        marginTop: 16,
        padding: 12,
        backgroundColor: '#18181b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    commentMain: {
        flexDirection: 'row',
    },
    repliesContainer: {
        marginTop: 12,
        marginLeft: 48, // Indent replies
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    },
    replyItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    replyAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#27272a',
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
        marginRight: 12,
    },
    noCommentsText: {
        color: '#71717a',
        textAlign: 'center',
        marginTop: 16,
        fontSize: 14,
    },
    commentFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    replyButton: {
        paddingVertical: 2,
        paddingHorizontal: 8,
    },
    replyButtonText: {
        color: '#a1a1aa',
        fontSize: 12,
        fontWeight: '600',
    },
    replyingToBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    replyingToText: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: 'bold',
    },
    commentInputContainer: {
        // Removed flexDirection: 'row' to stack reply bar
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: '#0a0a0a',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
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
    messageButtonDisabled: {
        opacity: 0.6,
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
