import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'NotFound'>;

const NotFoundScreen = ({ navigation, route }: Props) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.code, { color: colors.primary }]}>404</Text>
            <Text style={[styles.title, { color: colors.text }]}>Screen not found</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {route.params?.path ? `No mobile screen matches "${route.params.path}".` : 'That route does not exist in the mobile app.'}
            </Text>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.replace('MainTabs')}
                style={[styles.button, { backgroundColor: colors.primary }]}
            >
                <Text style={[styles.buttonText, { color: colors.white }]}>Go to Explore</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    code: {
        fontSize: 48,
        fontWeight: '800',
    },
    title: {
        marginTop: 8,
        fontSize: 24,
        fontWeight: '800',
    },
    subtitle: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
    button: {
        minHeight: 44,
        marginTop: 24,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default NotFoundScreen;

