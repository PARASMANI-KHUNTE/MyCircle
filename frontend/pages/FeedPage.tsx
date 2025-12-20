import React, { useState } from 'react';
import { Search, MapPin, Filter, Clock, MessageCircle, X } from 'lucide-react';
import { MOCK_POSTS } from '../services/mockData';
import { Category, ExchangeType } from '../types';
import { useNavigate } from 'react-router-dom';

export const FeedPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExchangeTypes, setSelectedExchangeTypes] = useState<ExchangeType[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'nearest'>('recent');
  const navigate = useNavigate();

  const toggleExchangeType = (type: ExchangeType) => {
    if (selectedExchangeTypes.includes(type)) {
      setSelectedExchangeTypes(prev => prev.filter(t => t !== type));
    } else {
      setSelectedExchangeTypes(prev => [...prev, type]);
    }
  };

  const filteredPosts = MOCK_POSTS.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesExchange = selectedExchangeTypes.length === 0 || selectedExchangeTypes.includes(post.exchangeType);
    
    return matchesSearch && matchesCategory && matchesExchange;
  }).sort((a, b) => {
    if (sortBy === 'nearest') {
      return a.distance - b.distance;
    }
    // For 'recent', we rely on the default order of MOCK_POSTS or could parse dates if they were real objects
    return 0; 
  });

  const handleWhatsAppClick = (e: React.MouseEvent, post: typeof MOCK_POSTS[0]) => {
    e.stopPropagation();
    const message = encodeURIComponent(`Hi ${post.creator.name}, I'm interested in your post on HyperLocal: "${post.title}"`);
    window.open(`https://wa.me/${post.creator.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Local Feed</h1>
          <p className="text-gray-500 text-sm">Discover opportunities in your neighborhood</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm flex-1 md:w-80 focus-within:ring-2 ring-primary/20 transition-all">
            <Search size={18} className="text-gray-400" />
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
            className={`p-2.5 rounded-lg border shadow-sm transition-colors ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            aria-label="Toggle filters"
          >
            {showFilters ? <X size={20} /> : <Filter size={20} />}
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedExchangeTypes.includes(type)
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
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
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'All' ? 'bg-primary text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
        >
          All Posts
        </button>
        {Object.values(Category).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => navigate(`/posts/${post.id}`)}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
          >
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              <img 
                src={post.images[0]} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-800 shadow-sm">
                {post.category}
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                <MapPin size={10} />
                {post.distance}km
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{post.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  post.exchangeType === ExchangeType.MONEY ? 'bg-green-100 text-green-700' : 
                  post.exchangeType === ExchangeType.FREE ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {post.price || post.exchangeType}
                </span>
              </div>
              
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{post.description}</p>
              
              <div className="flex items-center justify-between pt-3 border-t mt-auto">
                <div className="flex items-center gap-2">
                  <img src={post.creator.avatar} alt={post.creator.name} className="w-6 h-6 rounded-full" />
                  <span className="text-xs text-gray-600">{post.creator.name}</span>
                </div>
                
                <button
                  onClick={(e) => handleWhatsAppClick(e, post)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-full hover:bg-green-600 transition-colors z-10"
                >
                  <MessageCircle size={14} />
                  Chat on WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Filter size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No posts found</h3>
          <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          <button 
             onClick={() => {
                 setSearchTerm('');
                 setSelectedCategory('All');
                 setSelectedExchangeTypes([]);
                 setShowFilters(false);
             }}
             className="mt-4 text-primary font-medium hover:underline"
          >
              Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
