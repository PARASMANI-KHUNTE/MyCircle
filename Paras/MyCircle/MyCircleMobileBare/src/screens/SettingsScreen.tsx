import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, StyleSheet } from 'react-native';
import ThemedAlert from '../components/ui/ThemedAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Lock, Eye, Trash2, ChevronRight, UserX, Moon, Sun, Info } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';
import GlassView from '../components/ui/GlassView';
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FloatingShape = ({ delay = 0, color, size, top, left }: any) => {
    const translationY = useSharedValue(0);
    const translationX = useSharedValue(0);

    React.useEffect(() => {
        translationY.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.sin) })),
                withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
        translationX.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(-15, { duration: 4000, easing: Easing.inOut(Easing.sin) })),
                withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translationY.value }, { translateX: translationX.value }],
    }));

    return (
        <Animated.View
            style={[
                styles.floatingShape,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    top,
                    left,
                },
                animatedStyle,
            ]}
        />
    );
};

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
        <SafeAreaView style={styles.container} edges={['top']}>
            <FloatingShape color="rgba(139, 92, 246, 0.15)" size={400} top={-200} left={-150} delay={0} />
            <FloatingShape color="rgba(236, 72, 153, 0.1)" size={300} top={SCREEN_HEIGHT * 0.5} left={SCREEN_WIDTH - 150} delay={1000} />

            <GlassView intensity={20} borderRadius={0} style={styles.headerGlass}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassCircleBtn}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleMain}>Settings</Text>
                </View>
            </GlassView>

            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(150).springify()}>
                    <GlassView intensity={10} style={styles.settingsGroup}>
                        <SettingItem
                            icon={theme === 'dark' ? Moon : Sun}
                            label="Dark Mode"
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                        />
                    </GlassView>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(250).springify()}>
                    <GlassView intensity={10} style={styles.settingsGroup}>
                        <SettingItem
                            icon={Bell}
                            label="Push Notifications"
                            value={notifications.push}
                            onValueChange={(val: boolean) => setNotifications(prev => ({ ...prev, push: val }))}
                        />
                    </GlassView>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Privacy</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(350).springify()}>
                    <GlassView intensity={10} style={styles.settingsGroup}>
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
                            <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>
                    </GlassView>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danger Zone</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(450).springify()}>
                    <GlassView intensity={5} style={[styles.settingsGroup, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
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
                            <ChevronRight size={20} color="#ef4444" opacity={0.5} />
                        </TouchableOpacity>
                    </GlassView>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.footer}>
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
        backgroundColor: '#09090b',
    },
    headerGlass: {
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    glassCircleBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginRight: 16,
    },
    headerTitleMain: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
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
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '900',
        textTransform: 'uppercase',
        fontSize: 12,
        letterSpacing: 2,
    },
    settingsGroup: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
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
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
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
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
        fontWeight: '600',
    },
    copyrightText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 11,
        marginTop: 6,
    },
    floatingShape: {
        position: 'absolute',
        opacity: 0.5,
    },
});

export default SettingsScreen;
