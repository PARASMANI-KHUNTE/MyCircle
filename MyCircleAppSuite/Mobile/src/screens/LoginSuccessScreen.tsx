import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'LoginSuccess'>;

const LoginSuccessScreen = ({ navigation, route }: Props) => {
    const { login } = useAuth();
    const { colors, typography } = useTheme();

    useEffect(() => {
        let isMounted = true;

        async function completeLogin() {
            const token = route.params?.token;

            if (!token) {
                navigation.replace('Landing');
                return;
            }

            await login(token);

            if (isMounted) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }
        }

        void completeLogin();

        return () => {
            isMounted = false;
        };
    }, [login, navigation, route.params?.token]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.title, { color: colors.text, fontSize: typography.size.title }]}>
                Signing you in
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Finalizing your MyCircle session securely.
            </Text>
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
    title: {
        marginTop: 16,
        fontWeight: '700',
    },
    subtitle: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
});

export default LoginSuccessScreen;
