import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Dimensions, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }: any) => {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<'displayName' | 'email' | 'password' | 'confirmPassword' | null>(null);
    const auth = useAuth() as any;

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

    const handleBack = () => {
        navigation.goBack();
    };

    const handleGoogleLogin = () => {
        Alert.alert('Google Sign In', 'Google registration will be available soon.');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Subtle Grid Pattern */}
            <View style={styles.gridPattern}>
                {[...Array(12)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.gridLine,
                            {
                                left: (i % 4) * (width / 4),
                                top: Math.floor(i / 4) * (height / 3),
                                width: 1,
                                height: height / 3,
                            }
                        ]}
                    />
                ))}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(600).springify()}
                        style={styles.headerSection}
                    >
                        <TouchableOpacity
                            onPress={handleBack}
                            style={styles.backButton}
                            activeOpacity={0.8}
                        >
                            <ArrowLeft size={20} color="#ffffff" />
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <Text style={styles.welcomeText}>Join Circle</Text>
                            <Text style={styles.subtitleText}>Create your professional profile</Text>
                        </View>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(800).springify()}
                        style={styles.formSection}
                    >
                        <View style={styles.formCard}>
                            <View style={styles.formContent}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Display Name</Text>
                                    <View style={[
                                        styles.inputContainer,
                                        focusedInput === 'displayName' && styles.inputFocused
                                    ]}>
                                        <User size={20} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Your Name"
                                            placeholderTextColor="#94a3b8"
                                            value={displayName}
                                            onChangeText={setDisplayName}
                                            onFocus={() => setFocusedInput('displayName')}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email Address</Text>
                                    <View style={[
                                        styles.inputContainer,
                                        focusedInput === 'email' && styles.inputFocused
                                    ]}>
                                        <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Enter your email"
                                            placeholderTextColor="#94a3b8"
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
                                    <Text style={styles.inputLabel}>Password</Text>
                                    <View style={[
                                        styles.inputContainer,
                                        focusedInput === 'password' && styles.inputFocused
                                    ]}>
                                        <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Create a password"
                                            placeholderTextColor="#94a3b8"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            onFocus={() => setFocusedInput('password')}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                        <TouchableOpacity
                                            style={styles.passwordToggle}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff size={20} color="#94a3b8" />
                                            ) : (
                                                <Eye size={20} color="#94a3b8" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Confirm Password</Text>
                                    <View style={[
                                        styles.inputContainer,
                                        focusedInput === 'confirmPassword' && styles.inputFocused
                                    ]}>
                                        <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Confirm your password"
                                            placeholderTextColor="#94a3b8"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showConfirmPassword}
                                            onFocus={() => setFocusedInput('confirmPassword')}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                        <TouchableOpacity
                                            style={styles.passwordToggle}
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff size={20} color="#94a3b8" />
                                            ) : (
                                                <Eye size={20} color="#94a3b8" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                                    onPress={handleRegister}
                                    disabled={loading}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.registerButtonText}>
                                        {loading ? 'Creating...' : 'Sign Up'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View
                        entering={FadeInUp.delay(600).duration(800).springify()}
                        style={styles.footerSection}
                    >
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            style={styles.loginLink}
                        >
                            <Text style={styles.loginText}>Already have an account?</Text>
                            <Text style={styles.loginLinkText}>Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleGoogleLogin}
                            style={styles.googleLink}
                        >
                            <Text style={styles.googleLinkText}>Or use Google Sign In</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Landing')}
                            style={styles.backToLandingLink}
                        >
                            <Text style={styles.backToLandingText}>← Back to Landing</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
    },
    gridLine: {
        position: 'absolute',
        backgroundColor: '#af25f4',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    headerSection: {
        marginBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerContent: {
        marginLeft: 16,
        flex: 1,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
        fontFamily: 'System',
        letterSpacing: -0.5,
    },
    subtitleText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 8,
    },
    formSection: {
        marginBottom: 40,
    },
    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    formContent: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        transition: 'all 0.2s ease',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    inputFocused: {
        borderColor: '#af25f4',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        fontSize: 16,
        color: '#ffffff',
        flex: 1,
    },
    passwordToggle: {
        position: 'absolute',
        right: 12,
    },
    registerButton: {
        backgroundColor: '#af25f4',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginTop: 16,
    },
    registerButtonDisabled: {
        opacity: 0.6,
    },
    registerButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    footerSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    loginLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    loginText: {
        fontSize: 14,
        color: '#64748b',
        marginRight: 6,
    },
    loginLinkText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#af25f4',
    },
    googleLink: {
        marginBottom: 16,
    },
    googleLinkText: {
        fontSize: 14,
        color: '#64748b',
        textDecorationLine: 'underline',
    },
    divider: {
        width: 40,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 8,
    },
    backToLandingLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
    },
    backToLandingText: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
});

export default RegisterScreen;
