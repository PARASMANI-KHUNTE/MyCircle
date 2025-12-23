import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, Upload, Check, 
  Briefcase, ShoppingBag, Wrench, Package, 
  X, Image as ImageIcon, ArrowLeft, ArrowRight, Clock 
} from 'lucide-react';
import { Category, ExchangeType } from '../types';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type ImageSlot = {
  file: File;
  preview: string;
};

const STEPS = ['Category', 'Details', 'Exchange', 'Review'];

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    exchangeType: ExchangeType.MONEY,
    price: '',
    images: [] as ImageSlot[],
    expiryDuration: '30' // Default 30 days
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token === null) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (!token) {
      setError('You must be logged in to publish a post.');
      return;
    }

    if (!formData.category || !formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      setError('Please fill in category, title, description, and location.');
      return;
    }

    const fd = new FormData();
    fd.append('type', formData.category);
    fd.append('title', formData.title.trim());
    fd.append('description', formData.description.trim());
    fd.append('location', formData.location.trim());

    // Exchange / pricing
    const priceNumber = formData.price ? Number(formData.price) : undefined;
    if (formData.exchangeType === ExchangeType.MONEY && priceNumber !== undefined && !Number.isNaN(priceNumber)) {
      fd.append('price', String(priceNumber));
    }
    if (formData.exchangeType === ExchangeType.BARTER) {
      fd.append('acceptsBarter', 'true');
      fd.append('barterPreferences', formData.description.slice(0, 200));
    }

    // Images
    formData.images.forEach((img) => {
      fd.append('images', img.file);
    });

    setIsSubmitting(true);
    setError(null);
    try {
      await api.createPost(token, fd);
      navigate('/feed');
    } catch (err) {
      console.error('Failed to publish post', err);
      setError('Unable to publish right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files as FileList);
      const remainingSlots = 5 - formData.images.length;
      
      if (files.length > remainingSlots) {
        alert(`You can only upload up to 5 images. You have ${remainingSlots} slots left.`);
        return;
      }

      const newImages: ImageSlot[] = files.map(file => ({
        file,
        preview: URL.createObjectURL(file as Blob),
      }));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
      
      // Reset input value to allow selecting the same file again if needed (after deletion)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (
      (direction === 'left' && index === 0) || 
      (direction === 'right' && index === formData.images.length - 1)
    ) return;

    const newImages = [...formData.images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const categories = [
    { id: Category.JOB, icon: Briefcase, label: 'Post a Job', desc: 'Hire help for tasks' },
    { id: Category.SERVICE, icon: Wrench, label: 'Offer Service', desc: 'Share your skills' },
    { id: Category.SELL, icon: ShoppingBag, label: 'Sell Item', desc: 'Declutter your home' },
    { id: Category.RENT, icon: Package, label: 'Rent Item', desc: 'Lend out equipment' },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFormData({ ...formData, category: cat.id })}
                className={`flex flex-col items-center p-6 border rounded-xl transition-all ${
                  formData.category === cat.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${formData.category === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <cat.icon size={24} />
                </div>
                <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                <p className="text-sm text-gray-500">{cat.desc}</p>
              </button>
            ))}
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g., Fix my garden fence"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={5}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                placeholder="Describe what you need in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g., Downtown District"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Expiry</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['7', '14', '30', 'never'].map((duration) => (
                  <button
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
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Exchange Type</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(ExchangeType).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, exchangeType: type })}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      formData.exchangeType === type
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {formData.exchangeType === ExchangeType.MONEY && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price / Budget</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="text"
                    className="w-full pl-7 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos <span className="text-gray-400 font-normal">({formData.images.length}/5)</span>
              </label>
              
              {/* Image Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border bg-gray-50">
                    <img src={img.preview} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    
                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <button 
                        onClick={() => removeImage(idx)}
                        className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                      <div className="flex gap-2">
                        {idx > 0 && (
                          <button 
                            onClick={() => moveImage(idx, 'left')}
                            className="p-1.5 bg-white/20 text-white hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors"
                          >
                            <ArrowLeft size={14} />
                          </button>
                        )}
                        {idx < formData.images.length - 1 && (
                          <button 
                            onClick={() => moveImage(idx, 'right')}
                            className="p-1.5 bg-white/20 text-white hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors"
                          >
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-primary/90 text-white text-[10px] px-1.5 rounded font-medium">Cover</span>
                    )}
                  </div>
                ))}
                
                {formData.images.length < 5 && (
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-primary/50 hover:text-primary transition-all cursor-pointer bg-white"
                  >
                    <Upload size={24} className="mb-1" />
                    <span className="text-xs font-medium">Add Photo</span>
                  </div>
                )}
              </div>
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <p className="text-xs text-gray-400">
                Upload up to 5 photos. The first photo will be the cover image.
              </p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-gray-50 p-6 rounded-xl border">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Review your post</h3>
            
            {/* Image Preview Strip */}
            {formData.images.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {formData.images.map((img, i) => (
                  <img 
                    key={i} 
                    src={img.preview} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-lg object-cover border bg-white flex-shrink-0" 
                  />
                ))}
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Category</span>
                <span className="col-span-2 font-medium">{formData.category}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Title</span>
                <span className="col-span-2 font-medium">{formData.title}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Exchange</span>
                <span className="col-span-2 font-medium">{formData.exchangeType} {formData.price && `(${formData.price})`}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Location</span>
                <span className="col-span-2 font-medium">{formData.location}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Auto-Archive</span>
                <span className="col-span-2 font-medium text-gray-700 flex items-center gap-1.5">
                   <Clock size={14} className="text-gray-400" />
                   {formData.expiryDuration === 'never' ? 'Never' : `After ${formData.expiryDuration} days`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Images</span>
                <span className="col-span-2 font-medium flex items-center gap-2">
                  <ImageIcon size={14} />
                  {formData.images.length > 0 ? `${formData.images.length} selected` : 'No images'}
                </span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
        <div className="flex items-center gap-2 mt-4">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 ${idx <= currentStep ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx <= currentStep ? 'bg-primary text-white' : 'bg-gray-200'
                }`}>
                  {idx + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step}</span>
              </div>
              {idx < STEPS.length - 1 && <div className={`h-0.5 w-8 ${idx < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {renderStep()}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
            currentStep === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft size={18} /> Back
        </button>

        {currentStep === STEPS.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2 bg-success text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Post'}
            {!isSubmitting && <Check size={18} />}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={currentStep === 0 && !formData.category}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Step <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};