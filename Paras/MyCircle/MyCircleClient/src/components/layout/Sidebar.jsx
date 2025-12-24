import React from 'react';
import { Home, Bell, FileText, PlusCircle, Map, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/avatar';

const Sidebar = ({ activeTab, onTabChange }) => {
    const { user, logout } = useAuth();

    const menuItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'posts', label: 'My Posts', icon: FileText },
        { id: 'create', label: 'Create Post', icon: PlusCircle },
        { id: 'map', label: 'Map View', icon: Map },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-50">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">M</div>
                <span className="text-xl font-bold tracking-tight text-slate-900">MyCircle.</span>
            </div>

            {/* User Short Profile */}
            <div className="p-6 flex items-center gap-3">
                <img
                    src={getAvatarUrl(user?.avatar)}
                    alt={user?.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div className="overflow-hidden">
                    <h3 className="font-semibold text-sm truncate text-slate-900">{user?.displayName || 'User'}</h3>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                ${isActive
                                    ? 'bg-black text-white shadow-md shadow-black/10'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
