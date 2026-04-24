import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { Bell, Lock, Trash2, Save, Moon, Sun, ChevronRight, UserX, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

const Settings = () => {
    const { toggleTheme, isDark } = useTheme();
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        profileVisibility: 'public'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    useEffect(() => {
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
            setMessage('Settings saved successfully!');
            setMessageType('success');
        } catch (err) {
            console.error(err);
            setMessage('Failed to update settings. Please try again.');
            setMessageType('error');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 min-h-screen max-w-2xl">
            <div className="mb-8">
                <p className="text-sm text-foreground-muted mt-1">Manage your preferences and account details.</p>
            </div>

            <div className="space-y-4">
                {/* Notifications */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold">Notifications</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                            <p className="text-xs text-foreground-muted mt-0.5">Receive emails about new messages and updates</p>
                        </div>
                        {/* Toggle switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="emailNotifications"
                                checked={preferences.emailNotifications}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-card-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                        </label>
                    </div>
                </div>

                {/* Appearance */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                            {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </div>
                        <h2 className="text-base font-bold">Appearance</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Theme</p>
                            <p className="text-xs text-foreground-muted mt-0.5">Switch between dark and light mode</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card-hover hover:bg-background-tertiary transition-all border border-card-border text-sm font-semibold min-h-[44px]"
                        >
                            {isDark ? (
                                <>
                                    <Moon className="w-4 h-4 text-foreground-muted" />
                                    <span>Dark</span>
                                </>
                            ) : (
                                <>
                                    <Sun className="w-4 h-4 text-warning" />
                                    <span>Light</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Privacy */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold">Privacy</h2>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-foreground-muted mb-2">Profile Visibility</label>
                            <select
                                name="profileVisibility"
                                value={preferences.profileVisibility}
                                onChange={handleChange}
                                className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[44px]"
                            >
                                <option value="public">Public — Everyone can see your profile</option>
                                <option value="private">Private — Only you can see your details</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-card-border">
                            <a
                                href="/blocked-users"
                                className="flex items-center justify-between p-4 rounded-xl bg-card-hover hover:bg-background-tertiary transition-all group border border-transparent hover:border-card-border"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-error/10 text-error flex items-center justify-center">
                                        <UserX className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Blocked Users</p>
                                        <p className="text-xs text-foreground-muted">Manage blocked users</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Save + feedback */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        {message && (
                            <div className={cn(
                                'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium',
                                messageType === 'success'
                                    ? 'bg-success/10 border-success/20 text-success'
                                    : 'bg-error/10 border-error/20 text-error'
                            )}>
                                {messageType === 'success'
                                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    : <AlertCircle className="w-4 h-4 shrink-0" />
                                }
                                {message}
                            </div>
                        )}
                    </div>
                    <Button variant="primary" onClick={handleSubmit} disabled={loading} className="gap-2 shrink-0">
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                {/* Danger Zone */}
                <div className="border border-error/20 rounded-2xl p-6 bg-error/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-error/10 text-error flex items-center justify-center">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold text-error">Danger Zone</h2>
                    </div>
                    <p className="text-sm text-foreground-muted mb-5 leading-relaxed">
                        Permanently delete your account and all of your content. This action cannot be undone.
                    </p>
                    <Button
                        variant="outline"
                        className="text-error border-error/20 hover:bg-error/10 hover:border-error/40 w-full justify-center"
                    >
                        Delete Account
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
