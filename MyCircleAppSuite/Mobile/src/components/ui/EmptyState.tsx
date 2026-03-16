import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LucideIcon, Ghost } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import GlassView from './GlassView';
import { Palette } from '../../constants/design';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    onAction?: () => void;
    actionLabel?: string;
    style?: ViewStyle;
}

const EmptyState = ({
    title,
    description,
    icon: Icon = Ghost,
    onAction,
    actionLabel,
    style
}: EmptyStateProps) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, style]}>
            <GlassView intensity={10} style={styles.iconCircle} borderRadius={40}>
                <Icon size={40} color={colors.primary} />
            </GlassView>

            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

            {onAction && actionLabel && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={onAction}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    iconCircle: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        backgroundColor: Palette.violet[500] + '15', // 15% opacity tint
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
        lineHeight: 20,
        maxWidth: 250,
        marginBottom: 24,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: Palette.violet[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});

export default EmptyState;
