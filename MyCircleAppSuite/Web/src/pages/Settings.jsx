import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { Bell, Lock, Trash2, Save, Moon, Sun, ChevronRight, UserX, CheckCircle2, AlertCircle, DollarSign, Filter } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCurrencySymbol } from '../context/CurrencySymbolContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';
import { describeFeedPreset } from '../utils/feedPresets';

const Settings = () => {
    const { toggleTheme, isDark } = useTheme();
    const { currencySymbol, toggleCurrencySymbol } = useCurrencySymbol();
    const { refreshUser } = useAuth();
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        profileVisibility: 'public',
        notificationCategories: {
            contactRequests: true,
            messages: true,
            postExpiry: true,
        },
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '07:00',
            timezone: 'UTC',
        },
        feedPresets: [],
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/user/profile');
                if (res.data.preferences) {
                    const saved = res.data.preferences;
                    setPreferences(prev => ({
                        ...prev,
                        ...saved,
                        notificationCategories: { ...prev.notificationCategories, ...(saved.notificationCategories || {}) },
                        quietHours: { ...prev.quietHours, ...(saved.quietHours || {}) },
                        feedPresets: Array.isArray(saved.feedPresets) ? saved.feedPresets : [],
                    }));
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

    const handleNestedChange = (group, field, e) => {
        const { type, value, checked } = e.target;
        setPreferences(prev => ({
            ...prev,
            [group]: {
                ...prev[group],
                [field]: type === 'checkbox' ? checked : value,
            },
        }));
    };

    const deletePreset = async (name) => {
        setLoading(true);
        try {
            const feedPresets = (preferences.feedPresets || []).filter(preset => preset.name !== name);
            await api.put('/user/settings', { feedPresets });
            setPreferences(prev => ({ ...prev, feedPresets }));
            await refreshUser();
            setMessage('Preset removed.');
            setMessageType('success');
        } catch (err) {
            console.error(err);
            setMessage('Failed to remove preset. Please try again.');
            setMessageType('error');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.put('/user/settings', preferences);
            await refreshUser();
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
        <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 min-h-screen max-w-2xl">
            <div className="mb-8">
                <p className="text-sm text-foreground-muted mt-1">Manage your preferences and account details.</p>
            </div>

            <div className="space-y-4">
                {/* Notifications */}
                <div className="glass-panel p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold">Notifications</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                    <div className="mt-5 pt-5 border-t border-card-border space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted">Notification types</p>
                        {[
                            { key: 'contactRequests', label: 'Contact requests', description: 'New requests and application updates' },
                            { key: 'messages', label: 'Messages', description: 'New chat messages' },
                            { key: 'postExpiry', label: 'Post expiry', description: 'Posts expiring, archiving and expired requests' },
                        ].map(({ key, label, description }) => (
                            <div key={key} className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{label}</p>
                                    <p className="text-xs text-foreground-muted mt-0.5">{description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={preferences.notificationCategories[key]}
                                        onChange={(e) => handleNestedChange('notificationCategories', key, e)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-card-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 pt-5 border-t border-card-border space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted">Quiet hours</p>
                        <label className="flex items-center justify-between gap-4">
                            <span className="text-sm font-semibold text-foreground">Pause notifications overnight</span>
                            <input
                                type="checkbox"
                                checked={preferences.quietHours.enabled}
                                onChange={(e) => handleNestedChange('quietHours', 'enabled', e)}
                                className="accent-primary w-5 h-5"
                            />
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-foreground-muted mb-1">Start</label>
                                <input
                                    type="time"
                                    value={preferences.quietHours.start}
                                    onChange={(e) => handleNestedChange('quietHours', 'start', e)}
                                    className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-foreground-muted mb-1">End</label>
                                <input
                                    type="time"
                                    value={preferences.quietHours.end}
                                    onChange={(e) => handleNestedChange('quietHours', 'end', e)}
                                    className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-foreground-muted mb-1">Timezone</label>
                                <input
                                    type="text"
                                    value={preferences.quietHours.timezone}
                                    onChange={(e) => handleNestedChange('quietHours', 'timezone', e)}
                                    placeholder="Asia/Kolkata"
                                    className="w-full bg-card border border-card-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary min-h-[44px]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saved feed presets */}
                <div className="glass-panel p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Filter className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold">Saved feed presets</h2>
                    </div>
                    {preferences.feedPresets.length === 0 ? (
                        <p className="text-sm text-foreground-muted">
                            No presets yet. Save your current filters from the Feed page to reuse them here.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {preferences.feedPresets.map((preset) => (
                                <div key={preset.name} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-card border border-card-border">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground">{preset.name}</p>
                                        <p className="text-xs text-foreground-muted mt-0.5 break-words">{describeFeedPreset(preset)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => deletePreset(preset.name)}
                                        disabled={loading}
                                        className="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold text-error border border-error/20 hover:bg-error/10 disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Appearance */}
                <div className="glass-panel p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                            {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </div>
                        <h2 className="text-base font-bold">Appearance</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                {/* Currency Symbol */}
                <div className="glass-panel p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold">Currency</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Currency Symbol</p>
                            <p className="text-xs text-foreground-muted mt-0.5">Choose your preferred currency symbol</p>
                        </div>
                        <button
                            onClick={toggleCurrencySymbol}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card-hover hover:bg-background-tertiary transition-all border border-card-border text-sm font-semibold min-h-[44px]"
                        >
                            <span className="text-lg font-bold">{currencySymbol}</span>
                            <span className="text-foreground-muted">{currencySymbol === '₹' ? 'INR' : 'USD'}</span>
                        </button>
                    </div>
                </div>

                {/* Privacy */}
                <div className="glass-panel p-4 sm:p-6">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 w-full">
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
                    <Button variant="primary" onClick={handleSubmit} disabled={loading} className="gap-2 w-full sm:w-auto justify-center shrink-0">
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                {/* Danger Zone */}
                <div className="border border-error/20 rounded-2xl p-4 sm:p-6 bg-error/5">
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
