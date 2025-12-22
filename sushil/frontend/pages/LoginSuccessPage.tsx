import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';

export const LoginSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    // Fallback for hash fragments like #/login/success?token=...
    const hashQuery = new URLSearchParams(location.hash.split('?')[1] || '');
    const tokenFromHash = hashQuery.get('token');
    const token = tokenParam || tokenFromHash;

    if (!token) {
      setError('No token found in login callback.');
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/feed', { replace: true }))
      .catch(() => setError('Failed to finalize login. Please try again.'));
  }, [searchParams, location.hash, loginWithToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-sm w-full text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle size={20} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Login failed</h1>
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-cyan-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-sm w-full text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Loader2 className="animate-spin" size={20} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Finishing sign-in</h1>
        <p className="text-sm text-gray-600">Please wait while we finalize your login.</p>
      </div>
    </div>
  );
};
