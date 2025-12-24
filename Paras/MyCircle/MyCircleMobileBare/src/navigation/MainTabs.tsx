import { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Home, Bell, Inbox, User, PlusSquare, MessageCircle } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withSequence } from 'react-native-reanimated';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

import FeedScreen from '../screens/FeedScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import RequestsScreen from '../screens/RequestsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreatePostScreen from '../screens/CreatePostScreen';

const Tab = createBottomTabNavigator();

// Extracted component to prevent re-render issues
const TabBarIcon = ({ icon: Icon, color, focused, count }: { icon: any, color: string, focused: boolean, count?: number }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (focused) {
            scale.value = withSequence(
                withSpring(1.2, { damping: 4 }),
                withSpring(1.1)
            );
        } else {
            scale.value = withSpring(1);
        }
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Icon size={24} color={color} />
            {count && count > 0 ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {count > 99 ? '99+' : count}
                    </Text>
                </View>
            ) : null}
        </Animated.View>
    );
};

import Sound from 'react-native-sound';

// Enable playback in silent mode
Sound.setCategory('Playback');

const MainTabs = () => {
    const { unreadCount, notifications } = useNotifications();
    const { socket } = useSocket() as any;
    const { user } = useAuth();
    const { colors } = useTheme();
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);

    const fetchUnreadMsgCount = async () => {
        try {
            const res = await api.get('/chat/unread/count');
            setUnreadMsgCount(res.data.count);
        } catch (err) {
            console.error('Failed to fetch unread messages count', err);
        }
    };

    useEffect(() => {
        fetchUnreadMsgCount();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = () => {
            fetchUnreadMsgCount();

            // Play notification sound
            const ding = new Sound('notification.mp3', Sound.MAIN_BUNDLE, (error) => {
                if (error) {
                    console.log('Failed to load sound', error);
                    return;
                }
                ding.play((success) => {
                    if (!success) {
                        console.log('Sound playback failed');
                    }
                });
            });
        };

        const handleMessagesRead = () => {
            fetchUnreadMsgCount();
        };

        socket.on('receive_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);
        socket.on('unread_count_update', handleMessagesRead);

        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
            socket.off('unread_count_update', handleMessagesRead);
        };
    }, [socket]);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    height: 60,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                }
            }}
        >
            <Tab.Screen
                name="Feed"
                component={FeedScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Home} color={color} focused={focused} />,
                }}
            />
            <Tab.Screen
                name="CreatePost"
                component={CreatePostScreen}
                options={{
                    title: 'Post',
                    tabBarIcon: ({ color, focused }) => <TabBarIcon icon={PlusSquare} color={color} focused={focused} />,
                }}
            />
            {/* Notifications and Chat moved to Home Header */}
            <Tab.Screen
                name="Requests"
                component={RequestsScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon
                            icon={Inbox}
                            color={color}
                            focused={focused}
                            count={notifications.filter(n => !n.read && (n.type === 'request' || n.type === 'approval')).length}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => <TabBarIcon icon={User} color={color} focused={focused} />,
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: -1,
        right: -1,
        backgroundColor: '#ef4444', // red-500
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    badgeText: {
        fontSize: 10,
        color: '#ffffff',
        fontWeight: 'bold',
    },
});

export default MainTabs;
