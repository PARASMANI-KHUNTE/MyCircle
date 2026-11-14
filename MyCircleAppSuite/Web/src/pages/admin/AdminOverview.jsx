import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { Activity, Users, AlertCircle, Info, Shield, Flag, Clock, Calendar, TrendingUp, ShieldCheck, XCircle } from 'lucide-react';
import { formatNumber } from '../../utils/numbers';

const AdminOverview = () => {
    const { user } = useAuth();
    const { notifications, loading, refresh, markAllRead } = useNotifications();
    const { colors } = useTheme();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    const [stats, setStats] = useState({
        totalUsers: { value: 0, change: 0 },
        activeUsers: { value: 0, change: 0 },
        totalPosts: { value: 0, change: 0 },
        pendingEscrows: { value: 0, change: 0 },
        activePosts: { value: 0, change: 0 },
        totalRevenue: { value: 0, change: 0 },
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [users, posts, notifications] = await Promise.all([
                    // User count would come from API
                    0,
                    // Post count would come from API
                    0,
                    // Notifications count
                    notifications?.length || 0,
                ]);

                setStats({
                    totalUsers: { value: users, change: 0 },
                    activeUsers: { value: users, change: 0 },
                    totalPosts: { value: posts, change: 0 },
                    pendingEscrows: { value: 0, change: 0 },
                    activePosts: { value: posts, change: 0 },
                    totalRevenue: { value: 0, change: 0 },
                });
            } catch (err) {
                showError('Failed to load statistics');
            }
        };

        loadStats();
        const interval = setInterval(loadStats, 60000);
        return () => clearInterval(interval);
    }, [notifications, refresh]);

    const handleLogout = async () => {
        await navigator.serviceWorker.getRegistration()?.unregister();
        showError('Logging out...');
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Users</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalUsers.change >= 0 ? '+' : ''}{stats.totalUsers.change}%</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active Users</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeUsers.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stats.activeUsers.change >= 0 ? '+' : ''}{stats.activeUsers.change}%</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Posts</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPosts.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalPosts.change >= 0 ? '+' : ''}{stats.totalPosts.change}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending Activities</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingEscrows.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stats.pendingEscrows.change >= 0 ? '+' : ''}{stats.pendingEscrows.change}%</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active Posts</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activePosts.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stats.activePosts.change >= 0 ? '+' : ''}{stats.activePosts.change}%</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Revenue</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRevenue.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalRevenue.change >= 0 ? '+' : ''}{stats.totalRevenue.change}%</p>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {notifications?.slice(0, 5).map((notification, index) => (
                            <div
                                key={index}
                                className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-2"
                            >
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {notifications[index]?.message || 'No activity'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;