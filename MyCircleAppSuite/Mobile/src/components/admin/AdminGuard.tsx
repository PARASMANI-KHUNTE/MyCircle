import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import AppScreen from '../layout/AppScreen';
import ScreenHeader from '../layout/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { isAdminUser } from '../../utils/adminAccess';

type AdminGuardProps = {
    navigation: any;
    children: React.ReactNode;
};

const AdminGuard = ({ navigation, children }: AdminGuardProps) => {
    const { user } = useAuth() as any;
    const { colors } = useTheme();

    if (!isAdminUser(user)) {
        return (
            <AppScreen>
                <ScreenHeader title="Admin" onBack={() => navigation.goBack()} />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
                        Admin access required
                    </Text>
                    <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                        You do not have permission to view this area.
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.primary }}
                    >
                        <Text style={{ color: colors.white, fontWeight: '700' }}>Go back</Text>
                    </TouchableOpacity>
                </View>
            </AppScreen>
        );
    }

    return <>{children}</>;
};

export default AdminGuard;
