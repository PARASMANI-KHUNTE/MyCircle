import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircleDot, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { cn } from '../utils/cn';

const Login = () => {
    const { isAuthenticated, loading, login, loginWithPassword, registerUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isExpired = searchParams.get('expired') === 'true';
    const authError = searchParams.get('error');

    const [mode, setMode] = useState('signin');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            if (mode === 'register') {
                await registerUser(displayName.trim(), email.trim(), password);
            } else {
                await loginWithPassword(email.trim(), password);
            }
            navigate('/', { replace: true });
        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                err.response?.data?.msg ||
                'Could not sign in. Please check your details and try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <Loading fullscreen text="Checking session..." />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <CircleDot className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground">MyCircle</h1>
                    <p className="mt-1.5 text-sm text-foreground-muted">
                        Connect with your local community.
                    </p>
                </div>

                <div className="space-y-4">
                    {isExpired && (
                        <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            Your session expired. Please sign in again.
                        </div>
                    )}
                    {authError === 'oauth' && (
                        <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-foreground">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                            Sign-in failed. Please try again.
                        </div>
                    )}

                    <div className="flex gap-1 rounded-xl border border-card-border bg-background-secondary p-1">
                        {[
                            { id: 'signin', label: 'Sign in' },
                            { id: 'register', label: 'Create account' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setMode(tab.id);
                                    setFormError('');
                                }}
                                className={cn(
                                    'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    mode === tab.id
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-foreground-muted hover:text-foreground'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {mode === 'register' && (
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-foreground-muted">
                                    Display name
                                </span>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                    maxLength={50}
                                    autoComplete="name"
                                    className="input-modern"
                                />
                            </label>
                        )}

                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-foreground-muted">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="input-modern"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-foreground-muted">Password</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                className="input-modern"
                            />
                            {mode === 'register' && (
                                <span className="mt-1 block text-[11px] text-foreground-muted">
                                    At least 8 characters.
                                </span>
                            )}
                        </label>

                        {formError && (
                            <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-foreground">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                                {formError}
                            </div>
                        )}

                        <Button type="submit" size="lg" className="w-full" loading={submitting}>
                            {mode === 'register' ? 'Create account' : 'Sign in'}
                        </Button>
                    </form>

                    <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-card-border" />
                        <span className="text-xs text-foreground-muted">or</span>
                        <span className="h-px flex-1 bg-card-border" />
                    </div>

                    <Button variant="outline" size="lg" className="w-full" onClick={() => login()}>
                        Continue with Google
                    </Button>
                </div>

                <p className="mt-6 text-center text-xs text-foreground-muted">
                    By continuing you agree to our community guidelines.
                </p>
            </div>
        </div>
    );
};

export default Login;
