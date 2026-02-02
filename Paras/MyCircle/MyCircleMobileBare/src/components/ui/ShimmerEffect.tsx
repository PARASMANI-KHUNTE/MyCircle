import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    withSequence
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Palette } from '../../constants/design';

interface ShimmerProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
}

const ShimmerEffect = ({ width = '100%', height = 20, borderRadius = 8, style }: ShimmerProps) => {
    const { colors, theme } = useTheme();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.3, { duration: 0 }),
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    // Determine base color based on theme
    const baseColor = theme === 'dark'
        ? Palette.dark.elevator
        : Palette.light.elevator;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: baseColor,
                },
                animatedStyle,
                style
            ]}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});

export default ShimmerEffect;
