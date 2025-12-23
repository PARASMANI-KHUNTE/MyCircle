import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Lock, Eye, Trash2, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function SettingsScreen() {
    const router = useRouter();
    const { logout } = useAuth();
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
                        // Call API to delete account
                        Alert.alert("Account Deleted", "Your account has been successfully removed.");
                        logout();
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon: Icon, label, value, onValueChange, type = 'switch' }: any) => (
        <View className="flex-row items-center justify-between py-4 border-b border-white/5">
            <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-zinc-900 rounded-xl items-center justify-center border border-white/5">
                    <Icon size={20} color="#a1a1aa" />
                </View>
                <Text className="text-white text-base">{label}</Text>
            </View>
            {type === 'switch' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#27272a', true: '#8b5cf6' }}
                    thumbColor="#fff"
                />
            ) : (
                <ChevronRight size={20} color="#52525b" />
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4 border-b border-white/10 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-white">Settings</Text>
            </View>

            <ScrollView className="flex-1 px-4">
                <View className="mt-6 mb-2">
                    <Text className="text-zinc-500 font-bold uppercase text-xs tracking-widest pl-1">Notifications</Text>
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

                <View className="mt-8 mb-2">
                    <Text className="text-zinc-500 font-bold uppercase text-xs tracking-widest pl-1">Privacy</Text>
                </View>
                <SettingItem
                    icon={Eye}
                    label="Public Profile"
                    value={privacy.publicProfile}
                    onValueChange={(val: boolean) => setPrivacy(prev => ({ ...prev, publicProfile: val }))}
                />
                <SettingItem
                    icon={Lock}
                    label="Password & Security"
                    type="link"
                />

                <View className="mt-8 mb-2">
                    <Text className="text-zinc-500 font-bold uppercase text-xs tracking-widest pl-1">Danger Zone</Text>
                </View>
                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    className="flex-row items-center justify-between py-4"
                >
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 bg-red-500/10 rounded-xl items-center justify-center border border-red-500/20">
                            <Trash2 size={20} color="#ef4444" />
                        </View>
                        <Text className="text-red-500 text-base">Delete Account</Text>
                    </View>
                </TouchableOpacity>

                <View className="mt-auto py-10 items-center">
                    <Text className="text-zinc-600 text-xs text-center">MyCircle v1.0.0</Text>
                    <Text className="text-zinc-700 text-[10px] text-center mt-1">© 2025 Antigravity Technologies</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
