import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface PaginationFooterProps {
    loading?: boolean;
    error?: string | null;
    hasMore: boolean;
    onRetry?: () => void;
    endText?: string;
    showEnd?: boolean;
}

/**
 * Shared load-more / end-of-list / retry row for paginated lists.
 */
const PaginationFooter = ({
    loading = false,
    error = null,
    hasMore,
    onRetry,
    endText = "You're all caught up",
    showEnd = true,
}: PaginationFooterProps) => {
    const { colors } = useTheme();

    if (!loading && !error && !hasMore && showEnd) {
        return (
            <View style={styles.container}>
                <Text style={[styles.text, { color: colors.textSecondary }]}>{endText}</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={[styles.text, { color: colors.danger }]}>{error}</Text>
                {onRetry ? (
                    <TouchableOpacity onPress={onRetry} style={[styles.retry, { borderColor: colors.primary }]}>
                        <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.text, { color: colors.textSecondary }]}>Loading more…</Text>
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    text: {
        fontSize: 13,
    },
    retry: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    retryText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default PaginationFooter;
