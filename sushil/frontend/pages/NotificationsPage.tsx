import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, MessageCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { ContactRequest } from '../types';

export const NotificationsPage: React.FC = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReceivedRequests(token);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests', err);
      setError('Unable to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await api.updateRequestStatus(token, id, status);
      setRequests(prev => prev.map(req => (req.id === id ? updated : req)));
    } catch (err) {
      console.error('Failed to update request', err);
      setError('Unable to update request. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderStatusBadge = (status: ContactRequest['status']) => {
    const classes: Record<ContactRequest['status'], string> = {
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${classes[status]}`}>
        {status === 'approved' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Pending'}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <p className="text-sm text-gray-500">
          Manage contact requests from neighbors who are interested in your posts.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          Loading alerts…
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
          No alerts yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl divide-y">
          {requests.map(request => (
            <div key={request.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={request.requester.avatar}
                  alt={request.requester.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{request.requester.name}</p>
                  <p className="text-sm text-gray-500">
                    wants to connect about <span className="font-medium text-gray-800">“{request.post.title}”</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    {renderStatusBadge(request.status)}
                    <span>{new Date(request.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {request.status === 'approved' && request.post.contactWhatsapp && (
                  <a
                    href={`https://wa.me/${request.post.contactWhatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                )}

                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'rejected')}
                      disabled={updatingId === request.id}
                      className="px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 disabled:opacity-50"
                    >
                      {updatingId === request.id ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'approved')}
                      disabled={updatingId === request.id}
                      className="px-3 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-cyan-700 disabled:opacity-60 inline-flex items-center gap-1"
                    >
                      {updatingId === request.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      Accept
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
