import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/components/ui/Toast';
import { SocketProvider } from '../src/context/SocketContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ToastProvider>
                <AuthProvider>
                    <SocketProvider>
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="index" />
                            <Stack.Screen name="login" />
                            <Stack.Screen name="register" />
                            <Stack.Screen name="(tabs)" />
                        </Stack>
                    </SocketProvider>
                </AuthProvider>
            </ToastProvider>
        </SafeAreaProvider>
    );
}
