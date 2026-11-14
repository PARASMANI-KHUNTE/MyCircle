import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, StatusBar, Clipboard } from 'react-native';
import { Alert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, MessageCircle, ArrowLeft, ChevronRight, Share2, Heart, MoreVertical, Sparkles } from 'lucide-react-native';
import { getAvatarUrl } from '../utils/avatar';
import { formatDurationMinutesLong } from '../utils/formatDuration';
import api, { BASE_URL } from '../services/api';
import { ensureConversationWithUser } from '../services/chat';
import { useAuth } from '../context/AuthContext';
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
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [contactRequestStatus, setContactRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'approved' | 'rejected' | 'expired'>('none');
    const [likes, setLikes] = useState<string[]>([]);
    const [shares, setShares] = useState(0);
    const [hasShared, setHasShared] = useState(false);
    const [comments, setComments] = useState<any[]>([]);

    useEffect(() => {
        const checkShared = async () => {
            try {
                const sharedPosts = JSON.parse(await AsyncStorage.getItem('sharedPosts') || '[]');
                setHasShared(sharedPosts.includes(id));
            } catch {}
        };
        checkShared();
    }, [id]);
    const [likes, setLikes] = useState<string[]>([]);

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

    // Wallet state
    const [walletBalance, setWalletBalance] = useState(0);

    const isLiked = auth?.user?._id && likes.includes(auth.user._id);
    const isOwnPost = auth?.user?._id === post?.user?._id;
    const hasChatAccess = contactRequestStatus === 'accepted' || contactRequestStatus === 'approved';

    const fetchPostDetails = useCallback(async () => {
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
    }, [id, navigation]);

    useEffect(() => {
        fetchPostDetails();
    }, [fetchPostDetails]);

    useEffect(() => {
        if (post && (!post.images || post.images.length === 0)) {
            getPlaceholderSuggestions(post.title, post.description).then(setAiPlaceholderSuggestion);
        }
    }, [post]);

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
            if (!post) throw new Error('Post not loaded');

            // Purchase completed - release funds and mark as approved
            setContactRequestStatus('approved');
            setPurchaseLoading(false);
            setCheckoutVisible(false);
            Alert.alert("Success", "Purchase successful! You can now contact the author.");

            // Refresh wallet balance
            setWalletBalance(walletBalance + post.price);
        } catch (err) {
            console.error('Purchase failed:', err);
            Alert.alert("Error", "Purchase failed. Please try again.");
            setPurchaseLoading(false);
        }
    };

    const handleConfirmPurchaseLegacy = async () => {
        // Legacy purchase flow removed - purchase now simply approves contact
        setContactRequestStatus('approved');
        Alert.alert("Success", "Purchase completed! You can now contact the author.");
        setCheckoutVisible(false);
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

    const hasChatAccess = contactRequestStatus === 'accepted' || contactRequestStatus === 'approved';

    useEffect(() => {
        if (post && (!post.images || post.images.length === 0)) {
            getPlaceholderSuggestions(post.title, post.description).then(setAiPlaceholderSuggestion);
        }
    }, [post]);

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

    const hasChatAccess = contactRequestStatus === 'accepted' || contactRequestStatus === 'approved';

    const fetchPostDetails = useCallback(async () => {
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
    }, [id, navigation]);

    useEffect(() => {
        fetchPostDetails();
    }, [fetchPostDetails]);

    const [comments, setComments] = useState<any[]>([]);

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

    const isLiked = auth?.user?._id && likes.includes(auth.user._id);
    const isOwnPost = auth?.user?._id === post?.user?._id;
    const hasChatAccess = contactRequestStatus === 'accepted' || contactRequestStatus === 'approved';

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
            if (!post) throw new Error('Post not loaded');

            // Purchase completed - release funds and mark as approved
            setContactRequestStatus('approved');
            setPurchaseLoading(false);
            setCheckoutVisible(false);
            Alert.alert("Success", "Purchase successful! You can now contact the author.");

            // Refresh wallet balance
            setWalletBalance(walletBalance + post.price);
        } catch (err) {
            console.error('Purchase failed:', err);
            Alert.alert("Error", "Purchase failed. Please try again.");
            setPurchaseLoading(false);
        }
    };

    const handleConfirmPurchaseLegacy = async () => {
        // Legacy purchase flow removed - purchase now simply approves contact
        setContactRequestStatus('approved');
        Alert.alert("Success", "Purchase completed! You can now contact the author.");
        setCheckoutVisible(false);
    };

    const styles = StyleSheet.create({
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        // ... (keep existing styles, remove escrow-specific ones)
    });

    const [comments, setComments] = useState<any[]>([]);

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
            if (!post) throw new Error('Post not loaded');

            // Purchase completed - release funds and mark as approved
            setContactRequestStatus('approved');
            setPurchaseLoading(false);
            setCheckoutVisible(false);
            Alert.alert("Success", "Purchase successful! You can now contact the author.");

            // Refresh wallet balance
            setWalletBalance(walletBalance + post.price);
        } catch (err) {
            console.error('Purchase failed:', err);
            Alert.alert("Error", "Purchase failed. Please try again.");
            setPurchaseLoading(false);
        }
    };

    const handleConfirmPurchaseLegacy = async () => {
        // Legacy purchase flow removed - purchase now simply approves contact
        setContactRequestStatus('approved');
        Alert.alert("Success", "Purchase completed! You can now contact the author.");
        setCheckoutVisible(false);
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

    const hasChatAccess = contactRequestStatus === 'accepted' || contactRequestStatus === 'approved';

    return (
        <PostDetailsScreen route={route} navigation={navigation} />
    );
};

export default PostDetailsScreen;