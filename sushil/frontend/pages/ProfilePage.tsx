import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Calendar, Camera,
  Grid, Briefcase, Wrench, ShoppingBag, Package,
  Phone, Edit3, Share2, CheckCircle2, MessageCircle, Mail,
  Shield, Eye, EyeOff, Upload, User as UserIcon, AtSign, Smartphone
} from 'lucide-react';
import { Category, ExchangeType, User, PrivacySettings, Post, Review } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [displayUser, setDisplayUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { currentUser, token, refreshUser } = useAuth();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const loadProfile = async () => {
      try {
        if (!id && currentUser) {
          if (!cancelled) {
            setDisplayUser(currentUser);
            setFormData(JSON.parse(JSON.stringify(currentUser)));
          }
          return;
        }

        if (id) {
          const profile = await api.getPublicProfile(id);
          if (!cancelled) {
            setDisplayUser(profile);
            setFormData(JSON.parse(JSON.stringify(profile)));
          }
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        if (!cancelled) {
          setError('Unable to load profile.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [id, currentUser]);

  useEffect(() => {
    if (!displayUser) return;
    let cancelled = false;
    setPostsLoading(true);
    setPostsError(null);

    const loadPosts = async () => {
      try {
        let fetched: Post[] = [];
        if (displayUser.id === currentUser?.id && token) {
          fetched = await api.getMyPosts(token);
        } else {
          fetched = await api.getPostsByUser(displayUser.id);
        }
        if (!cancelled) {
          setUserPosts(fetched);
        }
      } catch (err) {
        console.error('Failed to load user posts', err);
        if (!cancelled) {
          setPostsError('Unable to load listings.');
        }
      } finally {
        if (!cancelled) {
          setPostsLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [displayUser, currentUser, token]);

  useEffect(() => {
    if (!displayUser) return;
    let cancelled = false;
    setReviewsLoading(true);
    setReviewsError(null);

    const loadReviews = async () => {
      try {
        const data = await api.getUserReviews(displayUser.id);
        if (!cancelled) {
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to load user reviews', err);
        if (!cancelled) {
          setReviewsError('Unable to load reviews right now.');
        }
      } finally {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [displayUser]);

  if (isLoading) {
    return (
        <div className="max-w-4xl mx-auto pb-8 animate-pulse">
            <div className="bg-white md:rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
                <div className="h-32 md:h-56 bg-gray-200" />
                <div className="px-6 md:px-10 pb-8">
                    <div className="flex flex-col md:flex-row items-start gap-6 relative">
                         <div className="relative -mt-12 md:-mt-16 shrink-0 mx-auto md:mx-0">
                             <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-gray-300 border-4 border-white shadow-md" />
                         </div>
                         <div className="flex-1 w-full mt-2 md:mt-4 space-y-4">
                             <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                 <div className="space-y-2 text-center md:text-left">
                                     <div className="h-8 w-48 bg-gray-200 rounded mx-auto md:mx-0" />
                                     <div className="h-4 w-64 bg-gray-200 rounded mx-auto md:mx-0" />
                                 </div>
                                 <div className="hidden md:flex gap-2">
                                     <div className="h-10 w-24 bg-gray-200 rounded-lg" />
                                     <div className="h-10 w-24 bg-gray-200 rounded-lg" />
                                 </div>
                             </div>
                             <div className="h-16 w-full bg-gray-200 rounded-xl" />
                         </div>
                    </div>
                </div>
            </div>
             <div className="flex gap-4 border-b border-gray-200 mb-6 px-4 md:px-0">
                <div className="h-8 w-24 bg-gray-200 rounded-t-lg" />
                <div className="h-8 w-24 bg-gray-200 rounded-t-lg" />
             </div>
        </div>
    );
  }

  if (!displayUser || !formData) {
    return (
        <div className="flex flex-col items-center justify-center h-96">
            <h2 className="text-xl font-bold text-gray-900">User not found</h2>
            <button onClick={() => navigate('/feed')} className="mt-4 text-primary hover:underline">Return to Feed</button>
        </div>
    );
  }

  const isCurrentUser = !!currentUser && displayUser.id === currentUser.id;
  const ratingAvg = displayUser.ratingAvg ?? 0;
  const ratingCount = displayUser.ratingCount ?? 0;

  const handleSave = async () => {
    if (!token || !formData) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        bio: formData.bio,
        area: formData.area,
        location: formData.location,
        whatsappNumber: formData.whatsappNumber,
        email: formData.email,
        displayName: formData.name,
        privacy: formData.privacy,
      };
      await api.updateCurrentUser(token, payload);
      await refreshUser();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      setError('Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const togglePrivacy = (key: keyof PrivacySettings) => {
    if (formData && formData.privacy) {
       setFormData({
           ...formData,
           privacy: {
               ...formData.privacy,
               [key]: !formData.privacy[key]
           }
       });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverImage') => {
    if (e.target.files && e.target.files[0] && formData) {
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData({ ...formData, [type]: url });
    }
  };

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case Category.JOB: return <Briefcase size={12} />;
      case Category.SERVICE: return <Wrench size={12} />;
      case Category.SELL: return <ShoppingBag size={12} />;
      case Category.RENT: return <Package size={12} />;
      default: return <Briefcase size={12} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      
      {/* Main Profile Card */}
      <div className="bg-white md:rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-6">
        
        {/* Cover Photo */}
        <div className="h-32 md:h-56 relative group bg-gray-100">
            {formData.coverImage ? (
                <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-cyan-900 via-[#1F7F8F] to-teal-600" />
            )}
            
            {isCurrentUser && (
                <>
                    <button 
                        onClick={() => isEditing && coverInputRef.current?.click()}
                        className={`absolute top-4 right-4 bg-black/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${isEditing ? 'hover:bg-black/40 cursor-pointer' : 'opacity-0'}`}
                    >
                        <Camera size={14} /> 
                        <span className="hidden md:inline">Edit Cover</span>
                    </button>
                    <input 
                        type="file" 
                        ref={coverInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleImageChange(e, 'coverImage')}
                    />
                </>
            )}
        </div>

        {/* Profile Content */}
        <div className="px-6 md:px-10 pb-8">
            <div className="flex flex-col md:flex-row items-start gap-6 relative">
                
                {/* Avatar (Negative Margin) */}
                <div className="relative -mt-12 md:-mt-16 shrink-0 mx-auto md:mx-0 group">
                    <img 
                        src={formData.avatar} 
                        alt={formData.name} 
                        className="w-24 h-24 md:w-36 md:h-36 rounded-full border-4 border-white shadow-md object-cover bg-gray-100"
                    />
                    {isCurrentUser && isEditing && (
                         <div 
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity border-4 border-transparent"
                         >
                            <Camera size={24} className="text-white" />
                         </div>
                    )}
                    <input 
                        type="file" 
                        ref={avatarInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleImageChange(e, 'avatar')}
                    />
                </div>

                {/* Identity & Actions */}
                <div className="flex-1 w-full text-center md:text-left mt-2 md:mt-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        
                        {/* Name & Meta */}
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-3 max-w-sm mx-auto md:mx-0">
                                    <div className="relative">
                                        <UserIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full pl-9 pr-4 py-2 text-lg font-bold text-gray-900 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.area}
                                            onChange={(e) => setFormData({...formData, area: e.target.value})}
                                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="Location / Area"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                                        {displayUser.name}
                                        <span className="text-blue-500" title="Verified User">
                                            <CheckCircle2 size={20} fill="currentColor" className="text-blue-100" />
                                        </span>
                                    </h1>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-sm text-gray-500 mt-2">
                                        {(displayUser.privacy.showLocation || isCurrentUser) && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin size={15} className="text-gray-400" />
                                                {displayUser.area}
                                            </span>
                                        )}
                                        <span className="hidden md:inline text-gray-300">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={15} className="text-gray-400" />
                                            Joined {new Date(displayUser.joinDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-2">
                            {isCurrentUser ? (
                                isEditing ? (
                                    <div className="flex gap-2">
                                        <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData(JSON.parse(JSON.stringify(currentUser)));
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-cyan-700 shadow-sm transition-colors disabled:opacity-60"
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all"
                                >
                                    <Edit3 size={16} /> Edit Profile
                                </button>
                            )
                            ) : (
                                <>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                        <Share2 size={20} />
                                    </button>
                                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-all">
                                        <Mail size={16} /> Message
                                    </button>
                                    {(displayUser.privacy.showPhone) && (
                                        <button className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-cyan-700 rounded-lg flex items-center gap-2 transition-all shadow-sm">
                                            <Phone size={16} /> Contact
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="md:hidden mt-6 flex gap-3">
                         {isCurrentUser ? (
                            isEditing ? (
                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData(JSON.parse(JSON.stringify(displayUser)));
                                        }}
                                        className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button onClick={handleSave} className="flex-1 py-2 text-sm font-medium bg-primary text-white rounded-lg shadow-sm">
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Edit3 size={16} /> Edit Profile
                                </button>
                            )
                        ) : (
                            <>
                                {(displayUser.privacy.showPhone) && (
                                    <button 
                                        onClick={() => window.location.href = `tel:${displayUser.whatsappNumber}`}
                                        className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                                    >
                                        <Phone size={18} /> Call
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        const message = encodeURIComponent(`Hi ${displayUser.name}, I saw your profile on MyCircle.`);
                                        window.open(`https://wa.me/${displayUser.whatsappNumber}?text=${message}`, '_blank');
                                    }}
                                    className="flex-1 py-2 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-cyan-700 transition-colors shadow-sm"
                                >
                                    <MessageCircle size={18} /> Chat
                                </button>
                            </>
                        )}
                    </div>

                    {/* Stats Row */}
                    {((displayUser.privacy.showStats || isCurrentUser) && !isEditing) && (
                        <div className="flex items-center justify-center md:justify-start gap-8 mt-6 pt-6 border-t border-gray-50">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{displayUser.completedDeals ?? 0}</p>
                                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Deals Done</p>
                            </div>
                            <div className="w-px h-8 bg-gray-100" />
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{displayUser.responseRate ?? 0}%</p>
                                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Reply Rate</p>
                            </div>
                             <div className="w-px h-8 bg-gray-100" />
                            <div>
                                <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
                                    {ratingAvg.toFixed(1)} <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                </div>
                                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">
                                  Rating{ratingCount > 0 ? ` (${ratingCount})` : ''}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Bio, Contact Info & Privacy Settings */}
                    <div className="mt-8 max-w-2xl">
                        {isEditing ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                                    <textarea 
                                        className="w-full border rounded-xl p-3 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-primary/20 resize-none bg-gray-50"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                        placeholder="Tell the community about yourself..."
                                    />
                                </div>

                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Smartphone size={16} className="text-primary" />
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                                            <div className="relative">
                                                <AtSign size={14} className="absolute left-3 top-2.5 text-gray-400" />
                                                <input 
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Phone / WhatsApp</label>
                                            <div className="relative">
                                                <Phone size={14} className="absolute left-3 top-2.5 text-gray-400" />
                                                <input 
                                                    type="tel"
                                                    value={formData.whatsappNumber}
                                                    onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                                                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                                    placeholder="1234567890"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield size={16} className="text-primary" />
                                        Privacy Settings
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { key: 'showEmail', label: 'Show Email Address' },
                                            { key: 'showPhone', label: 'Show Phone Number' },
                                            { key: 'showLocation', label: 'Show Location' },
                                            { key: 'showStats', label: 'Show Statistics' }
                                        ].map((item) => (
                                            <div 
                                                key={item.key}
                                                className="flex items-center justify-between cursor-pointer group select-none"
                                                onClick={() => togglePrivacy(item.key as keyof PrivacySettings)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {formData.privacy[item.key as keyof PrivacySettings] ? <Eye size={16} className="text-gray-500"/> : <EyeOff size={16} className="text-gray-400"/>}
                                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{item.label}</span>
                                                </div>
                                                <div className={`w-11 h-6 rounded-full relative transition-colors ${formData.privacy[item.key as keyof PrivacySettings] ? 'bg-primary' : 'bg-gray-300'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${formData.privacy[item.key as keyof PrivacySettings] ? 'left-6' : 'left-1'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                {displayUser.bio || "No bio added yet."}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="">
          {/* Custom Tab Navigation */}
          <div className="flex items-center gap-8 border-b border-gray-200 mb-6 px-4 md:px-0">
             <button
                onClick={() => setActiveTab('posts')}
                className={`pb-3 text-sm font-semibold transition-all relative ${
                    activeTab === 'posts' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
             >
                 Listings
                 <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{userPosts.length}</span>
                 {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 rounded-t-full" />}
             </button>
             <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 text-sm font-semibold transition-all relative ${
                    activeTab === 'reviews' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
             >
                 Reviews
                 <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{ratingCount}</span>
                 {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 rounded-t-full" />}
             </button>
          </div>

          {/* Grid Content */}
          <div className="px-4 md:px-0">
             {activeTab === 'posts' ? (
                postsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Loading listings…</p>
                  </div>
                ) : postsError ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-red-100">
                    <p className="text-sm text-red-500">{postsError}</p>
                  </div>
                ) : userPosts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userPosts.map((post) => (
                        <div 
                            key={post.id} 
                            onClick={() => navigate(`/posts/${post.id}`)}
                            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                        >
                            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                <img 
                                    src={post.images[0]} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-800 shadow-sm flex items-center gap-1.5 border border-white/20">
                                    {getCategoryIcon(post.category)}
                                    {post.category}
                                </div>
                                <div className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md ${
                                    post.exchangeType === ExchangeType.MONEY ? 'bg-green-500/90 text-white' : 'bg-blue-500/90 text-white'
                                }`}>
                                    {post.price || post.exchangeType}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors line-clamp-1 mb-1">{post.title}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <MapPin size={12} /> {post.distance ? `${post.distance}km away` : post.location}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{post.postedAt}</span>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Grid className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-gray-900 font-medium">No active listings</h3>
                        <p className="text-gray-500 text-sm mt-1">This user hasn't posted anything yet.</p>
                    </div>
                )
             ) : (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Reviews</h3>
                      <p className="text-sm text-gray-500 mt-1">Ratings are collected per-post.</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-2xl font-bold text-gray-900">
                        {ratingAvg.toFixed(1)} <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      </div>
                      <p className="text-xs text-gray-400">{ratingCount} total ratings</p>
                    </div>
                  </div>

                  <div className="mt-6 text-sm text-gray-600">
                    To see written feedback, open any listing and check the Reviews section.
                  </div>
                </div>
             )}
          </div>
      </div>
    </div>
  );
};