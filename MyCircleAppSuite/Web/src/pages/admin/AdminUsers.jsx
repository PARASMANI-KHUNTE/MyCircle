import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import {
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Ban,
  UserCog,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const ITEMS_PER_PAGE = 20;



  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users || res.data);
      setTotalUsers(res.data.total || res.data.length);
      setTotalPages(Math.ceil((res.data.total || res.data.length) / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (userId, action, data = {}) => {
    setActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/${action}`, data);
      fetchUsers();
      if (showModal) setShowModal(false);
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      alert(`Failed to ${action} user: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const openModal = (type, user) => {
    setSelectedUser(user);
    setModalType(type);
    setShowModal(true);
  };

  const getStatusBadge = (user) => {
    if (user.banned) return { label: 'Banned', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
    if (user.isOnline) return { label: 'Online', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
    return { label: 'Offline', className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' };
  };

  const getRoleBadge = (role) => {
    const configs = {
      admin: { label: 'Admin', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
      moderator: { label: 'Moderator', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
      user: { label: 'User', className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
    };
    return configs[role] || configs.user;
  };

  const columns = [
    { key: 'avatar', label: '' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'stats', label: 'Activity' },
    { key: 'joined', label: 'Joined' },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View, search, and manage platform users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active (24h)</option>
              <option value="banned">Banned</option>
              <option value="online">Online Now</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                          {user.displayName?.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{user.displayName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {user._id?.slice(-8)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 dark:text-white">{user.email}</div>
                        {user.contactPhone && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.contactPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role).className}`}>
                          {getRoleBadge(user.role).label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user).className}`}>
                          {getStatusBadge(user).label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <div>Posts: {user.stats?.totalPosts || 0}</div>
                        <div>Completed: {user.stats?.tasksCompleted || 0}</div>
                        <div>Trust: {user.reputation?.trustScore || 50}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal('view', user)}
                            className="p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => openModal('role', user)}
                                disabled={actionLoading === user._id}
                                className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Change Role"
                              >
                                <UserCog className="w-4 h-4" />
                              </button>
                              {!user.banned ? (
                                <button
                                  onClick={() => openModal('ban', user)}
                                  disabled={actionLoading === user._id}
                                  className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  title="Ban User"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => openModal('unban', user)}
                                  disabled={actionLoading === user._id}
                                  className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  title="Unban User"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No users found matching your criteria.
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)} of {totalUsers} users
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalType === 'view' ? 'User Details' :
                 modalType === 'ban' ? 'Ban User' :
                 modalType === 'unban' ? 'Unban User' : 'Change Role'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'view' && selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-medium">
                    {selectedUser.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{selectedUser.displayName}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Role:</span> <span className="font-medium ml-2">{selectedUser.role}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Status:</span> <span className="font-medium ml-2">{selectedUser.banned ? 'Banned' : 'Active'}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Posts:</span> <span className="font-medium ml-2">{selectedUser.stats?.totalPosts || 0}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Trust Score:</span> <span className="font-medium ml-2">{selectedUser.reputation?.trustScore || 50}</span></div>
                  <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">Joined:</span> <span className="font-medium ml-2">{format(new Date(selectedUser.createdAt), 'MMMM d, yyyy')}</span></div>
                  <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">Last Seen:</span> <span className="font-medium ml-2">{selectedUser.lastSeenAt ? format(new Date(selectedUser.lastSeenAt), 'MMMM d, yyyy HH:mm') : 'Never'}</span></div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Close</button>
              </div>
            )}

            {modalType === 'ban' && selectedUser && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">Are you sure you want to ban <strong>{selectedUser.displayName}</strong>? They will lose access to the platform.</p>
                <textarea placeholder="Reason for ban (optional)" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" rows={3} />
                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                  <button onClick={() => handleAction(selectedUser._id, 'ban')} disabled={actionLoading === selectedUser._id} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Ban User</button>
                </div>
              </div>
            )}

            {modalType === 'unban' && selectedUser && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">Unban <strong>{selectedUser.displayName}</strong>? They will regain access to the platform.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                  <button onClick={() => handleAction(selectedUser._id, 'unban')} disabled={actionLoading === selectedUser._id} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Unban User</button>
                </div>
              </div>
            )}

            {modalType === 'role' && selectedUser && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">Change role for <strong>{selectedUser.displayName}</strong> (current: {selectedUser.role})</p>
                <select defaultValue={selectedUser.role} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                  <button onClick={() => handleAction(selectedUser._id, 'role', { role: selectedUser.role })} disabled={actionLoading === selectedUser._id} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">Update Role</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;