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

const FloatingShape = ({ delay = 0, size = 300, color = '#af25f4', top = 0, left = 0, opacity = 0.4 }: any) => {
    const translationY = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translationY.value = withDelay(delay, withRepeat(withTiming(30, { duration: 5000 }), -1, true));
        scale.value = withDelay(delay, withRepeat(withTiming(1.3, { duration: 7000 }), -1, true));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translationY.value },
            { scale: scale.value }
        ],
        opacity: opacity,
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
                    borderRadius: size / 2,
                    // @ts-ignore
                    filter: 'blur(80px)', // Neon glow effect
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
            <View className="flex-1 items-center justify-center bg-background-dark">
                <ActivityIndicator size="large" color="#af25f4" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <StatusBar barStyle="light-content" />

            {/* Background Decorations (Neon Glows) */}
            <View style={StyleSheet.absoluteFill}>
                <FloatingShape size={400} color="#af25f4" top={-100} left={-100} delay={0} opacity={0.6} />
                <FloatingShape size={400} color="#00f5ff" top={height * 0.4} left={width * 0.5} delay={2000} opacity={0.4} />
                <FloatingShape size={500} color="#af25f4" top={height * 0.7} left={-100} delay={4000} opacity={0.3} />
            </View>

            <View className="flex-1 px-8 pt-20 pb-10 relative z-10 justify-between">
                {/* Brand Hero Section */}
                <View className="items-center mt-10">
                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        className="relative"
                    >
                        {/* Logo Backdrop Glow */}
                        <View className="absolute inset-0 bg-primary/30 blur-3xl scale-125" />
                        <View className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                            <Image
                                source={require('../assets/logo.png')}
                                className="w-16 h-16"
                                resizeMode="contain"
                            />
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(400).springify()}
                        className="mt-8 space-y-2 items-center"
                    >
                        <Text className="text-5xl font-extrabold tracking-tight text-white font-display">
                            MyCircle<Text className="text-primary">.</Text>
                        </Text>
                        <Text className="text-slate-400 text-lg text-center max-w-[280px] leading-relaxed">
                            Where high-performance communities thrive.
                        </Text>
                    </Animated.View>
                </View>

                {/* Action Container */}
                <Animated.View
                    entering={FadeInDown.delay(800).springify()}
                    className="space-y-4 mb-10"
                >
                    {/* Google Auth Button */}
                    <TouchableOpacity
                        onPress={handleGoogleLogin}
                        activeOpacity={0.85}
                    >
                        <GlassView intensity={5} borderRadius={99} style={styles.actionButton}>
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/COxitqgJr1sICpeqCu7Lx2rjqD02G6DRtLU-q333L-RyXVw_Z_9_ls6Y9.png' }} // Better quality google logo
                                className="w-6 h-6 mr-3"
                                resizeMode="contain"
                                defaultSource={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                            />
                            <Text className="text-white font-bold text-lg">Continue with Google</Text>
                        </GlassView>
                    </TouchableOpacity>

                    {/* Secondary Login Option */}
                    <View className="space-y-3">
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.8}
                            className="w-full bg-primary py-5 rounded-full shadow-lg shadow-primary/20 items-center"
                        >
                            <Text className="text-white font-bold text-lg">Get Started</Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center justify-center space-x-2 pt-2">
                            <Text className="text-slate-500 text-sm">Already a member?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text className="text-primary font-bold text-sm">Log in</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer Compliance */}
                    <View className="pt-8 text-center px-4">
                        <Text className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed text-center">
                            By continuing, you agree to our {'\n'}
                            <Text className="underline">Terms of Service</Text> and <Text className="underline">Privacy Policy</Text>
                        </Text>
                    </View>
                </Animated.View>
            </View>

            {/* iOS Home Indicator Simulation */}
            <View className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    floatingShape: {
        position: 'absolute',
    },
    actionButton: {
        width: '100%',
        flexDirection: 'row',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default LandingScreen;
