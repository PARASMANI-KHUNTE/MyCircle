import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import {
  Server,
  Database,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Zap,
  HardDrive,
  MemoryStick,
  Cpu,
  Wifi,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

const StatusIndicator = ({ status, latency, label }) => {
  const configs = {
    healthy: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', label: 'Healthy', icon: CheckCircle },
    degraded: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-800', label: 'Degraded', icon: AlertTriangle },
    down: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', label: 'Down', icon: XCircle },
    unknown: { color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-200 dark:border-gray-700', label: 'Unknown', icon: Clock },
  };
  const config = configs[status] || configs.unknown;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border ${config.border} ${config.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{config.label} • {latency}ms latency</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
};

const ServiceCard = ({ service }) => {
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await api.get(`/admin/health/${service.name}/metrics`);
      setMetrics(res.data);
    } catch (err) {
      console.error(`Failed to fetch metrics for ${service.name}:`, err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const statusConfigs = {
    healthy: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Healthy', icon: CheckCircle },
    degraded: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Degraded', icon: AlertTriangle },
    down: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Down', icon: XCircle },
    unknown: { color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', label: 'Unknown', icon: Clock },
  };

  const config = statusConfigs[service.status] || statusConfigs.unknown;
  const Icon = config.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${config.bg} ${config.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{service.description || 'Microservice'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
            {config.label}
          </span>
          <button
            onClick={fetchMetrics}
            disabled={loadingMetrics}
            className="p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="View Metrics"
          >
            <Activity className={`w-4 h-4 ${loadingMetrics ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <MetricItem label="Status" value={<span className={`font-medium ${config.color}`}>{config.label}</span>} icon={Server} />
        <MetricItem label="Latency" value={`${service.latency || 'N/A'}ms`} icon={Clock} trend={service.latency ? (service.latency < 100 ? 'up' : service.latency < 500 ? 'neutral' : 'down') : null} />
        <MetricItem label="Uptime" value={service.uptime || 'N/A'} icon={TrendingUp} />
        <MetricItem label="Last Check" value={service.lastCheck ? format(new Date(service.lastCheck), 'HH:mm:ss') : 'Never'} icon={Clock} />
      </div>

      {metrics && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">Detailed Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metrics.memory && (
              <MetricItem label="Memory" value={`${(metrics.memory.heapUsed / 1024 / 1024).toFixed(1)} MB / ${(metrics.memory.heapTotal / 1024 / 1024).toFixed(1)} MB`} icon={MemoryStick} />
            )}
            {metrics.cpu && (
              <MetricItem label="CPU" value={`${metrics.cpu.toFixed(1)}%`} icon={Cpu} />
            )}
            {metrics.connections && (
              <MetricItem label="Connections" value={metrics.connections} icon={Wifi} />
            )}
            {metrics.requestsPerMinute && (
              <MetricItem label="Req/min" value={metrics.requestsPerMinute} icon={Zap} />
            )}
            {metrics.errorRate && (
              <MetricItem label="Error Rate" value={`${(metrics.errorRate * 100).toFixed(2)}%`} icon={AlertTriangle} trend={metrics.errorRate > 0.05 ? 'down' : 'up'} />
            )}
            {metrics.dbStatus && (
              <MetricItem label="Database" value={metrics.dbStatus} icon={Database} trend={metrics.dbStatus === 'connected' ? 'up' : 'down'} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricItem = ({ label, value, icon: Icon, trend }) => (
  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
    <div className="flex items-center gap-1">
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
      {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
      {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
      {trend === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
    </div>
  </div>
);

const AdminHealth = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/health/services');
      setServices(res.data.services || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch service health:', err);
    } finally {
      setLoading(false);
    }
  };

  const overallStatus = services.length > 0
    ? services.some(s => s.status === 'down') ? 'down'
    : services.some(s => s.status === 'degraded') ? 'degraded'
    : 'healthy'
    : 'unknown';

  const statusConfigs = {
    healthy: { label: 'All Systems Operational', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
    degraded: { label: 'Degraded Performance', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: AlertTriangle },
    down: { label: 'Service Outage', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
    unknown: { label: 'Status Unknown', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', icon: Clock },
  };

  const overallConfig = statusConfigs[overallStatus];
  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services Health</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor microservice health, latency, and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-xl border p-4 ${overallConfig.bg} ${overallConfig.border || ''} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${overallConfig.bg} ${overallConfig.color}`}>
            <OverallIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{overallConfig.label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {services.filter(s => s.status === 'healthy').length} of {services.length} services healthy
              {services.some(s => s.status === 'down') && ` • ${services.filter(s => s.status === 'down').length} down`}
              {services.some(s => s.status === 'degraded') && ` • ${services.filter(s => s.status === 'degraded').length} degraded`}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${overallConfig.bg} ${overallConfig.color}`}>
          {overallConfig.label}
        </span>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && services.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No services configured</p>
          </div>
        ) : (
          services.map((service) => (
            <ServiceCard key={service.name} service={service} onRefresh={fetchHealth} />
          ))
        )}
      </div>

      {/* System Resources (if available) */}
      {services.some(s => s.metrics) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Resources Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ResourceChart title="Memory Usage" services={services} metric="memory" icon={HardDrive} />
            <ResourceChart title="CPU Usage" services={services} metric="cpu" icon={Cpu} />
            <ResourceChart title="Request Rate" services={services} metric="requestsPerMinute" icon={Zap} />
          </div>
        </div>
      )}
    </div>
  );
};

const ResourceChart = ({ title, services, metric, icon: Icon }) => (
  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
      <Icon className="w-4 h-4" />
      <span>{title}</span>
    </div>
    <div className="space-y-2">
      {services
        .filter(s => s.metrics && s.metrics[metric] !== undefined)
        .map((service) => {
          const value = service.metrics[metric];
          let displayValue, unit = '';
          if (metric === 'memory') {
            displayValue = `${(value.heapUsed / 1024 / 1024).toFixed(1)} / ${(value.heapTotal / 1024 / 1024).toFixed(1)}`;
            unit = 'MB';
          } else if (metric === 'cpu') {
            displayValue = value.toFixed(1);
            unit = '%';
          } else {
            displayValue = value;
          }
          return (
            <div key={service.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">{service.name}</span>
              <span className="font-medium text-gray-900 dark:text-white">{displayValue} {unit}</span>
            </div>
          );
        })}
    </div>
  </div>
);

export default AdminHealth;