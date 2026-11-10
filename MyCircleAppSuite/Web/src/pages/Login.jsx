import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircleDot, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';

const Login = () => {
    const { isAuthenticated, loading, login, loginWithPassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isExpired = searchParams.get('expired') === 'true';
    const authError = searchParams.get('error');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
            await loginWithPassword(email.trim(), password);
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

    const handleGoogleLogin = () => {
        login();
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

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-foreground-muted">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="input-modern"
                                placeholder="Enter your email"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-foreground-muted">Password</span>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="current-password"
                                    className="input-modern pr-10"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </label>

                        {formError && (
                            <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-foreground">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                                {formError}
                            </div>
                        )}

                        <Button type="submit" size="lg" className="w-full" loading={submitting}>
                            Sign in
                            <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                    </form>

                    <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-card-border" />
                        <span className="text-xs text-foreground-muted">or</span>
                        <span className="h-px flex-1 bg-card-border" />
                    </div>

                    <Button variant="outline" size="lg" className="w-full" onClick={handleGoogleLogin}>
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </Button>

                    <p className="mt-4 text-center text-xs text-foreground-muted">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="text-primary hover:underline font-medium"
                        >
                            Create one
                        </button>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-foreground-muted">
                    By continuing you agree to our community guidelines.
                </p>
            </div>
        </div>
    );
};

export default Login;