import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Share2, MessageCircle, Shield, Tag, Info } from 'lucide-react';
import { MOCK_POSTS } from '../services/mockData';
import { ExchangeType } from '../types';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const post = MOCK_POSTS.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h2>
        <p className="text-gray-500 mb-4">The post you are looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/')}
          className="text-primary hover:underline"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`Hi ${post.creator.name}, I'm interested in your post on HyperLocal: "${post.title}"`);
    window.open(`https://wa.me/${post.creator.whatsappNumber}?text=${message}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
        // Fallback for desktop/unsupported browsers
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="pb-24 md:pb-0 max-w-5xl mx-auto">
      {/* Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Feed</span>
      </button>

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
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{post.location} ({post.distance}km away)</span>
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

             <button 
                onClick={handleWhatsAppClick}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm mb-3"
             >
                <MessageCircle size={20} />
                Chat on WhatsApp
             </button>

             <div className="text-center">
               <p className="text-xs text-gray-400">Usually responds within an hour</p>
             </div>
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

             <button className="w-full py-2 border border-gray-200 text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors">
                View Profile
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
