import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Users, Shield, AlertTriangle, Activity, 
  MoreVertical, Search, Filter, Ban, Trash2, 
  CheckCircle, XCircle, ChevronDown, LayoutDashboard, 
  FileText, Settings, LogOut, X, MapPin, Calendar, Mail, Lock, Save,
  Briefcase, Wrench, ShoppingBag, Package, DollarSign, Clock, Edit3
} from 'lucide-react';
import { User, PostStatus, Post, Category, ExchangeType } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

// Define the extended user type for dashboard
interface AdminDashboardUser extends Partial<User> {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  area?: string;
  status?: string;
  lastActive?: string;
  reports?: number;
}

const formatRelativeTime = (timestamp?: string) => {
  if (!timestamp) return 'Recently';
  const now = Date.now();
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) return 'Recently';
  const diff = now - value;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

const mapUserToAdminUser = (user: User): AdminDashboardUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  area: user.area,
  completedDeals: user.completedDeals,
  responseRate: user.responseRate,
  status: 'Active',
  lastActive: formatRelativeTime(user.joinDate),
  reports: 0,
});

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // User Management State
  const [selectedUser, setSelectedUser] = useState<AdminDashboardUser | null>(null);
  const [openUserActionId, setOpenUserActionId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminDashboardUser[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // Post Moderation State
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [openPostActionId, setOpenPostActionId] = useState<string | null>(null);
  const [postSearchTerm, setPostSearchTerm] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Settings State
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error' | '', text: string }>({ type: '', text: '' });
  
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (token === null) {
      navigate('/login');
    }
  }, [token, navigate]);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const data = await api.getAllPosts(token);
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts', err);
      setPostsError('Unable to load posts right now.');
    } finally {
      setPostsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const derivedUsers = useMemo(() => {
    const map = new Map<string, AdminDashboardUser>();
    posts.forEach((post) => {
      const creator = post.creator;
      if (!map.has(creator.id)) {
        map.set(creator.id, mapUserToAdminUser(creator));
      }
    });
    return Array.from(map.values());
  }, [posts]);

  useEffect(() => {
    setUsers((prev) => {
      const prevMap = new Map<string, AdminDashboardUser>(
        prev.map((user) => [user.id, user] as const)
      );
      return derivedUsers.map((user) => {
        const existing = prevMap.get(user.id);
        return existing
          ? {
              ...user,
              status: existing.status ?? user.status,
              reports: existing.reports ?? user.reports,
              lastActive: existing.lastActive ?? user.lastActive,
            }
          : user;
      });
    });
  }, [derivedUsers]);

  useEffect(() => {
    if (!selectedPost) return;
    const updated = posts.find((post) => post.id === selectedPost.id);
    if (!updated) {
      setSelectedPost(null);
      setIsEditingPost(false);
    } else if (updated !== selectedPost) {
      setSelectedPost(updated);
    }
  }, [posts, selectedPost]);

  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return users;
    const query = userSearchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        (user.email?.toLowerCase().includes(query) ?? false)
    );
  }, [users, userSearchTerm]);

  const filteredPosts = useMemo(() => {
    if (!postSearchTerm.trim()) return posts;
    const query = postSearchTerm.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.creator.name.toLowerCase().includes(query)
    );
  }, [posts, postSearchTerm]);

  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const openPosts = posts.filter((post) => post.status === PostStatus.OPEN).length;
    const totalUsers = users.length;
    const avgResponse =
      totalUsers === 0
        ? 0
        : Math.round(
            users.reduce((sum, user) => sum + (user.responseRate ?? 0), 0) / totalUsers
          );

    return [
      { label: 'Total Users', value: totalUsers.toLocaleString('en-IN'), change: '+0%', isPositive: true, icon: Users },
      { label: 'Total Posts', value: totalPosts.toLocaleString('en-IN'), change: '+0%', isPositive: true, icon: FileText },
      { label: 'Open Posts', value: openPosts.toLocaleString('en-IN'), change: `${totalPosts ? Math.round((openPosts / totalPosts) * 100) : 0}% open`, isPositive: true, icon: Activity },
      { label: 'Avg Response Rate', value: `${avgResponse}%`, change: 'Live', isPositive: avgResponse >= 50, icon: Shield },
    ];
  }, [posts, users]);

  const handleLogout = () => {
      navigate('/login');
  };

  // --- User Handlers ---
  const handleUserActionClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenUserActionId(openUserActionId === id ? null : id);
  };

  const handleUserStatusChange = (userId: string, newStatus: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    setOpenUserActionId(null);
  };

  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Banned': return 'bg-red-100 text-red-700 border-red-200';
      case 'Suspended': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // --- Post Handlers ---
  const handlePostActionClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenPostActionId(openPostActionId === id ? null : id);
  };

  const handleDeletePost = async (postId: string) => {
    if (!token) {
      setActionError('You must be logged in to manage posts.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    setDeletingPostId(postId);
    setActionError(null);
    try {
      await api.deletePost(token, postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setOpenPostActionId(null);
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
        setIsEditingPost(false);
      }
    } catch (err) {
      console.error('Failed to delete post', err);
      setActionError('Unable to delete this post right now.');
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleSavePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPost || !token) {
      setActionError('You must be logged in to manage posts.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const title = (formData.get('title') as string).trim();
    const description = (formData.get('description') as string).trim();
    const category = formData.get('category') as Category;
    const status = formData.get('status') as PostStatus;

    const payload: Record<string, unknown> = {
      title,
      description,
      type: category,
      status: status === PostStatus.OPEN ? 'open' : 'closed',
    };

    setIsSavingPost(true);
    setActionError(null);

    try {
      const updated = await api.updatePost(token, selectedPost.id, payload);
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPost(updated);
      setIsEditingPost(false);
    } catch (err) {
      console.error('Failed to save post', err);
      setActionError('Unable to save post changes.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const getPostStatusBadge = (status: PostStatus) => {
      switch (status) {
          case PostStatus.OPEN: return 'bg-green-100 text-green-800 border-green-200';
          case PostStatus.COMPLETED: return 'bg-blue-100 text-blue-800 border-blue-200';
          case PostStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
          case PostStatus.ARCHIVED: return 'bg-gray-100 text-gray-800 border-gray-200';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  // --- Settings Handler ---
  const handleUpdatePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSettingsMsg({ type: '', text: '' });
    
    const formData = new FormData(e.currentTarget);
    const currentPass = formData.get('currentPass') as string;
    const newPass = formData.get('newPass') as string;
    const confirmPass = formData.get('confirmPass') as string;

    const storedPass = localStorage.getItem('admin_password') || '12345';

    if (currentPass !== storedPass) {
      setSettingsMsg({ type: 'error', text: 'Current password is incorrect.' });
      return;
    }
    if (newPass !== confirmPass) {
       setSettingsMsg({ type: 'error', text: 'New passwords do not match.' });
       return;
    }
    if (newPass.length < 5) {
       setSettingsMsg({ type: 'error', text: 'New password must be at least 5 characters long.' });
       return;
    }

    localStorage.setItem('admin_password', newPass);
    setSettingsMsg({ type: 'success', text: 'Admin password updated successfully.' });
    e.currentTarget.reset();
  };

  const userRecentPosts = useMemo(() => {
    if (!selectedUser) return [];
    return posts.filter((post) => post.creator.id === selectedUser.id).slice(0, 5);
  }, [posts, selectedUser]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar Navigation - Dark Navy */}
      <aside className="w-64 bg-[#2B2D42] text-white flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700/50">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
             <span className="text-white font-extrabold text-lg">M</span>
          </div>
          <span className="font-bold text-xl tracking-wide">Admin</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'posts', label: 'Post Moderation', icon: FileText },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'users' ? 'User Management' : 
                   activeTab === 'posts' ? 'Post Moderation' :
                   activeTab === 'settings' ? 'Admin Settings' : 
                   'Dashboard Overview'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                  {activeTab === 'users' ? 'Manage accounts, permissions, and status.' : 
                   activeTab === 'posts' ? 'Review, edit, and delete community listings.' :
                   activeTab === 'settings' ? 'Manage your admin account and security.' : 
                   'Platform statistics and quick actions.'}
              </p>
            </div>
            {(activeTab === 'users' || activeTab === 'posts') && (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Last 30 Days</span>
                        <ChevronDown size={14} className="text-gray-400" />
                    </div>
                    <button className="bg-primary hover:bg-cyan-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm">
                        Export CSV
                    </button>
                </div>
            )}
          </div>

          {/* ----- CONTENT SWITCHER ----- */}
          
          {activeTab === 'settings' && (
              /* Settings View */
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-2xl">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gray-100 rounded-full text-gray-600">
                          <Lock size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-900">Security Settings</h3>
                          <p className="text-sm text-gray-500">Update your admin password.</p>
                      </div>
                  </div>

                  {settingsMsg.text && (
                      <div className={`p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2 ${
                          settingsMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                          {settingsMsg.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                          {settingsMsg.text}
                      </div>
                  )}

                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <input 
                              type="password" 
                              name="currentPass" 
                              required 
                              placeholder="••••••••"
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                              <input 
                                  type="password" 
                                  name="newPass" 
                                  required 
                                  placeholder="••••••••"
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                              <input 
                                  type="password" 
                                  name="confirmPass" 
                                  required 
                                  placeholder="••••••••"
                                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                          </div>
                      </div>
                      <div className="pt-2">
                          <button 
                              type="submit" 
                              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                          >
                              <Save size={18} /> Update Password
                          </button>
                      </div>
                  </form>
              </div>
          )}

          {activeTab === 'dashboard' && (
              <>
                 {/* Metrics Bar */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${stat.isPositive ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                            <stat.icon size={20} />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {stat.change}
                        </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                        <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    </div>
                    ))}
                </div>
                
                <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Platform Activity</h3>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">
                        Select "User Management" or "Post Moderation" from the sidebar to manage content.
                    </p>
                </div>
              </>
          )}

          {activeTab === 'users' && (
            <>
              {/* Filter & Search Bar */}
              <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="relative w-full md:w-96 group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search users by name or email..." 
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                    <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                       <Filter size={16} /> Filters
                    </button>
                 </div>
              </div>

              {/* User Table */}
              <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden mb-12">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-200">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Active</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                          onClick={() => setSelectedUser(user)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                              <div>
                                <p className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">{user.name}</p>
                                <p className="text-xs text-gray-500">ID: #{user.id.toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                {user.email}
                             </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                             {user.area}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getUserStatusBadge(user.status || 'Active')}`}>
                               {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {user.lastActive || 'Recently'}
                          </td>
                          <td className="px-6 py-4 text-right relative">
                            <button 
                              onClick={(e) => handleUserActionClick(e, user.id)}
                              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                            >
                              <MoreVertical size={18} />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {openUserActionId === user.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={(e) => { e.stopPropagation(); setOpenUserActionId(null); }}
                                />
                                <div className="absolute right-8 top-8 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setOpenUserActionId(null); }}
                                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-2"
                                  >
                                    <FileText size={16} /> View Details
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleUserStatusChange(user.id, 'Suspended'); }}
                                    className="w-full px-4 py-2.5 text-sm text-left text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                  >
                                    <AlertTriangle size={16} /> Suspend User
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleUserStatusChange(user.id, 'Banned'); }}
                                    className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Ban size={16} /> Ban User
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
                    <span className="text-sm text-gray-500">
                      Showing {filteredUsers.length} of {users.length} users
                    </span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded-lg text-sm bg-white disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border rounded-lg text-sm bg-white hover:bg-gray-50">Next</button>
                    </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'posts' && (
              <>
                {/* Post Filters & Search */}
                 <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="relative w-full md:w-96 group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text" 
                          placeholder="Search posts or creators..." 
                          value={postSearchTerm}
                          onChange={(e) => setPostSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                     </div>
                     <div className="flex gap-2 w-full md:w-auto">
                        <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                           <Filter size={16} /> Filter Status
                        </button>
                     </div>
                  </div>

                  {actionError && (
                    <div className="w-full bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 my-4">
                      {actionError}
                    </div>
                  )}

                  {postsLoading ? (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-12">
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin mb-3" />
                        <p className="text-sm text-gray-500">Loading posts…</p>
                      </div>
                    </div>
                  ) : postsError ? (
                    <div className="bg-white border border-red-100 rounded-2xl shadow-sm mb-12">
                      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <AlertTriangle className="text-red-400 mb-2" />
                        <p className="text-sm text-red-500">{postsError}</p>
                        <button
                          onClick={loadPosts}
                          className="mt-3 text-primary font-medium text-sm hover:underline"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden mb-12">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-200">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Post Details</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Creator</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Posted</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredPosts.map((post) => (
                            <tr 
                              key={post.id} 
                              className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                              onClick={() => { setSelectedPost(post); setIsEditingPost(false); }}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <img src={post.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-100" />
                                  <div>
                                    <p className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors line-clamp-1 w-48">{post.title}</p>
                                    <p className="text-xs text-gray-500">{post.price || post.exchangeType}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="text-sm text-gray-600 font-medium">{post.category}</span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2">
                                     <img src={post.creator.avatar} className="w-6 h-6 rounded-full" alt=""/>
                                     <span className="text-sm text-gray-600">{post.creator.name}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPostStatusBadge(post.status)}`}>
                                   {post.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {post.postedAt}
                              </td>
                              <td className="px-6 py-4 text-right relative">
                                <button 
                                  onClick={(e) => handlePostActionClick(e, post.id)}
                                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                                >
                                  <MoreVertical size={18} />
                                </button>
                                
                                {openPostActionId === post.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-10" 
                                      onClick={(e) => { e.stopPropagation(); setOpenPostActionId(null); }}
                                    />
                                    <div className="absolute right-8 top-8 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                      <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setSelectedPost(post); 
                                            setIsEditingPost(true);
                                            setOpenPostActionId(null);
                                        }}
                                        className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-2"
                                      >
                                        <Edit3 size={16} /> Edit Post
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                        disabled={deletingPostId === post.id}
                                        className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                                      >
                                        {deletingPostId === post.id ? (
                                          <>
                                            <Clock size={16} /> Deleting…
                                          </>
                                        ) : (
                                          <>
                                            <Trash2 size={16} /> Delete Post
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                          {filteredPosts.length === 0 && (
                             <tr>
                                 <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                     No posts found matching your search.
                                 </td>
                             </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}
              </>
          )}

        </div>
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-[#2B2D42] p-6 text-white flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <img src={selectedUser.avatar} alt="" className="w-20 h-20 rounded-full border-4 border-white/20" />
                    <div>
                       <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                       <div className="flex items-center gap-2 text-gray-300 text-sm mt-1">
                          <Mail size={14} /> {selectedUser.email}
                       </div>
                       <div className="flex items-center gap-2 text-gray-300 text-sm mt-1">
                          <MapPin size={14} /> {selectedUser.area}
                       </div>
                    </div>
                 </div>
                 <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                 >
                    <X size={20} />
                 </button>
              </div>

              {/* Modal Stats */}
              <div className="grid grid-cols-3 border-b border-gray-200 divide-x divide-gray-200">
                 <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedUser.completedDeals || 0}</p>
                    <p className="text-xs uppercase text-gray-500 font-bold tracking-wide">Deals</p>
                 </div>
                 <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedUser.reports || 0}</p>
                    <p className="text-xs uppercase text-gray-500 font-bold tracking-wide text-red-500">Reports</p>
                 </div>
                 <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedUser.responseRate || 100}%</p>
                    <p className="text-xs uppercase text-gray-500 font-bold tracking-wide">Reliability</p>
                 </div>
              </div>

              {/* Modal Body - Recent Posts */}
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                 <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Recent Activity
                 </h3>
                 <div className="space-y-3">
                    {userRecentPosts.length > 0 ? (
                        userRecentPosts.map(post => (
                            <div key={post.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-start group">
                                <div className="flex gap-3">
                                   <img src={post.images[0]} className="w-12 h-12 rounded-lg object-cover bg-gray-100" alt="" />
                                   <div>
                                      <h4 className="font-bold text-sm text-gray-900">{post.title}</h4>
                                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{post.description}</p>
                                      <span className="inline-block mt-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{post.status}</span>
                                   </div>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Delete Post">
                                   <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500 text-sm italic">
                           No recent posts found for this user.
                        </div>
                    )}
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getUserStatusBadge(selectedUser.status || 'Active')}`}>
                      Current Status: {selectedUser.status || 'Active'}
                  </span>
                  <div className="flex gap-3">
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                          Reset Password
                      </button>
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-red-200">
                          Delete Account
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Post Detail/Edit Modal */}
      {selectedPost && (
         <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               {/* Modal Header */}
               <div className="bg-[#2B2D42] p-6 text-white flex justify-between items-center">
                   <h2 className="text-xl font-bold">{isEditingPost ? 'Edit Post' : 'Post Details'}</h2>
                   <button 
                      onClick={() => { setSelectedPost(null); setIsEditingPost(false); }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                   >
                      <X size={20} />
                   </button>
               </div>

               {isEditingPost ? (
                   /* EDIT MODE */
                   <form onSubmit={handleSavePost} className="flex-1 flex flex-col overflow-hidden">
                       <div className="p-6 overflow-y-auto flex-1 space-y-4">
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Post Title</label>
                             <input 
                                name="title"
                                type="text" 
                                defaultValue={selectedPost.title}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                required
                             />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                             <select 
                                name="category"
                                defaultValue={selectedPost.category}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                             >
                                 {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                             <select 
                                name="status"
                                defaultValue={selectedPost.status}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                             >
                                 {Object.values(PostStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                             <textarea 
                                name="description"
                                defaultValue={selectedPost.description}
                                rows={6}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                required
                             />
                          </div>
                       </div>
                       <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                           <button 
                              type="button" 
                              onClick={() => setIsEditingPost(false)}
                              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                           >
                              Cancel
                           </button>
                           <button 
                              type="submit" 
                              className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors"
                           >
                              Save Changes
                           </button>
                       </div>
                   </form>
               ) : (
                   /* VIEW MODE */
                   <div className="flex-1 flex flex-col overflow-hidden">
                       <div className="overflow-y-auto flex-1">
                           <div className="aspect-video bg-gray-100 relative">
                               <img src={selectedPost.images[0]} alt="" className="w-full h-full object-cover" />
                               <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                   {selectedPost.category}
                               </div>
                           </div>
                           <div className="p-6">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       <h3 className="text-xl font-bold text-gray-900">{selectedPost.title}</h3>
                                       <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                           <span>Posted {selectedPost.postedAt} by</span>
                                           <span className="font-semibold text-gray-700 flex items-center gap-1">
                                               <img src={selectedPost.creator.avatar} className="w-5 h-5 rounded-full" alt=""/>
                                               {selectedPost.creator.name}
                                           </span>
                                       </p>
                                   </div>
                                   <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPostStatusBadge(selectedPost.status)}`}>
                                       {selectedPost.status}
                                   </span>
                               </div>
                               
                               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 flex gap-8">
                                   <div>
                                       <span className="block text-xs text-gray-500 uppercase font-bold tracking-wide">Exchange</span>
                                       <span className="font-medium text-gray-900">{selectedPost.exchangeType}</span>
                                   </div>
                                   <div>
                                       <span className="block text-xs text-gray-500 uppercase font-bold tracking-wide">Value</span>
                                       <span className="font-medium text-gray-900">{selectedPost.price || 'N/A'}</span>
                                   </div>
                                   <div>
                                       <span className="block text-xs text-gray-500 uppercase font-bold tracking-wide">Location</span>
                                       <span className="font-medium text-gray-900">{selectedPost.location}</span>
                                   </div>
                               </div>

                               <h4 className="font-bold text-gray-900 mb-2">Description</h4>
                               <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                   {selectedPost.description}
                               </p>
                           </div>
                       </div>
                       <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                           <button 
                              onClick={() => handleDeletePost(selectedPost.id)}
                              className="text-red-500 font-medium hover:text-red-700 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50"
                           >
                              <Trash2 size={18} /> Delete Post
                           </button>
                           <button 
                              onClick={() => setIsEditingPost(true)}
                              className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
                           >
                              <Edit3 size={18} /> Edit Post
                           </button>
                       </div>
                   </div>
               )}
            </div>
         </div>
      )}

    </div>
  );
};