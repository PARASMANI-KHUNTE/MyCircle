import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppScreen from '../components/layout/AppScreen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { Alert } from '../utils/alert';
import { useTheme } from '../context/ThemeContext';
import { submitSupportRequest } from '../services/supportService';
import { SupportSubjectType, SupportType } from '../utils/supportSubmission';

const TYPES: SupportType[] = ['report', 'help', 'feedback'];
const CATEGORIES = ['spam', 'harassment', 'scam', 'impersonation', 'hate_speech', 'nudity', 'violence', 'other'];

const SupportScreen = ({ navigation, route }: any) => {
    const { colors } = useTheme();
    const params = route.params || {};
    const [type, setType] = useState<SupportType>(params.type || 'help');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('other');
    const [sending, setSending] = useState(false);

    const submit = async () => {
        if (message.trim().length < 3) {
            Alert.alert('Missing details', 'Please provide a little more detail.');
            return;
        }

        setSending(true);
        try {
            await submitSupportRequest({
                type,
                message,
                category,
                subjectType: (params.subjectType || 'other') as SupportSubjectType,
                subjectId: params.subjectId,
                reportedUserId: params.reportedUserId,
            });
            Alert.alert('Submitted', 'Thanks! Our team will review your submission.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error?.userFriendlyMessage || 'Could not submit your request. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <AppScreen>
            <ScreenHeader title={type === 'report' ? 'Report' : type === 'feedback' ? 'Feedback' : 'Help'} onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.typeRow}>
                    {TYPES.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.typeButton,
                                { borderColor: colors.borderSoft, backgroundColor: type === option ? colors.primary : colors.cardSoft },
                            ]}
                            onPress={() => setType(option)}
                        >
                            <Text style={{ color: type === option ? colors.white : colors.text, fontWeight: '600', textTransform: 'capitalize' }}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: colors.text }]}>
                    {type === 'report' ? 'What happened?' : type === 'feedback' ? 'Share your feedback' : 'How can we help?'}
                </Text>
                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={2000}
                    placeholder={type === 'report' ? 'Describe the issue and include any useful details.' : 'Tell us what you need…'}
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, styles.textArea, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft, color: colors.text }]}
                />

                {type === 'report' && (
                    <>
                        <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                        <View style={styles.categoryRow}>
                            {CATEGORIES.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => setCategory(option)}
                                    style={[
                                        styles.categoryChip,
                                        { borderColor: colors.borderSoft, backgroundColor: category === option ? colors.primary : colors.cardSoft },
                                    ]}
                                >
                                    <Text style={{ color: category === option ? colors.white : colors.text, fontSize: 12 }}>
                                        {option.replace('_', ' ')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary, opacity: sending ? 0.6 : 1 }]}
                    onPress={submit}
                    disabled={sending}
                >
                    <Text style={{ color: colors.white, fontWeight: '700' }}>{sending ? 'Submitting…' : 'Submit'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    content: { padding: 16, paddingBottom: 40 },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    typeButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
    label: { fontWeight: '700', marginBottom: 8, textTransform: 'capitalize' },
    input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
    textArea: { minHeight: 140, textAlignVertical: 'top' },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
    submitButton: { marginTop: 24, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
});

export default SupportScreen;
