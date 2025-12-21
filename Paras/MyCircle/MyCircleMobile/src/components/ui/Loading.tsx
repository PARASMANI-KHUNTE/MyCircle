import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingProps {
    fullscreen?: boolean;
    text?: string;
    size?: 'small' | 'large';
}

const Loading = ({ fullscreen = false, text, size = 'large' }: LoadingProps) => {
    if (fullscreen) {
        return (
            <View style={styles.fullscreenContainer}>
                <ActivityIndicator size={size} color="#8B5CF6" />
                {text && <Text style={styles.text}>{text}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.inlineContainer}>
            <ActivityIndicator size={size} color="#8B5CF6" />
            {text && <Text style={styles.text}>{text}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    fullscreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    inlineContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        color: '#FFFFFF',
        marginTop: 12,
        fontSize: 14,
    },
});

export default Loading;
