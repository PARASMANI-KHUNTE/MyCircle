import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ToastProvider } from './src/components/ui/Toast';
import { ThemeProvider } from './src/context/ThemeContext';
import { navigationRef } from './src/services/navigationService';
import StartupAnimation from './src/components/animations/StartupAnimation';
import codePush from 'react-native-code-push';

// Screen Placeholders
import LandingScreen from './src/screens/LandingScreen';
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

const Stack = createStackNavigator();
const queryClient = new QueryClient();

const getSyncStatusLabel = (status: number | null) => {
    switch (status) {
        case codePush.SyncStatus.CHECKING_FOR_UPDATE:
            return 'CHECKING_FOR_UPDATE';
        case codePush.SyncStatus.DOWNLOADING_PACKAGE:
            return 'DOWNLOADING_PACKAGE';
        case codePush.SyncStatus.INSTALLING_UPDATE:
            return 'INSTALLING_UPDATE';
        case codePush.SyncStatus.UP_TO_DATE:
            return 'UP_TO_DATE';
        case codePush.SyncStatus.UPDATE_INSTALLED:
            return 'UPDATE_INSTALLED';
        case codePush.SyncStatus.UPDATE_IGNORED:
            return 'UPDATE_IGNORED';
        case codePush.SyncStatus.UNKNOWN_ERROR:
            return 'ERROR';
        default:
            return 'UPDATING';
    }
};

const CodePushStatusModal = ({ status, isVisible }: { status: string; isVisible: boolean }) => {
    if (!isVisible) return null;

    const getMessage = () => {
        switch (status) {
            case 'CHECKING_FOR_UPDATE':
                return 'Checking for updates...';
            case 'DOWNLOADING_PACKAGE':
                return 'Downloading update...';
            case 'INSTALLING_UPDATE':
                return 'Installing update...';
            case 'UP_TO_DATE':
                return 'App is up to date';
            case 'UPDATE_INSTALLED':
                return 'Update installed. Restart required.';
            case 'ERROR':
                return 'Update error occurred';
            default:
                return 'Updating...';
        }
    };

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.modalText}>{getMessage()}</Text>
            </View>
        </View>
    );
};

const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
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
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="MainTabs" component={MainTabs} />
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
                </>
            )}
        </Stack.Navigator>
    );
};

const MainContent = () => {
    const [showStartup, setShowStartup] = useState(true);
    const [codePushStatus, setCodePushStatus] = useState('UPDATING');
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    useEffect(() => {
        const syncUpdate = async () => {
            try {
                const result = await codePush.sync({
                    installMode: codePush.InstallMode.ON_NEXT_RESTART,
                    mandatoryInstallMode: codePush.InstallMode.IMMEDIATE,
                    updateDialog: {
                        appendReleaseDescription: true,
                        descriptionPrefix: '\n\nChange log:\n',
                        mandatoryContinueButtonLabel: 'Restart Now',
                        mandatoryUpdateMessage: 'A mandatory update is available. Please restart the app to continue.',
                        optionalIgnoreButtonLabel: 'Later',
                        optionalInstallButtonLabel: 'Restart',
                        optionalUpdateMessage: 'An update is available. Would you like to install it?',
                        title: 'Update Available'
                    }
                }, (status) => {
                    setCodePushStatus(getSyncStatusLabel(status));
                    if (status === codePush.SyncStatus.DOWNLOADING_PACKAGE || 
                        status === codePush.SyncStatus.INSTALLING_UPDATE) {
                        setShowUpdateModal(true);
                    }
                });

                switch (typeof result === 'number' ? result : null) {
                    case codePush.SyncStatus.UP_TO_DATE:
                        console.log('App is up to date');
                        break;
                    case codePush.SyncStatus.UPDATE_INSTALLED:
                        console.log('Update installed, will apply on restart');
                        break;
                    case codePush.SyncStatus.UPDATE_IGNORED:
                        console.log('User ignored the update');
                        break;
                    case codePush.SyncStatus.UNKNOWN_ERROR:
                        console.error('CodePush sync error');
                        break;
                }
            } catch (error) {
                console.error('CodePush sync failed:', error);
            }
        };

        syncUpdate();
    }, []);

    useEffect(() => {
        const checkForUpdate = async () => {
            try {
                const update = await codePush.checkForUpdate();
                if (update) {
                    console.log('Update available from CodePush');
                }
            } catch (error) {
                console.error('Check for update failed:', error);
            }
        };

        checkForUpdate();
    }, []);

    if (showStartup) {
        return (
            <StartupAnimation
                onComplete={() => {
                    setShowUpdateModal(false);
                    setShowStartup(false);
                }}
            />
        );
    }

    return (
        <>
            <NavigationContainer ref={navigationRef}>
                <RootNavigator />
            </NavigationContainer>
            <CodePushStatusModal 
                status={codePushStatus || ''} 
                isVisible={showUpdateModal}
            />
        </>
    );
};

const App = () => {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <ToastProvider>
                        <AuthProvider>
                            <SocketProvider>
                                <NotificationProvider>
                                    <MainContent />
                                </NotificationProvider>
                            </SocketProvider>
                        </AuthProvider>
                    </ToastProvider>
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
        backgroundColor: '#0F172A'
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    },
    modalContent: {
        backgroundColor: '#1E293B',
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 250
    },
    modalText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center'
    }
});

export default codePush(App);
