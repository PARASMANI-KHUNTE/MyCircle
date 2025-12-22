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
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Category, ExchangeType, Post } from '../types';
import { api } from '../services/api';

export const PublicFeedPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExchangeTypes, setSelectedExchangeTypes] = useState<ExchangeType[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'nearest'>('recent');
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const feed = await api.getPublicFeed();
        if (!cancelled) {
          setPosts(feed);
        }
      } catch (err) {
        console.error('Failed to fetch public feed', err);
        if (!cancelled) {
          setError('Unable to load listings right now. Please try again later.');
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
  }, []);

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

  const handleItemClick = () => {
    // Redirect to login for interactions
    navigate('/login');
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Public Header */}
      <nav className="sticky top-0 w-full bg-white border-b border-gray-200 z-50 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">MyCircle</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-full hover:bg-cyan-700 transition-all shadow-sm"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Explore Neighborhood Listings</h1>
              <p className="text-gray-300">See what's happening in your local community today.</p>
            </div>
            <button 
              onClick={() => navigate('/signup')}
              className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-md flex items-center gap-2 whitespace-nowrap"
            >
              Join to Post & Chat <ArrowRight size={18} />
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex gap-2 w-full md:w-auto flex-1 md:max-w-lg">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm flex-1 focus-within:ring-2 ring-primary/20 transition-all">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search jobs, items, services..." 
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

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                    </div>
                ))}
            </div>
          ) : (
            /* Post Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPosts.map((post) => (
                <div 
                  key={post.id} 
                  onClick={handleItemClick}
                  className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer overflow-hidden flex flex-col"
                >
                  {/* Post Image Preview */}
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

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors line-clamp-1">{post.title}</h3>
                      
                      {/* Exchange Type Badge */}
                      <span className={`shrink-0 flex items-center gap-1 text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${getExchangeBadgeStyle(post.exchangeType)}`}>
                        {getExchangeIcon(post.exchangeType)}
                        {post.price || post.exchangeType}
                      </span>
                    </div>
                    
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2 flex-1 leading-relaxed">{post.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-2">
                        <img src={post.creator.avatar} alt={post.creator.name} className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                        <span className="text-xs text-gray-600 font-medium">{post.creator.name}</span>
                      </div>
                      
                      <span className="text-[10px] text-gray-400 font-medium">
                          {post.postedAt}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && filteredPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <Filter size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No posts found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
              <button 
                 onClick={() => {
                     setSearchTerm('');
                     setSelectedCategory('All');
                     setSelectedExchangeTypes([]);
                     setShowFilters(false);
                 }}
                 className="mt-4 text-primary font-bold hover:underline"
              >
                  Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};