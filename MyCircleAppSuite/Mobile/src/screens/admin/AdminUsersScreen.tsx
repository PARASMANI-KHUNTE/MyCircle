import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AdminGuard from '../../components/admin/AdminGuard';
import AppScreen from '../../components/layout/AppScreen';
import ScreenHeader from '../../components/layout/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { listAdminUsers, updateUserStatus } from '../../services/adminService';
import { Alert } from '../../utils/alert';

const statusActions = [
    { status: 'active', label: 'Restore', destructive: false },
    { status: 'suspended', label: 'Suspend', destructive: true },
    { status: 'banned', label: 'Ban', destructive: true },
] as const;

const AdminUsersScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { user: currentUser } = useAuth() as any;
    const { confirm, dialog } = useConfirmDialog();
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<{ users: any[]; totalPages: number }>({ users: [], totalPages: 1 });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listAdminUsers({ page, limit: 20, q: query });
            setData({ users: result.users || [], totalPages: result.totalPages || 1 });
        } catch (error: any) {
            Alert.alert('Error', error?.userFriendlyMessage || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [page, query]);

    useEffect(() => {
        load();
    }, [load]);

    const changeStatus = (item: any, status: 'active' | 'suspended' | 'banned', label: string) => {
        confirm({
            title: `${label} user`,
            message: `${label} ${item.displayName || item.email}? They will lose access until restored.`,
            confirmText: label,
            isDestructive: status !== 'active',
            onConfirm: async () => {
                try {
                    await updateUserStatus(item._id, status);
                    await load();
                } catch (error: any) {
                    Alert.alert('Error', error?.userFriendlyMessage || 'Failed to update user.');
                }
            },
        });
    };

    return (
        <AdminGuard navigation={navigation}>
            <AppScreen>
                <ScreenHeader title="Users" onBack={() => navigation.goBack()} />
                <View style={styles.searchRow}>
                    <TextInput
                        value={query}
                        onChangeText={(text) => { setQuery(text); setPage(1); }}
                        placeholder="Search name or email"
                        placeholderTextColor={colors.textMuted}
                        style={[styles.search, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft, color: colors.text }]}
                    />
                </View>
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {data.users.map((item) => {
                            const isSelf = String(item._id) === String(currentUser?._id || currentUser?.id);
                            return (
                                <View key={item._id} style={[styles.card, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                                    <Text style={[styles.name, { color: colors.text }]}>{item.displayName || 'Unnamed user'}</Text>
                                    <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
                                    <View style={styles.badgeRow}>
                                        <Text style={[styles.badge, { color: colors.textSecondary, borderColor: colors.borderSoft }]}>{item.role}</Text>
                                        <Text style={[styles.badge, { color: item.accountStatus === 'active' ? colors.primary : colors.danger, borderColor: colors.borderSoft }]}>
                                            {item.accountStatus || 'active'}
                                        </Text>
                                    </View>
                                    {isSelf ? (
                                        <Text style={[styles.selfNote, { color: colors.textMuted }]}>You cannot change your own account.</Text>
                                    ) : (
                                        <View style={styles.actions}>
                                            {statusActions
                                                .filter((action) => action.status !== (item.accountStatus || 'active'))
                                                .map((action) => (
                                                    <TouchableOpacity
                                                        key={action.status}
                                                        style={[styles.action, { borderColor: colors.borderSoft, backgroundColor: action.destructive ? colors.dangerSoft : colors.backdrop }]}
                                                        onPress={() => changeStatus(item, action.status, action.label)}
                                                    >
                                                        <Text style={{ color: action.destructive ? colors.danger : colors.text, fontSize: 12, fontWeight: '700' }}>{action.label}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                        {data.users.length === 0 && <Text style={[styles.empty, { color: colors.textSecondary }]}>No users found.</Text>}
                        <View style={styles.pagination}>
                            <TouchableOpacity disabled={page <= 1} onPress={() => setPage((value) => value - 1)} style={[styles.pageButton, { borderColor: colors.borderSoft, opacity: page <= 1 ? 0.4 : 1 }]}>
                                <Text style={{ color: colors.text }}>Prev</Text>
                            </TouchableOpacity>
                            <Text style={{ color: colors.textSecondary }}>{page} / {data.totalPages}</Text>
                            <TouchableOpacity disabled={page >= data.totalPages} onPress={() => setPage((value) => value + 1)} style={[styles.pageButton, { borderColor: colors.borderSoft, opacity: page >= data.totalPages ? 0.4 : 1 }]}>
                                <Text style={{ color: colors.text }}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
                {dialog}
            </AppScreen>
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    searchRow: { paddingHorizontal: 16 },
    search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    loader: { marginTop: 40 },
    content: { padding: 16, paddingBottom: 40 },
    card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
    name: { fontWeight: '800', fontSize: 16 },
    email: { fontSize: 12, marginTop: 2 },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11, textTransform: 'capitalize' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    action: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
    selfNote: { marginTop: 10, fontSize: 12 },
    empty: { textAlign: 'center', marginTop: 30 },
    pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    pageButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
});

export default AdminUsersScreen;
