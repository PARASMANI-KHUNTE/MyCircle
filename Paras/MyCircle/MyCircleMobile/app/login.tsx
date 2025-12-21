import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Get base URL and remove /api if calling /auth
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://192.168.1.4:5000/api';
            const authUrl = apiUrl.replace('/api', '') + '/auth/login';

            const res = await axios.post(authUrl, {
                email,
                password
            });

            await login(res.data.token);
        } catch (error) {
            console.error(error);
            Alert.alert('Login Failed', error.response?.data?.msg || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-zinc-950 px-6 justify-center">
            <View className="items-center mb-10">
                <Text className="text-4xl font-bold text-white mb-2">MyCircle</Text>
                <Text className="text-zinc-400">Welcome back!</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-zinc-400 mb-2 ml-1">Email</Text>
                    <TextInput
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                        placeholder="Enter your email"
                        placeholderTextColor="#71717a"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View>
                    <Text className="text-zinc-400 mb-2 ml-1">Password</Text>
                    <TextInput
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                        placeholder="Enter your password"
                        placeholderTextColor="#71717a"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    className="bg-blue-600 py-4 rounded-xl mt-4 active:opacity-90"
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        {loading ? 'Logging in...' : 'Sign In'}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-4">
                    <Text className="text-zinc-400">Don't have an account? </Text>
                    <Link href="/register" asChild>
                        <TouchableOpacity>
                            <Text className="text-blue-500 font-bold">Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                <View className="flex-row justify-center mt-4">
                    <Link href="/(tabs)" asChild>
                        <TouchableOpacity>
                            <Text className="text-zinc-500 text-xs">Skip to Feed (Dev)</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
