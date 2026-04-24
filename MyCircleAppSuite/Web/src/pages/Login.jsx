import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleDot, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';

const Login = () => {
    const { isAuthenticated, loading, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isExpired = searchParams.get('expired') === 'true';
    const authError = searchParams.get('error');

    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loading fullscreen text="Checking session..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
            {/* Subtle ambient background blobs */}
            <div
                aria-hidden="true"
                className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgb(245 158 11), transparent 70%)' }}
            />
            <div
                aria-hidden="true"
                className="absolute bottom-[-10%] left-[-5%] w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgb(16 185 129), transparent 70%)' }}
            />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-md"
            >
                <div className="bg-card rounded-3xl border border-card-border p-8" style={{ boxShadow: 'var(--shadow-xl)' }}>
                    {/* Brand mark */}
                    <div className="flex items-center gap-3 mb-8">
                        <div
                            className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center"
                            style={{ boxShadow: '0 4px 16px rgb(245 158 11 / 0.4)' }}
                        >
                            <CircleDot className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight font-display">MyCircle</span>
                    </div>

                    {/* Heading */}
                    <div className="mb-7">
                        <h1 className="text-2xl font-bold tracking-tight leading-tight">
                            Connect with your<br />
                            <span className="gradient-text">local community</span>
                        </h1>
                        <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
                            Earn, hire, trade, and rent — everything your neighborhood needs in one place.
                        </p>
                    </div>

                    {/* Alert states */}
                    {isExpired && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3 text-sm text-foreground">
                            <Clock className="w-4 h-4 text-warning shrink-0" />
                            Your session expired. Please sign in again.
                        </div>
                    )}
                    {authError === 'oauth' && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-error/30 bg-error/8 px-4 py-3 text-sm text-foreground">
                            <AlertTriangle className="w-4 h-4 text-error shrink-0" />
                            Sign-in failed. Please try again.
                        </div>
                    )}

                    {/* CTA */}
                    <Button
                        className="w-full gap-3"
                        size="lg"
                        onClick={() => login()}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" opacity=".9"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".7"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".5"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".6"/>
                        </svg>
                        Continue with Google
                    </Button>

                    {/* Trust indicators */}
                    <div className="mt-6 pt-5 border-t border-card-border">
                        <div className="grid grid-cols-3 gap-4 text-center mb-4">
                            {[
                                { label: 'Verified', sub: 'profiles' },
                                { label: 'Local', sub: 'community' },
                                { label: 'Secure', sub: 'platform' },
                            ].map((item) => (
                                <div key={item.label}>
                                    <p className="text-xs font-bold text-foreground">{item.label}</p>
                                    <p className="text-[11px] text-foreground-muted">{item.sub}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-foreground-muted text-center leading-relaxed">
                            By continuing, you agree to our{' '}
                            <span className="text-primary underline-offset-2 hover:underline cursor-pointer">Terms</span>
                            {' '}and{' '}
                            <span className="text-primary underline-offset-2 hover:underline cursor-pointer">Privacy Policy</span>.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
