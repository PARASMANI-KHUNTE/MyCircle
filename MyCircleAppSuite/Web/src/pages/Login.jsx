import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            {/* Simple brand mark */}
            <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-orange flex items-center justify-center mb-4">
                    <i className="circle-icon" style="width:2rem;height:2rem;" /> {/* Placeholder - use actual icon */}
                </div>
                <h1 className="text-2xl font-bold">MyCircle</h1>
                <p className="text-muted-foreground mt-2">Connect with your local community</p>
            </div>

            {/* Sign in form area */}
            <div className="w-full max-w-md">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => login()}
                    className="w-full"
                >
                    Continue with Google
                </Button>
            </div>

            {/* Alert states */}
            {isExpired && (
                <div className="mb-4 rounded-xl border border-orange/30 bg-orange/8 px-4 py-3 text-sm text-foreground">
                    <i className="clock-icon" style="width:1rem;height:1rem;" /> Your session expired. Please sign in again.
                </div>
            )}
            {authError === 'oauth' && (
                <div className="mb-4 rounded-xl border border-error/30 bg-error/8 px-4 py-3 text-sm text-foreground">
                    <i className="alert-icon" style="width:1rem;height:1rem;" /> Sign-in failed. Please try again.
                </div>
            )}
        </div>
    );
};

export default Login;