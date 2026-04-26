import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking, StyleSheet, Dimensions, TextInput, KeyboardAvoidingView, Platform, StatusBar, Clipboard } from 'react-native';
import { Alert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, Clock, MessageCircle, ArrowLeft, Trash2, Shield, Calendar, Tag, ChevronLeft, ChevronRight, User, Share2, Heart, MoreVertical, Sparkles, X } from 'lucide-react-native';
import { getAvatarUrl } from '../utils/avatar';
import { formatDurationMinutesLong } from '../utils/formatDuration';
import api, { BASE_URL } from '../services/api';
import { ensureConversationWithUser } from '../services/chat';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getPostInsights, getPostExplanation, getPlaceholderSuggestions } from '../services/aiService';

import ActionSheet, { ActionItem } from '../components/ui/ActionSheet';
import ImagePreviewModal from '../components/ui/ImagePreviewModal';
import GenerativePlaceholder from '../components/ui/GenerativePlaceholder';
import TrustBadge from '../components/ui/TrustBadge';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CheckoutModal from '../components/ui/CheckoutModal';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostDetailsScreen = ({ route, navigation }: any) => {
    const { id } = route.params;
    const auth = useAuth() as any;
    const { colors } = useTheme();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [contactRequestStatus, setContactRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'approved' | 'rejected' | 'expired'>('none');
    const [likes, setLikes] = useState<string[]>([]);
    const [shares, setShares] = useState(0);
    const [hasShared, setHasShared] = useState(false);

    useEffect(() => {
        const checkShared = async () => {
            try {
                const sharedPosts = JSON.parse(await AsyncStorage.getItem('sharedPosts') || '[]');
                setHasShared(sharedPosts.includes(id));
            } catch {}
        };
        checkShared();
    }, [id]);
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

    // ActionSheet & Image State
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [actionSheetConfig, setActionSheetConfig] = useState<{ title?: string; description?: string; actions: ActionItem[] }>({ actions: [] });
    const [aiPlaceholderSuggestion, setAiPlaceholderSuggestion] = useState<{ icon: string; gifKeywords: string[] } | null>(null);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Checkout State
    const [checkoutVisible, setCheckoutVisible] = useState(false);
    const [purchaseLoading, setPurchaseLoading] = useState(false);

    const isLiked = auth?.user?._id && likes.includes(auth.user._id);
    const isOwnPost = auth?.user?._id === post?.user?._id;
    const hasChatAccess = contactRequestStatus === 'accepted' || contactRequestStatus === 'approved';

    useEffect(() => {
        fetchPostDetails();
    }, [id]);

    useEffect(() => {
        if (post && (!post.images || post.images.length === 0)) {
            getPlaceholderSuggestions(post.title, post.description).then(setAiPlaceholderSuggestion);
        }
    }, [post?._id]);

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
            Alert.alert("Error", "Could not fetch details.");
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
                const res = await api.post(`/posts/${id}/comment/${replyTo.id}/reply`, { text: commentText });
                setComments(comments.map(c => c._id === replyTo.id ? { ...c, replies: [...(c.replies || []), res.data] } : c));
                setReplyTo(null);
            } else {
                const res = await api.post(`/posts/${id}/comment`, { text: commentText });
                setComments([res.data, ...comments]);
            }
            setCommentText('');
        } catch (err: any) {
            Alert.alert("Error", "Failed to post.");
        } finally {
            setPostingComment(false);
        }
    };

    const handleLike = async () => {
        if (!auth.user) return Alert.alert("Login Required", "Please login to like posts");
        try {
            await api.post(`/posts/${id}/like`);
            setLikes(isLiked ? likes.filter(uid => uid !== auth.user._id) : [...likes, auth.user._id]);
        } catch (err) {
            Alert.alert("Error", "Failed to update like");
        }
    };

    const handleShare = async () => {
        if (hasShared) {
            Alert.alert("Already Shared", "Link already copied!");
            return;
        }
        
        try {
            const sharedPosts = JSON.parse(await AsyncStorage.getItem('sharedPosts') || '[]');
            sharedPosts.push(id);
            await AsyncStorage.setItem('sharedPosts', JSON.stringify(sharedPosts));
            setHasShared(true);
            
            await api.post(`/posts/${id}/share`);
            setShares(shares + 1);
            const serverBase = (BASE_URL || '').replace(/\/api\/?$/, '');
            Clipboard.setString(`${serverBase}/post/${id}`);
            Alert.alert("Copied", "Post link copied!");
        } catch (err) {
            Alert.alert("Error", "Failed to share");
        }
    };

    const handleGetInsights = async () => {
        if (isGeneratingAI) return;
        setIsGeneratingAI(true);
        try {
            if (isOwnPost) {
                const insights = await getPostInsights(post);
                setAiResult({ type: 'owner', summary: `Score: ${insights.score}/100`, details: insights.summary, listItems: insights.tips });
            } else {
                const explanation = await getPostExplanation(post);
                setAiResult({ type: 'viewer', summary: explanation?.summary || "", details: explanation?.context || "", listItems: explanation?.interestingFacts || [] });
            }
        } catch (error) {
            Alert.alert("Error", "Analysis failed.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleRequestContact = async () => {
        try {
            await api.post(`/contacts/${id}`);
            Alert.alert("Success", "Request Sent!");
            setContactRequestStatus('pending');
        } catch (err: any) {
            Alert.alert("Error", "Failed to send request.");
        }
    };

    const handleMessage = async () => {
        if (!hasChatAccess) return Alert.alert('Approval Required', 'Chat unlocks after approval.');
        try {
            const conversation = await ensureConversationWithUser(post.user._id, id);
            navigation.navigate('ChatWindow', { conversation });
        } catch (err) {
            Alert.alert("Error", "Failed to start chat.");
        }
    };

    const handleConfirmPurchase = async () => {
        setPurchaseLoading(true);
        try {
            // Mock purchase logic
            await new Promise((resolve) => {
                setTimeout(resolve as () => void, 2000);
            });
            setCheckoutVisible(false);
            Alert.alert("Success", "Purchase successful! You can now contact the author.");
            setContactRequestStatus('approved');
        } catch (err) {
            Alert.alert("Error", "Purchase failed.");
        } finally {
            setPurchaseLoading(false);
        }
    };

    const handleDeletePost = async () => {
        try {
            await api.delete(`/posts/${id}`);
            Alert.alert("Deleted", "Post removed");
            navigation.goBack();
        } catch (err) {
            Alert.alert("Error", "Failed to delete.");
        }
    };

    const showMenu = () => {
        setActionSheetConfig({
            title: "Options",
            actions: isOwnPost ? [
                { label: "Delete Post", isDestructive: true, onPress: () => setTimeout(handleDeletePost, 500) }
            ] : [
                { label: "Report Post", onPress: () => Alert.alert("Reported", "Thank you.") },
                { label: "Block Author", isDestructive: true, onPress: () => Alert.alert("Blocked", "User blocked.") }
            ]
        });
        setActionSheetVisible(true);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-background-dark items-center justify-center">
                <ActivityIndicator size="large" color="#af25f4" />
            </View>
        );
    }

    if (!post) return null;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
                <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

                {/* Header */}
                <View className="px-5 py-4 flex-row justify-between items-center border-b border-white/5">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10"
                    >
                        <ArrowLeft size={20} color="#fff" />
                    </TouchableOpacity>

                    <View className="flex-row items-center space-x-3">
                        <TouchableOpacity onPress={handleShare} className="p-2">
                            <Share2 size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={showMenu} className="p-2">
                            <MoreVertical size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Image / Gallery */}
                    <View className="relative">
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
                            <GenerativePlaceholder
                                id={post._id}
                                type={post.type}
                                style={styles.imageGallery}
                                iconSize={150}
                                aiIcon={aiPlaceholderSuggestion?.icon}
                                aiGifKeyword={aiPlaceholderSuggestion?.gifKeywords?.[0]}
                            />
                        )}

                        {/* Type Badge Floating */}
                        <View className="absolute top-6 left-6">
                            <View style={styles.detailsTypeBadge}>
                                <Text className="text-white font-bold text-xs uppercase tracking-widest">{post.type}</Text>
                            </View>
                        </View>
                    </View>

                    <View className="px-6 -mt-8">
                        {/* Main Info Card */}
                        <View style={styles.mainInfoPanel}>
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-1 mr-4">
                                    <Text className="text-white text-3xl font-extrabold font-display leading-tight">{post.title}</Text>
                                    <View className="flex-row items-center mt-3">
                                        <MapPin size={16} color="#71717a" />
                                        <Text className="text-slate-400 ml-2 font-medium">{post.location}</Text>
                                    </View>
                                </View>
                                {post.price && (
                                    <View className="bg-primary/20 px-4 py-2 rounded-2xl border border-primary/30">
                                        <Text className="text-primary font-black text-xl">₹{post.price}</Text>
                                    </View>
                                )}
                            </View>

                            {/* User Section */}
                            <TouchableOpacity
                                onPress={() => navigation.navigate('UserProfile', { userId: post.user?._id })}
                                className="flex-row items-center mt-6 p-4 bg-white/5 rounded-3xl border border-white/5"
                            >
                                <Image source={{ uri: getAvatarUrl(post.user) }} style={styles.detailsAvatar} />
                                <View className="flex-1 ml-4">
                                    <Text className="text-white font-bold text-lg">{post.user?.displayName}</Text>
                                    <TrustBadge score={post.user?.reputation?.trustScore || 85} isVerified={true} size="small" />
                                </View>
                                <ChevronRight size={20} color="#71717a" />
                            </TouchableOpacity>

                            {/* Description */}
                            <View className="mt-8">
                                <Text className="text-slate-400 font-bold mb-3 uppercase tracking-widest text-xs">Description</Text>
                                <Text className="text-slate-200 text-lg leading-7">{post.description}</Text>
                            </View>

                            {(post.budgetMin || post.budgetMax || post.availability || post.duration) && (
                                <View className="mt-6 gap-3">
                                    {(post.budgetMin || post.budgetMax) && (
                                        <View className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <Text className="text-slate-400 font-bold mb-2 uppercase tracking-widest text-xs">Budget Range</Text>
                                            <Text className="text-white font-semibold text-base">₹{post.budgetMin || post.price || 0} to ₹{post.budgetMax || post.price || 0}</Text>
                                        </View>
                                    )}
                                    {post.duration && (
                                        <View className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <Text className="text-slate-400 font-bold mb-2 uppercase tracking-widest text-xs">Estimated Duration</Text>
                                            <Text className="text-white font-semibold text-base">{formatDurationMinutesLong(post.duration)}</Text>
                                        </View>
                                    )}
                                    {post.availability && (
                                        <View className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <Text className="text-slate-400 font-bold mb-2 uppercase tracking-widest text-xs">Availability</Text>
                                            <Text className="text-white font-semibold text-base">{post.availability}</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* AI Insights Panel */}
                            <TouchableOpacity
                                onPress={handleGetInsights}
                                className="mt-8 bg-primary/10 border border-primary/20 p-5 rounded-3xl"
                            >
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center">
                                        <Sparkles size={20} color="#af25f4" />
                                        <Text className="text-primary font-bold ml-3 text-lg">AI Insights</Text>
                                    </View>
                                    {isGeneratingAI && <ActivityIndicator size="small" color="#af25f4" />}
                                </View>

                                {aiResult ? (
                                    <Animated.View entering={FadeInDown.springify()}>
                                        <Text className="text-white font-bold text-lg mb-2">{aiResult.summary}</Text>
                                        <Text className="text-slate-400 leading-6">{aiResult.details}</Text>
                                    </Animated.View>
                                ) : (
                                    <Text className="text-slate-500 italic">Tap to generate professional AI analysis of this post...</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Comments Section */}
                        <View className="mt-10 mb-10">
                            <Text className="text-white text-2xl font-bold mb-6">Interaction ({comments.length})</Text>
                            {comments.map((comment: any, index: number) => (
                                <View key={index} style={styles.commentCard}>
                                    <View className="flex-row">
                                        <Image source={{ uri: getAvatarUrl(comment.user) }} className="w-10 h-10 rounded-full" />
                                        <View className="flex-1 ml-4">
                                            <Text className="text-white font-bold">{comment.user?.displayName}</Text>
                                            <Text className="text-slate-300 mt-1">{comment.text}</Text>
                                            <TouchableOpacity className="mt-3">
                                                <Text className="text-primary font-bold text-xs">REPLY</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Neon Action Bar */}
                <View className="absolute bottom-6 left-6 right-6">
                    <View style={styles.neonActionBar}>
                        <View className="flex-row items-center justify-between px-2">
                            <TouchableOpacity
                                onPress={handleLike}
                                className="flex-1 items-center justify-center py-4 rounded-full"
                            >
                                <Heart size={24} color={isLiked ? "#ef4444" : "#fff"} fill={isLiked ? "#ef4444" : "transparent"} />
                            </TouchableOpacity>

                            {post.price > 0 && contactRequestStatus === 'none' ? (
                                <TouchableOpacity
                                    onPress={() => setCheckoutVisible(true)}
                                    className="bg-primary flex-[3] py-4 rounded-full items-center shadow-lg shadow-primary/30 mx-2"
                                >
                                    <Text className="text-white font-black text-lg tracking-wider">BUY NOW</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleRequestContact}
                                    style={[
                                        styles.requestBtn,
                                        { backgroundColor: contactRequestStatus === 'pending' ? 'rgba(255,255,255,0.1)' : '#af25f4' }
                                    ]}
                                    disabled={contactRequestStatus !== 'none'}
                                    className="flex-[3] py-4 rounded-full items-center shadow-lg mx-2"
                                >
                                    <Text className="text-white font-black text-sm tracking-wider uppercase">
                                        {contactRequestStatus === 'none' ? 'Request Contact' : contactRequestStatus}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                onPress={handleMessage}
                                className="flex-1 items-center justify-center py-4 rounded-full"
                            >
                                <MessageCircle size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <CheckoutModal
                    visible={checkoutVisible}
                    onClose={() => setCheckoutVisible(false)}
                    onConfirm={handleConfirmPurchase}
                    postTitle={post.title}
                    price={post.price}
                    loading={purchaseLoading}
                    balance={auth.user?.walletBalance || 5000} // Mock balance if missing
                />

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
    },
    header: {
        backgroundColor: '#0a0a0a',
    },
    scrollView: {
        flex: 1,
    },
    imageGallery: {
        height: 400,
        backgroundColor: '#0a0a0a',
    },
    postImage: {
        width: SCREEN_WIDTH,
        height: 400,
    },
    detailsTypeBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(175, 37, 244, 0.3)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(175, 37, 244, 0.5)',
    },
    mainInfoPanel: {
        padding: 24,
        paddingTop: 32,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    detailsAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#af25f4',
    },
    commentGlassCard: {
        padding: 20,
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    commentCard: {
        padding: 20,
        marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    neonActionBar: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    requestBtn: {
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
});

export default PostDetailsScreen;
