import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface GlassViewProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    intensity?: number; // Simulated opacity, normally 3-5 for Stitch style
    borderRadius?: number;
    variant?: 'light' | 'dark';
}

const GlassView = ({
    children,
    style,
    intensity = 3,
    borderRadius = 24,
    variant = 'dark'
}: GlassViewProps) => {

    // Precise reference colors from Stitch: rgba(255, 255, 255, 0.03)
    const backgroundColor = variant === 'dark'
        ? `rgba(255, 255, 255, ${intensity / 100})`
        : `rgba(255, 255, 255, ${intensity / 100})`;

    const borderColor = 'rgba(255, 255, 255, 0.08)';

    return (
        <View style={[
            styles.container,
            {
                backgroundColor,
                borderColor,
                borderRadius,
            },
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        overflow: 'hidden',
        // Note: Real glassmorphism would leverage backdrop-filter. 
        // We simulate it here with high transparency + border against neon backgrounds.
    }
});

export default GlassView;
