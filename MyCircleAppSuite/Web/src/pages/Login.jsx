import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';

const Login = () => {
    const { isAuthenticated, loading, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

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
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-3xl border border-card-border bg-card/70 backdrop-blur-xl shadow-xl p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Welcome to MyCircle</h1>
                    <p className="text-sm text-foreground-muted mt-2">
                        Sign in to connect with people and services in your neighborhood.
                    </p>
                </div>

                {isExpired && (
                    <div className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
                        Your session expired. Please sign in again.
                    </div>
                )}

                <Button className="w-full" size="lg" onClick={() => login()}>
                    Continue with Google
                </Button>

                <div className="mt-6 text-xs text-foreground-muted">
                    By continuing, you agree to the Terms and acknowledge the Privacy Policy.
                </div>
            </div>
        </div>
    );
};

export default Login;

