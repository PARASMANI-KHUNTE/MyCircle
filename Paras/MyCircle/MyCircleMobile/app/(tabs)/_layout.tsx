import { Tabs } from 'expo-router';
import { Home, PlusSquare, Inbox, Grid, User, Bell } from 'lucide-react-native';
import { useNotifications } from '../../src/context/NotificationContext';
import { View, Text } from 'react-native';

export default function TabLayout() {
    const { unreadCount } = useNotifications();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#18181b', // Zinc 900
                    borderTopColor: 'rgba(255,255,255,0.1)',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#8b5cf6', // Violet 500
                tabBarInactiveTintColor: '#a1a1aa', // Zinc 400
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Feed',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    title: 'Post',
                    tabBarIcon: ({ color }) => <PlusSquare size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Alerts',
                    tabBarIcon: ({ color }) => (
                        <View>
                            <Bell size={24} color={color} />
                            {unreadCount > 0 && (
                                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                                    <Text className="text-[10px] text-white font-bold">{unreadCount > 99 ? '99+' : unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="requests"
                options={{
                    title: 'Inbox',
                    tabBarIcon: ({ color }) => <Inbox size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="myposts"
                options={{
                    href: null, // Hide from bar if needed, or keep for quick access
                }}
            />
        </Tabs>
    );
}
