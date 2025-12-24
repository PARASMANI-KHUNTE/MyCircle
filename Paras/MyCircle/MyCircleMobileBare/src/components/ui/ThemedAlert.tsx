import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ThemedAlertProps {
    visible: boolean;
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

const ThemedAlert = ({
    visible,
    title,
    message,
    onCancel,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false
}: ThemedAlertProps) => {
    const { colors } = useTheme();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <Pressable style={styles.overlay} onPress={onCancel}>
                <Pressable style={[styles.alertContainer, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={styles.cancelButton}
                        >
                            <Text style={[styles.cancelText, { color: colors.text }]}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onConfirm}
                            style={[
                                styles.confirmButton,
                                { backgroundColor: isDestructive ? colors.danger : colors.primary }
                            ]}
                        >
                            <Text style={styles.confirmText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertContainer: {
        width: '100%',
        maxWidth: 340,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 32,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    confirmButton: {
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    confirmText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelText: {
        fontWeight: '600',
        fontSize: 16,
    }
});

export default ThemedAlert;
