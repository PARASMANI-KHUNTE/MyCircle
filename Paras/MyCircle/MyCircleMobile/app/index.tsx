import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Rocket } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
// import * as Google from 'expo-auth-session/providers/google';
// import * as WebBrowser from 'expo-web-browser';

// WebBrowser.maybeCompleteAuthSession();

const Landing = () => {
    const router = useRouter();
    const { login, token, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && token) {
            router.replace('/(tabs)');
        }
    }, [token, isLoading]);

    // FIXME: Add your Google Client ID here when available
    // const [request, response, promptAsync] = Google.useAuthRequest({
    //   androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    //   iosClientId: 'YOUR_IOS_CLIENT_ID',
    //   webClientId: 'YOUR_WEB_CLIENT_ID',
    // });

    const handleDevLogin = async () => {
        // Simulate a login for development
        try {
            // In real app: response.authentication.accessToken
            // Then send to backend to verify and get JWT

            // For MVP Demo: We will assume a valid token for "Test User"
            // You can generate a real one from http://localhost:5000/auth/dev-token (We need to build this!) or copy from Web

            // Let's implement a Dev Login Endpoint on backend to get a real JWT!

            const devEmail = "demo@example.com";
            const res = await fetch('http://192.168.1.10:5000/auth/dev-login', { // Ensure API_URL is correct!
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: devEmail })
            });

            const data = await res.json();

            if (data.token) {
                await login(data.token);
            } else {
                Alert.alert("Login Failed", "Could not get dev token.");
            }

        } catch (err) {
            Alert.alert("Error", "Is backend running? Check API_URL.");
        }
    };

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
                onPress={handleDevLogin} // Changed to Dev Login for immediate testing
                className="bg-primary w-full py-4 rounded-xl items-center shadow-lg shadow-purple-500/30"
            >
                <Text className="text-white font-bold text-lg">Sign in with Google (Dev)</Text>
            </TouchableOpacity>

            <Text className="text-gray-500 mt-4 text-xs text-center">
                * Using Dev Login for MVP Testing. Replace with real Google OAuth Client ID for Production.
            </Text>
        </View>
    );
};

export default Landing;
