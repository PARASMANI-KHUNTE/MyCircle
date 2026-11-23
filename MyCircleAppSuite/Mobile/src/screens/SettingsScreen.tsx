import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Bell, ChevronRight, HelpCircle, MessageSquare, Moon, RefreshCw, Shield, Sun, Trash2, UserX } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AppScreen from '../components/layout/AppScreen';
import ScreenHeader from '../components/layout/ScreenHeader';
import ThemedAlert from '../components/ui/ThemedAlert';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { checkForAppUpdate, UpdateStatusState } from '../services/updateService';

const SettingsScreen = ({ navigation }: any) => {
    const { logout, isAdmin } = useAuth() as any;
    const { theme, toggleTheme, colors } = useTheme();
    const [notifications, setNotifications] = useState({ push: true });
    const [updateStatus, setUpdateStatus] = useState<string>('');
    const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        isDestructive: boolean;
    }>({
        visible: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: () => { },
        isDestructive: false,
    });

    const handleCheckUpdate = async () => {
        setIsCheckingUpdate(true);
        setUpdateStatus('Checking for updates...');
        const result = await checkForAppUpdate({
            isManual: true,
            onStatusChange: (state: UpdateStatusState) => {
                setUpdateStatus(state.statusText);
            },
        });
        setIsCheckingUpdate(false);
        setAlertConfig({
            visible: true,
            title: result.success ? 'App Updates' : 'Update Check',
            message: result.message,
            confirmText: 'OK',
            isDestructive: false,
            onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        });
    };

    const performDeleteAccount = async () => {
        if (isDeletingAccount) return;

        setIsDeletingAccount(true);
        try {
            await api.delete('/user/account');
            setAlertConfig({
                visible: true,
                title: 'Account Deleted',
                message: 'Your account and associated data have been removed.',
                confirmText: 'OK',
                isDestructive: false,
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    void logout();
                },
            });
        } catch (error: any) {
            setAlertConfig({
                visible: true,
                title: 'Could Not Delete Account',
                message: error?.userFriendlyMessage || error?.response?.data?.msg ||
                    'We could not delete your account. Please try again.',
                confirmText: 'OK',
                isDestructive: false,
                onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
            });
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleDeleteAccount = () => {
        setAlertConfig({
            visible: true,
            title: 'Delete Account',
            message: 'This action is permanent. All your posts and messages will be removed.',
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: () => {
                void performDeleteAccount();
            },
        });
    };

    const SettingItem = ({
        icon: Icon,
        label,
        value,
        onValueChange,
        onPress,
    }: {
        icon: typeof Bell;
        label: string;
        value?: boolean;
        onValueChange?: (value: boolean) => void;
        onPress?: () => void;
    }) => (
        <TouchableOpacity
            activeOpacity={onPress ? 0.85 : 1}
            onPress={onPress}
            disabled={!onPress}
            style={[styles.settingItem, { borderColor: colors.borderSoft }]}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.backdrop, borderColor: colors.borderSoft }]}>
                    <Icon size={20} color={colors.textSecondary} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
            </View>
            {typeof value === 'boolean' && onValueChange ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: colors.elevated, true: colors.primary }}
                    thumbColor={colors.white}
                />
            ) : (
                <ChevronRight size={20} color={colors.textSecondary} />
            )}
        </TouchableOpacity>
    );

    return (
        <AppScreen>
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
                <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(250).duration(800).springify()}>
                    <View style={[styles.group, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <SettingItem
                            icon={theme === 'dark' ? Moon : Sun}
                            label="Dark Mode"
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(350).duration(800).springify()}>
                    <View style={[styles.group, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <SettingItem
                            icon={Bell}
                            label="Push Notifications"
                            value={notifications.push}
                            onValueChange={(value) => setNotifications({ push: value })}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(425).duration(800).springify()}>
                    <View style={[styles.group, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <SettingItem
                            icon={HelpCircle}
                            label="Help & Support"
                            onPress={() => navigation.navigate('Support', { type: 'help' })}
                        />
                        <SettingItem
                            icon={MessageSquare}
                            label="Send Feedback"
                            onPress={() => navigation.navigate('Support', { type: 'feedback' })}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(450).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Updates</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(450).duration(800).springify()}>
                    <View style={[styles.group, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <SettingItem
                            icon={RefreshCw}
                            label={isCheckingUpdate ? 'Checking for updates...' : (updateStatus || 'Check for Updates')}
                            onPress={handleCheckUpdate}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(500).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Privacy</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(450).duration(800).springify()}>
                    <View style={[styles.group, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                        <SettingItem
                            icon={UserX}
                            label="Blocked Users"
                            onPress={() => navigation.navigate('BlockedUsers')}
                        />
                    </View>
                </Animated.View>

                {isAdmin && (
                    <>
                        <Animated.View entering={FadeInDown.delay(475).duration(800).springify()} style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Administration</Text>
                        </Animated.View>
                        <Animated.View entering={FadeInDown.delay(500).duration(800).springify()}>
                            <View style={[styles.group, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                                <SettingItem
                                    icon={Shield}
                                    label="Admin Panel"
                                    onPress={() => navigation.navigate('AdminDashboard')}
                                />
                            </View>
                        </Animated.View>
                    </>
                )}

                <Animated.View entering={FadeInDown.delay(500).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Danger Zone</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(550).duration(800).springify()}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={isDeletingAccount}
                        onPress={handleDeleteAccount}
                        style={[styles.group, styles.deleteRow, { backgroundColor: colors.cardSoft, borderColor: colors.dangerSoft }]}
                    >
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft }]}>
                                <Trash2 size={20} color={colors.danger} />
                            </View>
                            <Text style={[styles.settingLabel, { color: colors.danger }]}>
                                {isDeletingAccount ? 'Deleting account...' : 'Delete Account'}
                            </Text>
                        </View>
                        <ChevronRight size={20} color={colors.danger} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600).duration(800).springify()} style={styles.footer}>
                    <Image source={require('../assets/logo.png')} style={styles.footerLogo} resizeMode="contain" />
                    <Text style={[styles.versionText, { color: colors.textSecondary }]}>MyCircle v1.0.0</Text>
                    <Text style={[styles.copyrightText, { color: colors.textMuted }]}>Hyperlocal Community & Marketplace</Text>
                </Animated.View>
            </ScrollView>

            <ThemedAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                isDestructive={alertConfig.isDestructive}
                onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
            />
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionHeader: {
        marginTop: 32,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontWeight: '700',
        textTransform: 'uppercase',
        fontSize: 12,
        letterSpacing: 2,
    },
    group: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 18,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 14,
    },
    deleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 18,
    },
    footer: {
        marginTop: 40,
        paddingVertical: 40,
        alignItems: 'center',
    },
    footerLogo: {
        width: 36,
        height: 36,
        marginBottom: 10,
        opacity: 0.85,
    },
    versionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    copyrightText: {
        fontSize: 11,
        marginTop: 6,
    },
});

export default SettingsScreen;
