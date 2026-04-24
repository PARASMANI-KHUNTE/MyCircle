import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import AppScreen from '../components/layout/AppScreen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const LoginScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const auth = useAuth() as any;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.data.token) {
                await auth.login(res.data.token);
            } else {
                Alert.alert('Login Failed', 'No token received');
            }
        } catch (error: any) {
            Alert.alert('Login Failed', error.response?.data?.msg || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
                        <ScreenHeader title="Sign In" onBack={() => navigation.goBack()} />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} style={styles.hero}>
                        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue your MyCircle workflow.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
                        <View style={[styles.formCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                                <View style={[
                                    styles.inputContainer,
                                    {
                                        backgroundColor: colors.backdrop,
                                        borderColor: focusedInput === 'email' ? colors.primary : colors.borderSoft,
                                    },
                                ]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder="Enter your email"
                                        placeholderTextColor={colors.placeholder}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        onFocus={() => setFocusedInput('email')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                                <View style={[
                                    styles.inputContainer,
                                    {
                                        backgroundColor: colors.backdrop,
                                        borderColor: focusedInput === 'password' ? colors.primary : colors.borderSoft,
                                    },
                                ]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder="Enter your password"
                                        placeholderTextColor={colors.placeholder}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        onFocus={() => setFocusedInput('password')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                    <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(prev => !prev)}>
                                        {showPassword ? (
                                            <EyeOff size={20} color={colors.textSecondary} />
                                        ) : (
                                            <Eye size={20} color={colors.textSecondary} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity activeOpacity={0.9} style={[styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
                                <Text style={[styles.primaryButtonText, { color: colors.white }]}>{loading ? 'Signing In...' : 'Sign In'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).duration(800).springify()} style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
                            <Text style={[styles.linkLabel, { color: colors.textMuted }]}>Don't have an account?</Text>
                            <Text style={[styles.linkValue, { color: colors.primary }]}>Sign Up</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'Password reset functionality will be available soon.')} style={styles.linkOnly}>
                            <Text style={[styles.linkLabel, { color: colors.textMuted }]}>Forgot Password?</Text>
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
    },
    input: {
        fontSize: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        flex: 1,
    },
    passwordToggle: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    primaryButton: {
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
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

export default LoginScreen;
