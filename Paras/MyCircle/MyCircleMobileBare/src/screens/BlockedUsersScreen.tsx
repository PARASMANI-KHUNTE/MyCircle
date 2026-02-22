import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserX } from 'lucide-react-native';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import Animated, { FadeInDown } from 'react-native-reanimated';

const BlockedUsersScreen = ({ navigation }: any) => {
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const fetchBlockedUsers = async () => {
        try {
            const res = await api.get('/user/blocked');
            setBlockedUsers(res.data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to load blocked users');
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (userId: string, displayName: string) => {
        Alert.alert(
            'Unblock User',
            `Unblock ${displayName}? They will be able to message you again.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unblock',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/user/unblock/${userId}`);
                            setBlockedUsers(prev => prev.filter(u => u._id !== userId));
                            Alert.alert('Success', `${displayName} has been unblocked`);
                        } catch (err) {
                            console.error(err);
                            Alert.alert('Error', 'Failed to unblock user');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <View style={styles.userCard}>
                <Image
                    source={{ uri: getAvatarUrl(item) }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.displayName}</Text>
                    <Text style={styles.blockedBadge}>BLOCKED</Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleUnblock(item._id, item.displayName)}
                    style={styles.unblockBtn}
                >
                    <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Blocked Users</Text>
            </Animated.View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : blockedUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrapper}>
                        <UserX size={48} color="#af25f4" />
                    </View>
                    <Text style={styles.emptyTitle}>No Blocked Users</Text>
                    <Text style={styles.emptyText}>
                        Users you block will appear here. You can unblock them anytime.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(175, 37, 244, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 22,
    },
    list: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    blockedBadge: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: '700',
        marginTop: 4,
    },
    unblockBtn: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    unblockText: {
        color: '#10b981',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default BlockedUsersScreen;
