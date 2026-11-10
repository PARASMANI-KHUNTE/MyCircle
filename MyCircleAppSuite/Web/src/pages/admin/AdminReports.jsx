import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  MessageSquare,
  Image,
  MapPin,
  Shield,
  Ban,
  UserCheck,
  Trash2,
  Mail,
  Phone,
  ExternalLink,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
  const configs = {
    pending: { label: 'Pending Review', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', icon: Clock },
    under_review: { label: 'Under Review', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: Shield },
    resolved: { label: 'Resolved', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle },
    dismissed: { label: 'Dismissed', className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: XCircle },
    escalated: { label: 'Escalated', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: AlertTriangle },
  };
  const config = configs[status] || { label: status, className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: Clock };
  const Icon = config.icon;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const CategoryBadge = ({ category }) => {
  const configs = {
    spam: { label: 'Spam', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
    harassment: { label: 'Harassment', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
    scam: { label: 'Scam/Fraud', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
    impersonation: { label: 'Impersonation', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
    hate_speech: { label: 'Hate Speech', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
    nudity: { label: 'Nudity', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' },
    violence: { label: 'Violence', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
    other: { label: 'Other', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  };
  const config = configs[category] || { label: category, color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
};

const ContentTypeIcon = ({ type }) => {
  const icons = {
    post: MapPin,
    comment: MessageSquare,
    chat: MessageSquare,
    user: User,
    profile: User,
    image: Image,
  };
  const Icon = icons[type] || Flag;
  return <Icon className="w-4 h-4" />;
};

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const ITEMS_PER_PAGE = 20;



  const fetchReports = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const res = await api.get(`/admin/reports?${params.toString()}`);
      setReports(res.data.reports || res.data);
      setTotalItems(res.data.total || res.data.length);
      setTotalPages(Math.ceil((res.data.total || res.data.length) / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (reportId, action, data = {}) => {
    setActionLoading(reportId);
    try {
      await api.post(`/admin/reports/${reportId}/${action}`, data);
      fetchReports();
      if (showModal) setShowModal(false);
    } catch (err) {
      console.error(`Failed to ${action} report:`, err);
      alert(`Failed to ${action} report: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const openDetails = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Moderation</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and act on user reports and content flags</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatSummary title="Total Reports" value={totalItems} icon={Flag} color="bg-purple-500" />
        <StatSummary title="Pending" value={reports.filter(r => r.status === 'pending').length} icon={Clock} color="bg-yellow-500" />
        <StatSummary title="Under Review" value={reports.filter(r => r.status === 'under_review').length} icon={Shield} color="bg-blue-500" />
        <StatSummary title="Resolved" value={reports.filter(r => r.status === 'resolved').length} icon={CheckCircle} color="bg-green-500" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reporter, reported user, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
              <option value="escalated">Escalated</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="scam">Scam/Fraud</option>
              <option value="impersonation">Impersonation</option>
              <option value="hate_speech">Hate Speech</option>
              <option value="nudity">Nudity</option>
              <option value="violence">Violence</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && reports.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading reports...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reporter</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reported User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <code className="text-sm text-gray-600 dark:text-gray-300 font-mono">{report._id?.slice(-12)}</code>
                      </td>
                      <td className="px-4 py-3">
                        {report.reporter && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                              {report.reporter.displayName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">{report.reporter.displayName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {report.reportedUser && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-medium">
                              {report.reportedUser.displayName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">{report.reportedUser.displayName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <CategoryBadge category={report.category} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <ContentTypeIcon type={report.contentType} />
                          <span className="text-sm capitalize text-gray-600 dark:text-gray-300">{report.contentType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate block" title={report.reason}>
                          {report.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openDetails(report)}
                            className="p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {report.status === 'pending' || report.status === 'under_review' ? (
                            <>
                              <button
                                onClick={() => handleAction(report._id, 'resolve')}
                                disabled={actionLoading === report._id}
                                className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Mark Resolved"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction(report._id, 'dismiss')}
                                disabled={actionLoading === report._id}
                                className="p-2 text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Dismiss"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction(report._id, 'escalate')}
                                disabled={actionLoading === report._id}
                                className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Escalate"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reports.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No reports found matching your criteria.
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} reports
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-medium text-gray-900 dark:text-white">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Details</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Report ID" value={selectedReport._id} />
                <DetailRow label="Status" value={<StatusBadge status={selectedReport.status} />} />
                <DetailRow label="Category" value={<CategoryBadge category={selectedReport.category} />} />
                <DetailRow label="Content Type" value={<span className="capitalize">{selectedReport.contentType}</span>} />
                <DetailRow label="Created" value={format(new Date(selectedReport.createdAt), 'MMMM d, yyyy HH:mm:ss')} />
                <DetailRow label="Updated" value={selectedReport.updatedAt ? format(new Date(selectedReport.updatedAt), 'MMMM d, yyyy HH:mm:ss') : '—'} />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Reason</h4>
                <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg whitespace-pre-wrap">{selectedReport.reason}</p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Parties</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedReport.reporter && (
                    <PartyCard
                      label="Reporter"
                      name={selectedReport.reporter.displayName}
                      email={selectedReport.reporter.email}
                      avatar={selectedReport.reporter.avatar}
                      userId={selectedReport.reporter._id}
                      role={selectedReport.reporter.role}
                    />
                  )}
                  {selectedReport.reportedUser && (
                    <PartyCard
                      label="Reported User"
                      name={selectedReport.reportedUser.displayName}
                      email={selectedReport.reportedUser.email}
                      avatar={selectedReport.reportedUser.avatar}
                      userId={selectedReport.reportedUser._id}
                      role={selectedReport.reportedUser.role}
                    />
                  )}
                </div>
              </div>

              {selectedReport.contentId && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Reported Content</h4>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Type: <span className="font-medium capitalize">{selectedReport.contentType}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Content ID: <code className="font-mono">{selectedReport.contentId}</code>
                    </p>
                    {selectedReport.content && (
                      <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                        <p className="text-sm text-gray-900 dark:text-white">{JSON.stringify(selectedReport.content, null, 2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex gap-2">
                {selectedReport.status === 'pending' || selectedReport.status === 'under_review' ? (
                  <>
                    <button
                      onClick={() => handleAction(selectedReport._id, 'resolve')}
                      disabled={actionLoading === selectedReport._id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleAction(selectedReport._id, 'dismiss')}
                      disabled={actionLoading === selectedReport._id}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleAction(selectedReport._id, 'escalate')}
                      disabled={actionLoading === selectedReport._id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Escalate
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleAction(selectedReport._id, 'reopen')}
                    disabled={actionLoading === selectedReport._id}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatSummary = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="text-sm text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
);

const PartyCard = ({ label, name, email, userId, role }) => (
  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
    <div className="flex items-center gap-2 mt-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
        {name?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">{name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">ID: {userId?.slice(-8)}</p>
        {role && <span className="px-2 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{role}</span>}
      </div>
    </div>
  </div>
);

export default AdminReports;