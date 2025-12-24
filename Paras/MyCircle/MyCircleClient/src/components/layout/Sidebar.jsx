import React from 'react';
import { Home, Bell, FileText, PlusCircle, Map, LogOut, User, LogIn, ChevronRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/avatar';

const Sidebar = ({ activeTab, onTabChange }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { id: 'home', label: 'Discover', icon: Home },
        { id: 'map', label: 'Map View', icon: Map },
        { type: 'divider' },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'posts', label: 'My Listings', icon: FileText },
        { id: 'create', label: 'Create Post', icon: PlusCircle },
    ];

    const handleSignAction = () => {
        if (user) {
            logout();
        } else {
            window.location.href = 'http://localhost:5000/auth/google';
        }
    };

    return (
        <aside className="w-72 bg-white border-r border-zinc-200 h-screen fixed left-0 top-0 flex flex-col z-50 shadow-sm font-sans">
            {/* 1. Header & Profile Section (Top) */}
            <div className="p-6 border-b border-zinc-100/50">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-zinc-900/20">M</div>
                    <span className="text-xl font-bold tracking-tight text-zinc-900">MyCircle.</span>
                </div>

                {/* Profile Card */}
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-3 cursor-pointer hover:bg-zinc-100 transition-colors group" onClick={() => user && navigate('/profile')}>
                    {user ? (
                        <>
                            <img
                                src={getAvatarUrl(user?.avatar)}
                                alt={user?.displayName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm group-hover:scale-105 transition-transform"
                            />
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-semibold text-sm truncate text-zinc-900">{user?.displayName || 'User'}</h3>
                                <p className="text-xs text-zinc-500 truncate">View Profile</p>
                            </div>
                            <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                        </>
                    ) : (
                        <div className="flex items-center gap-3 w-full opacity-80">
                            <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
                                <User className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-zinc-900">Guest</h3>
                                <p className="text-xs text-zinc-500">View Only</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {menuItems.map((item, index) => {
                    if (item.type === 'divider') {
                        return <div key={`div-${index}`} className="h-px bg-zinc-100 my-4 mx-2" />;
                    }

                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/10'
                                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                                }`}
                        >
                            <Icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                            {item.label}

                            {isActive && (
                                <span className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full opacity-50" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* 3. Footer */}
            <div className="p-4 border-t border-zinc-100">
                <button
                    onClick={handleSignAction}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${user
                            ? 'text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                            : 'bg-zinc-900 text-white border-transparent hover:bg-black shadow-lg shadow-zinc-900/20'
                        }`}
                >
                    {user ? <LogOut size={16} /> : <LogIn size={16} />}
                    {user ? 'Sign Out' : 'Sign In'}
                </button>
                <p className="text-[10px] text-zinc-300 text-center mt-4">v1.2.0 • MyCircle Inc.</p>
            </div>
        </aside>
    );
};

export default Sidebar;
