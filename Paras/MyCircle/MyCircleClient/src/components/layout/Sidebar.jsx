import React from 'react';
import {
    LayoutDashboard,
    PlusCircle,
    MessageCircle,
    Bell,
    MapPin,
    User,
    FileText,
    Settings,
    LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/avatar';

const Sidebar = ({ activeTab, onTabChange, unreadChats = 0, unreadRequests = 0 }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Updated Menu Items
    const menuItems = [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'create', label: 'Create', icon: PlusCircle },
        { id: 'chats', label: 'Chats', icon: MessageCircle, badge: unreadChats > 0 ? unreadChats : null },
        { id: 'requests', label: 'My Activity', icon: Bell, badge: unreadRequests > 0 ? unreadRequests : null },
        { id: 'map', label: 'Map', icon: MapPin },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'posts', label: 'Posts', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const handleSignAction = () => {
        if (user) {
            logout();
        } else {
            console.log('Redirecting to login...');
        }
    };

    return (
        <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50 font-sans border-r border-slate-800">

            {/* 1. Profile Section */}
            <div className="flex flex-col items-center pt-10 pb-8 border-b border-slate-800/50 mx-4 mb-4">
                <div
                    className="relative mb-3 cursor-pointer group"
                    onClick={() => user && navigate('/profile')}
                >
                    <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-teal-400 to-blue-500 shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all duration-300">
                        {user ? (
                            <img
                                src={getAvatarUrl(user)}
                                alt={user?.displayName}
                                className="w-full h-full rounded-full object-cover border-2 border-[#0F172A] bg-slate-800"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full border-2 border-[#0F172A] bg-slate-800 flex items-center justify-center text-slate-400">
                                <User size={24} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="font-semibold text-white text-sm tracking-wide">
                        {user?.displayName || 'Guest User'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        {user?.email || 'Admin Access'}
                    </p>
                </div>
            </div>

            {/* 2. Navigation Menu */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    const hasBadge = item.badge && item.badge > 0;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-teal-500/10 text-teal-400 shadow-inner'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }
                            `}
                        >
                            <Icon
                                size={18}
                                className={`transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}
                                strokeWidth={2}
                            />
                            {item.label}
                            {hasBadge && (
                                <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* 3. Logout Footer */}
            <div className="p-4 mt-auto border-t border-slate-800/50">
                <button
                    onClick={handleSignAction}
                    className="flex items-center gap-3 w-full px-4 py-3 text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all duration-200"
                >
                    <LogOut size={16} />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;