import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Filter,
  X,
  Briefcase,
  Wrench,
  ShoppingBag,
  Package,
  DollarSign,
  Repeat,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Category, ExchangeType, Post } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const FeedPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExchangeTypes, setSelectedExchangeTypes] = useState<ExchangeType[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'nearest'>('recent');
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchPosts = async () => {
      try {
        const feed = token ? await api.getPersonalFeed(token) : await api.getPublicFeed();
        if (isMounted) {
          setPosts(feed);
        }
      } catch (err) {
        console.error('Failed to load feed', err);
        if (isMounted) {
          setError('Unable to load feed. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const toggleExchangeType = (type: ExchangeType) => {
    if (selectedExchangeTypes.includes(type)) {
      setSelectedExchangeTypes(prev => prev.filter(t => t !== type));
    } else {
      setSelectedExchangeTypes(prev => [...prev, type]);
    }
  };

  const filteredPosts = useMemo(() => {
    const filtered = posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesExchange =
        selectedExchangeTypes.length === 0 || selectedExchangeTypes.includes(post.exchangeType);

      return matchesSearch && matchesCategory && matchesExchange;
    });

    if (sortBy === 'nearest') {
      return filtered.slice().sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    return filtered;
  }, [posts, searchTerm, selectedCategory, selectedExchangeTypes, sortBy]);

  const handleCreatorClick = (e: React.MouseEvent, creatorId: string) => {
    e.stopPropagation();
    navigate(`/profile/${creatorId}`);
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

  const getExchangeIcon = (type: ExchangeType) => {
    switch (type) {
      case ExchangeType.MONEY: return <DollarSign size={12} />;
      case ExchangeType.BARTER: return <Repeat size={12} />;
      case ExchangeType.SERVICE: return <Wrench size={12} />;
      case ExchangeType.FREE: return <Gift size={12} />;
      case ExchangeType.OPEN: return <HelpCircle size={12} />;
      default: return <DollarSign size={12} />;
    }
  };

  const getExchangeBadgeStyle = (type: ExchangeType) => {
    switch (type) {
      case ExchangeType.MONEY: return 'bg-green-100 text-green-700';
      case ExchangeType.FREE: return 'bg-blue-100 text-blue-700';
      case ExchangeType.BARTER: return 'bg-purple-100 text-purple-700';
      case ExchangeType.SERVICE: return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 animate-pulse">
           <div className="space-y-2">
               <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
               <div className="h-4 w-64 bg-gray-200 rounded-lg"></div>
           </div>
           <div className="h-10 w-full md:w-80 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Categories Skeleton */}
        <div className="flex gap-2 overflow-hidden pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
            ))}
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 space-y-3 shadow-sm">
                    <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex justify-between">
                             <div className="h-3 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                             <div className="h-3 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="pt-2 border-t flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
                         <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Local Feed</h1>
          <p className="text-gray-500 text-xs md:text-sm">Discover opportunities in your neighborhood</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm flex-1 md:w-80 focus-within:ring-2 ring-primary/20 transition-all">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none flex-1 text-sm text-gray-700 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border shadow-sm transition-colors ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            aria-label="Toggle filters"
          >
            {showFilters ? <X size={18} /> : <Filter size={18} />}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Exchange Type</h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(ExchangeType).map((type) => (
                <button
                  key={type}
                  onClick={() => toggleExchangeType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedExchangeTypes.includes(type)
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {getExchangeIcon(type)}
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Sort By</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    sortBy === 'recent' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                Most Recent
              </button>
              <button
                onClick={() => setSortBy('nearest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    sortBy === 'nearest' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                Nearest First
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <button 
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategory === 'All' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          All
        </button>
        {Object.values(Category).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {getCategoryIcon(cat)}
            {cat}
          </button>
        ))}
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPosts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => navigate(`/posts/${post.id}`)}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
          >
            {/* Post Image Preview - Square */}
            <div className="relative aspect-square bg-gray-200 overflow-hidden">
              <img 
                src={post.images[0]} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Category Badge */}
              <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-gray-800 shadow-sm flex items-center gap-1 border border-white/20">
                {getCategoryIcon(post.category)}
                {post.category}
              </div>

              {/* Distance Badge */}
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 backdrop-blur-sm border border-white/10">
                <MapPin size={8} />
                {post.distance}km
              </div>
            </div>

            <div className="p-3 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1 gap-2">
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors line-clamp-1">{post.title}</h3>
                
                {/* Exchange Type Badge */}
                <span className={`shrink-0 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${getExchangeBadgeStyle(post.exchangeType)}`}>
                  {getExchangeIcon(post.exchangeType)}
                  {post.price || post.exchangeType}
                </span>
              </div>
              
              <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1 leading-relaxed">{post.description}</p>
              
              <div className="flex items-center justify-between pt-2 border-t mt-auto">
                <div 
                  className="flex items-center gap-1.5 hover:bg-gray-50 rounded-full pr-2 py-0.5 -ml-1 transition-colors group/creator"
                  onClick={(e) => handleCreatorClick(e, post.creator.id)}
                >
                  <img src={post.creator.avatar} alt={post.creator.name} className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-[10px] text-gray-600 font-medium group-hover/creator:text-primary group-hover/creator:underline">{post.creator.name}</span>
                </div>
                
                <span className="text-[10px] text-gray-400">
                    {post.postedAt}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-100 p-3 rounded-full mb-3">
            <Filter size={24} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No posts found</h3>
          <p className="text-xs text-gray-500">Try adjusting your search or filters.</p>
          <button 
             onClick={() => {
                 setSearchTerm('');
                 setSelectedCategory('All');
                 setSelectedExchangeTypes([]);
                 setShowFilters(false);
             }}
             className="mt-2 text-primary text-xs font-medium hover:underline"
          >
              Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};