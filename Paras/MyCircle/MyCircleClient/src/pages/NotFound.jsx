import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
            <div className="relative mb-8">
                <div className="text-[12rem] font-bold text-white/5 select-none leading-none">404</div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-bounce shadow-2xl shadow-primary/20">
                        <Rocket className="text-white w-12 h-12" />
                    </div>
                </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4 font-display">Lost in Space?</h1>
            <p className="text-gray-400 max-w-md mx-auto mb-10 text-lg">
                The page you are looking for has drifted away or never existed in this circle.
            </p>

            <div className="flex gap-4">
                <Link to="/">
                    <Button variant="primary">
                        Back to Orbit (Home)
                    </Button>
                </Link>
                <Link to="/feed">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Explore Feed
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
