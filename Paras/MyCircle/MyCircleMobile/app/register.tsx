import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import axios from 'axios';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Register() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!displayName || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Get base URL and remove /api if calling /auth
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://192.168.1.4:5000/api';
            const authUrl = apiUrl.replace('/api', '') + '/auth/register';

            const res = await axios.post(authUrl, {
                displayName,
                email,
                password
            });

            await login(res.data.token);
        } catch (error) {
            console.error(error);
            Alert.alert('Registration Failed', error.response?.data?.msg || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-zinc-950 px-6 justify-center">
            <View className="items-center mb-10">
                <Text className="text-4xl font-bold text-white mb-2">MyCircle</Text>
                <Text className="text-zinc-400">Create your account</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-zinc-400 mb-2 ml-1">Display Name</Text>
                    <TextInput
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                        placeholder="Your Name"
                        placeholderTextColor="#71717a"
                        value={displayName}
                        onChangeText={setDisplayName}
                    />
                </View>

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
                        placeholder="Create a password"
                        placeholderTextColor="#71717a"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    className="bg-blue-600 py-4 rounded-xl mt-4 active:opacity-90"
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-4">
                    <Text className="text-zinc-400">Already have an account? </Text>
                    <Link href="/login" asChild>
                        <TouchableOpacity>
                            <Text className="text-blue-500 font-bold">Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
