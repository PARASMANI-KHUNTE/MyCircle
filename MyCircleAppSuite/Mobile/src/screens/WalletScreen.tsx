import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, CreditCard, History, Plus, TrendingUp, Wallet, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import api from '../services/api';

import AppScreen from '../components/layout/AppScreen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const WalletScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [balance, setBalance] = useState(0);
    const [pendingBalance, setPendingBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [topupLoading, setTopupLoading] = useState(false);
    const [stripeConnected, setStripeConnected] = useState(false);
    const [stripeConnectLoading, setStripeConnectLoading] = useState(false);

    useEffect(() => {
        fetchWallet();
        fetchStripeStatus();
    }, []);

    const fetchWallet = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payments/wallet');
            setBalance(res.data.balance || 0);
            setPendingBalance(res.data.pendingBalance || 0);
            if (res.data.stripeAccountId) {
                setStripeConnected(true);
            }
        } catch (err) {
            console.error('Failed to fetch wallet:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStripeStatus = async () => {
        try {
            const res = await api.get('/payments/stripe/connect/status');
            setStripeConnected(res.data.connected || false);
        } catch (err) {
            console.error('Failed to fetch Stripe status:', err);
        }
    };

    const handleTopUp = async () => {
        // Use Alert with text input for amount entry
        const amountStr = await new Promise<string | null>((resolve) => {
            Alert.prompt(
                'Top Up Wallet',
                'Enter amount to add (₹10 - ₹50,000):',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
                    {
                        text: 'OK',
                        onPress: (value) => resolve(value || null),
                    },
                ],
                'plain-text',
                '1000'
            );
        });

        if (!amountStr) return;
        const amount = parseInt(amountStr, 10);
        if (isNaN(amount) || amount < 10 || amount > 50000) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount between ₹10 and ₹50,000');
            return;
        }

        setTopupLoading(true);
        try {
            // Create payment intent
            const res = await api.post('/payments/wallet/topup', { amount });
            const { clientSecret, devMode } = res.data;

            if (devMode || !clientSecret) {
                // Dev mode: auto-confirm
                await api.post('/payments/wallet/topup/confirm', { amount });
            } else {
                // Production: Would use Stripe SDK to confirm with clientSecret
                // Then call confirm endpoint
                // For now, simulate
                await api.post('/payments/wallet/topup/confirm', { amount });
            }

            Alert.alert('Success', 'Wallet topped up successfully!');
            await fetchWallet();
        } catch (err: any) {
            console.error('Top-up failed:', err);
            const message = err.response?.data?.message || 'Top-up failed. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setTopupLoading(false);
        }
    };

    const handleStripeConnect = async () => {
        setStripeConnectLoading(true);
        try {
            const res = await api.post('/payments/stripe/connect');
            if (res.data.onboardingUrl) {
                // Open in browser
                const { Linking } = require('react-native');
                await Linking.openURL(res.data.onboardingUrl);
            }
        } catch (err: any) {
            console.error('Stripe connect failed:', err);
            const message = err.response?.data?.message || 'Failed to connect Stripe account';
            Alert.alert('Error', message);
        } finally {
            setStripeConnectLoading(false);
        }
    };

    const handleRefresh = async () => {
        await fetchWallet();
    };

    return (
        <AppScreen>
            <ScreenHeader
                title="My Wallet"
                onBack={() => navigation.goBack()}
                right={
                    <TouchableOpacity onPress={handleRefresh} style={{ padding: 8 }}>
                        <RefreshCw size={22} color={colors.text} style={{ transform: loading ? [{ rotate: '180deg' }] : [] }} />
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInUp.springify()}>
                    <View style={[styles.balanceCard, { backgroundColor: colors.primarySoft, borderColor: colors.borderStrong }]}>
                        <View style={styles.balanceHeader}>
                            <View style={[styles.walletIcon, { backgroundColor: colors.backdrop }]}>
                                <Wallet size={20} color={colors.text} />
                            </View>
                            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Total Balance</Text>
                        </View>

                        <View style={styles.balanceRow}>
                            <Text style={[styles.currency, { color: colors.textMuted }]}>₹</Text>
                            <Text style={[styles.balanceValue, { color: colors.text }]}>{balance.toLocaleString()}</Text>
                        </View>

                        {pendingBalance > 0 && (
                            <View style={styles.pendingRow}>
                                <Text style={styles.pendingLabel}>Pending (Escrow)</Text>
                                <Text style={styles.pendingValue}>₹{pendingBalance.toLocaleString()}</Text>
                            </View>
                        )}

                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={[styles.topUpButton, { backgroundColor: colors.primary }]}
                                onPress={handleTopUp}
                                disabled={topupLoading}
                            >
                                {topupLoading ? (
                                    <ActivityIndicator color={colors.white} size="small" />
                                ) : (
                                    <>
                                        <Plus size={20} color={colors.white} style={{ marginRight: 8 }} />
                                        <Text style={[styles.topUpText, { color: colors.white }]}>TOP UP</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={[styles.withdrawButton, { backgroundColor: colors.backdrop, borderColor: colors.borderSoft }]}
                                onPress={() => Alert.alert('Coming Soon', 'Withdraw feature coming soon!')}
                            >
                                <Text style={[styles.withdrawText, { color: colors.text }]}>WITHDRAW</Text>
                            </TouchableOpacity>
                        </View>

                        {stripeConnected ? (
                            <View style={[styles.statChip, { backgroundColor: colors.successSoft }]}>
                                <CheckCircle2 size={16} color={colors.success} />
                                <Text style={[styles.statText, { color: colors.success }]}>Stripe Connected</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={handleStripeConnect}
                                disabled={stripeConnectLoading}
                                style={[styles.statChip, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                            >
                                <Plus size={16} color={colors.primary} />
                                <Text style={[styles.statText, { color: colors.primary }]}>
                                    {stripeConnectLoading ? 'Connecting...' : 'Connect Stripe for Payouts'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>

                <View style={styles.quickActions}>
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.quickActionCell}>
                        <TouchableOpacity activeOpacity={0.85} style={[styles.quickActionCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]} onPress={handleTopUp}>
                            <Plus size={24} color={colors.primary} />
                            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Add Funds</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.quickActionCell}>
                        <TouchableOpacity activeOpacity={0.85} style={[styles.quickActionCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]} onPress={() => Alert.alert('Coming Soon', 'Analytics coming soon!')}>
                            <History size={24} color={colors.secondary} />
                            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Analytics</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                <View style={styles.transactionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
                        <TouchableOpacity onPress={handleRefresh}>
                            <Text style={[styles.seeAll, { color: colors.primary }]}>Refresh</Text>
                        </TouchableOpacity>
                    </View>

                    {loading && transactions.length === 0 ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={colors.primary} size="large" />
                        </View>
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions yet</Text>
                        </View>
                    ) : (
                        transactions.map((transaction, index) => {
                            const isCredit = transaction.type === 'credit';
                            return (
                                <Animated.View key={transaction.id} entering={FadeInDown.delay(400 + index * 50).springify()}>
                                    <View style={[styles.transactionCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                                        <View
                                            style={[
                                                styles.transactionIcon,
                                                {
                                                    backgroundColor: isCredit ? colors.successSoft : colors.dangerSoft,
                                                    borderColor: isCredit ? colors.successSoft : colors.dangerSoft,
                                                },
                                            ]}
                                        >
                                            {isCredit ? (
                                                <ArrowDownLeft size={20} color={colors.success} />
                                            ) : (
                                                <ArrowUpRight size={20} color={colors.danger} />
                                            )}
                                        </View>
                                        <View style={styles.transactionMain}>
                                            <Text style={[styles.transactionTitle, { color: colors.text }]}>{transaction.title}</Text>
                                            <Text style={[styles.transactionDate, { color: colors.textMuted }]}>{transaction.date}</Text>
                                        </View>
                                        <Text style={[styles.transactionAmount, { color: isCredit ? colors.success : colors.text }]}>
                                            {isCredit ? '+' : '-'}₹{transaction.amount}
                                        </Text>
                                    </View>
                                </Animated.View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 8,
    },
    balanceCard: {
        padding: 30,
        borderWidth: 1.5,
        borderRadius: 24,
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    walletIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    balanceLabel: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    currency: {
        fontSize: 28,
        fontWeight: '900',
        marginRight: 4,
    },
    balanceValue: {
        fontSize: 54,
        fontWeight: '900',
        letterSpacing: -2,
    },
    pendingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    pendingLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    pendingValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#f59e0b',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    topUpButton: {
        flex: 1.5,
        minHeight: 54,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topUpText: {
        fontWeight: '900',
        fontSize: 15,
        letterSpacing: 1,
    },
    withdrawButton: {
        flex: 1,
        minHeight: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    withdrawText: {
        fontWeight: '700',
        fontSize: 14,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 24,
    },
    quickActionCell: {
        flex: 1,
    },
    quickActionCard: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
    },
    quickActionLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 10,
    },
    transactionsSection: {
        marginTop: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '700',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    },
    transactionCard: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderRadius: 20,
    },
    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    transactionMain: {
        flex: 1,
        marginLeft: 16,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        fontWeight: '600',
    },
    transactionAmount: {
        fontSize: 17,
        fontWeight: '900',
    },
});

export default WalletScreen;
