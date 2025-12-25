import React from 'react';
import { Home, MessageCircle, Bell, User, MapPin } from 'lucide-react';

const BottomNav = ({ activeTab, onTabChange, unreadChats = 0, unreadRequests = 0 }) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'chats', label: 'Chats', icon: MessageCircle, badge: unreadChats > 0 ? unreadChats : null },
        { id: 'requests', label: 'Activity', icon: Bell, badge: unreadRequests > 0 ? unreadRequests : null },
        { id: 'map', label: 'Map', icon: MapPin },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:hidden">
            <div className="grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const hasBadge = item.badge && item.badge > 0;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${isActive
                                ? 'text-teal-600'
                                : 'text-slate-400'
                                }`}
                        >
                            <div className="relative">
                                <Icon size={20} strokeWidth={2} />
                                {hasBadge && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
