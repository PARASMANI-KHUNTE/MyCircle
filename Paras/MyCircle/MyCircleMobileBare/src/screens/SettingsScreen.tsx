import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Lock, Eye, Trash2, ChevronRight, UserX, Moon, Sun } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }: any) => {
    const { logout } = useAuth() as any;
    const { theme, toggleTheme, colors } = useTheme();

    // Dynamic styles based on theme
    const themeStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        card: { backgroundColor: colors.card },
        border: { borderColor: colors.border },
        iconContainer: { backgroundColor: colors.card, borderColor: colors.border }
    };

    const [notifications, setNotifications] = useState({
        push: true,
        email: true,
        activity: true
    });
    const [privacy, setPrivacy] = useState({
        publicProfile: true,
        showLocation: true
    });

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action is permanent. All your posts and messages will be removed.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: () => {
                        Alert.alert("Account Deleted", "Your account has been successfully removed.");
                        logout();
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon: Icon, label, value, onValueChange, type = 'switch' }: any) => (
        <View style={[styles.settingItem, themeStyles.border]}>
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, themeStyles.iconContainer]}>
                    <Icon size={20} color={colors.textSecondary} />
                </View>
                <Text style={[styles.settingLabel, themeStyles.text]}>{label}</Text>
            </View>
            {type === 'switch' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: colors.card, true: colors.primary }}
                    thumbColor="#fff"
                />
            ) : (
                <ChevronRight size={20} color={colors.textSecondary} />
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, themeStyles.text]}>Settings</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                </View>
                <SettingItem
                    icon={theme === 'dark' ? Moon : Sun}
                    label="Dark Mode"
                    value={theme === 'dark'}
                    onValueChange={toggleTheme}
                />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                </View>
                <SettingItem
                    icon={Bell}
                    label="Push Notifications"
                    value={notifications.push}
                    onValueChange={(val: boolean) => setNotifications(prev => ({ ...prev, push: val }))}
                />
                <SettingItem
                    icon={Bell}
                    label="Email Alerts"
                    value={notifications.email}
                    onValueChange={(val: boolean) => setNotifications(prev => ({ ...prev, email: val }))}
                />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Privacy</Text>
                </View>
                <SettingItem
                    icon={Eye}
                    label="Public Profile"
                    value={privacy.publicProfile}
                    onValueChange={(val: boolean) => setPrivacy(prev => ({ ...prev, publicProfile: val }))}
                />
                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => navigation.navigate('BlockedUsers')}
                >
                    <View style={styles.settingLeft}>
                        <UserX size={20} color="#ef4444" />
                        <Text style={styles.settingLabel}>Blocked Users</Text>
                    </View>
                    <ChevronRight size={20} color="#52525b" />
                </TouchableOpacity>
                <SettingItem
                    icon={Lock}
                    label="Password & Security"
                    type="link"
                />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danger Zone</Text>
                </View>
                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    style={styles.deleteRow}
                >
                    <View style={styles.settingLeft}>
                        <View style={styles.deleteIconContainer}>
                            <Trash2 size={20} color="#ef4444" />
                        </View>
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>MyCircle v1.0.0</Text>
                    <Text style={styles.copyrightText}>© 2025 Antigravity Technologies</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        marginTop: 24,
        marginBottom: 8,
    },
    sectionTitle: {
        color: '#71717a', // zinc-500
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: 12,
        letterSpacing: 1.5,
        paddingLeft: 4,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#18181b', // zinc-900
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    settingLabel: {
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 12,
    },
    deleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    deleteIconContainer: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500/10
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    deleteText: {
        color: '#ef4444',
        fontSize: 16,
        marginLeft: 12,
    },
    footer: {
        marginTop: 'auto',
        paddingVertical: 40,
        alignItems: 'center',
    },
    versionText: {
        color: '#52525b', // zinc-600
        fontSize: 12,
        textAlign: 'center',
    },
    copyrightText: {
        color: '#3f3f46', // zinc-700
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
    },
});

export default SettingsScreen;
