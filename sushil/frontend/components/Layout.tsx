import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading, token, logout } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      navigate('/login', { replace: true });
    }
  }, [loading, token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/feed', icon: Home, label: 'Feed' },
    { to: '/create', icon: PlusSquare, label: 'Create' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
  ];

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const getLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-primary/10 text-primary font-semibold shadow-sm'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`;

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex-none bg-white border-b p-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
             <span className="text-white font-bold">M</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">MyCircle</span>
        </div>
        <button 
            onClick={handleLogout} 
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Log Out"
        >
           <LogOut size={24} />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r h-full flex-none">
        <div className="p-6 flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
             <span className="text-white font-bold">M</span>
          </div>
          <span className="font-bold text-xl text-gray-900">MyCircle</span>
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
          <div 
            onClick={handleProfileClick}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors group"
          >
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.area ?? 'Neighborhood'}</p>
            </div>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation - Now part of flex flow, not fixed overlay */}
        <nav className="md:hidden flex-none bg-white border-t flex justify-around p-2 z-20 pb-safe">
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
          <NavLink
              to="/profile"
              className={({ isActive }) => `flex flex-col items-center p-2 text-xs ${isActive ? 'text-primary' : 'text-gray-400'}`}
            >
              <UserIcon size={20} />
              <span className="mt-1">Profile</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};