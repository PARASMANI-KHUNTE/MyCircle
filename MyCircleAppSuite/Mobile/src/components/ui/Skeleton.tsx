import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
    dark?: boolean;
}

const Skeleton = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
    dark
}: SkeletonProps) => {
    const opacity = useSharedValue(0.3);
    const { colors } = useTheme();

    const baseColor = dark ? '#27272a' : (colors.background === '#09090b' ? '#27272a' : '#e4e4e7');

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.8, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            true
        );
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width: width as any,
                    height: height as any,
                    borderRadius,
                    backgroundColor: baseColor,
                },
                style,
                animatedStyle,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
});

export default Skeleton;
