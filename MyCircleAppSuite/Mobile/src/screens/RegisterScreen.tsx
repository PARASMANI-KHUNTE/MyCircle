import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import AppScreen from '../components/layout/AppScreen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const RegisterScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const auth = useAuth() as any;
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<'displayName' | 'email' | 'password' | 'confirmPassword' | null>(null);

    const handleRegister = async () => {
        if (!displayName || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/register', { displayName, email, password });
            if (res.data.token) {
                await auth.login(res.data.token);
            } else {
                Alert.alert('Registration Failed', 'No token received');
            }
        } catch (error: any) {
            Alert.alert('Registration Failed', error.response?.data?.msg || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const renderInput = ({
        field,
        label,
        value,
        onChangeText,
        placeholder,
        icon,
        secureTextEntry,
        showToggle,
        onToggle,
        keyboardType,
        autoCapitalize,
    }: {
        field: 'displayName' | 'email' | 'password' | 'confirmPassword';
        label: string;
        value: string;
        onChangeText: (value: string) => void;
        placeholder: string;
        icon: React.ReactNode;
        secureTextEntry?: boolean;
        showToggle?: boolean;
        onToggle?: () => void;
        keyboardType?: 'default' | 'email-address';
        autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    }) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.backdrop,
                        borderColor: focusedInput === field ? colors.primary : colors.borderSoft,
                    },
                ]}
            >
                {icon}
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setFocusedInput(field)}
                    onBlur={() => setFocusedInput(null)}
                />
                {showToggle ? (
                    <TouchableOpacity style={styles.passwordToggle} onPress={onToggle}>
                        {secureTextEntry ? (
                            <Eye size={20} color={colors.textSecondary} />
                        ) : (
                            <EyeOff size={20} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );

    return (
        <AppScreen>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
                        <ScreenHeader title="Create Account" onBack={() => navigation.goBack()} />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} style={styles.hero}>
                        <Text style={[styles.title, { color: colors.text }]}>Join MyCircle</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create your profile and start connecting locally.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
                        <View style={[styles.formCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                            {renderInput({
                                field: 'displayName',
                                label: 'Display Name',
                                value: displayName,
                                onChangeText: setDisplayName,
                                placeholder: 'Your name',
                                icon: <User size={20} color={colors.textSecondary} style={styles.inputIcon} />,
                                autoCapitalize: 'words',
                            })}
                            {renderInput({
                                field: 'email',
                                label: 'Email Address',
                                value: email,
                                onChangeText: setEmail,
                                placeholder: 'Enter your email',
                                icon: <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />,
                                keyboardType: 'email-address',
                                autoCapitalize: 'none',
                            })}
                            {renderInput({
                                field: 'password',
                                label: 'Password',
                                value: password,
                                onChangeText: setPassword,
                                placeholder: 'Create a password',
                                icon: <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />,
                                secureTextEntry: !showPassword,
                                showToggle: true,
                                onToggle: () => setShowPassword(prev => !prev),
                            })}
                            {renderInput({
                                field: 'confirmPassword',
                                label: 'Confirm Password',
                                value: confirmPassword,
                                onChangeText: setConfirmPassword,
                                placeholder: 'Confirm your password',
                                icon: <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />,
                                secureTextEntry: !showConfirmPassword,
                                showToggle: true,
                                onToggle: () => setShowConfirmPassword(prev => !prev),
                            })}

                            <TouchableOpacity activeOpacity={0.9} style={[styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
                                <Text style={[styles.primaryButtonText, { color: colors.white }]}>{loading ? 'Creating...' : 'Sign Up'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).duration(800).springify()} style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
                            <Text style={[styles.linkLabel, { color: colors.textMuted }]}>Already have an account?</Text>
                            <Text style={[styles.linkValue, { color: colors.primary }]}>Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => Alert.alert('Google Sign In', 'Google registration will be available soon.')} style={styles.linkOnly}>
                            <Text style={[styles.linkLabel, { color: colors.textMuted }]}>Or use Google Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Landing')} style={styles.linkOnly}>
                            <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back to Landing</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    hero: {
        marginTop: 12,
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 8,
        lineHeight: 24,
    },
    formCard: {
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        position: 'relative',
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        fontSize: 16,
        flex: 1,
    },
    passwordToggle: {
        position: 'absolute',
        right: 12,
    },
    primaryButton: {
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 16,
    },
    disabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 20,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    linkLabel: {
        fontSize: 14,
        marginRight: 6,
    },
    linkValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    linkOnly: {
        marginBottom: 16,
    },
    backText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default RegisterScreen;
