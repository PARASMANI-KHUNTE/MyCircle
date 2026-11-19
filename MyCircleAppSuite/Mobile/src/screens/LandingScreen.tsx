import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowRight, ShieldCheck, ShoppingBag, Sparkles, Zap } from 'lucide-react-native';

import AppScreen from '../components/layout/AppScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Alert } from '../utils/alert';

const LandingScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { login, isLoading: authLoading } = useAuth();
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            offlineAccess: false,
        });
    }, []);

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            await GoogleSignin.hasPlayServices();
            try {
                await GoogleSignin.signOut();
            } catch { }
            const googleResponse = await GoogleSignin.signIn();
            const idToken = 'data' in googleResponse ? googleResponse.data?.idToken : (googleResponse as any)?.idToken;

            if (!idToken) {
                Alert.alert('Sign In Error', 'Could not obtain Google authentication credentials. Please try again.');
                return;
            }

            const apiResponse = await api.post('/auth/google-mobile', { idToken });

            if (apiResponse.data?.token) {
                await login(apiResponse.data.token);
            } else {
                Alert.alert('Login Failed', apiResponse.data?.msg || 'Could not verify your account.');
            }
        } catch (error: any) {
            if (error?.code !== statusCodes.SIGN_IN_CANCELLED) {
                console.error('Google Sign-In Error:', error);
                Alert.alert('Sign In Error', error);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    if (authLoading) {
        return (
            <AppScreen withBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </AppScreen>
        );
    }

    return (
        <AppScreen withBackground edges={['top', 'bottom']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Hero Header */}
                <Animated.View entering={FadeInDown.delay(100).duration(700).springify()} style={styles.heroSection}>
                    <View style={[styles.logoWrapper, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={[styles.tagPill, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <Sparkles size={13} color={colors.primary} style={styles.tagIcon} />
                        <Text style={[styles.tagText, { color: colors.textSecondary }]}>Hyperlocal Community & Trade</Text>
                    </View>

                    <Text style={[styles.brandTitle, { color: colors.text }]}>
                        MyCircle<Text style={{ color: colors.primary }}>.</Text>
                    </Text>

                    <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                        Connect with neighbors, trade & barter goods, discover local services, and grow trusted connections.
                    </Text>
                </Animated.View>

                {/* Features Highlights */}
                <Animated.View entering={FadeInDown.delay(250).duration(800).springify()} style={styles.featuresContainer}>
                    <View style={[styles.featureCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <View style={[styles.featureIconContainer, { backgroundColor: colors.backdrop }]}>
                            <ShoppingBag size={20} color={colors.primary} />
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>Trade & Barter</Text>
                            <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                                Buy, sell, or exchange items with neighbors easily
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.featureCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <View style={[styles.featureIconContainer, { backgroundColor: colors.backdrop }]}>
                            <Zap size={20} color={colors.accent || colors.primary} />
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>Services & Gigs</Text>
                            <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                                Offer your skills or hire verified talent nearby
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.featureCard, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <View style={[styles.featureIconContainer, { backgroundColor: colors.backdrop }]}>
                            <ShieldCheck size={20} color={colors.success || '#10b981'} />
                        </View>
                        <View style={styles.featureTextContainer}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>Verified & Safe</Text>
                            <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                                Community trust scores and direct local messaging
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Actions / Buttons */}
                <Animated.View entering={FadeInUp.delay(400).duration(800).springify()} style={styles.actionSection}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.88}
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    >
                        <Text style={[styles.primaryButtonText, { color: colors.white }]}>Get Started</Text>
                        <ArrowRight size={20} color={colors.white} style={styles.arrowIcon} />
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.borderSoft }]} />
                        <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with</Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.borderSoft }]} />
                    </View>

                    <TouchableOpacity
                        onPress={handleGoogleLogin}
                        activeOpacity={0.85}
                        style={[
                            styles.googleButton,
                            { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft },
                            googleLoading && styles.disabled,
                        ]}
                        disabled={googleLoading}
                    >
                        {googleLoading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <>
                                <Image
                                    source={{ uri: 'https://lh3.googleusercontent.com/COxitqgJr1sICpeqCu7Lx2rjqD02G6DRtLU-q333L-RyXVw_Z_9_ls6Y9.png' }}
                                    style={styles.googleIcon}
                                    resizeMode="contain"
                                />
                                <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.signInRow}>
                        <Text style={[styles.signInLabel, { color: colors.textSecondary }]}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={[styles.signInLink, { color: colors.primary }]}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        By continuing, you agree to our{' '}
                        <Text style={[styles.footerLink, { color: colors.textSecondary }]}>Terms of Service</Text> and{' '}
                        <Text style={[styles.footerLink, { color: colors.textSecondary }]}>Privacy Policy</Text>
                    </Text>
                </View>
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 32,
        justifyContent: 'space-between',
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    logoWrapper: {
        width: 76,
        height: 76,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoImage: {
        width: 48,
        height: 48,
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
    },
    tagIcon: {
        marginRight: 6,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    brandTitle: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -0.8,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    featuresContainer: {
        gap: 10,
        marginBottom: 24,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
    },
    featureIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    featureSubtitle: {
        fontSize: 13,
        lineHeight: 18,
    },
    actionSection: {
        marginTop: 'auto',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 17,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '700',
    },
    arrowIcon: {
        marginLeft: 8,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 14,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 12,
        paddingHorizontal: 10,
        fontWeight: '500',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 15,
        borderWidth: 1,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.6,
    },
    signInRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    signInLabel: {
        fontSize: 14,
        marginRight: 6,
    },
    signInLink: {
        fontSize: 14,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        marginTop: 18,
    },
    footerText: {
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },
    footerLink: {
        fontWeight: '600',
    },
});

export default LandingScreen;
