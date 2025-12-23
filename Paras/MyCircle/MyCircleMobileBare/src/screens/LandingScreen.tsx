import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions, StyleSheet } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

const LandingScreen = ({ navigation }: any) => {
    const { login, isLoading: authLoading } = useAuth();

    useEffect(() => {
        console.log('Window Dimensions:', Dimensions.get('window'));
        console.log('Google webClientId:', GOOGLE_WEB_CLIENT_ID);
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
            } catch (error) {
                // Ignore if not signed in
            }
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
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert("Error", "Play services not available or outdated.");
            } else {
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
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.logoWrapper}>
                    <Image
                        source={require('../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>MyCircle</Text>
                <Text style={styles.subtitle}>Hyperlocal Exchange Reimagined</Text>
            </View>

            <TouchableOpacity
                onPress={handleGoogleLogin}
                style={styles.button}
                activeOpacity={0.9}
            >
                <Text style={styles.buttonText}>Sign in with Google</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
                By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#09090b', // zinc-950
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#09090b',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoWrapper: {
        width: 96,
        height: 96,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        color: '#ffffff',
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        color: '#71717a',
        fontSize: 18,
        marginTop: 8,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#f4f4f5',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 32,
    },
    buttonText: {
        color: '#09090b',
        fontWeight: 'bold',
        fontSize: 18,
    },
    footerText: {
        color: '#71717a',
        marginTop: 24,
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 16,
        lineHeight: 20,
    },
});

export default LandingScreen;
