import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import GlassView from '../components/ui/GlassView';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    FadeInDown,
    FadeOutDown
} from 'react-native-reanimated';
import { Home, Inbox, User, Plus, Map } from 'lucide-react-native';

const ACCENT_COLOR = '#af25f4';

const TabIcon = ({ routeName, isFocused, color }: { routeName: string, isFocused: boolean, color: string }) => {

    let Icon = Home;
    switch (routeName) {
        case 'Feed': Icon = Home; break;
        case 'MapView': Icon = Map; break;
        case 'Requests': Icon = Inbox; break;
        case 'Profile': Icon = User; break;
        case 'CreatePost': Icon = Plus; break;
        default: Icon = Home;
    }

    const scale = useSharedValue(1);

    useEffect(() => {
        if (isFocused) {
            scale.value = withSpring(1.2);
        } else {
            scale.value = withSpring(1);
        }
    }, [isFocused, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View
            style={[styles.iconContainer, animatedStyle]}
        // Simple entry animation for initial load
        >
            <Icon size={24} color={color} />
            {isFocused && (
                <Animated.View
                    entering={FadeInDown.springify().damping(12)}
                    exiting={FadeOutDown.duration(200)}
                    style={[styles.dot, { backgroundColor: color }]}
                />
            )}
        </Animated.View>
    );
};

const ModernTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const { colors } = useTheme();

    const focusedRoute = state.routes[state.index];
    const focusedOptions = descriptors[focusedRoute.key].options;
    const tabBarStyle = StyleSheet.flatten(focusedOptions.tabBarStyle || {}) as any;

    // Support hiding tab bar via screen options
    if (tabBarStyle?.display === 'none') {
        return null;
    }

    const createPostRoute = state.routes.find(r => r.name === 'CreatePost');

    const onCreatePress = () => {
        if (createPostRoute) {
            const event = navigation.emit({
                type: 'tabPress',
                target: createPostRoute.key,
                canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
                navigation.navigate('CreatePost');
            }
        }
    };

    return (
        <View style={styles.container}>
            <GlassView
                intensity={20}
                style={styles.glassContainer}
                borderRadius={32}
            >
                <View style={styles.tabRow}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];

                        const isFocused = state.index === index;

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

                        // Placeholder for CreatePost within the glass bar to keep spacing
                        if (route.name === 'CreatePost') {
                            return (
                                <View key={index} style={styles.tabButton} pointerEvents="none" />
                            );
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                onPress={onPress}
                                style={styles.tabButton}
                            >
                                <TabIcon
                                    routeName={route.name}
                                    isFocused={isFocused}
                                    color={isFocused ? ACCENT_COLOR : colors.textSecondary}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </GlassView>

            {/* Floating Create Button - Rendered OUTSIDE GlassView */}
            <View style={styles.createButtonContainer} pointerEvents="box-none">
                <TouchableOpacity
                    style={styles.createButton}
                    activeOpacity={0.9}
                    onPress={onCreatePress}
                >
                    <Plus size={32} color="#fff" />
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
        backgroundColor: 'rgba(20, 20, 25, 0.85)', // Dark fallback tint
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        shadowColor: '#000',
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
        top: -20, // Lowered for better integration (was -30)
        alignSelf: 'center',
        shadowColor: ACCENT_COLOR,
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
        backgroundColor: ACCENT_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#09090b', // Match standard dark background to create a "faux cutout" effect if over glass, or just seamless. 
        // Actually, if it's over glass, transparent border doesn't create cutout. 
        // Dark border matches the app background, making it look like it punches through the glass?
        // Let's try matching the app background color.
    }
});

export default ModernTabBar;
