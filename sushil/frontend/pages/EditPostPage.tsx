import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Clock } from 'lucide-react';
import { Category, ExchangeType, Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { token, currentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: Category.JOB,
    exchangeType: ExchangeType.MONEY,
    price: '',
    location: '',
    expiryDuration: '30'
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const loadPost = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const fetched = await api.getPostById(id, token);
        if (fetched.creator.id !== currentUser?.id) {
          navigate('/feed');
          return;
        }
        if (!cancelled) {
          setPost(fetched);
          setFormData({
            title: fetched.title,
            description: fetched.description,
            category: fetched.category,
            exchangeType: fetched.exchangeType,
            price: fetched.price ?? '',
            location: fetched.location,
            expiryDuration: '30',
          });
        }
      } catch (err) {
        console.error('Failed to load post', err);
        if (!cancelled) {
          setError('Unable to load post. It may have been removed.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [id, token, currentUser, navigate]);

  if (isLoading) {
    return (
        <div className="max-w-2xl mx-auto animate-pulse">
            <div className="h-6 w-24 bg-gray-200 rounded mb-6" />
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b flex justify-between">
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="h-8 w-8 bg-gray-200 rounded" />
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                        <div className="h-10 w-full bg-gray-200 rounded" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                        <div className="h-10 w-full bg-gray-200 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="h-16 bg-gray-200 rounded" />
                         <div className="h-16 bg-gray-200 rounded" />
                    </div>
                    <div className="h-32 w-full bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );
  }

  if (!post && !isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">{error ?? 'Post not found'}</p>
        <button onClick={() => navigate('/feed')} className="text-primary hover:underline text-sm">
          Back to feed
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        type: formData.category,
        location: formData.location,
        acceptsBarter: formData.exchangeType === ExchangeType.BARTER,
      };

      if (formData.exchangeType === ExchangeType.MONEY && formData.price) {
        const parsed = Number(formData.price.replace(/[^\d.]/g, ''));
        payload.price = Number.isFinite(parsed) ? parsed : undefined;
      } else {
        payload.price = undefined;
      }

      await api.updatePost(token, id, payload);
      navigate(`/posts/${id}`);
    } catch (err) {
      console.error('Failed to update post', err);
      setError('Unable to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !id) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await api.deletePost(token, id);
      navigate('/feed');
    } catch (err) {
      console.error('Failed to delete post', err);
      setError('Unable to delete the post. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Cancel Edit</span>
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
             <h1 className="text-xl font-bold text-gray-900">Edit Post</h1>
             <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:pointer-events-none p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Post"
             >
                 <Trash2 size={20} />
             </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
             <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
             >
                 {Object.values(Category).map(c => (
                     <option key={c} value={c}>{c}</option>
                 ))}
             </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Type</label>
                 <select 
                    value={formData.exchangeType}
                    onChange={(e) => setFormData({...formData, exchangeType: e.target.value as ExchangeType})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                 >
                     {Object.values(ExchangeType).map(t => (
                         <option key={t} value={t}>{t}</option>
                     ))}
                 </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price / Value</label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="e.g. $50"
                />
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Post Expiry</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['7', '14', '30', 'never'].map((duration) => (
                  <button
                    type="button"
                    key={duration}
                    onClick={() => setFormData({ ...formData, expiryDuration: duration })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      formData.expiryDuration === duration
                        ? 'bg-primary/10 text-primary border-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {duration === 'never' ? 'Never' : `${duration} Days`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                <Clock size={12} />
                {formData.expiryDuration === 'never' 
                  ? 'Your post will remain active until you close it.' 
                  : `Post will be automatically archived after ${formData.expiryDuration} days.`}
              </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
             <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
             >
                 Cancel
             </button>
             <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
             >
                 {isSubmitting ? 'Saving...' : 'Save Changes'}
                 {!isSubmitting && <Save size={18} />}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};