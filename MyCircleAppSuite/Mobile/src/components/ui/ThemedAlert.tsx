import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    isDestructive = false,
}: ThemedAlertProps) => {
    const { colors, shadow } = useTheme();

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
            <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onCancel}>
                <Pressable
                    style={[styles.alertContainer, shadow.md, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}
                    onPress={(event) => event.stopPropagation()}
                >
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                            <Text style={[styles.cancelText, { color: colors.text }]}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onConfirm}
                            style={[styles.confirmButton, { backgroundColor: isDestructive ? colors.danger : colors.primary }]}
                        >
                            <Text style={[styles.confirmText, { color: colors.white }]}>{confirmText}</Text>
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
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
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
        fontWeight: '700',
        fontSize: 16,
    },
    cancelText: {
        fontWeight: '600',
        fontSize: 16,
    },
});

export default ThemedAlert;
