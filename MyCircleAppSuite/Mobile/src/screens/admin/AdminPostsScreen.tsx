import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AdminGuard from '../../components/admin/AdminGuard';
import AppScreen from '../../components/layout/AppScreen';
import ScreenHeader from '../../components/layout/ScreenHeader';
import { useTheme } from '../../context/ThemeContext';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { listAdminPosts, updatePostModeration } from '../../services/adminService';
import { Alert } from '../../utils/alert';

const filters = ['visible', 'hidden', 'removed'] as const;
const actions = [
    { status: 'visible', label: 'Restore', destructive: false },
    { status: 'hidden', label: 'Hide', destructive: true },
    { status: 'removed', label: 'Remove', destructive: true },
] as const;

const AdminPostsScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { confirm, dialog } = useConfirmDialog();
    const [filter, setFilter] = useState<string>('visible');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<{ posts: any[]; totalPages: number }>({ posts: [], totalPages: 1 });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listAdminPosts({ page, limit: 20, moderationStatus: filter });
            setData({ posts: result.posts || [], totalPages: result.totalPages || 1 });
        } catch (error: any) {
            Alert.alert('Error', error?.userFriendlyMessage || 'Failed to load posts.');
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        load();
    }, [load]);

    const changeStatus = (post: any, status: 'visible' | 'hidden' | 'removed', label: string) => {
        confirm({
            title: `${label} post`,
            message: `${label} "${post.title}"? This changes what other users can see.`,
            confirmText: label,
            isDestructive: status !== 'visible',
            onConfirm: async () => {
                try {
                    await updatePostModeration(post._id, status);
                    await load();
                } catch (error: any) {
                    Alert.alert('Error', error?.userFriendlyMessage || 'Failed to update post.');
                }
            },
        });
    };

    return (
        <AdminGuard navigation={navigation}>
            <AppScreen>
                <ScreenHeader title="Content moderation" onBack={() => navigation.goBack()} />
                <View style={styles.filters}>
                    {filters.map((option) => (
                        <TouchableOpacity
                            key={option}
                            onPress={() => { setFilter(option); setPage(1); }}
                            style={[
                                styles.filter,
                                { borderColor: colors.borderSoft, backgroundColor: filter === option ? colors.primary : colors.cardSoft },
                            ]}
                        >
                            <Text style={{ color: filter === option ? colors.white : colors.text, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {data.posts.map((post) => (
                            <View key={post._id} style={[styles.card, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                                <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
                                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                                    {post.user?.displayName || 'Unknown author'} · {post.type} · {post.status}
                                </Text>
                                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>{post.description}</Text>
                                <View style={styles.actions}>
                                    {actions
                                        .filter((action) => action.status !== (post.moderationStatus || 'visible'))
                                        .map((action) => (
                                            <TouchableOpacity
                                                key={action.status}
                                                style={[styles.action, { borderColor: colors.borderSoft, backgroundColor: action.destructive ? colors.dangerSoft : colors.backdrop }]}
                                                onPress={() => changeStatus(post, action.status, action.label)}
                                            >
                                                <Text style={{ color: action.destructive ? colors.danger : colors.text, fontSize: 12, fontWeight: '700' }}>{action.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            </View>
                        ))}
                        {data.posts.length === 0 && <Text style={[styles.empty, { color: colors.textSecondary }]}>No posts found.</Text>}
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
    filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
    filter: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 8 },
    loader: { marginTop: 40 },
    content: { padding: 16, paddingBottom: 40 },
    card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
    title: { fontWeight: '800', fontSize: 16 },
    meta: { fontSize: 12, marginTop: 3 },
    description: { fontSize: 13, marginTop: 8, lineHeight: 18 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    action: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
    empty: { textAlign: 'center', marginTop: 30 },
    pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    pageButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
});

export default AdminPostsScreen;
