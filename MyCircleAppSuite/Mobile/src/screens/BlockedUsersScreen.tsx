import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Alert } from '../utils/alert';
import { UserX } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AppScreen from '../components/layout/AppScreen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

const BlockedUsersScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void fetchBlockedUsers();
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
        Alert.alert('Unblock User', `Unblock ${displayName}? They will be able to message you again.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Unblock',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.post(`/user/unblock/${userId}`);
                        setBlockedUsers(prev => prev.filter(user => user._id !== userId));
                        Alert.alert('Success', `${displayName} has been unblocked`);
                    } catch (err) {
                        console.error(err);
                        Alert.alert('Error', 'Failed to unblock user');
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <View style={[styles.userCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                <Image source={{ uri: getAvatarUrl(item) }} style={[styles.avatar, { borderColor: colors.borderSoft }]} />
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.displayName}</Text>
                    <Text style={[styles.blockedBadge, { color: colors.danger }]}>BLOCKED</Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleUnblock(item._id, item.displayName)}
                    style={[styles.unblockButton, { backgroundColor: colors.successSoft, borderColor: colors.successSoft }]}
                >
                    <Text style={[styles.unblockText, { color: colors.success }]}>Unblock</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <AppScreen>
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
                <ScreenHeader title="Blocked Users" onBack={() => navigation.goBack()} />
            </Animated.View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : blockedUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primarySoft }]}>
                        <UserX size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Blocked Users</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Users you block will appear here. You can unblock them anytime.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </AppScreen>
    );
};

const styles = StyleSheet.create({
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
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    list: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
    },
    blockedBadge: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
    unblockButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    unblockText: {
        fontWeight: '700',
        fontSize: 14,
    },
});

export default BlockedUsersScreen;
