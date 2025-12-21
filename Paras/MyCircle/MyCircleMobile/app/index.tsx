import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Rocket } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useAuth } from '../src/context/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const Landing = () => {
    const router = useRouter();
    const { login, token, isLoading: authLoading } = useAuth();

    // FORCING EXACT ALIGNMENT WITH YOUR GOOGLE CONSOLE SCREENSHOT
    const redirectUri = 'https://auth.expo.io/@paras/MyCircleMobile';

    const webId = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: webId,
        iosClientId: webId, // Force Web ID to avoid mismatch
        androidClientId: webId, // Force Web ID to avoid mismatch while satisfying "must be defined"
        redirectUri,
        scopes: ['profile', 'email'],
    } as any);

    useEffect(() => {
        if (request) {
            console.log('🌐 FULL REQUEST DETAILS:');
            console.log('- URL:', request.url);
            console.log('- Redirect:', request.redirectUri);
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
            console.log('📦 OAUTH RESPONSE:', JSON.stringify(response, null, 2));
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
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://192.168.1.4:5000/api';
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
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background items-center justify-center p-6">
            <View className="items-center mb-10">
                <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center mb-4">
                    <Rocket color="white" size={40} />
                </View>
                <Text className="text-4xl font-bold text-white text-center">MyCircle</Text>
                <Text className="text-gray-400 text-center mt-2 text-lg">Hyperlocal Exchange Reimagined</Text>
            </View>

            <TouchableOpacity
                disabled={!request}
                onPress={() => (promptAsync as any)({ useProxy: true })}
                className="bg-primary w-full py-4 rounded-xl items-center shadow-lg shadow-purple-500/30 mb-8"
            >
                <Text className="text-white font-bold text-lg">Sign in with Google</Text>
            </TouchableOpacity>

            <Text className="text-gray-500 mt-6 text-xs text-center px-4">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
        </View>
    );
};

export default Landing;
