import React from 'react';
import { Lock } from 'lucide-react';
import Button from './ui/Button';

const LoginRequired = ({ message = "Please sign in to view this content." }) => {
    const handleLogin = () => {
        window.location.href = 'http://localhost:5000/auth/google';
    };

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-slate-500 max-w-md mb-8">
                {message}
            </p>
            <Button
                variant="primary"
                onClick={handleLogin}
                className="px-8 py-3 text-base shadow-xl shadow-black/10"
            >
                Sign In to Continue
            </Button>
        </div>
    );
};

export default LoginRequired;
