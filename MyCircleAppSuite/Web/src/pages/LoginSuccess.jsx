import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';

const LoginSuccess = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (isAuthenticated) {
            navigate('/', { replace: true });
            return;
        }

        const timer = setTimeout(() => {
            navigate('/login', { replace: true });
        }, 1200);

        return () => clearTimeout(timer);
    }, [isAuthenticated, loading, navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loading fullscreen text="Signing you in..." />
        </div>
    );
};

export default LoginSuccess;

