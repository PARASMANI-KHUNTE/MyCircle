import React, { useEffect, useState } from 'react';
import { Bell, Moon, Sun, DollarSign, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useCurrencySymbol } from '../context/CurrencySymbolContext';
import { cn } from '../utils/cn';

const Row = ({ title, description, children }) => (
    <div className="flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description && <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

const Section = ({ icon: Icon, title, children }) => (
    <section className="rounded-2xl border border-card-border bg-card p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <div className="divide-y divide-card-border">{children}</div>
    </section>
);

const Toggle = ({ checked, onChange, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            checked ? 'bg-primary' : 'bg-background-tertiary border border-card-border'
        )}
    >
        <span
            className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                checked ? 'translate-x-[22px]' : 'translate-x-0.5'
            )}
        />
    </button>
);

const Settings = () => {
    const { toggleTheme, isDark } = useTheme();
    const { currencySymbol, toggleCurrencySymbol } = useCurrencySymbol();
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        profileVisibility: 'public',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        let active = true;
        api.get('/user/profile')
            .then((res) => {
                if (active && res.data?.preferences) {
                    setPreferences((prev) => ({ ...prev, ...res.data.preferences }));
                }
            })
            .catch(() => { /* keep defaults */ });
        return () => { active = false; };
    }, []);

    const updatePreference = (key, value) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await api.put('/user/settings', preferences);
            setMessage({ type: 'success', text: 'Settings saved.' });
        } catch {
            setMessage({ type: 'error', text: 'Could not save settings. Please try again.' });
        } finally {
            setLoading(false);
            window.setTimeout(() => setMessage(null), 4000);
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
            <header className="mb-5">
                <h1 className="text-xl font-semibold text-foreground">Settings</h1>
                <p className="mt-1 text-sm text-foreground-muted">
                    Manage your preferences and account appearance.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Section icon={Bell} title="Notifications">
                    <Row
                        title="Email notifications"
                        description="Updates about messages, requests, and activity."
                    >
                        <Toggle
                            label="Email notifications"
                            checked={!!preferences.emailNotifications}
                            onChange={(value) => updatePreference('emailNotifications', value)}
                        />
                    </Row>
                </Section>

                <Section icon={Eye} title="Privacy">
                    <Row title="Profile visibility" description="Who can see your profile and posts.">
                        <select
                            value={preferences.profileVisibility}
                            onChange={(e) => updatePreference('profileVisibility', e.target.value)}
                            className="input-modern w-auto min-w-[8rem] py-2"
                        >
                            <option value="public">Public</option>
                            <option value="connections">Connections</option>
                            <option value="private">Private</option>
                        </select>
                    </Row>
                </Section>

                <Section icon={isDark ? Moon : Sun} title="Appearance">
                    <Row title="Theme" description="Switch between light and dark mode.">
                        <Button type="button" variant="outline" size="sm" onClick={toggleTheme}>
                            {isDark ? <Moon className="mr-1.5 h-4 w-4" /> : <Sun className="mr-1.5 h-4 w-4" />}
                            {isDark ? 'Dark' : 'Light'}
                        </Button>
                    </Row>
                </Section>

                <Section icon={DollarSign} title="Currency">
                    <Row title="Currency symbol" description="Used for prices across the app.">
                        <Button type="button" variant="outline" size="sm" onClick={toggleCurrencySymbol}>
                            <span className="text-base font-semibold">{currencySymbol}</span>
                            <span className="ml-1.5 text-foreground-muted">
                                {currencySymbol === '₹' ? 'INR' : 'USD'}
                            </span>
                        </Button>
                    </Row>
                </Section>

                {message && (
                    <div
                        className={cn(
                            'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm',
                            message.type === 'success'
                                ? 'border-success/30 bg-success/10 text-success'
                                : 'border-error/30 bg-error/10 text-error'
                        )}
                        role="status"
                    >
                        {message.type === 'success'
                            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                            : <AlertCircle className="h-4 w-4 shrink-0" />}
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end">
                    <Button type="submit" loading={loading}>
                        {loading ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
