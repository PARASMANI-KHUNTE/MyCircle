import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  Users,
  CreditCard,
  Flag,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Shield,
  Database,
  Server,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

const StatCard = ({ title, value, change, icon: Icon, color, href, loading }) => (
  <Link
    to={href}
    className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        {loading ? (
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        ) : (
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        {change && !loading && (
          <div className="flex items-center gap-1 mt-2">
            {change >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">vs last month</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {href && (
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:underline">
          View details
        </span>
        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
      </div>
    )}
  </Link>
);

const ServiceStatusCard = ({ service, status, latency, lastCheck }) => {
  const statusConfig = {
    healthy: { label: 'Healthy', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
    degraded: { label: 'Degraded', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: AlertTriangle },
    down: { label: 'Down', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
    unknown: { label: 'Unknown', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', icon: Clock },
  };

  const config = statusConfig[status] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{service}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last checked: {lastCheck}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="text-sm font-mono text-gray-900 dark:text-white">{latency}ms</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Latency</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} flex items-center gap-1`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      </div>
    </div>
  );
};

const RecentActivity = ({ activities, loading }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
      <Link to="/admin/users" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
        View all
      </Link>
    </div>
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))
      ) : activities.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">No recent activity</div>
      ) : (
        activities.map((activity, index) => (
          <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'user' ? 'bg-blue-100 dark:bg-blue-900/30' : activity.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {activity.type === 'payment' && <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />}
                  {activity.type === 'report' && <Flag className="w-4 h-4 text-red-600 dark:text-red-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {activity.severity}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: { value: 0, change: 0 },
    activeUsers: { value: 0, change: 0 },
    totalRevenue: { value: 0, change: 0 },
    pendingEscrows: { value: 0, change: 0 },
    openReports: { value: 0, change: 0 },
    avgResponseTime: { value: 0, change: 0 },
  });
  const [services, setServices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, healthRes, activityRes] = await Promise.allSettled([
          api.get('/admin/stats'),
          api.get('/health/services'),
          api.get('/admin/activity?limit=10'),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        }
        if (healthRes.status === 'fulfilled') {
          setServices(healthRes.value.data.services || []);
        }
        if (activityRes.status === 'fulfilled') {
          setActivities(activityRes.value.data);
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch admin overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of platform health, users, and transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(stats.totalUsers.value)}
          change={stats.totalUsers.change}
          icon={Users}
          color="bg-blue-500"
          href="/admin/users"
          loading={loading}
        />
        <StatCard
          title="Active (24h)"
          value={formatNumber(stats.activeUsers.value)}
          change={stats.activeUsers.change}
          icon={Activity}
          color="bg-green-500"
          href="/admin/users?filter=active"
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue.value)}
          change={stats.totalRevenue.change}
          icon={DollarSign}
          color="bg-purple-500"
          href="/admin/payments"
          loading={loading}
        />
        <StatCard
          title="Pending Escrows"
          value={formatNumber(stats.pendingEscrows.value)}
          change={stats.pendingEscrows.change}
          icon={Shield}
          color="bg-yellow-500"
          href="/admin/payments?filter=pending"
          loading={loading}
        />
        <StatCard
          title="Open Reports"
          value={formatNumber(stats.openReports.value)}
          change={stats.openReports.change}
          icon={Flag}
          color="bg-red-500"
          href="/admin/reports"
          loading={loading}
        />
        <StatCard
          title="Avg Response"
          value={`${stats.avgResponseTime.value}ms`}
          change={stats.avgResponseTime.change}
          icon={Clock}
          color="bg-orange-500"
          href="/admin/health"
          loading={loading}
        />
      </div>

      {/* Services Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Health */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Services Health
              </h3>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                Real-time
              </span>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
                ))
              ) : services.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">No service data</div>
              ) : (
                services.map((service) => (
                  <ServiceStatusCard
                    key={service.name}
                    service={service.name}
                    status={service.status}
                    latency={service.latency || 'N/A'}
                    lastCheck={service.lastCheck ? format(new Date(service.lastCheck), 'HH:mm:ss') : 'Never'}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} loading={loading} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/users" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-colors group">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Manage Users</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View, ban, or modify roles</p>
          </Link>
          <Link to="/admin/payments" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-colors group">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Payments & Escrows</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review transactions, payouts</p>
          </Link>
          <Link to="/admin/reports" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-colors group">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
              <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Moderate Reports</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Handle user reports & flags</p>
          </Link>
          <Link to="/admin/analytics" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-colors group">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">View Analytics</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Growth, engagement, revenue</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;