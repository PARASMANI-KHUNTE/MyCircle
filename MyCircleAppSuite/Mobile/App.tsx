import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AlertProvider from './src/components/ui/AlertProvider';
import { ToastProvider } from './src/components/ui/Toast';
import { ThemeProvider } from './src/context/ThemeContext';
import { useTheme } from './src/context/ThemeContext';
import { navigationRef } from './src/services/navigationService';
import StartupAnimation from './src/components/animations/StartupAnimation';
import { getNavigationTheme } from './src/theme/theme';
import { RootStackParamList } from './src/navigation/types';

// Screen Placeholders
import LandingScreen from './src/screens/LandingScreen';
import HomeScreen from './src/screens/HomeScreen';
import MainTabs from './src/navigation/MainTabs';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PostDetailsScreen from './src/screens/PostDetailsScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatWindowScreen from './src/screens/ChatWindowScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MyPostsScreen from './src/screens/MyPostsScreen';
import RequestsScreen from './src/screens/RequestsScreen';
import BlockedUsersScreen from './src/screens/BlockedUsersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditPostScreen from './src/screens/EditPostScreen';
import WalletScreen from './src/screens/WalletScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginSuccessScreen from './src/screens/LoginSuccessScreen';
import NotFoundScreen from './src/screens/NotFoundScreen';

const Stack = createStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { colors } = useTheme();

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            }}
        >
            {!isAuthenticated ? (
                <>
                    <Stack.Screen name="Landing" component={LandingScreen} />
                    <Stack.Screen name="Welcome" component={HomeScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="LoginSuccess" component={LoginSuccessScreen} />
                    <Stack.Screen name="NotFound" component={NotFoundScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                    <Stack.Screen name="Welcome" component={HomeScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
                    <Stack.Screen name="ChatList" component={ChatListScreen} />
                    <Stack.Screen name="ChatWindow" component={ChatWindowScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="MyPosts" component={MyPostsScreen} />
                    <Stack.Screen name="Requests" component={RequestsScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="UserProfile" component={ProfileScreen} />
                    <Stack.Screen name="EditPost" component={EditPostScreen} />
                    <Stack.Screen name="Wallet" component={WalletScreen} />
                    <Stack.Screen name="LoginSuccess" component={LoginSuccessScreen} />
                    <Stack.Screen name="NotFound" component={NotFoundScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

const MainContent = () => {
    const [showStartup, setShowStartup] = useState(true);
    const { appTheme } = useTheme();

    if (showStartup) {
        return (
            <StartupAnimation
                onComplete={() => setShowStartup(false)}
            />
        );
    }

    return (
        <NavigationContainer ref={navigationRef} theme={getNavigationTheme(appTheme)}>
            <RootNavigator />
        </NavigationContainer>
    );
};

const App = () => {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <AlertProvider>
                        <ToastProvider>
                            <AuthProvider>
                                <SocketProvider>
                                    <NotificationProvider>
                                        <MainContent />
                                    </NotificationProvider>
                                </SocketProvider>
                            </AuthProvider>
                        </ToastProvider>
                    </AlertProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default App;
