import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../src/context/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const Landing = () => {
    const router = useRouter();
    const { login, token, isLoading: authLoading } = useAuth();

    // FORCING compliant Redirect URI for Google (must be https for Web Client IDs)
    const redirectUri = 'https://auth.expo.io/@paras/MyCircleMobile';

    const webId = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const iosId = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const androidId = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: webId,
        iosClientId: iosId,
        androidClientId: androidId,
        redirectUri,
        // Requesting ID token explicitly as requested by backend in previous iterations
        responseType: AuthSession.ResponseType.IdToken,
        scopes: ['profile', 'email'],
    } as any);

    useEffect(() => {
        if (request) {
            console.log('🌐 OAUTH CONFIG:');
            console.log('- Redirect URI:', request.redirectUri);
            console.log('- Client ID (Expo/Web):', webId);
            console.log('------------------------');
        }
    }, [request]);

    useEffect(() => {
        if (!authLoading && token) {
            router.replace('/(tabs)');
        }
    }, [token, authLoading]);

    useEffect(() => {
        if (response) {
            console.log('📦 OAUTH RESPONSE:', response.type);
        }
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const idToken = response.authentication?.idToken || id_token;
            if (idToken) {
                handleGoogleLogin(idToken);
            } else {
                Alert.alert("Error", "Could not retrieve ID token from Google.");
            }
        } else if (response?.type === 'error') {
            console.error('❌ OAUTH ERROR:', response.error);
        }
    }, [response]);

    const handleGoogleLogin = async (idToken: string) => {
        try {
            const apiUrl = process.env.EXPO_PUBLIC_API_URL;
            if (!apiUrl) {
                throw new Error('EXPO_PUBLIC_API_URL is not set. Please configure it in your Expo environment.');
            }
            const authUrl = apiUrl.replace('/api', '') + '/auth/google-mobile';

            const res = await fetch(authUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });

            const data = await res.json();

            if (data.token) {
                await login(data.token);
            } else {
                Alert.alert("Login Failed", data.msg || "Could not verify Google account.");
            }
        } catch (err) {
            Alert.alert("Error", "Connection failed. Is backend running?");
            console.error(err);
        }
    };

    if (authLoading) {
        return (
            <View className="flex-1 bg-zinc-950 items-center justify-center">
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-zinc-950 items-center justify-center p-6">
            <View className="items-center mb-10">
                <View className="w-24 h-24 items-center justify-center mb-6">
                    <Image
                        source={require('../assets/logo.png')}
                        className="w-full h-full"
                        resizeMode="contain"
                    />
                </View>
                <Text className="text-5xl font-bold text-white tracking-tighter">MyCircle</Text>
                <Text className="text-zinc-400 text-center mt-3 text-lg font-medium">Hyperlocal Exchange Reimagined</Text>
            </View>

            <TouchableOpacity
                disabled={!request}
                onPress={() => promptAsync()}
                className="bg-white w-full py-4 rounded-2xl items-center shadow-2xl shadow-white/5 mb-8"
            >
                <Text className="text-black font-bold text-lg">Sign in with Google</Text>
            </TouchableOpacity>

            <Text className="text-zinc-500 mt-6 text-xs text-center px-4 leading-5">
                By continuing, you agree to our <Text className="text-zinc-300">Terms of Service</Text> and <Text className="text-zinc-300">Privacy Policy</Text>.
            </Text>
        </View>
    );
};

export default Landing;
