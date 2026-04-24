import React, { useEffect } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Home, Inbox, Map, Plus, User } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import GlassView from '../components/ui/GlassView';
import { useTheme } from '../context/ThemeContext';

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

                        return (
                            <TouchableOpacity key={route.key} activeOpacity={0.8} onPress={onPress} style={styles.tabButton}>
                                <TabIcon routeName={route.name} isFocused={isFocused} color={isFocused ? colors.primary : colors.textSecondary} />
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
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
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
