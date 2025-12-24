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
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const LandingScreen = ({ navigation }: any) => {
    const { login, isLoading: authLoading } = useAuth();

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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* 3D Background Animations */}
            <View style={StyleSheet.absoluteFill}>
                <FloatingShape size={300} color="#8b5cf6" top={-50} left={-50} delay={0} />
                <FloatingShape size={250} color="#3b82f6" top={height * 0.4} left={width * 0.6} delay={1000} />
                <FloatingShape size={200} color="#ec4899" top={height * 0.7} left={-50} delay={2000} />
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.brandName}>MyCircle</Text>

                    <View style={styles.introContainer}>
                        <Text style={styles.headline}>
                            Connect, Exchange,{' '}
                            <Text style={styles.highlight}>Thrive Locally.</Text>
                        </Text>
                        <Text style={styles.description}>
                            The modern way to find tasks, offer services, and trade items in your neighborhood. Secure, fast, and beautiful.
                        </Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={handleGoogleLogin}
                        style={styles.googleButton}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                            style={styles.googleIcon}
                        />
                        <Text style={styles.googleButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>

                    <Text style={styles.terms}>
                        By continuing, you agree to our{' '}
                        <Text style={{ color: '#fff' }}>Terms of Service</Text> and{' '}
                        <Text style={{ color: '#fff' }}>Privacy Policy</Text>
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingShape: {
        position: 'absolute',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'flex-start',
    },
    logoWrapper: {
        width: 100,
        height: 100,
        marginBottom: 10,
        overflow: 'hidden',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    brandName: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 30,
        letterSpacing: 0.5,
    },
    introContainer: {
        maxWidth: '100%',
    },
    headline: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '800',
        lineHeight: 56,
        letterSpacing: -1,
    },
    highlight: {
        color: '#8b5cf6',
    },
    description: {
        color: '#a1a1aa',
        fontSize: 18,
        marginTop: 20,
        lineHeight: 28,
        fontWeight: '500',
    },
    actions: {
        width: '100%',
    },
    googleButton: {
        backgroundColor: '#fff',
        width: '100%',
        flexDirection: 'row',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    googleButtonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 18,
    },
    terms: {
        color: '#71717a',
        marginTop: 30,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default LandingScreen;
