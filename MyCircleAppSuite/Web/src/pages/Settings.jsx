import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useCurrencySymbol } from '../context/CurrencySymbolContext';
import { cn } from '../utils/cn';

const Settings = () => {
    const { toggleTheme, isDark } = useTheme();
    const { currencySymbol, toggleCurrencySymbol } = useCurrencySymbol();
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
        <div className="min-h-screen bg-background text-foreground py-6 px-4 sm:px-6 lg:px-8 max-w-2xl">
            <div className="mb-6">
                <p className="text-sm text-muted-foreground mt-1">Manage your preferences and account details.</p>
            </div>

            <div className="space-y-4">
                {/* Notifications */}
                <div className="p-4 sm:p-6 border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-orange/10 text-orange flex items-center justify-center">
                            <i className="bell-icon" style="width:1.25rem;height:1.25rem;" />
                        </div>
                        <h2 className="text-base font-bold">Notifications</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Receive emails about new messages and updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="emailNotifications"
                                checked={preferences.emailNotifications}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-background rounded-full peer-focus:outline-none peer-focus:ring-2 peer-orange-500/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
                        </label>
                    </div>
                </div>

                {/* Appearance */}
                <div className="p-4 sm:p-6 border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-orange/10 text-orange flex items-center justify-center">
                            {isDark ? <i className="moon-icon" style="width:1rem;height:1rem;" /> : <i className="sun-icon" style="width:1rem;height:1rem;" />}
                        </div>
                        <h2 className="text-base font-bold">Appearance</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-foreground">Theme</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Switch between dark and light mode</p>
                        <button
                            onClick={toggleTheme}
                            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 hover:bg-background/80 transition-all border border-border text-sm font-semibold min-h-[44px]"
                        >
                            {isDark ? (
                                <>
                                    <i className="moon-icon" style="width:1rem;height:1rem;" /> Dark
                                </>
                            ) : (
                                <>
                                    <i className="sun-icon" style="width:1rem;height:1rem;" /> Light
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Currency Symbol */}
                <div className="p-4 sm:p-6 border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-orange/10 text-orange flex items-center justify-center">
                            <i className="dollar-icon" style="width:1rem;height:1rem;" />
                        </div>
                        <h2 className="text-base font-bold">Currency</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-foreground">Currency Symbol</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Choose your preferred currency symbol</p>
                        <button
                            onClick={toggleCurrencySymbol}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 hover:bg-background/80 transition-all border border-border text-sm font-semibold min-h-[44px]"
                        >
                            <span className="text-lg font-bold">{currencySymbol}</span>
                            <span className="text-muted-foreground">{currencySymbol === '₹' ? 'INR' : 'USD'}</span>
                        </button>
                    </div>
                </div>

                {/* Save + feedback */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                        {message && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium">
                                {messageType === 'success'
                                    ? <i className="check-icon" style="width:1rem;height:1rem;" /> Success: {message}
                                    : <i className="alert-icon" style="width:1rem;height:1rem;" /> Error: {message}"
                                }
                            </div>
                        )}
                    </div>
                    <button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="gap-2 w-full sm:w-auto justify-center shrink-0"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;