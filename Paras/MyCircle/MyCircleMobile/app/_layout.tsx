import { Stack } from 'expo-router';
import { View } from 'react-native';
import "../global.css";
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <View style={{ flex: 1, backgroundColor: '#09090b' }}>
                <Stack screenOptions={{
                    headerStyle: { backgroundColor: '#18181b' },
                    headerTintColor: '#fff',
                    contentStyle: { backgroundColor: '#09090b' }
                }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                </Stack>
            </View>
        </AuthProvider>
    );
}
