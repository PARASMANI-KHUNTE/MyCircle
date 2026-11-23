import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Star, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface RateRequestModalProps {
    visible: boolean;
    request: any | null;
    onClose: () => void;
    onSubmit: (requestId: string, score: number, review: string) => Promise<void>;
}

const SCORES = [1, 2, 3, 4, 5];

const RateRequestModal: React.FC<RateRequestModalProps> = ({
    visible,
    request,
    onClose,
    onSubmit,
}) => {
    const { colors } = useTheme();
    const [score, setScore] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setScore(0);
        setReview('');
        setSubmitting(false);
    }, [visible, request?._id]);

    const handleSubmit = async () => {
        if (!request?._id || !score || submitting) return;

        setSubmitting(true);
        try {
            await onSubmit(request._id, score, review.trim());
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const counterpartyName = request?.counterparty?.displayName
        || request?.recipient?.displayName
        || request?.requester?.displayName
        || 'your counterparty';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={(event) => event.stopPropagation()}
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Rate your experience</Text>
                        <TouchableOpacity onPress={onClose} accessibilityLabel="Close rating dialog">
                            <X size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        How was working with {counterpartyName}?
                    </Text>

                    <View style={styles.stars}>
                        {SCORES.map((value) => (
                            <TouchableOpacity
                                key={value}
                                onPress={() => setScore(value)}
                                accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}
                                style={styles.starButton}
                            >
                                <Star
                                    size={34}
                                    color={value <= score ? '#facc15' : colors.textSecondary}
                                    fill={value <= score ? '#facc15' : 'none'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        value={review}
                        onChangeText={setReview}
                        placeholder="Add an optional review"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.reviewInput, { color: colors.text, borderColor: colors.border }]}
                        multiline
                        maxLength={300}
                    />

                    <TouchableOpacity
                        onPress={() => { void handleSubmit(); }}
                        disabled={!score || submitting}
                        style={[styles.submitButton, { backgroundColor: colors.primary, opacity: !score || submitting ? 0.5 : 1 }]}
                    >
                        <Text style={styles.submitText}>
                            {submitting ? 'Submitting...' : 'Submit rating'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 18,
        borderWidth: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    stars: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    starButton: {
        padding: 4,
    },
    reviewInput: {
        minHeight: 80,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    submitButton: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitText: {
        color: '#ffffff',
        fontWeight: '800',
    },
    cancelButton: {
        marginTop: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontWeight: '600',
    },
});

export default RateRequestModal;
