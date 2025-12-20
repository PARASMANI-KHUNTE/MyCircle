import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, PlusSquare, User, Bell, LogOut } from 'lucide-react';
import { CURRENT_USER } from '../services/mockData';

export const Layout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: 'Feed' },
    { to: '/create', icon: PlusSquare, label: 'Create' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  // Helper to determine active state styling
  const getLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-primary/10 text-primary font-semibold shadow-sm'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
             <span className="text-white font-bold">H</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">HyperLocal</span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0">
        <div className="p-6 flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
             <span className="text-white font-bold">H</span>
          </div>
          <span className="font-bold text-xl text-gray-900">HyperLocal</span>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => getLinkClass(isActive)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3">
            <img src={CURRENT_USER.avatar} alt="User" className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{CURRENT_USER.name}</p>
              <p className="text-xs text-gray-500 truncate">{CURRENT_USER.area}</p>
            </div>
            <button className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50 pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex flex-col items-center p-2 text-xs ${isActive ? 'text-primary' : 'text-gray-400'}`}
          >
            <item.icon size={20} />
            <span className="mt-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
