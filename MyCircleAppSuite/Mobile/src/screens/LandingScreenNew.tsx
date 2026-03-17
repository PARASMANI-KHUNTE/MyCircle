import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight, Sparkles, Users, Zap } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }: any) => {
    const { login, isLoading: authLoading } = useAuth();
    const scrollY = useSharedValue(0);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            offlineAccess: false,
        });
    }, []);

    const handleGoogleLogin = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            try {
                await GoogleSignin.signOut();
            } catch (error) { }
            const googleResponse = await GoogleSignin.signIn();
            const idToken = 'data' in googleResponse ? googleResponse.data?.idToken : null;

            if (!idToken) {
                Alert.alert("Error", "No ID token received from Google.");
                return;
            }

            const apiResponse = await api.post('/auth/google-mobile', { idToken });

            if (apiResponse.data.token) {
                await login(apiResponse.data.token);
            } else {
                Alert.alert("Login Failed", apiResponse.data.msg || "Could not verify account.");
            }
        } catch (error: any) {
            if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
                console.error('Google Sign-In Error:', JSON.stringify(error, null, 2));
                Alert.alert("Error", `Something went wrong: ${error.message || error.code || 'Unknown error'}`);
            }
        }
    };

    if (authLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-background-dark">
                <ActivityIndicator size="large" color="#af25f4" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Subtle Grid Pattern */}
            <View style={styles.gridPattern}>
                {[...Array(20)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.gridLine,
                            {
                                left: (i % 5) * (width / 5),
                                top: Math.floor(i / 5) * (height / 4),
                                width: 1,
                                height: height / 4,
                            }
                        ]}
                    />
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScroll={(event) => {
                    scrollY.value = event.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(800).springify()}
                        style={styles.logoContainer}
                    >
                        <View style={styles.logoGlow}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={require('../assets/logo.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                        
                        {/* Floating Icons */}
                        <Animated.View
                            entering={FadeInDown.delay(600).duration(600).springify()}
                            style={[styles.floatingIcon, { top: -20, right: -30 }]}
                        >
                            <Sparkles size={24} color="#af25f4" />
                        </Animated.View>
                        
                        <Animated.View
                            entering={FadeInDown.delay(800).duration(600).springify()}
                            style={[styles.floatingIcon, { top: 20, right: -50 }]}
                        >
                            <Zap size={20} color="#00f5ff" />
                        </Animated.View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInUp.delay(400).duration(800).springify()}
                        style={styles.titleContainer}
                    >
                        <Text style={styles.mainTitle}>
                            MyCircle<Text style={styles.titleDot}>.</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            Where high-performance communities thrive
                        </Text>
                    </Animated.View>
                </View>

                {/* Features Section */}
                <Animated.View
                    entering={FadeInUp.delay(600).duration(800).springify()}
                    style={styles.featuresSection}
                >
                    <View style={styles.featureCard}>
                        <Users size={32} color="#af25f4" style={styles.featureIcon} />
                        <Text style={styles.featureTitle}>Connect</Text>
                        <Text style={styles.featureDescription}>
                            Join exclusive communities of like-minded professionals
                        </Text>
                    </View>

                    <View style={styles.featureCard}>
                        <Sparkles size={32} color="#00f5ff" style={styles.featureIcon} />
                        <Text style={styles.featureTitle}>Create</Text>
                        <Text style={styles.featureDescription}>
                            Share your ideas and build your personal brand
                        </Text>
                    </View>

                    <View style={styles.featureCard}>
                        <Zap size={32} color="#af25f4" style={styles.featureIcon} />
                        <Text style={styles.featureTitle}>Thrive</Text>
                        <Text style={styles.featureDescription}>
                            Grow your network and unlock new opportunities
                        </Text>
                    </View>
                </Animated.View>

                {/* Action Section */}
                <Animated.View
                    entering={FadeInUp.delay(800).duration(800).springify()}
                    style={styles.actionSection}
                >
                    {/* Primary Action */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.9}
                        style={styles.primaryButton}
                    >
                        <View style={[styles.buttonGradient, styles.primaryButtonFill]}>
                            <Text style={styles.primaryButtonText}>Get Started</Text>
                            <ArrowRight size={20} color="#fff" style={styles.buttonIcon} />
                        </View>
                    </TouchableOpacity>

                    {/* Secondary Action */}
                    <TouchableOpacity
                        onPress={handleGoogleLogin}
                        activeOpacity={0.8}
                        style={styles.secondaryButton}
                    >
                        <View style={styles.googleIconContainer}>
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/COxitqgJr1sICpeqCu7Lx2rjqD02G6DRtLU-q333L-RyXVw_Z_9_ls6Y9.png' }}
                                style={styles.googleIcon}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.secondaryButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.loginLinkContainer}>
                        <Text style={styles.loginText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLink}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By continuing, you agree to our{'\n'}
                        <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
                        <Text style={styles.footerLink}>Privacy Policy</Text>
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    gradientLayer: {
        ...StyleSheet.absoluteFillObject,
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
        paddingTop: 60,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoContainer: {
        position: 'relative',
        marginBottom: 32,
    },
    logoGlow: {
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#af25f4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(175, 37, 244, 0.3)',
    },
    logoImage: {
        width: 50,
        height: 50,
    },
    floatingIcon: {
        position: 'absolute',
        backgroundColor: 'rgba(10, 10, 11, 0.8)',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    titleContainer: {
        alignItems: 'center',
    },
    mainTitle: {
        fontSize: 42,
        fontWeight: '800',
        color: '#ffffff',
        fontFamily: 'System',
        letterSpacing: -1,
        textAlign: 'center',
    },
    titleDot: {
        color: '#af25f4',
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
        maxWidth: 280,
    },
    featuresSection: {
        marginBottom: 60,
    },
    featureCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    featureIcon: {
        marginBottom: 16,
    },
    featureTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    featureDescription: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    actionSection: {
        marginBottom: 40,
    },
    primaryButton: {
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    primaryButtonFill: {
        backgroundColor: '#af25f4',
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginRight: 8,
    },
    buttonIcon: {
        marginLeft: 8,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    googleIconContainer: {
        width: 24,
        height: 24,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIcon: {
        width: 20,
        height: 20,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    loginText: {
        fontSize: 14,
        color: '#64748b',
        marginRight: 6,
    },
    loginLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#af25f4',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: '#af25f4',
        textDecorationLine: 'underline',
    },
});

export default LandingScreen;
