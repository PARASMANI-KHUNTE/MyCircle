import React, { useEffect } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Home, Inbox, Map, Plus, User, MessageCircle } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';

import GlassView from '../components/ui/GlassView';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const TabIcon = ({ routeName, isFocused, color }: { routeName: string; isFocused: boolean; color: string }) => {
    let Icon = Home;
    switch (routeName) {
        case 'Feed':
            Icon = Home;
            break;
        case 'MapView':
            Icon = Map;
            break;
        case 'Requests':
            Icon = Inbox;
            break;
        case 'Profile':
            Icon = User;
            break;
        case 'CreatePost':
            Icon = Plus;
            break;
        default:
            Icon = Home;
    }

    const scale = useSharedValue(1);
    useEffect(() => {
        scale.value = withSpring(isFocused ? 1.2 : 1);
    }, [isFocused, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
            <Icon size={24} color={color} />
            {isFocused ? (
                <Animated.View entering={FadeInDown.springify().damping(12)} exiting={FadeOutDown.duration(200)} style={[styles.dot, { backgroundColor: color }]} />
            ) : null}
        </Animated.View>
    );
};

const ModernTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const { colors } = useTheme();
    const { socket } = useSocket() as any;
    const [unreadMsgCount, setUnreadMsgCount] = React.useState(0);
    const inFlightRef = React.useRef(false);
    const queuedRef = React.useRef(false);
    const timeoutRef = React.useRef(null);

    // Fetch unread count
    const fetchUnreadCount = React.useCallback(async () => {
        if (inFlightRef.current) {
            queuedRef.current = true;
            return;
        }
        inFlightRef.current = true;
        try {
            const res = await api.get('/chat/unread/count');
            setUnreadMsgCount(res.data?.count || 0);
        } catch {
            /* silent */
        } finally {
            inFlightRef.current = false;
            if (queuedRef.current) {
                queuedRef.current = false;
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => void fetchUnreadCount(), 150);
            }
        }
    }, []);

    // Set up socket listeners
    React.useEffect(() => {
        fetchUnreadCount();

        if (!socket) return;

        const handle = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => void fetchUnreadCount(), 150);
        };

        socket.on('receive_message', handle);
        socket.on('messages_read', handle);
        socket.on('unread_count_update', handle);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            socket.off('receive_message', handle);
            socket.off('messages_read', handle);
            socket.off('unread_count_update', handle);
        };
    }, [socket, fetchUnreadCount]);

    const focusedRoute = state.routes[state.index];
    const focusedOptions = descriptors[focusedRoute.key].options;
    const tabBarStyle = StyleSheet.flatten(focusedOptions.tabBarStyle || {}) as any;

    if (tabBarStyle?.display === 'none') {
        return null;
    }

    const createPostRoute = state.routes.find(route => route.name === 'CreatePost');

    const onCreatePress = () => {
        if (!createPostRoute) {
            return;
        }
        const event = navigation.emit({
            type: 'tabPress',
            target: createPostRoute.key,
            canPreventDefault: true,
        });

        if (!event.defaultPrevented) {
            navigation.navigate('CreatePost');
        }
    };

    return (
        <View style={styles.container}>
            <GlassView
                intensity={20}
                borderRadius={32}
                style={[
                    styles.glassContainer,
                    {
                        backgroundColor: colors.glass,
                        borderColor: colors.borderSoft,
                        shadowColor: colors.black,
                    },
                ]}
            >
                <View style={styles.tabRow}>
                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;

                        if (route.name === 'CreatePost') {
                            return <View key={route.key} style={styles.tabButton} pointerEvents="none" />;
                        }

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        // Show badge only for Chat (Requests tab in this case)
                        const showBadge = route.name === 'Requests' && unreadMsgCount > 0;

                        return (
                            <TouchableOpacity key={route.key} activeOpacity={0.8} onPress={onPress} style={styles.tabButton}>
                                <View style={styles.iconWrapper}>
                                    <TabIcon routeName={route.name} isFocused={isFocused} color={isFocused ? colors.primary : colors.textSecondary} />
                                    {showBadge && (
                                        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                            <Text style={styles.badgeText}>{unreadMsgCount > 9 ? '9+' : unreadMsgCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </GlassView>

            <View style={[styles.createButtonContainer, { shadowColor: colors.primary }]} pointerEvents="box-none">
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={onCreatePress}
                    style={[styles.createButton, { backgroundColor: colors.primary, borderColor: colors.background }]}
                >
                    <Plus size={32} color={colors.white} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    glassContainer: {
        width: '100%',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    tabRow: {
        flexDirection: 'row',
        height: 64,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
        position: 'absolute',
        bottom: -8,
    },
    createButtonContainer: {
        position: 'absolute',
        top: -20,
        alignSelf: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 12,
        zIndex: 50,
    },
    createButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
    },
});

export default ModernTabBar;
