import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, MapPin, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    // Simulate signup delay
    setTimeout(() => {
      // Mock validation
      if (email === 'exists@example.com') {
        setError('This email address is already in use. Please sign in instead.');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(false);
      navigate('/feed');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
       {/* Left Panel - Hero Image */}
       <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?q=80&w=1974&auto=format&fit=crop" 
          alt="Diverse Community" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-[20s] hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end h-full p-16 text-white">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/30 backdrop-blur-sm">
             <span className="text-white font-extrabold text-2xl">M</span>
          </div>
          <h2 className="text-5xl font-bold mb-6 leading-tight tracking-tight">Join the circle.<br/>Make an impact.</h2>
          <p className="text-lg text-gray-200 max-w-md leading-relaxed">
            Create an account to start trading, helping, and connecting with verified neighbors in your area.
          </p>
          <div className="mt-8 flex gap-2">
            <div className="h-1 w-2 bg-white/30 rounded-full"></div>
            <div className="h-1 w-12 bg-white rounded-full"></div>
            <div className="h-1 w-2 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">
        <div className="absolute top-6 left-6 lg:hidden">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center cursor-pointer shadow-lg" onClick={() => navigate('/')}>
               <span className="text-white font-bold text-xl">M</span>
             </div>
        </div>
        
        <div className="absolute top-6 right-6 lg:right-12">
            <Link to="/login" className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                Log in
            </Link>
        </div>

        <div className="mx-auto w-full max-w-sm lg:w-96 pt-12 lg:pt-0">
          <div className="mb-8">
            <button 
                onClick={() => navigate(-1)} 
                className="group flex items-center text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors mb-6"
            >
                <ArrowLeft size={16} className="mr-1 transition-transform group-hover:-translate-x-1" /> Back
            </button>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Create Account</h2>
            <p className="text-sm text-gray-500">
              Start your journey with MyCircle today.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm text-red-600 font-medium">
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 sm:text-sm font-medium"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 sm:text-sm font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="area" className="block text-sm font-semibold text-gray-700">
                    Area
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                      <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
                    </div>
                    <input
                      id="area"
                      name="area"
                      type="text"
                      required
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 sm:text-sm font-medium"
                      placeholder="City"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                   <label htmlFor="zip" className="block text-sm font-semibold text-gray-700">
                    Zip Code
                  </label>
                  <input
                      id="zip"
                      name="zip"
                      type="text"
                      className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 sm:text-sm font-medium"
                      placeholder="10001"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 sm:text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-start mt-2">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-600">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/20 text-sm font-bold text-white bg-primary hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.99] mt-6"
            >
              {isLoading ? (
                  <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                  </span>
              ) : (
                  <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};