import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Dimensions, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import GlassView from '../components/ui/GlassView';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const FloatingShape = ({ delay = 0, size = 300, color = '#af25f4', top = 0, left = 0, opacity = 0.4 }: any) => {
    const translationY = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translationY.value = withDelay(delay, withRepeat(withTiming(30, { duration: 5000 }), -1, true));
        scale.value = withDelay(delay, withRepeat(withTiming(1.3, { duration: 7000 }), -1, true));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translationY.value }, { scale: scale.value }],
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
                    filter: 'blur(80px)',
                },
                animatedStyle
            ]}
        />
    );
};

const RegisterScreen = ({ navigation }: any) => {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = useAuth() as any;

    const handleRegister = async () => {
        if (!displayName || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/register', { displayName, email, password });
            if (res.data.token) {
                await auth.login(res.data.token);
            } else {
                Alert.alert('Registration Failed', 'No token received');
            }
        } catch (error: any) {
            Alert.alert('Registration Failed', error.response?.data?.msg || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <StatusBar barStyle="light-content" />

            {/* Background Neon glows */}
            <View style={StyleSheet.absoluteFill}>
                <FloatingShape size={350} color="#af25f4" top={-50} left={-100} delay={0} opacity={0.5} />
                <FloatingShape size={300} color="#00f5ff" top={height * 0.7} left={width * 0.6} delay={2000} opacity={0.3} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-6">
                    {/* Header */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mt-4 mb-8 w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10"
                    >
                        <ArrowLeft size={20} color="#fff" />
                    </TouchableOpacity>

                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        className="mb-10"
                    >
                        <Text className="text-4xl font-extrabold text-white font-display">
                            Join Circle<Text className="text-primary">.</Text>
                        </Text>
                        <Text className="text-slate-400 mt-2 text-lg">Create your professional profile</Text>
                    </Animated.View>

                    {/* Form Panel */}
                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <GlassView intensity={5} borderRadius={32} style={styles.formPanel}>
                            <View className="space-y-6">
                                <View>
                                    <Text className="text-slate-400 mb-2 font-semibold ml-1">Display Name</Text>
                                    <TextInput
                                        className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white"
                                        placeholder="Your Name"
                                        placeholderTextColor="#71717a"
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                    />
                                </View>

                                <View>
                                    <Text className="text-slate-400 mb-2 font-semibold ml-1">Email Address</Text>
                                    <TextInput
                                        className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white"
                                        placeholder="Enter your email"
                                        placeholderTextColor="#71717a"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>

                                <View>
                                    <Text className="text-slate-400 mb-2 font-semibold ml-1">Password</Text>
                                    <TextInput
                                        className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white"
                                        placeholder="Create a password"
                                        placeholderTextColor="#71717a"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleRegister}
                                    disabled={loading}
                                    className={`w-full bg-primary py-5 rounded-full items-center shadow-lg shadow-primary/30 mt-4 ${loading ? 'opacity-70' : ''}`}
                                >
                                    <Text className="text-white font-bold text-lg">
                                        {loading ? 'Creating...' : 'Sign Up'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </GlassView>
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View
                        entering={FadeInDown.delay(600).springify()}
                        className="mt-8 mb-10"
                    >
                        <View className="flex-row justify-center items-center space-x-2">
                            <Text className="text-slate-500">Already have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text className="text-primary font-bold">Sign In</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Landing')}
                            className="mt-8 items-center"
                        >
                            <Text className="text-slate-600 text-sm">Or use Google Sign In</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    floatingShape: {
        position: 'absolute',
    },
    formPanel: {
        padding: 24,
        width: '100%',
    }
});

export default RegisterScreen;
