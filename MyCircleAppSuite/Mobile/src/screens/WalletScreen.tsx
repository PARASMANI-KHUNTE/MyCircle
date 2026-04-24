import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, CreditCard, History, Plus, TrendingUp, Wallet } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import AppScreen from '../components/layout/AppScreen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const WalletScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const balance = user?.walletBalance || 5240;
    const transactions = [
        { id: '1', type: 'debit', title: 'Post Access: Web Developer Needed', date: 'Oct 12, 2023', amount: 499 },
        { id: '2', type: 'credit', title: 'Wallet Top-up', date: 'Oct 10, 2023', amount: 2000 },
        { id: '3', type: 'debit', title: 'Post Access: Graphic Design', date: 'Oct 05, 2023', amount: 299 },
        { id: '4', type: 'credit', title: 'Service Payment Received', date: 'Oct 01, 2023', amount: 1500 },
    ];

    return (
        <AppScreen>
            <ScreenHeader
                title="My Wallet"
                onBack={() => navigation.goBack()}
                right={<CreditCard size={22} color={colors.text} />}
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

                        <View style={styles.cardActions}>
                            <TouchableOpacity activeOpacity={0.85} style={[styles.topUpButton, { backgroundColor: colors.primary }]}>
                                <Plus size={20} color={colors.white} style={{ marginRight: 8 }} />
                                <Text style={[styles.topUpText, { color: colors.white }]}>TOP UP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.85} style={[styles.withdrawButton, { backgroundColor: colors.backdrop, borderColor: colors.borderSoft }]}>
                                <Text style={[styles.withdrawText, { color: colors.text }]}>WITHDRAW</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.statChip, { backgroundColor: colors.successSoft }]}>
                            <TrendingUp size={16} color={colors.success} />
                            <Text style={[styles.statText, { color: colors.success }]}>+12.4% this month</Text>
                        </View>
                    </View>
                </Animated.View>

                <View style={styles.quickActions}>
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.quickActionCell}>
                        <TouchableOpacity activeOpacity={0.85} style={[styles.quickActionCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                            <Plus size={24} color={colors.primary} />
                            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Add Funds</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.quickActionCell}>
                        <TouchableOpacity activeOpacity={0.85} style={[styles.quickActionCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                            <History size={24} color={colors.secondary} />
                            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Analytics</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                <View style={styles.transactionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
                        <TouchableOpacity>
                            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {transactions.map((transaction, index) => {
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
                    })}
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
        marginBottom: 32,
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
