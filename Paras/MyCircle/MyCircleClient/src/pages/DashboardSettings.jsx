import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { Bell, Lock, Trash2, Save, Moon, Sun, Shield, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const DashboardSettings = () => {
    const { theme, toggleTheme, isDark } = useTheme();
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        profileVisibility: 'public'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/user/profile');
            if (res.data.preferences) {
                setPreferences(res.data.preferences);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPreferences(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/user/settings', preferences);
            success('Settings updated successfully!');
        } catch (err) {
            console.error(err);
            showError('Failed to update settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account preferences</p>
            </div>

            <div className="space-y-4">
                {/* Notifications */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="text-slate-900 font-medium">Email Notifications</p>
                            <p className="text-sm text-slate-500">Receive emails about new messages and updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="emailNotifications"
                                checked={preferences.emailNotifications}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                {/* Appearance */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-yellow-50">
                            {isDark ? <Moon className="w-5 h-5 text-yellow-600" /> : <Sun className="w-5 h-5 text-yellow-600" />}
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Appearance</h2>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="text-slate-900 font-medium">Theme</p>
                            <p className="text-sm text-slate-500">Switch between dark and light mode</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            {isDark ? (
                                <>
                                    <Moon className="w-4 h-4 text-slate-700" />
                                    <span className="text-sm font-medium text-slate-700">Dark</span>
                                </>
                            ) : (
                                <>
                                    <Sun className="w-4 h-4 text-slate-700" />
                                    <span className="text-sm font-medium text-slate-700">Light</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Privacy */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-50">
                            <Lock className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Privacy</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Profile Visibility</label>
                            <select
                                name="profileVisibility"
                                value={preferences.profileVisibility}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                            >
                                <option value="public">Public (Everyone can see your profile)</option>
                                <option value="private">Private (Only you can see your details)</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <button
                                onClick={() => { }}
                                className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-50">
                                        <Shield className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-slate-900 font-medium">Blocked Users</p>
                                        <p className="text-sm text-slate-500">Manage blocked users</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-black transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="border-2 border-red-200 rounded-xl p-6 mt-8 bg-red-50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-red-100">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
                    </div>
                    <p className="text-red-700 mb-4 text-sm">Permanently delete your account and all of your content.</p>
                    <button className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardSettings;
