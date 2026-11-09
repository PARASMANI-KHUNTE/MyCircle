import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import Button from '../components/ui/Button';

const Explore = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();

    const exploreItems = [
        { path: '/', label: 'Home', icon: 'home' },
        { path: '/explore', label: 'Explore', icon: 'grid' },
        { path: '/create-post', label: 'Create', icon: 'plus' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Explore</h1>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    {exploreItems.map((item) => (
                        <Button
                            key={item.path}
                            variant="outline"
                            size="lg"
                            onClick={() => navigate(item.path)}
                        >
                            <span className="w-6 h-6">{item.icon}</span>
                            <span className="ml-2">{item.label}</span>
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Placeholder explore cards */}
                    <div className="p-6 bg-background/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Explore posts by category</p>
                    </div>
                    <div className="p-6 bg-background/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Discover local opportunities</p>
                    </div>
                    <div className="p-6 bg-background/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Find services near you</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Explore;