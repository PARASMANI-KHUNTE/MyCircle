import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Share,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Alert } from '../utils/alert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    MapPin,
    MessageCircle,
    ArrowLeft,
    ChevronRight,
    Share2,
    Heart,
    MoreVertical,
    Sparkles,
    Clock,
    Calendar,
} from 'lucide-react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostDetailsScreen = ({ route, navigation }: any) => {
    const { id } = route.params;
    const auth = useAuth() as any;
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [contactRequestStatus, setContactRequestStatus] = useState<
        'none' | 'pending' | 'accepted' | 'approved' | 'rejected' | 'expired'
    >('none');
    const [likes, setLikes] = useState<string[]>([]);
    const [comments, setComments] = useState<any[]>([]);

    // AI State
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiResult, setAiResult] = useState<{
        type: 'owner' | 'viewer';
        summary: string;
        details: string;
        listItems: string[];
    } | null>(null);

    // ActionSheet & Image State
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [actionSheetConfig, setActionSheetConfig] = useState<{
        title?: string;
        description?: string;
        actions: ActionItem[];
    }>({ actions: [] });
    const [aiPlaceholderSuggestion, setAiPlaceholderSuggestion] = useState<{
        icon: string;
        gifKeywords: string[];
    } | null>(null);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const isLiked = auth?.user?._id && likes.includes(auth.user._id);
    const isOwnPost = auth?.user?._id === post?.user?._id;
    const hasChatAccess =
        contactRequestStatus === 'accepted' || contactRequestStatus === 'approved';

    const fetchPostDetails = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/posts/${id}`);
            setPost(res.data);
            setLikes(res.data.likes || []);
            setComments(res.data.comments || []);
            setContactRequestStatus(
                res.data.contactRequestStatus || (res.data.hasRequested ? 'pending' : 'none')
            );
        } catch {
            Alert.alert('Error', 'Could not fetch details.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [id, navigation]);

    useEffect(() => {
        fetchPostDetails();
    }, [fetchPostDetails]);

    useEffect(() => {
        if (post && (!post.images || post.images.length === 0)) {
            getPlaceholderSuggestions(post.title, post.description).then(
                setAiPlaceholderSuggestion
            );
        }
    }, [post]);

    const handleLike = async () => {
        if (!auth.user)
            return Alert.alert('Login Required', 'Please login to like posts');
        try {
            await api.post(`/posts/${id}/like`);
            setLikes(
                isLiked
                    ? likes.filter((uid) => uid !== auth.user._id)
                    : [...likes, auth.user._id]
            );
        } catch {
            Alert.alert('Error', 'Failed to update like');
        }
    };

    const handleShare = async () => {
        try {
            const serverBase = (BASE_URL || '').replace(/\/api\/?$/, '');
            const postUrl = `${serverBase}/post/${id}`;
            const shareTitle = post?.title || 'Check out this post on MyCircle';
            const shareMessage = `Check out "${shareTitle}" on MyCircle: ${postUrl}`;

            const result = await Share.share({
                title: shareTitle,
                message: Platform.OS === 'android' ? shareMessage : shareTitle,
                url: postUrl,
            });

            if (result.action === Share.sharedAction) {
                api.post(`/posts/${id}/share`).catch(() => {});
            }
        } catch (err: any) {
            if (
                err?.message &&
                !err.message.includes('dismissed') &&
                !err.message.includes('cancelled')
            ) {
                try {
                    const serverBase = (BASE_URL || '').replace(/\/api\/?$/, '');
                    Clipboard.setString(`${serverBase}/post/${id}`);
                    Alert.alert('Link Copied', 'Post link copied to clipboard!');
                } catch {
                    Alert.alert('Error', 'Failed to share');
                }
            }
        }
    };

    const handleGetInsights = async () => {
        if (isGeneratingAI) return;
        setIsGeneratingAI(true);
        try {
            if (isOwnPost) {
                const insights = await getPostInsights(post);
                setAiResult({
                    type: 'owner',
                    summary: `Score: ${insights.score}/100`,
                    details: insights.summary,
                    listItems: insights.tips,
                });
            } else {
                const explanation = await getPostExplanation(post);
                setAiResult({
                    type: 'viewer',
                    summary: explanation?.summary || '',
                    details: explanation?.context || '',
                    listItems: explanation?.interestingFacts || [],
                });
            }
        } catch {
            Alert.alert('Error', 'Analysis failed.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleRequestContact = async () => {
        try {
            await api.post(`/contacts/${id}`);
            Alert.alert('Success', 'Request Sent!');
            setContactRequestStatus('pending');
        } catch {
            Alert.alert('Error', 'Failed to send request.');
        }
    };

    const handleMessage = async () => {
        if (!hasChatAccess)
            return Alert.alert('Approval Required', 'Chat unlocks after request approval.');
        try {
            const conversation = await ensureConversationWithUser(post.user._id, id);
            navigation.navigate('ChatWindow', { conversation });
        } catch {
            Alert.alert('Error', 'Failed to start chat.');
        }
    };

    const handleDeletePost = async () => {
        try {
            await api.delete(`/posts/${id}`);
            Alert.alert('Deleted', 'Post removed');
            navigation.goBack();
        } catch {
            Alert.alert('Error', 'Failed to delete.');
        }
    };

    const showMenu = () => {
        setActionSheetConfig({
            title: 'Options',
            actions: isOwnPost
                ? [
                      {
                          label: 'Delete Post',
                          isDestructive: true,
                          onPress: () => setTimeout(handleDeletePost, 500),
                      },
                  ]
                : [
                      {
                          label: 'Report Post',
                          onPress: () => Alert.alert('Reported', 'Thank you.'),
                      },
                      {
                          label: 'Block Author',
                          isDestructive: true,
                          onPress: () => Alert.alert('Blocked', 'User blocked.'),
                      },
                  ],
        });
        setActionSheetVisible(true);
    };

    if (loading) {
        return (
            <SafeAreaView
                style={[styles.centerContainer, { backgroundColor: colors.background }]}
            >
                <StatusBar
                    barStyle={isDark ? 'light-content' : 'dark-content'}
                    backgroundColor={colors.background}
                />
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!post) return null;

    const formattedPrice =
        post.price !== undefined && post.price !== '' && post.price !== null
            ? `₹${post.price}`
            : post.acceptsBarter
            ? 'Barter / Exchange'
            : 'Contact for price';

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar
                    barStyle={isDark ? 'light-content' : 'dark-content'}
                    backgroundColor="transparent"
                    translucent
                />

                {/* Top Floating Navigation Header */}
                <SafeAreaView
                    edges={['top']}
                    style={[
                        styles.headerBar,
                        {
                            backgroundColor: isDark
                                ? 'rgba(11, 17, 32, 0.85)'
                                : 'rgba(255, 255, 255, 0.85)',
                            borderColor: colors.borderSoft,
                        },
                    ]}
                >
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[
                            styles.headerButton,
                            {
                                backgroundColor: isDark
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.05)',
                                borderColor: colors.borderSoft,
                            },
                        ]}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                        {post.type ? post.type.toUpperCase() : 'DETAILS'}
                    </Text>

                    <View style={styles.headerRightActions}>
                        <TouchableOpacity
                            onPress={handleShare}
                            style={[
                                styles.headerButton,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(0,0,0,0.05)',
                                    borderColor: colors.borderSoft,
                                },
                            ]}
                            activeOpacity={0.7}
                        >
                            <Share2 size={18} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={showMenu}
                            style={[
                                styles.headerButton,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(0,0,0,0.05)',
                                    borderColor: colors.borderSoft,
                                    marginLeft: 8,
                                },
                            ]}
                            activeOpacity={0.7}
                        >
                            <MoreVertical size={18} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{
                        paddingBottom: insets.bottom + 100,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Gallery or Placeholder */}
                    <View style={styles.heroWrapper}>
                        {post.images && post.images.length > 0 ? (
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                style={styles.imageGallery}
                            >
                                {post.images.map((img: string, idx: number) => (
                                    <TouchableOpacity
                                        key={idx}
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            setSelectedImageIndex(idx);
                                            setImagePreviewVisible(true);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: img }}
                                            style={styles.postHeroImage}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <GenerativePlaceholder
                                id={post._id}
                                type={post.type}
                                style={styles.imageGallery}
                                iconSize={120}
                                aiIcon={aiPlaceholderSuggestion?.icon}
                                aiGifKeyword={aiPlaceholderSuggestion?.gifKeywords?.[0]}
                            />
                        )}

                        {/* Category Tag Overlay */}
                        <View style={styles.floatingTypeBadge}>
                            <Text style={styles.floatingTypeBadgeText}>
                                {post.type ? post.type.toUpperCase() : 'LISTING'}
                            </Text>
                        </View>
                    </View>

                    {/* Main Details Panel */}
                    <View style={styles.detailsContainer}>
                        <View
                            style={[
                                styles.mainCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.borderSoft,
                                },
                            ]}
                        >
                            {/* Price and Title */}
                            <View style={styles.headerInfoRow}>
                                <Text
                                    style={[styles.postTitle, { color: colors.text }]}
                                    numberOfLines={3}
                                >
                                    {post.title}
                                </Text>

                                <View
                                    style={[
                                        styles.pricePill,
                                        {
                                            backgroundColor: isDark
                                                ? 'rgba(99, 102, 241, 0.16)'
                                                : 'rgba(99, 102, 241, 0.1)',
                                            borderColor: colors.primary,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[styles.priceText, { color: colors.primary }]}
                                    >
                                        {formattedPrice}
                                    </Text>
                                </View>
                            </View>

                            {/* Location */}
                            {post.location && (
                                <View style={styles.locationRow}>
                                    <MapPin size={16} color={colors.textSecondary} />
                                    <Text
                                        style={[
                                            styles.locationText,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        {post.location}
                                    </Text>
                                </View>
                            )}

                            {/* Seller / Author Info Card */}
                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate('UserProfile', {
                                        userId: post.user?._id,
                                    })
                                }
                                style={[
                                    styles.userRowCard,
                                    {
                                        backgroundColor: isDark
                                            ? 'rgba(255, 255, 255, 0.04)'
                                            : 'rgba(0, 0, 0, 0.03)',
                                        borderColor: colors.borderSoft,
                                    },
                                ]}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={{ uri: getAvatarUrl(post.user) }}
                                    style={[
                                        styles.avatar,
                                        { borderColor: colors.primary },
                                    ]}
                                />
                                <View style={styles.userInfo}>
                                    <Text
                                        style={[styles.userName, { color: colors.text }]}
                                        numberOfLines={1}
                                    >
                                        {post.user?.displayName || 'Community Member'}
                                    </Text>
                                    <TrustBadge
                                        score={post.user?.reputation?.trustScore ?? 50}
                                        isVerified={Boolean(post.user?.reputation?.isVerified)}
                                        size="small"
                                    />
                                </View>
                                <ChevronRight size={18} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {/* Description Section */}
                            <View style={styles.sectionDivider} />
                            <Text
                                style={[
                                    styles.sectionHeader,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                About this listing
                            </Text>
                            <Text style={[styles.descriptionBody, { color: colors.text }]}>
                                {post.description}
                            </Text>

                            {/* Key Specifications / Attributes */}
                            {(post.budgetMin ||
                                post.budgetMax ||
                                post.availability ||
                                post.duration) && (
                                <View style={styles.attributesContainer}>
                                    {(post.budgetMin || post.budgetMax) && (
                                        <View
                                            style={[
                                                styles.attributeCard,
                                                {
                                                    backgroundColor: isDark
                                                        ? 'rgba(255, 255, 255, 0.03)'
                                                        : 'rgba(0, 0, 0, 0.02)',
                                                    borderColor: colors.borderSoft,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.attributeLabel,
                                                    { color: colors.textSecondary },
                                                ]}
                                            >
                                                BUDGET RANGE
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.attributeValue,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                ₹{post.budgetMin || post.price || 0} - ₹
                                                {post.budgetMax || post.price || 0}
                                            </Text>
                                        </View>
                                    )}

                                    {post.duration && (
                                        <View
                                            style={[
                                                styles.attributeCard,
                                                {
                                                    backgroundColor: isDark
                                                        ? 'rgba(255, 255, 255, 0.03)'
                                                        : 'rgba(0, 0, 0, 0.02)',
                                                    borderColor: colors.borderSoft,
                                                },
                                            ]}
                                        >
                                            <View style={styles.attributeTitleRow}>
                                                <Clock size={14} color={colors.textSecondary} />
                                                <Text
                                                    style={[
                                                        styles.attributeLabel,
                                                        {
                                                            color: colors.textSecondary,
                                                            marginLeft: 6,
                                                        },
                                                    ]}
                                                >
                                                    DURATION
                                                </Text>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.attributeValue,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                {formatDurationMinutesLong(post.duration)}
                                            </Text>
                                        </View>
                                    )}

                                    {post.availability && (
                                        <View
                                            style={[
                                                styles.attributeCard,
                                                {
                                                    backgroundColor: isDark
                                                        ? 'rgba(255, 255, 255, 0.03)'
                                                        : 'rgba(0, 0, 0, 0.02)',
                                                    borderColor: colors.borderSoft,
                                                },
                                            ]}
                                        >
                                            <View style={styles.attributeTitleRow}>
                                                <Calendar size={14} color={colors.textSecondary} />
                                                <Text
                                                    style={[
                                                        styles.attributeLabel,
                                                        {
                                                            color: colors.textSecondary,
                                                            marginLeft: 6,
                                                        },
                                                    ]}
                                                >
                                                    AVAILABILITY
                                                </Text>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.attributeValue,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                {post.availability}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* AI Insights Card */}
                            <TouchableOpacity
                                onPress={handleGetInsights}
                                style={[
                                    styles.aiCard,
                                    {
                                        backgroundColor: isDark
                                            ? 'rgba(99, 102, 241, 0.08)'
                                            : 'rgba(99, 102, 241, 0.06)',
                                        borderColor: 'rgba(99, 102, 241, 0.25)',
                                    },
                                ]}
                                activeOpacity={0.8}
                            >
                                <View style={styles.aiHeaderRow}>
                                    <View style={styles.aiTitleGroup}>
                                        <Sparkles size={18} color={colors.primary} />
                                        <Text
                                            style={[
                                                styles.aiTitle,
                                                { color: colors.primary },
                                            ]}
                                        >
                                            AI Marketplace Assistant
                                        </Text>
                                    </View>
                                    {isGeneratingAI && (
                                        <ActivityIndicator
                                            size="small"
                                            color={colors.primary}
                                        />
                                    )}
                                </View>

                                {aiResult ? (
                                    <Animated.View entering={FadeInDown.springify()}>
                                        <Text
                                            style={[
                                                styles.aiSummary,
                                                { color: colors.text },
                                            ]}
                                        >
                                            {aiResult.summary}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.aiDetails,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            {aiResult.details}
                                        </Text>
                                    </Animated.View>
                                ) : (
                                    <Text
                                        style={[
                                            styles.aiPrompt,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Tap to generate AI price appraisal & neighborhood tips...
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Comments / Questions */}
                        {comments.length > 0 && (
                            <View style={styles.commentsSection}>
                                <Text
                                    style={[
                                        styles.sectionTitle,
                                        { color: colors.text },
                                    ]}
                                >
                                    Questions & Community Inquiries ({comments.length})
                                </Text>
                                {comments.map((comment: any, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.commentItem,
                                            {
                                                backgroundColor: colors.card,
                                                borderColor: colors.borderSoft,
                                            },
                                        ]}
                                    >
                                        <Image
                                            source={{ uri: getAvatarUrl(comment.user) }}
                                            style={styles.commentAvatar}
                                        />
                                        <View style={styles.commentContent}>
                                            <Text
                                                style={[
                                                    styles.commentAuthor,
                                                    { color: colors.text },
                                                ]}
                                            >
                                                {comment.user?.displayName || 'User'}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.commentText,
                                                    { color: colors.textSecondary },
                                                ]}
                                            >
                                                {comment.text}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Floating Bottom Sticky Action Bar */}
                <View
                    style={[
                        styles.bottomActionBarWrapper,
                        {
                            paddingBottom: Math.max(insets.bottom, 12),
                            backgroundColor: isDark
                                ? 'rgba(11, 17, 32, 0.96)'
                                : 'rgba(255, 255, 255, 0.96)',
                            borderTopColor: colors.borderSoft,
                        },
                    ]}
                >
                    <View style={styles.bottomActionBar}>
                        {/* Like Button */}
                        <TouchableOpacity
                            onPress={handleLike}
                            style={[
                                styles.actionIconBtn,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(255,255,255,0.06)'
                                        : 'rgba(0,0,0,0.04)',
                                    borderColor: colors.borderSoft,
                                },
                            ]}
                            activeOpacity={0.7}
                        >
                            <Heart
                                size={22}
                                color={isLiked ? '#ef4444' : colors.text}
                                fill={isLiked ? '#ef4444' : 'transparent'}
                            />
                        </TouchableOpacity>

                        {/* Request Contact Button */}
                        <TouchableOpacity
                            onPress={handleRequestContact}
                            style={[
                                styles.requestMainBtn,
                                {
                                    backgroundColor:
                                        contactRequestStatus === 'pending'
                                            ? isDark
                                                ? 'rgba(255,255,255,0.1)'
                                                : 'rgba(0,0,0,0.08)'
                                            : colors.primary,
                                },
                            ]}
                            disabled={contactRequestStatus !== 'none'}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.requestMainBtnText,
                                    {
                                        color:
                                            contactRequestStatus === 'pending'
                                                ? colors.textSecondary
                                                : '#ffffff',
                                    },
                                ]}
                            >
                                {contactRequestStatus === 'none'
                                    ? 'Request Contact'
                                    : contactRequestStatus.toUpperCase()}
                            </Text>
                        </TouchableOpacity>

                        {/* Message Button */}
                        <TouchableOpacity
                            onPress={handleMessage}
                            style={[
                                styles.actionIconBtn,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(255,255,255,0.06)'
                                        : 'rgba(0,0,0,0.04)',
                                    borderColor: colors.borderSoft,
                                },
                            ]}
                            activeOpacity={0.7}
                        >
                            <MessageCircle size={22} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Modals */}
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
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    headerButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    heroWrapper: {
        position: 'relative',
        width: SCREEN_WIDTH,
        height: 340,
        marginTop: 50,
    },
    imageGallery: {
        width: SCREEN_WIDTH,
        height: 340,
    },
    postHeroImage: {
        width: SCREEN_WIDTH,
        height: 340,
    },
    floatingTypeBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    floatingTypeBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    detailsContainer: {
        paddingHorizontal: 16,
        marginTop: -16,
    },
    mainCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    headerInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    postTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 28,
        marginRight: 12,
    },
    pricePill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    locationText: {
        fontSize: 14,
        marginLeft: 6,
        fontWeight: '500',
    },
    userRowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 16,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: 'rgba(148, 163, 184, 0.15)',
        marginVertical: 16,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    descriptionBody: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '400',
    },
    attributesContainer: {
        marginTop: 16,
        gap: 8,
    },
    attributeCard: {
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
    },
    attributeTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    attributeLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    attributeValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    aiCard: {
        marginTop: 20,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
    },
    aiHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    aiTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    aiSummary: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    aiDetails: {
        fontSize: 13,
        lineHeight: 20,
    },
    aiPrompt: {
        fontSize: 13,
        fontStyle: 'italic',
    },
    commentsSection: {
        marginTop: 24,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    commentItem: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    commentContent: {
        flex: 1,
        marginLeft: 12,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 13,
        lineHeight: 18,
    },
    bottomActionBarWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        paddingTop: 10,
        paddingHorizontal: 16,
    },
    bottomActionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionIconBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestMainBtn: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    requestMainBtnText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default PostDetailsScreen;
