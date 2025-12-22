import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, MapPin, MessageCircle, Shield, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAvatarUrl } from '../utils/avatar';
import api from '../services/api';

const ProfileScreen = ({ navigation, route }: any) => {
    const { logout, user: currentUser } = useAuth();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Check if we are viewing another user's profile
    const userId = route?.params?.userId;
    const isOwnProfile = !userId || (currentUser && userId === currentUser._id) || (currentUser && userId === currentUser.id);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const endpoint = isOwnProfile ? '/user/profile' : `/user/${userId}`;
            const res = await api.get(endpoint);
            setUser(res.data);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not fetch profile");
            if (!isOwnProfile) navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: logout }
        ]);
    };

    const handleReport = () => {
        Alert.alert(
            "Report User",
            "Why are you reporting this user?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Spam", onPress: () => submitReport("spam") },
                { text: "Harassment", onPress: () => submitReport("harassment") },
                { text: "Inappropriate Content", onPress: () => submitReport("inappropriate") }
            ]
        );
    };

    const submitReport = async (reason: string) => {
        try {
            await api.post('/user/report', {
                reportedUserId: userId,
                reason,
                contentType: 'profile',
                contentId: userId
            });
            Alert.alert("Reported", "Thank you for your report. We will investigate.");
        } catch (error) {
            Alert.alert("Error", "Failed to submit report");
        }
    };

    const handleBlock = () => {
        Alert.alert(
            "Block User",
            "Are you sure? You won't see their posts or messages.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Block", style: "destructive", onPress: async () => {
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    if (!user) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!isOwnProfile && (
                            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16, padding: 4 }}>
                                <ArrowLeft size={24} color="#ffffff" />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.headerTitle}>{isOwnProfile ? 'Profile' : 'User Profile'}</Text>
                    </View>
                    <View style={styles.actionRow}>
                        {isOwnProfile ? (
                            <>
                                <TouchableOpacity onPress={() => navigation.navigate('ChatList')} style={styles.actionButton}>
                                    <MessageCircle size={20} color="#8b5cf6" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.actionButton}>
                                    <Settings size={20} color="#a1a1aa" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleLogout} style={styles.actionButton}>
                                    <LogOut size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity onPress={handleReport} style={styles.actionButton}>
                                <Shield size={20} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Profile Card */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: getAvatarUrl(user) }}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.userName}>{user.displayName}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>

                    {user.location && (
                        <View style={styles.locationContainer}>
                            <MapPin size={14} color="#a1a1aa" />
                            <Text style={styles.locationText}>{user.location}</Text>
                        </View>
                    )}
                </View>

                {/* Statistics */}
                <View style={styles.statsGrid}>
                    <TouchableOpacity
                        onPress={() => isOwnProfile && navigation.navigate('MyPosts')}
                        style={[styles.statBox, isOwnProfile && styles.activeStatBox]}
                        activeOpacity={isOwnProfile ? 0.7 : 1}
                        disabled={!isOwnProfile}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.statValue}>{user.stats?.totalPosts || 0}</Text>
                            {isOwnProfile && <Settings size={12} color="transparent" />}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={[styles.statLabel, isOwnProfile && { color: '#8b5cf6' }]}>Posts</Text>
                            {isOwnProfile && <MessageCircle size={10} color="#8b5cf6" style={{ marginLeft: 4, transform: [{ rotate: '-45deg' }] }} />}
                        </View>
                    </TouchableOpacity>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: '#a855f7' }]}>{user.stats?.requestsReceived || 0}</Text>
                        <Text style={styles.statLabel}>Requests</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: '#22c55e' }]}>{user.stats?.rating?.toFixed(1) || '5.0'}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                </View>

                {/* Bio */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Bio</Text>
                    <Text style={styles.bioText}>
                        {user.bio || "No bio added yet."}
                    </Text>
                </View>

                {/* Skills */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Skills & Interests</Text>
                    <View style={styles.skillsGrid}>
                        {user.skills && user.skills.length > 0 ? (
                            user.skills.map((skill: string, index: number) => (
                                <View key={index} style={styles.skillBadge}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No skills listed.</Text>
                        )}
                    </View>
                </View>

                {isOwnProfile ? (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('EditProfile')}
                            style={[styles.actionButtonMain, styles.editButton]}
                        >
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('MyPosts')}
                            style={[styles.actionButtonMain, styles.postsButton]}
                        >
                            <Text style={[styles.editButtonText, { color: '#ffffff' }]}>My Posts</Text>
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
                            style={[styles.actionButtonMain, styles.blockButton]}
                        >
                            <Text style={[styles.editButtonText, { color: '#ef4444' }]}>Block</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        paddingTop: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    actionRow: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 10,
        backgroundColor: '#18181b',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginLeft: 12,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#27272a',
        borderWidth: 2,
        borderColor: '#3f3f46',
        overflow: 'hidden',
        marginBottom: 16,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    userEmail: {
        color: '#a1a1aa',
        marginTop: 2,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    locationText: {
        color: '#71717a',
        fontSize: 14,
        marginLeft: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#18181b',
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    statLabel: {
        color: '#71717a',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        color: '#a1a1aa',
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    bioText: {
        color: '#d4d4d8',
        fontSize: 16,
        lineHeight: 24,
    },
    skillsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    skillBadge: {
        backgroundColor: '#18181b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginRight: 8,
        marginBottom: 8,
    },
    skillText: {
        color: '#d4d4d8',
        fontSize: 14,
    },
    emptyText: {
        color: '#71717a',
        fontStyle: 'italic',
    },
    activeStatBox: {
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionButtonMain: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#ffffff',
    },
    postsButton: {
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
    },
    messageButton: {
        backgroundColor: '#8b5cf6',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    blockButton: {
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
});

export default ProfileScreen;
