import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions, StyleSheet, StatusBar } from 'react-native';
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
    FadeInDown
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import GlassView from '../components/ui/GlassView';

const { width, height } = Dimensions.get('window');

const FloatingShape = ({ delay = 0, size = 200, color = '#8b5cf6', top = 0, left = 0 }: any) => {
    const translationY = useSharedValue(0);
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translationY.value = withDelay(delay, withRepeat(withTiming(20, { duration: 3000 }), -1, true));
        rotation.value = withDelay(delay, withRepeat(withTiming(360, { duration: 10000 }), -1, false));
        scale.value = withDelay(delay, withRepeat(withTiming(1.2, { duration: 5000 }), -1, true));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translationY.value },
            { rotate: `${rotation.value}deg` },
            { scale: scale.value }
        ],
        opacity: 0.15,
    }));

    return (
        <Animated.View
            style={[
                styles.floatingShape,
                {
                    width: size,
                    height: size,
                    backgroundColor: color,
                    top,
                    left,
                    borderRadius: size / 2.5
                },
                animatedStyle
            ]}
        />
    );
};

const LandingScreen = () => {
    const { login, isLoading: authLoading } = useAuth();
    const { colors } = useTheme();

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            offlineAccess: false,
        });
    }, []);

    const handleGoogleLogin = async () => {
        // ... same logic ...
        try {
            await GoogleSignin.hasPlayServices();
            try {
                await GoogleSignin.signOut();
            } catch (error) { }
            const googleResponse = await GoogleSignin.signIn();
            const idToken = googleResponse.data?.idToken;

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
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Background Decorations */}
            <View style={StyleSheet.absoluteFill}>
                <FloatingShape size={350} color={colors.primary} top={-100} left={-100} delay={0} />
                <FloatingShape size={300} color={colors.accent} top={height * 0.5} left={width * 0.7} delay={1500} />
                <FloatingShape size={200} color={colors.primary} top={height * 0.8} left={-50} delay={3000} />
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        style={styles.logoWrapper}
                    >
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>
                    <Animated.Text
                        entering={FadeInDown.delay(400).springify()}
                        style={[styles.brandName, { color: colors.text }]}
                    >
                        My<Text style={{ color: colors.accent }}>Circle</Text>
                    </Animated.Text>

                    <View style={styles.introContainer}>
                        <Animated.Text
                            entering={FadeInDown.delay(600).springify()}
                            style={[styles.headline, { color: colors.text }]}
                        >
                            Connect, Exchange,{'\n'}
                            <Text style={{ color: colors.primary }}>Thrive Locally.</Text>
                        </Animated.Text>
                        <Animated.Text
                            entering={FadeInDown.delay(800).springify()}
                            style={[styles.description, { color: colors.textSecondary }]}
                        >
                            The modern way to find tasks, offer services, and trade items in your neighborhood. Secure, fast, and beautiful.
                        </Animated.Text>
                    </View>
                </View>

                <Animated.View
                    entering={FadeInDown.delay(1000).springify()}
                    style={styles.actions}
                >
                    <TouchableOpacity
                        onPress={handleGoogleLogin}
                        activeOpacity={0.8}
                    >
                        <GlassView intensity={20} borderRadius={24} style={styles.glassButton}>
                            <Image
                                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                                style={styles.googleIcon}
                            />
                            <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
                        </GlassView>
                    </TouchableOpacity>

                    <Text style={[styles.terms, { color: colors.textSecondary }]}>
                        By continuing, you agree to our{' '}
                        <Text style={{ color: colors.primary }}>Terms</Text> and{' '}
                        <Text style={{ color: colors.primary }}>Privacy</Text>
                    </Text>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingShape: {
        position: 'absolute',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'flex-start',
    },
    logoWrapper: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    brandName: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 40,
        letterSpacing: -0.5,
    },
    introContainer: {
        maxWidth: '100%',
    },
    headline: {
        fontSize: 52,
        fontWeight: '800',
        lineHeight: 60,
        letterSpacing: -1.5,
    },
    description: {
        fontSize: 18,
        marginTop: 24,
        lineHeight: 28,
        fontWeight: '500',
    },
    actions: {
        width: '100%',
    },
    glassButton: {
        width: '100%',
        flexDirection: 'row',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    googleButtonText: {
        fontWeight: '700',
        fontSize: 18,
    },
    terms: {
        marginTop: 30,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default LandingScreen;
