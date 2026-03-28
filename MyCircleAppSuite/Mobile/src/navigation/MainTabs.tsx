import { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Sound from 'react-native-sound';

import FeedScreen from '../screens/FeedScreen';
import RequestsScreen from '../screens/RequestsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ModernTabBar from './ModernTabBar';

const Tab = createBottomTabNavigator();

// Enable playback in silent mode
Sound.setCategory('Playback');

const MainTabs = () => {
    const { socket } = useSocket() as any;
    const [_, setUnreadMsgCount] = useState(0);

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
            tabBar={(props) => <ModernTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    elevation: 0,
                    borderTopWidth: 0,
                }
            }}
        >
            <Tab.Screen
                name="Feed"
                component={FeedScreen}
            />
            <Tab.Screen
                name="MapView"
                component={FeedScreen}
                initialParams={{ viewMode: 'map' }}
            />
            <Tab.Screen
                name="CreatePost"
                component={CreatePostScreen}
                options={{
                    tabBarStyle: { display: 'none' }
                }}
            />
            <Tab.Screen
                name="Requests"
                component={RequestsScreen}
                options={{
                    tabBarBadge: 0, // Should be contacts request count if available
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
            />
        </Tab.Navigator>
    );
};

export default MainTabs;
