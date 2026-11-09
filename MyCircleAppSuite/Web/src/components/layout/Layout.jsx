import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { cn } from '../../utils/cn';

const Layout = () => {
    const { pathname } = useLocation();
    const isChat = pathname.startsWith('/chat');

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className={cn('min-h-screen pt-16', !isChat && 'pb-16 lg:pb-0')}>
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
