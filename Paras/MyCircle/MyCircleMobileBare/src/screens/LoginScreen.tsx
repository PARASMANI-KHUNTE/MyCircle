import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const LoginScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = useAuth() as any;

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const baseURL = api.defaults.baseURL || 'http://10.0.2.2:5000/api';
            const authUrl = baseURL.replace('/api', '') + '/auth/login';

            const res = await axios.post(authUrl, {
                email,
                password
            });

            if (res.data.token) {
                await auth.login(res.data.token);
            } else {
                Alert.alert('Login Failed', 'No token received');
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Login Failed', error.response?.data?.msg || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.logo}>MyCircle</Text>
                    <Text style={styles.subtitle}>Welcome back!</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#71717a"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={[styles.inputGroup, styles.mt16]}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="#71717a"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading ? styles.buttonDisabled : null]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Logging in...' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.footerRow}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('Landing')}
                    >
                        <Text style={styles.secondaryButtonText}>Back to Google Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b', // zinc-950
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        color: '#a1a1aa', // zinc-400
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        width: '100%',
    },
    mt16: {
        marginTop: 16,
    },
    label: {
        color: '#a1a1aa', // zinc-400
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#ffffff',
    },
    button: {
        backgroundColor: '#2563eb', // blue-600
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 32,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 18,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#a1a1aa', // zinc-400
    },
    linkText: {
        color: '#3b82f6', // blue-500
        fontWeight: 'bold',
    },
    secondaryButton: {
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#27272a', // zinc-800
        paddingVertical: 12,
        borderRadius: 12,
    },
    secondaryButtonText: {
        color: '#71717a', // zinc-500
        textAlign: 'center',
        fontSize: 14,
    },
});

export default LoginScreen;
