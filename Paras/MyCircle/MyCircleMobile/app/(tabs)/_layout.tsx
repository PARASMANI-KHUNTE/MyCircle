import { Tabs } from 'expo-router';
import { Home, PlusSquare, Inbox, Grid, User } from 'lucide-react-native';

export default function TabLayout() {
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
                name="requests"
                options={{
                    title: 'Requests',
                    tabBarIcon: ({ color }) => <Inbox size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="myposts"
                options={{
                    title: 'My Posts',
                    tabBarIcon: ({ color }) => <Grid size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
