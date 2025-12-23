import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserX } from 'lucide-react-native';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

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

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.userCard}>
            <Image
                source={{ uri: getAvatarUrl(item) }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.blockedText}>Blocked</Text>
            </View>
            <TouchableOpacity
                onPress={() => handleUnblock(item._id, item.displayName)}
                style={styles.unblockButton}
            >
                <Text style={styles.unblockText}>Unblock</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Blocked Users</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : blockedUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <UserX size={64} color="#3f3f46" />
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
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
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
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#71717a',
        textAlign: 'center',
        lineHeight: 20,
    },
    listContent: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181b',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#27272a',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    blockedText: {
        fontSize: 13,
        color: '#ef4444',
    },
    unblockButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#8b5cf6',
        borderRadius: 8,
    },
    unblockText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default BlockedUsersScreen;
