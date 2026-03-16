import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { Bell, Lock, Trash2, Save, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
    const { toggleTheme, isDark } = useTheme();
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        profileVisibility: 'public'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch current user settings
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
        fetchSettings();
    }, []);

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
        setMessage('');
        try {
            await api.put('/user/settings', preferences);
            setMessage('Settings updated successfully!');
        } catch (err) {
            console.error(err);
            setMessage('Failed to update settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-6 py-24 min-h-screen text-foreground">
            <h1 className="text-3xl font-bold text-text-heading mb-8">Account Settings</h1>

            <div className="max-w-2xl mx-auto space-y-8">
                {/* Notifications */}
                <div className="glass-panel p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Bell className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-text-heading">Notifications</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-heading font-medium">Email Notifications</p>
                            <p className="text-sm text-text-muted">Receive emails about new messages and updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="emailNotifications"
                                checked={preferences.emailNotifications}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-hover-bg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-card after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-card-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>

                {/* Theme */}
                <div className="glass-panel p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            {isDark ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                        </div>
                        <h2 className="text-xl font-bold text-text-heading">Appearance</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-heading font-medium">Theme</p>
                            <p className="text-sm text-text-muted">Switch between dark and light mode</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hover-bg hover:opacity-80 transition-all border border-card-border"
                        >
                            {isDark ? (
                                <>
                                    <Moon className="w-4 h-4 text-text-muted" />
                                    <span className="text-text-heading text-sm font-bold">Dark</span>
                                </>
                            ) : (
                                <>
                                    <Sun className="w-4 h-4 text-amber-500" />
                                    <span className="text-text-heading text-sm font-bold">Light</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Privacy */}
                <div className="glass-panel p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-text-heading">Privacy</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-black uppercase tracking-widest text-text-muted mb-2">Profile Visibility</label>
                            <select
                                name="profileVisibility"
                                value={preferences.profileVisibility}
                                onChange={handleChange}
                                className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-heading focus:outline-none focus:border-primary transition-colors"
                            >
                                <option value="public" className="bg-card text-text-heading">Public (Everyone can see your profile)</option>
                                <option value="private" className="bg-card text-text-heading">Private (Only you can see your details)</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-card-border">
                            <a
                                href="/blocked-users"
                                className="flex items-center justify-between p-4 rounded-xl bg-hover-bg hover:opacity-80 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-text-heading font-medium">Blocked Users</p>
                                        <p className="text-sm text-text-muted">Manage blocked users</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-text-muted group-hover:text-text-heading transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
                {message && <p className={`text-center ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}

                {/* Danger Zone */}
                <div className="border border-red-500/20 rounded-2xl p-8 mt-12 bg-red-500/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                    </div>
                    <p className="text-text-muted mb-6">Permanently delete your account and all of your content.</p>
                    <Button variant="outline" className="text-red-500 border-red-500/20 hover:bg-red-500/10 w-full justify-center">
                        Delete Account
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
