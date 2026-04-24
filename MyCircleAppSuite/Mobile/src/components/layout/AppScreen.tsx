import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';

type AppScreenProps = {
    children: React.ReactNode;
    edges?: Edge[];
    withBackground?: boolean;
};

const AppScreen = ({
    children,
    edges = ['top'],
    withBackground = true,
}: AppScreenProps) => {
    const { colors, isDark } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={edges}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            {withBackground ? (
                <View pointerEvents="none" style={styles.backgroundGradient}>
                    <View style={[styles.gradientLayer, { backgroundColor: colors.gradientStart }]} />
                    <View style={[styles.gradientLayer, { backgroundColor: colors.gradientMiddle, opacity: isDark ? 0.8 : 0.45 }]} />
                    <View style={[styles.gradientLayer, { backgroundColor: colors.gradientEnd, opacity: isDark ? 0.6 : 0.32 }]} />
                </View>
            ) : null}
            {children}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    gradientLayer: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default AppScreen;

