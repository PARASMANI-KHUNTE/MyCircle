import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, Check, Briefcase, ShoppingBag, Wrench, Package } from 'lucide-react';
import { Category, ExchangeType } from '../types';
import { useNavigate } from 'react-router-dom';

const STEPS = ['Category', 'Details', 'Exchange', 'Review'];

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    exchangeType: ExchangeType.MONEY,
    price: '',
    images: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    navigate('/');
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload size={32} className="mb-2" />
                <p className="text-sm">Click or drag photos here</p>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-gray-50 p-6 rounded-xl border">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Review your post</h3>
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
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-0">
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
