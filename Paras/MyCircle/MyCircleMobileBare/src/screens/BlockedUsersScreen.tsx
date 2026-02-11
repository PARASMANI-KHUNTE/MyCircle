import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserX } from 'lucide-react-native';
import api from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import GlassView from '../components/ui/GlassView';
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
            <GlassView intensity={5} borderRadius={20} style={styles.userCardGlass}>
                <Image
                    source={{ uri: getAvatarUrl(item) }}
                    style={styles.avatarGlass}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.displayName}</Text>
                    <Text style={styles.blockedBadge}>BLOCKED</Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleUnblock(item._id, item.displayName)}
                    style={styles.unblockBtnNeon}
                >
                    <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
            </GlassView>
        </Animated.View>
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
        backgroundColor: '#09090b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
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
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        lineHeight: 22,
    },
    listContent: {
        padding: 20,
    },
    userCardGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    avatarGlass: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    userInfo: {
        flex: 1,
        marginLeft: 14,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    blockedBadge: {
        fontSize: 10,
        color: '#ef4444',
        fontWeight: '900',
        letterSpacing: 1,
    },
    unblockBtnNeon: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#af25f4',
        borderRadius: 12,
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    unblockText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
    },
});

export default BlockedUsersScreen;
