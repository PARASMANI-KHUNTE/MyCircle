import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import {
  Download,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  MapPin,
  MessageSquare,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">vs prev period</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const LineChartComponent = ({ data, color, height = 200 }) => {
  if (!data?.length) return <div className="h-[200px] flex items-center justify-center text-gray-400">No data</div>;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value));
  const width = '100%';
  const padding = 20;
  const chartHeight = height - 40;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = [
    `${padding},${height - padding}`,
    ...points.split(' '),
    `${width - padding},${height - padding}`,
  ].join(' ');

  return (
    <div className="w-full h-[200px] relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#gradient)" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={padding + (i / (data.length - 1)) * (width - 2 * padding)}
            cy={height - padding - ((d.value - minValue) / (maxValue - minValue || 1)) * chartHeight}
            r="4"
            fill={color}
            stroke="white"
            strokeWidth="2"
            className="hover:r-6 transition-all"
          />
        ))}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-2 -mb-2">
        {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((d, i) => (
          <span key={i}>{d.date}</span>
        ))}
      </div>
    </div>
  );
};

const BarChartComponent = ({ data, color }) => {
  if (!data?.length) return <div className="h-[200px] flex items-center justify-center text-gray-400">No data</div>;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full h-[200px] flex items-end justify-between px-2 pb-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center" style={{ width: `${barWidth}%` }}>
          <div
            className="w-6 rounded-t transition-all hover:scale-110"
            style={{
              height: `${(d.value / maxValue) * 160}px`,
              backgroundColor: color,
            }}
            title={`${d.date}: ${d.value}`}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.date}</span>
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, data, dataKey, color, icon: Icon, chartType, setChartType, generateChartData }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setChartType('line')}
          className={`px-2 py-1 text-xs rounded ${chartType === 'line' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <LineChart className="w-4 h-4" />
        </button>
        <button
          onClick={() => setChartType('bar')}
          className={`px-2 py-1 text-xs rounded ${chartType === 'bar' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <BarChart3 className="w-4 h-4" />
        </button>
      </div>
    </div>
    {chartType === 'line' ? (
      <LineChartComponent data={generateChartData(data, dataKey)} color={color} />
    ) : (
      <BarChartComponent data={generateChartData(data, dataKey)} color={color} />
    )}
  </div>
);

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [chartType, setChartType] = useState('line');

  const fetchAnalytics = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/analytics?range=${dateRange}`);
      setAnalytics(res.data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const generateChartData = (data, key) => {
    if (!data || !data.daily) return [];
    return data.daily.map((day) => ({
      date: format(new Date(day.date), 'MMM d'),
      value: day[key] || 0,
    }));
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Platform growth, engagement, and revenue metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Platform growth, engagement, and revenue metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(analytics?.overview?.totalUsers || 0)}
          change={analytics?.overview?.userGrowth}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Users"
          value={formatNumber(analytics?.overview?.activeUsers || 0)}
          change={analytics?.overview?.activeGrowth}
          icon={Activity}
          color="bg-green-500"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(analytics?.overview?.totalRevenue || 0)}
          change={analytics?.overview?.revenueGrowth}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title="Posts Created"
          value={formatNumber(analytics?.overview?.totalPosts || 0)}
          change={analytics?.overview?.postGrowth}
          icon={MapPin}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="User Registrations"
          data={analytics?.registrations}
          key="users"
          color="#3b82f6"
          icon={Users}
        />
        <ChartCard
          title="Revenue"
          data={analytics?.revenue}
          key="revenue"
          color="#8b5cf6"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Active Users (DAU)"
          data={analytics?.activity}
          dataKey="activeUsers"
          color="#10b981"
          icon={Activity}
          chartType={chartType}
          setChartType={setChartType}
          generateChartData={generateChartData}
        />
        <ChartCard
          title="Posts Created"
          data={analytics?.posts}
          dataKey="posts"
          color="#f59e0b"
          icon={MapPin}
          chartType={chartType}
          setChartType={setChartType}
          generateChartData={generateChartData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Messages Sent"
          data={analytics?.messages}
          dataKey="messages"
          color="#ec4899"
          icon={MessageSquare}
          chartType={chartType}
          setChartType={setChartType}
          generateChartData={generateChartData}
        />
        <ChartCard
          title="Escrow Volume"
          data={analytics?.escrow}
          dataKey="escrow"
          color="#06b6d4"
          icon={Shield}
          chartType={chartType}
          setChartType={setChartType}
          generateChartData={generateChartData}
        />
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Categories</h3>
          <div className="space-y-3">
            {analytics?.categories?.slice(0, 10).map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-medium text-gray-500">{i + 1}</span>
                  <span className="text-gray-900 dark:text-white">{cat.category}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{formatNumber(cat.count)} posts</span>
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${(cat.count / (analytics.categories[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!analytics?.categories?.length) && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">No category data</div>
            )}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Locations</h3>
          <div className="space-y-3">
            {analytics?.locations?.slice(0, 10).map((loc, i) => (
              <div key={loc.location} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-medium text-gray-500">{i + 1}</span>
                  <span className="text-gray-900 dark:text-white">{loc.location}</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{formatNumber(loc.count)} posts</span>
              </div>
            ))}
            {(!analytics?.locations?.length) && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">No location data</div>
            )}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversion Funnel</h3>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {analytics?.funnel?.map((step) => (
            <div key={step.label} className="flex flex-col items-center flex-1 min-w-[120px]">
              <div className="relative w-24 h-24 mb-2">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="8"
                    strokeDasharray={`${step.rate * 283} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="55" textAnchor="middle" fill="#1f2937" fontSize="14" fontWeight="bold">
                    {step.rate}%
                  </text>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">{step.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(step.count)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { Activity, Shield } from 'lucide-react';

export default AdminAnalytics;