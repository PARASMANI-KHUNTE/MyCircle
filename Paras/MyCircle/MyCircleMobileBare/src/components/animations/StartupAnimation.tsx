import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    withSequence,
    withTiming,
    withRepeat,
    Easing
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const StartupAnimation = ({ onComplete }: { onComplete: () => void }) => {
    const { colors } = useTheme();
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const textY = useSharedValue(20);
    const hiveRotate = useSharedValue(0);

    useEffect(() => {
        // Logo pop-in
        scale.value = withSpring(1, { damping: 12 });
        opacity.value = withTiming(1, { duration: 800 });

        // Hive wobble
        hiveRotate.value = withDelay(500, withRepeat(withTiming(10, { duration: 100 }), 6, true));

        // Text slide-up
        textY.value = withDelay(300, withSpring(0));

        // Exit sequence
        const timer = setTimeout(() => {
            scale.value = withTiming(0, { duration: 500, easing: Easing.back(1) });
            opacity.value = withTiming(0, { duration: 500 });
            setTimeout(onComplete, 600);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: hiveRotate.value + 'deg' }],
        opacity: opacity.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: textY.value }],
    }));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                {/* Modern "MyCircle" Symbol */}
                <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.logoLetter, { color: colors.background }]}>M</Text>
                </View>
            </Animated.View>

            <Animated.View style={[styles.textContainer, textStyle]}>
                <Text style={[styles.title, { color: colors.text }]}>
                    My<Text style={{ color: colors.accent }}>Circle</Text>
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Your Neighborhood Hub
                </Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    logoLetter: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 4,
    },
});

export default StartupAnimation;
