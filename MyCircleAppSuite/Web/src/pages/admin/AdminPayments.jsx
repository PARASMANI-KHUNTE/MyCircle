import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  User,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const StatusBadge = ({ status }) => {
  const configs = {
    pending: { label: 'Pending', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', icon: Clock },
    funded: { label: 'Funded', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: DollarSign },
    held: { label: 'Held (Escrow)', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', icon: Shield },
    released: { label: 'Released', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle },
    refunded: { label: 'Refunded', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: ArrowDownRight },
    disputed: { label: 'Disputed', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', icon: AlertTriangle },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: XCircle },
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

const TypeBadge = ({ type }) => {
  const configs = {
    escrow: { label: 'Escrow', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', icon: Shield },
    topup: { label: 'Wallet Top-up', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: Banknote },
    payout: { label: 'Seller Payout', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: CreditCard },
  };
  const config = configs[type] || { label: type, color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: DollarSign };
  const Icon = config.icon;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const AdminPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const ITEMS_PER_PAGE = 20;



  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      if (search) params.append('search', search);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/admin/payments?${params.toString()}`);
      setTransactions(res.data.transactions || res.data);
      setTotalItems(res.data.total || res.data.length);
      setTotalPages(Math.ceil((res.data.total || res.data.length) / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, search, typeFilter, statusFilter]);

  const openDetails = (txn) => {
    setSelectedTxn(txn);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments & Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor escrows, wallet top-ups, and seller payouts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
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
        <StatSummary title="Total Volume" value={formatCurrency(transactions.reduce((sum, t) => sum + (t.amount || 0), 0))} icon={DollarSign} color="bg-purple-500" />
        <StatSummary title="Pending Escrows" value={transactions.filter(t => t.status === 'pending' || t.status === 'funded' || t.status === 'held').length} icon={Shield} color="bg-yellow-500" />
        <StatSummary title="Completed" value={transactions.filter(t => t.status === 'released').length} icon={CheckCircle} color="bg-green-500" />
        <StatSummary title="Disputed" value={transactions.filter(t => t.status === 'disputed').length} icon={AlertTriangle} color="bg-red-500" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, user, post..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="escrow">Escrow</option>
              <option value="topup">Wallet Top-up</option>
              <option value="payout">Seller Payout</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="funded">Funded</option>
              <option value="held">Held (Escrow)</option>
              <option value="released">Released</option>
              <option value="refunded">Refunded</option>
              <option value="disputed">Disputed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Buyer / Payer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seller / Recipient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Post / Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((txn) => (
                    <tr key={txn._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <code className="text-sm text-gray-600 dark:text-gray-300 font-mono">{txn._id?.slice(-12)}</code>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={txn.type || (txn.stripePaymentIntentId ? 'escrow' : 'unknown')} />
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{formatCurrency(txn.amount)}</td>
                      <td className="px-4 py-3">
                        {txn.buyer && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                              {txn.buyer.displayName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">{txn.buyer.displayName}</span>
                          </div>
                        )}
                        {txn.user && !txn.buyer && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                              {txn.user.displayName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">{txn.user.displayName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {txn.seller && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-xs font-medium">
                              {txn.seller.displayName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">{txn.seller.displayName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {txn.post ? (
                          <span className="text-sm text-gray-900 dark:text-white truncate max-w-xs block" title={txn.post.title}>
                            {txn.post.title}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={txn.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(txn.createdAt), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetails(txn)}
                          className="p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No transactions found matching your criteria.
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} transactions
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

      {/* Transaction Details Modal */}
      {showModal && selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Details</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Transaction ID" value={selectedTxn._id} />
                <DetailRow label="Type" value={<TypeBadge type={selectedTxn.type || 'escrow'} />} />
                <DetailRow label="Amount" value={<span className="font-mono font-bold text-lg">{formatCurrency(selectedTxn.amount)}</span>} />
                <DetailRow label="Status" value={<StatusBadge status={selectedTxn.status} />} />
                <DetailRow label="Currency" value={selectedTxn.currency || 'INR'} />
                <DetailRow label="Created" value={format(new Date(selectedTxn.createdAt), 'MMMM d, yyyy HH:mm:ss')} />
              </div>

              {selectedTxn.fundedAt && (
                <DetailRow label="Funded At" value={format(new Date(selectedTxn.fundedAt), 'MMMM d, yyyy HH:mm:ss')} />
              )}
              {selectedTxn.releasedAt && (
                <DetailRow label="Released At" value={format(new Date(selectedTxn.releasedAt), 'MMMM d, yyyy HH:mm:ss')} />
              )}
              {selectedTxn.refundedAt && (
                <DetailRow label="Refunded At" value={format(new Date(selectedTxn.refundedAt), 'MMMM d, yyyy HH:mm:ss')} />
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Parties</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedTxn.buyer && (
                    <PartyCard
                      label="Buyer / Payer"
                      name={selectedTxn.buyer.displayName}
                      email={selectedTxn.buyer.email}
                      avatar={selectedTxn.buyer.avatar}
                      userId={selectedTxn.buyer._id}
                    />
                  )}
                  {selectedTxn.seller && (
                    <PartyCard
                      label="Seller / Recipient"
                      name={selectedTxn.seller.displayName}
                      email={selectedTxn.seller.email}
                      avatar={selectedTxn.seller.avatar}
                      userId={selectedTxn.seller._id}
                    />
                  )}
                </div>
              </div>

              {selectedTxn.post && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Post</h4>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {selectedTxn.post.images?.[0] && (
                      <img src={selectedTxn.post.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{selectedTxn.post.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Price: {formatCurrency(selectedTxn.post.price)}</p>
                    </div>
                    <a href={`/post/${selectedTxn.post._id}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              )}

              {selectedTxn.stripePaymentIntentId && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Stripe Details</h4>
                  <div className="space-y-2 text-sm">
                    <DetailRow label="Payment Intent ID" value={<code className="text-xs">{selectedTxn.stripePaymentIntentId}</code>} />
                    {selectedTxn.stripeTransferId && (
                      <DetailRow label="Transfer ID" value={<code className="text-xs">{selectedTxn.stripeTransferId}</code>} />
                    )}
                  </div>
                </div>
              )}
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

const PartyCard = ({ label, name, email, userId }) => (
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
      </div>
    </div>
  </div>
);

export default AdminPayments;