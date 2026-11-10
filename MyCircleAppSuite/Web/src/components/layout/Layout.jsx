import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { cn } from '../../utils/cn';

const Layout = () => {
    const { pathname } = useLocation();
    const isChat = pathname.startsWith('/chat');

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />
            <main className={cn('flex-1 pt-14', !isChat && 'pb-16 md:pb-0')}>
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
