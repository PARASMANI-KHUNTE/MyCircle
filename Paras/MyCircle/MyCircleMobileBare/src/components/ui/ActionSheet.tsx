import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

export interface ActionItem {
    label: string;
    onPress: () => void;
    isDestructive?: boolean;
    isCancel?: boolean;
    icon?: React.ReactNode;
}

interface ActionSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    actions: ActionItem[];
}

const ActionSheet: React.FC<ActionSheetProps> = ({ visible, onClose, title, description, actions }) => {
    const { colors } = useTheme();

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={onClose}
            animationType="fade"
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.header}>
                                <View style={styles.headerContent}>
                                    {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
                                    {description && <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>}
                                </View>
                                {/* Optional Close Icon if needed, but tap outside is standard */}
                            </View>

                            <View style={styles.actionsContainer}>
                                {actions.map((action, index) => {
                                    if (action.isCancel) return null; // We typically render cancel separately or at bottom

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                onClose();
                                                setTimeout(action.onPress, 100); // Small delay to allow modal to close
                                            }}
                                            style={[
                                                styles.actionButton,
                                                { borderTopColor: colors.border }
                                            ]}
                                        >
                                            {action.icon && <View style={styles.iconContainer}>{action.icon}</View>}
                                            <Text style={[
                                                styles.actionLabel,
                                                { color: action.isDestructive ? '#ef4444' : colors.text }
                                            ]}>
                                                {action.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                onPress={onClose}
                                style={[styles.cancelButton, { backgroundColor: colors.background, marginTop: 12 }]}
                            >
                                <Text style={[styles.cancelLabel, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <SafeAreaView edges={['bottom']} />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 0,
        borderWidth: 1,
        borderBottomWidth: 0,
    },
    header: {
        marginBottom: 16,
        alignItems: 'center',
    },
    headerContent: {
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    actionsContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    actionButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        width: '100%',
        borderTopWidth: 1,
    },
    iconContainer: {
        marginRight: 12,
    },
    actionLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 8,
    },
    cancelLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ActionSheet;
