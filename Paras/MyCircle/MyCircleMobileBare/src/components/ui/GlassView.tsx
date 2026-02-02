import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
// Note: If you have @react-native-community/blur, use it here. 
// Since this is a "bare" project without explicit confirmation of that library, 
// we will simulate glassmorphism with high-quality translucency and borders.
// If the user installs the blur library later, we can upgrade this.

interface GlassViewProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    intensity?: number; // 0-100 (simulated opacity)
    borderRadius?: number;
    variant?: 'light' | 'dark';
}

const GlassView = ({
    children,
    style,
    intensity = 15,
    borderRadius = 24,
    variant = 'dark'
}: GlassViewProps) => {

    // Simulate glass with semi-transparent background and border
    const backgroundColor = variant === 'dark'
        ? `rgba(30, 41, 59, ${intensity / 100})` // Slate-800 based
        : `rgba(255, 255, 255, ${intensity / 100})`;

    const borderColor = variant === 'dark'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.3)';

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
        // In a real glass effect, we want backdropFilter but RN doesn't support it natively without native modules.
        // We rely on the semi-transparent color + border to convey the "glass" look on top of complex backgrounds.
    }
});

export default GlassView;
