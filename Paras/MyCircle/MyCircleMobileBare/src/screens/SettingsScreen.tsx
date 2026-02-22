import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, StyleSheet, StatusBar, Dimensions } from 'react-native';
import ThemedAlert from '../components/ui/ThemedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Lock, Eye, Trash2, ChevronRight, UserX, Moon, Sun, Info } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

    const handleDeleteAccount = () => {
        setAlertConfig({
            visible: true,
            title: "Delete Account",
            message: "This action is permanent. All your posts and messages will be removed.",
            confirmText: 'Delete',
            isDestructive: true,
            onConfirm: () => {
                setAlertConfig({
                    visible: true,
                    title: "Account Deleted",
                    message: "Your account has been successfully removed.",
                    confirmText: 'OK',
                    isDestructive: false,
                    onConfirm: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        logout();
                    }
                });
            }
        });
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(250).duration(800).springify()}>
                    <View style={styles.settingsGroup}>
                        <SettingItem
                            icon={theme === 'dark' ? Moon : Sun}
                            label="Dark Mode"
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(350).duration(800).springify()}>
                    <View style={styles.settingsGroup}>
                        <SettingItem
                            icon={Bell}
                            label="Push Notifications"
                            value={notifications.push}
                            onValueChange={(val: boolean) => setNotifications(prev => ({ ...prev, push: val }))}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Privacy</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(450).duration(800).springify()}>
                    <View style={styles.settingsGroup}>
                        <TouchableOpacity
                            style={[styles.settingItem, { borderBottomWidth: 0 }]}
                            onPress={() => navigation.navigate('BlockedUsers')}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconContainer, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                                    <UserX size={20} color="#ef4444" />
                                </View>
                                <Text style={styles.settingLabel}>Blocked Users</Text>
                            </View>
                            <ChevronRight size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(500).duration(800).springify()} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danger Zone</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(550).duration(800).springify()}>
                    <View style={[styles.settingsGroup, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
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
                            <ChevronRight size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600).duration(800).springify()} style={styles.footer}>
                    <Text style={styles.versionText}>MyCircle v1.0.0</Text>
                    <Text style={styles.copyrightText}>© 2026 Antigravity Technologies</Text>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        marginTop: 32,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        color: '#94a3b8',
        fontWeight: '700',
        textTransform: 'uppercase',
        fontSize: 12,
        letterSpacing: 2,
    },
    settingsGroup: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    settingLabel: {
        color: '#ffffff',
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
    deleteIconContainer: {
        width: 42,
        height: 42,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    deleteText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 14,
    },
    footer: {
        marginTop: 40,
        paddingVertical: 40,
        alignItems: 'center',
    },
    versionText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '600',
    },
    copyrightText: {
        color: '#64748b',
        fontSize: 11,
        marginTop: 6,
    },
});

export default SettingsScreen;
