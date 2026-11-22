import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AdminGuard from '../../components/admin/AdminGuard';
import AppScreen from '../../components/layout/AppScreen';
import ScreenHeader from '../../components/layout/ScreenHeader';
import { useTheme } from '../../context/ThemeContext';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { listAdminSubmissions, updateSupportSubmission } from '../../services/adminService';
import { Alert } from '../../utils/alert';

const types = ['report', 'help', 'feedback'] as const;
const statuses = ['open', 'in_progress', 'resolved', 'dismissed'] as const;

const AdminSubmissionsScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { confirm, dialog } = useConfirmDialog();
    const [type, setType] = useState<string>('');
    const [page, setPage] = useState(1);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [data, setData] = useState<{ submissions: any[]; totalPages: number }>({ submissions: [], totalPages: 1 });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listAdminSubmissions({ page, limit: 20, ...(type ? { type } : {}) });
            setData({ submissions: result.submissions || [], totalPages: result.totalPages || 1 });
            setResponses({});
        } catch (error: any) {
            Alert.alert('Error', error?.userFriendlyMessage || 'Failed to load submissions.');
        } finally {
            setLoading(false);
        }
    }, [page, type]);

    useEffect(() => {
        load();
    }, [load]);

    const update = (item: any, status: typeof statuses[number]) => {
        const apply = async () => {
            try {
                await updateSupportSubmission(item._id, {
                    status,
                    response: responses[item._id] ?? item.response ?? '',
                });
                await load();
            } catch (error: any) {
                Alert.alert('Error', error?.userFriendlyMessage || 'Failed to update submission.');
            }
        };

        if (['resolved', 'dismissed'].includes(status)) {
            confirm({
                title: `${status === 'resolved' ? 'Resolve' : 'Dismiss'} submission`,
                message: `Mark this ${item.type} as ${status.replace('_', ' ')}?`,
                confirmText: status === 'resolved' ? 'Resolve' : 'Dismiss',
                isDestructive: status === 'dismissed',
                onConfirm: apply,
            });
            return;
        }
        apply();
    };

    return (
        <AdminGuard navigation={navigation}>
            <AppScreen>
                <ScreenHeader title="Reports & support" onBack={() => navigation.goBack()} />
                <View style={styles.filters}>
                    <TouchableOpacity
                        onPress={() => { setType(''); setPage(1); }}
                        style={[styles.filter, { borderColor: colors.borderSoft, backgroundColor: !type ? colors.primary : colors.cardSoft }]}
                    >
                        <Text style={{ color: !type ? colors.white : colors.text, fontSize: 12, fontWeight: '700' }}>All</Text>
                    </TouchableOpacity>
                    {types.map((option) => (
                        <TouchableOpacity
                            key={option}
                            onPress={() => { setType(option); setPage(1); }}
                            style={[styles.filter, { borderColor: colors.borderSoft, backgroundColor: type === option ? colors.primary : colors.cardSoft }]}
                        >
                            <Text style={{ color: type === option ? colors.white : colors.text, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {data.submissions.map((item) => (
                            <View key={item._id} style={[styles.card, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                                <View style={styles.badgeRow}>
                                    <Text style={[styles.badge, { color: colors.text, borderColor: colors.borderSoft, textTransform: 'capitalize' }]}>{item.type}</Text>
                                    <Text style={[styles.badge, { color: colors.primary, borderColor: colors.borderSoft }]}>{item.status.replace('_', ' ')}</Text>
                                    <Text style={[styles.time, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>
                                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                                    From: {item.reporter?.displayName || item.reporter?.email || 'Unknown'}
                                </Text>
                                <TextInput
                                    value={responses[item._id] ?? item.response ?? ''}
                                    onChangeText={(text) => setResponses((current) => ({ ...current, [item._id]: text }))}
                                    placeholder="Optional response"
                                    placeholderTextColor={colors.textMuted}
                                    style={[styles.input, { borderColor: colors.borderSoft, color: colors.text, backgroundColor: colors.backdrop }]}
                                />
                                <View style={styles.actions}>
                                    {statuses
                                        .filter((status) => status !== item.status)
                                        .map((status) => (
                                            <TouchableOpacity
                                                key={status}
                                                onPress={() => update(item, status)}
                                                style={[styles.action, { borderColor: colors.borderSoft }]}
                                            >
                                                <Text style={{ color: colors.text, fontSize: 11, textTransform: 'capitalize' }}>{status.replace('_', ' ')}</Text>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            </View>
                        ))}
                        {data.submissions.length === 0 && <Text style={[styles.empty, { color: colors.textSecondary }]}>No submissions found.</Text>}
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
    filters: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 8 },
    filter: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 8 },
    loader: { marginTop: 40 },
    content: { padding: 16, paddingBottom: 40 },
    card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11 },
    time: { marginLeft: 'auto', fontSize: 11 },
    message: { marginTop: 10, lineHeight: 20 },
    meta: { fontSize: 12, marginTop: 6 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, fontSize: 13 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    action: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    empty: { textAlign: 'center', marginTop: 30 },
    pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    pageButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
});

export default AdminSubmissionsScreen;
