import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, History, Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, CreditCard } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TransactionItem = ({ type, title, date, amount, index }: any) => {
    const isCredit = type === 'credit';

    return (
        <Animated.View entering={FadeInDown.delay(400 + index * 50).springify()}>
            <View style={styles.transactionCard}>
                <View style={[styles.transactionIcon, { backgroundColor: isCredit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: isCredit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                    {isCredit ? <ArrowDownLeft size={20} color="#10b981" /> : <ArrowUpRight size={20} color="#ef4444" />}
                </View>
                <View style={styles.transactionMain}>
                    <Text style={styles.transactionTitle}>{title}</Text>
                    <Text style={styles.transactionDate}>{date}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: isCredit ? '#10b981' : '#fff' }]}>
                    {isCredit ? '+' : '-'}₹{amount}
                </Text>
            </View>
        </Animated.View>
    );
};

const WalletScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);

    // Mock data
    const balance = user?.walletBalance || 5240;
    const transactions = [
        { id: '1', type: 'debit', title: 'Post Access: Web Developer Needed', date: 'Oct 12, 2023', amount: 499 },
        { id: '2', type: 'credit', title: 'Wallet Top-up', date: 'Oct 10, 2023', amount: 2000 },
        { id: '3', type: 'debit', title: 'Post Access: Graphic Design', date: 'Oct 05, 2023', amount: 299 },
        { id: '4', type: 'credit', title: 'Service Payment Received', date: 'Oct 01, 2023', amount: 1500 },
        { id: '5', type: 'debit', title: 'Wallet Top-up', date: 'Sep 28, 2023', amount: 1000 },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Wallet</Text>
                <TouchableOpacity style={styles.moreBtn}>
                    <CreditCard size={22} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <Animated.View entering={FadeInUp.springify()}>
                    <View style={styles.balanceCard}>
                        <View style={styles.balanceHeader}>
                            <View style={styles.walletIcon}>
                                <Wallet size={20} color="#ffffff" />
                            </View>
                            <Text style={styles.balanceLabel}>Total Balance</Text>
                        </View>

                        <View style={styles.balanceRow}>
                            <Text style={styles.currency}>₹</Text>
                            <Text style={styles.balanceValue}>{balance.toLocaleString()}</Text>
                        </View>

                        <View style={styles.cardActions}>
                            <TouchableOpacity style={styles.topUpBtn}>
                                <Plus size={20} color="#ffffff" style={{ marginRight: 8 }} />
                                <Text style={styles.topUpText}>TOP UP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.withdrawBtn}>
                                <Text style={styles.withdrawText}>WITHDRAW</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <TrendingUp size={16} color="#10b981" />
                                <Text style={styles.statText}>+12.4% this month</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={{ flex: 1 }}>
                        <TouchableOpacity style={styles.actionItem}>
                            <View style={styles.actionInner}>
                                <Plus size={24} color="#af25f4" />
                                <Text style={styles.actionLabel}>Add Funds</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={{ flex: 1 }}>
                        <TouchableOpacity style={styles.actionItem}>
                            <View style={styles.actionInner}>
                                <History size={24} color="#06b6d4" />
                                <Text style={styles.actionLabel}>Analytics</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Transactions Section */}
                <View style={styles.transactionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {transactions.map((tx, index) => (
                        <TransactionItem
                            key={tx.id}
                            type={tx.type}
                            title={tx.title}
                            date={tx.date}
                            amount={tx.amount}
                            index={index}
                        />
                    ))}
                </View>
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    moreBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 8,
    },
    balanceCard: {
        padding: 30,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(175, 37, 244, 0.05)',
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
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
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
        color: 'rgba(255,255,255,0.4)',
        marginRight: 4,
    },
    balanceValue: {
        fontSize: 54,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -2,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    topUpBtn: {
        flex: 1.5,
        height: 54,
        backgroundColor: '#af25f4',
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    topUpText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 15,
        letterSpacing: 1,
    },
    withdrawBtn: {
        flex: 1,
        height: 54,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    withdrawText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    statText: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '700',
        marginLeft: 6,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 24,
    },
    actionItem: {
        flex: 1,
    },
    actionInner: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    actionLabel: {
        fontSize: 13,
        color: '#fff',
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
        color: '#fff',
        letterSpacing: -0.5,
    },
    seeAll: {
        fontSize: 14,
        color: '#af25f4',
        fontWeight: '700',
    },
    transactionCard: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
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
        color: '#fff',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
    },
    transactionAmount: {
        fontSize: 17,
        fontWeight: '900',
    },
});

export default WalletScreen;
