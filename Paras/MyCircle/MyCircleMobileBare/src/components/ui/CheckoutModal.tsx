import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { ShoppingBag, X, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react-native';
import GlassView from './GlassView';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CheckoutModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    postTitle: string;
    price: string | number;
    loading?: boolean;
    balance: number;
}

const CheckoutModal = ({ visible, onClose, onConfirm, postTitle, price, loading, balance }: CheckoutModalProps) => {
    const isInsufficient = balance < Number(price);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View
                    entering={ZoomIn.springify().damping(15)}
                    style={styles.container}
                >
                    <GlassView intensity={40} borderRadius={32} style={styles.modalContent}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <ShoppingBag size={24} color="#af25f4" />
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={20} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.title}>Confirm Purchase</Text>
                        <Text style={styles.subtitle}>You are about to purchase access to contact the owner of this post.</Text>

                        <GlassView intensity={10} style={styles.detailsCard}>
                            <Text style={styles.postTitle} numberOfLines={1}>{postTitle}</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Amount to Pay</Text>
                                <Text style={styles.priceValue}>₹{price}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.balanceRow}>
                                <View style={styles.balanceInfo}>
                                    <Wallet size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: 6 }} />
                                    <Text style={styles.balanceLabel}>Current Balance</Text>
                                </View>
                                <Text style={[styles.balanceValue, isInsufficient && { color: '#ef4444' }]}>
                                    ₹{balance}
                                </Text>
                            </View>
                        </GlassView>

                        <View style={styles.safetyNotice}>
                            <ShieldCheck size={16} color="#10b981" />
                            <Text style={styles.safetyText}>Secure transaction powered by MyCircle Pay</Text>
                        </View>

                        {isInsufficient ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>Insufficient balance. Please top up your wallet.</Text>
                                <TouchableOpacity
                                    style={styles.topUpBtn}
                                    onPress={() => {
                                        onClose();
                                        // Navigation logic will be handled by parent
                                    }}
                                >
                                    <Text style={styles.topUpText}>GO TO WALLET</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.confirmBtn, loading && styles.btnDisabled]}
                                onPress={onConfirm}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Text style={styles.confirmText}>CONFIRM PAYMENT</Text>
                                        <CheckCircle2 size={18} color="#fff" style={{ marginLeft: 8 }} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </GlassView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: SCREEN_WIDTH * 0.88,
        maxWidth: 400,
    },
    modalContent: {
        padding: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: 'rgba(175, 37, 244, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(175, 37, 244, 0.2)',
    },
    closeBtn: {
        padding: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 20,
        marginBottom: 24,
    },
    detailsCard: {
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    postTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 14,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '600',
    },
    balanceValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981',
    },
    safetyNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 8,
    },
    safetyText: {
        fontSize: 11,
        color: '#10b981',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    confirmBtn: {
        height: 56,
        backgroundColor: '#af25f4',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    confirmText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    },
    errorContainer: {
        alignItems: 'center',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    topUpBtn: {
        height: 50,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    topUpText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    cancelBtn: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 10,
    },
    cancelText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default CheckoutModal;
