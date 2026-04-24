import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const BottomNav = () => {
    const location = useLocation();
    const { user } = useAuth();
    const { unreadMsgCount } = useSocket();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/create-post', icon: PlusSquare, label: 'Create', highlight: true },
        { path: '/notifications', icon: Bell, label: 'Alerts' },
        { path: '/chat', icon: MessageCircle, label: 'Chat', badge: unreadMsgCount },
    ];

    if (location.pathname === '/' || location.pathname === '/explore') {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-card-border lg:hidden">
            <div className="flex items-center justify-around h-16 px-2 max-w-xl mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`
                                relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-200
                                ${item.highlight 
                                    ? 'bg-foreground text-background -top-5 shadow-md' 
                                    : isActive 
                                        ? 'text-foreground bg-card border border-card-border'
                                        : 'text-foreground-muted hover:text-foreground'
                                }
                            `}
                        >
                            {item.highlight ? (
                                <Icon className="w-6 h-6" />
                            ) : (
                                <>
                                    <Icon className="w-5 h-5" />
                                    {item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                            <span className={`text-[10px] font-medium mt-0.5 ${item.highlight ? 'text-white' : ''}`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
