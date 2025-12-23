import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Share2, MessageCircle, Shield, Edit2, Loader2, Star } from 'lucide-react';
import { ContactRequest, ExchangeType, Post, Review } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [request, setRequest] = useState<ContactRequest | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [myRating, setMyRating] = useState<number>(0);
  const [myText, setMyText] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { currentUser, token } = useAuth();
  const requestStatus = request?.status ?? 'none';
  const whatsappNumber = request?.post.contactWhatsapp || post?.contactWhatsapp || post?.creator.whatsappNumber;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    const load = async () => {
      try {
        const data = await api.getPostById(id, token);
        if (!cancelled) {
          setPost(data);
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

    load();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!id) return;
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const data = await api.getPostReviews(id);
        setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews', err);
        setReviewsError('Unable to load reviews.');
      } finally {
        setReviewsLoading(false);
      }
    };
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (!currentUser) return;
    const mine = reviews.find((r) => r.reviewer.id === currentUser.id);
    if (mine) {
      setMyRating(mine.rating);
      setMyText(mine.text ?? '');
    }
  }, [reviews, currentUser]);

  useEffect(() => {
    if (!token || !id) return;
    if (requestStatus === 'approved') return;
    const interval = setInterval(async () => {
      try {
        const sent = await api.getSentRequests(token);
        const existing = sent.find((req) => req.post.id === id);
        if (existing) setRequest(existing);
      } catch (err) {
        console.error('Failed to refresh request status', err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, token, requestStatus]);

  useEffect(() => {
    const fetchSentRequest = async () => {
      if (!token || !id) return;
      try {
        const sent = await api.getSentRequests(token);
        const existing = sent.find((req) => req.post.id === id);
        if (existing) setRequest(existing);
      } catch (err) {
        console.error('Failed to fetch sent requests', err);
      }
    };
    fetchSentRequest();
  }, [id, token]);

  if (isLoading) {
    return (
        <div className="max-w-5xl mx-auto animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="aspect-video bg-gray-200 rounded-2xl" />
                    <div className="h-10 w-3/4 bg-gray-200 rounded" />
                    <div className="flex gap-4">
                        <div className="h-5 w-24 bg-gray-200 rounded" />
                        <div className="h-5 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="space-y-2 pt-4">
                        <div className="h-4 w-full bg-gray-200 rounded" />
                        <div className="h-4 w-full bg-gray-200 rounded" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="h-64 bg-gray-200 rounded-2xl" />
                    <div className="h-40 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{error ? 'Unable to load post' : 'Post not found'}</h2>
        <p className="text-gray-500 mb-4">{error ?? "The post you are looking for doesn't exist or has been removed."}</p>
        <button
          onClick={() => navigate('/feed')}
          className="text-primary hover:underline"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const isOwner = currentUser?.id === post.creator.id;

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`Hi ${post.creator.name}, I'm interested in your post on MyCircle: "${post.title}"`);
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    }
  };

  const handleRequestContact = async () => {
    if (!token || !id) {
      navigate('/login');
      return;
    }
    if (requestStatus === 'pending') return;
    setIsRequesting(true);
    setError(null);
    setSuccess(null);
    try {
      const newRequest = await api.createContactRequest(token, id);
      setRequest(newRequest);
      setSuccess('Request sent! Awaiting approval.');
    } catch (err) {
      console.error('Failed to send request', err);
      setError('Unable to send request right now.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!token || !id) {
      navigate('/login');
      return;
    }
    if (isOwner) return;
    if (myRating < 1 || myRating > 5) {
      setReviewsError('Please select a rating from 1 to 5.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewsError(null);
    try {
      const res = await api.upsertPostReview(token, id, myRating, myText.trim() ? myText.trim() : undefined);

      setReviews((prev) => {
        const existingIdx = prev.findIndex((r) => r.id === res.review.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = res.review;
          return next;
        }
        return [res.review, ...prev];
      });

      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ratingAvg: res.postRating.avgRating,
          ratingCount: res.postRating.count,
          creator: {
            ...prev.creator,
            ratingAvg: res.ownerRating.avgRating,
            ratingCount: res.ownerRating.count,
          },
        };
      });
    } catch (err) {
      console.error('Failed to submit review', err);
      setReviewsError('Unable to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button 
            onClick={() => navigate('/feed')}
            className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Feed</span>
        </button>

        {isOwner && (
            <button 
                onClick={() => navigate(`/posts/${post.id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
                <Edit2 size={16} />
                Edit Post
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-video border shadow-sm relative group">
            <img 
              src={post.images[0]} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
            {post.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                    1 / {post.images.length}
                </div>
            )}
          </div>

          {/* Title & Stats */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
               <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wide">
                 {post.category}
               </span>
               <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  post.exchangeType === ExchangeType.MONEY ? 'bg-green-100 text-green-700' : 
                  post.exchangeType === ExchangeType.FREE ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {post.exchangeType}
               </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-800">{(post.ratingAvg ?? 0).toFixed(1)}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span>{post.ratingCount ?? 0} ratings</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{post.location}{post.distance ? ` (${post.distance}km away)` : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>Posted {post.postedAt}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Description */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {post.description}
            </p>
          </div>

          <div className="h-px bg-gray-200" />

          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reviews</h3>
                <p className="text-sm text-gray-500">Share your experience with this listing.</p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-xl font-bold text-gray-900">
                  {(post.ratingAvg ?? 0).toFixed(1)}
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-xs text-gray-400">{post.ratingCount ?? 0} total</p>
              </div>
            </div>

            {!isOwner && (
              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  {currentUser ? 'Your review' : 'Log in to leave a review'}
                </p>

                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => currentUser && setMyRating(n)}
                      disabled={!currentUser}
                      className="p-1 disabled:opacity-60"
                    >
                      <Star
                        size={20}
                        className={n <= myRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={myText}
                  onChange={(e) => setMyText(e.target.value)}
                  disabled={!currentUser}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100"
                  placeholder="Write a short review (optional)…"
                />

                {reviewsError && <p className="mt-2 text-sm text-red-600">{reviewsError}</p>}

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={!currentUser || isSubmittingReview}
                    className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-cyan-700 disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    {isSubmittingReview && <Loader2 className="animate-spin" size={16} />}
                    Submit
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {reviewsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="animate-spin" size={16} />
                  Loading reviews…
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.reviewer.avatar}
                          alt={r.reviewer.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{r.reviewer.name}</p>
                          <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={14}
                            className={n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                    </div>
                    {r.text && <p className="mt-3 text-sm text-gray-700 leading-relaxed">{r.text}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Safety Tip */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
            <Shield className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900 text-sm">Safety Tip</h4>
              <p className="text-blue-700 text-xs mt-1">
                Always meet in a public place. Do not transfer money before meeting or verifying the item/service.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar / Creator Info */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm sticky top-4">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <p className="text-sm text-gray-500 mb-1">Exchange Details</p>
                   <p className="text-2xl font-bold text-gray-900">
                     {post.price || post.exchangeType}
                   </p>
                </div>
                <button 
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Share2 size={20} />
                </button>
             </div>

             {isOwner ? (
               <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100 mb-3">
                 <p className="text-sm text-gray-600 font-medium">This is your post</p>
                 <p className="text-xs text-gray-400 mt-1">Manage it via the edit button above</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {requestStatus === 'approved' ? (
                   <button
                     onClick={handleWhatsAppClick}
                     disabled={!whatsappNumber}
                     className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                   >
                     <MessageCircle size={20} />
                     {whatsappNumber ? 'Chat on WhatsApp' : 'WhatsApp number missing'}
                   </button>
                 ) : (
                   <button
                     onClick={handleRequestContact}
                     disabled={isRequesting || requestStatus === 'pending'}
                     className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm disabled:opacity-60"
                   >
                     {isRequesting ? <Loader2 className="animate-spin" size={18} /> : <MessageCircle size={18} />}
                     {requestStatus === 'pending' ? 'Request Sent' : 'Request Contact'}
                   </button>
                 )}
                 <p className="text-xs text-gray-400 text-center">
                   {requestStatus === 'approved'
                     ? 'WhatsApp enabled — coordinate directly.'
                     : 'Owners can chat once your request is approved.'}
                 </p>
               </div>
             )}
          </div>

          {/* Creator Profile */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
             <h3 className="font-bold text-gray-900 mb-4">Posted by</h3>
             <div className="flex items-center gap-3 mb-4">
                <img 
                    src={post.creator.avatar} 
                    alt={post.creator.name} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                    <h4 className="font-bold text-gray-900">{post.creator.name}</h4>
                    <p className="text-xs text-gray-500">Member since {new Date(post.creator.joinDate).getFullYear()}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{post.creator.completedDeals}</p>
                    <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Deals</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{post.creator.responseRate}%</p>
                    <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Response</p>
                </div>
             </div>

             <button 
                onClick={() => navigate(`/profile/${post.creator.id}`)}
                className="w-full py-2 border border-gray-200 text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors"
             >
                View Profile
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};