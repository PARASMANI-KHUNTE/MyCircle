import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

const Layout = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="min-h-screen pt-16 pb-16 md:pt-16 lg:pb-0">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
