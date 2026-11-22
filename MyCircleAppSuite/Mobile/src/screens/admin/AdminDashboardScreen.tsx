import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AdminGuard from '../../components/admin/AdminGuard';
import AppScreen from '../../components/layout/AppScreen';
import ScreenHeader from '../../components/layout/ScreenHeader';
import { useTheme } from '../../context/ThemeContext';
import { getAdminOverview } from '../../services/adminService';
import { Alert } from '../../utils/alert';

const cards = [
    { key: 'users', label: 'Users' },
    { key: 'posts', label: 'Posts' },
    { key: 'deals', label: 'Deals' },
    { key: 'openReports', label: 'Open reports' },
    { key: 'openSubmissions', label: 'Open support' },
    { key: 'suspendedUsers', label: 'Suspended' },
];

const links = [
    { label: 'User management', target: 'AdminUsers' },
    { label: 'Content moderation', target: 'AdminPosts' },
    { label: 'Reports & support queue', target: 'AdminSubmissions' },
];

const AdminDashboardScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const [overview, setOverview] = useState<Record<string, number> | null>(null);

    const load = useCallback(async () => {
        try {
            setOverview(await getAdminOverview());
        } catch (error: any) {
            Alert.alert('Error', error?.userFriendlyMessage || 'Failed to load admin overview.');
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <AdminGuard navigation={navigation}>
            <AppScreen>
                <ScreenHeader title="Admin" onBack={() => navigation.goBack()} />
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.heading, { color: colors.text }]}>Progress overview</Text>
                    {!overview ? (
                        <ActivityIndicator color={colors.primary} style={styles.loader} />
                    ) : (
                        <View style={styles.grid}>
                            {cards.map((card) => (
                                <View key={card.key} style={[styles.card, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                                    <Text style={[styles.cardValue, { color: colors.primary }]}>{overview[card.key] ?? 0}</Text>
                                    <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{card.label}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={[styles.heading, { color: colors.text }]}>Moderation</Text>
                    {links.map((link) => (
                        <TouchableOpacity
                            key={link.target}
                            style={[styles.link, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}
                            onPress={() => navigation.navigate(link.target)}
                        >
                            <Text style={[styles.linkText, { color: colors.text }]}>{link.label}</Text>
                            <Text style={{ color: colors.primary, fontSize: 20 }}>›</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </AppScreen>
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    content: { padding: 16, paddingBottom: 40 },
    heading: { fontSize: 18, fontWeight: '800', marginTop: 12, marginBottom: 12 },
    loader: { marginVertical: 32 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    card: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 16, minHeight: 90, justifyContent: 'center' },
    cardValue: { fontSize: 26, fontWeight: '800' },
    cardLabel: { fontSize: 12, marginTop: 4, textTransform: 'uppercase' },
    link: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    linkText: { fontWeight: '700' },
});

export default AdminDashboardScreen;
