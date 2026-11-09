import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
        return <Loading fullscreen text="Checking session..." />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
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

                <div className="space-y-3">
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

                    <Button size="lg" className="w-full" onClick={() => login()}>
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
