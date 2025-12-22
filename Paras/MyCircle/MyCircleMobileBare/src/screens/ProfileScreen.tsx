import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Settings, LogOut, MessageCircle, Star } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const ProfileScreen = ({ navigation, route }: any) => {
    const { user: authUser, logout } = useAuth();
    const { colors } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ posts: 0, requests: 0, rating: 0 });

    const userId = route.params?.userId || authUser?._id || authUser?.id;
    const isOwnProfile = userId === (authUser?._id || authUser?.id);

    const fetchProfile = async () => {
        try {
            const res = await api.get(`/user/profile/${userId}`);
            setUser(res.data);

            // Mock stats if not provided by backend yet
            setStats({
                posts: res.data.postsCount || 0,
                requests: res.data.requestsCount || 0,
                rating: res.data.rating || 5.0
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load profile');
            navigation.goBack();
        } finally {
            setLoading(false);
            setRefreshing(false);
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
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        // Navigation is handled by AuthContext/AppNavigator
                    }
                }
            ]
        );
    };

    const handleBlock = () => {
        Alert.alert(
            "Block User",
            "Are you sure you want to block this user?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Block",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.post(`/user/block/${userId}`);
                            Alert.alert("Blocked", "User has been blocked");
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert("Error", "Failed to block user");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!user) return null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                {!isOwnProfile ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                ) : (
                    <View /> // Spacer
                )}
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                {isOwnProfile ? (
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
                        <Settings size={24} color={colors.text} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                <View style={styles.profileHeader}>
                    <Image
                        source={{ uri: user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.displayName}` }}
                        style={styles.avatar}
                    />
                    <Text style={[styles.name, { color: colors.text }]}>{user.displayName}</Text>
                    <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.posts}</Text>
                        <Text style={[styles.statLabel, { color: colors.primary }]}>POSTS</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.requests}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>REQUESTS</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.rating}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>RATING</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Bio</Text>
                    <Text style={[styles.sectionContent, { color: colors.text }]}>
                        {user.bio || "No bio added yet."}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Skills & Interests</Text>
                    <Text style={[styles.sectionContent, { color: colors.text, fontStyle: user.skills?.length ? 'normal' : 'italic' }]}>
                        {user.skills && user.skills.length > 0 ? user.skills.join(', ') : "No skills listed."}
                    </Text>
                </View>

                {isOwnProfile ? (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('EditProfile')}
                            style={[styles.actionButtonMain, { backgroundColor: colors.primary }]}
                        >
                            <Text style={[styles.editButtonText, { color: '#ffffff' }]}>Edit Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('MyPosts')}
                            style={[styles.actionButtonMain, styles.postsButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <Text style={[styles.editButtonText, { color: colors.text }]}>My Posts</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ChatWindow', { recipient: user })}
                            style={[styles.actionButtonMain, styles.messageButton]}
                        >
                            <MessageCircle size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={[styles.editButtonText, { color: '#ffffff' }]}>Message</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleBlock}
                            style={[styles.actionButtonMain, styles.blockButton, { backgroundColor: colors.card }]}
                        >
                            <Text style={[styles.editButtonText, { color: '#ef4444' }]}>Block</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isOwnProfile && (
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <LogOut size={20} color="#ef4444" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    iconButton: {
        padding: 5,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 6,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionContent: {
        fontSize: 16,
        lineHeight: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 30,
        gap: 12,
    },
    actionButtonMain: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    postsButton: {
        borderWidth: 1,
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    messageButton: {
        backgroundColor: '#8b5cf6',
    },
    blockButton: {
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20,
        padding: 15,
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default ProfileScreen;
