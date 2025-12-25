import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { AlertCircle, CheckCircle, Upload, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardCreatePost = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [formData, setFormData] = useState({
        type: 'job',
        title: '',
        description: '',
        price: '',
        location: '',
        contactPhone: '',
        contactWhatsapp: '',
        acceptsBarter: false,
        barterPreferences: '',
        includePhone: true,
        includeWhatsapp: true
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load user contact info
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                contactPhone: user.contactPhone || '',
                contactWhatsapp: user.contactWhatsapp || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
            if (name === 'acceptsBarter' && checked) {
                newData.price = '';
            }
            return newData;
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            showError('Maximum 5 images allowed');
            return;
        }

        setImages([...images, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const updatedImages = [...images];
        updatedImages.splice(index, 1);
        setImages(updatedImages);

        const updatedPreviews = [...previews];
        updatedPreviews.splice(index, 1);
        setPreviews(updatedPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user.contactPhone && !user.contactWhatsapp) {
            setError({
                type: 'validation',
                message: 'Contact Info Missing',
                reason: 'You must add a Phone or WhatsApp number in your Profile settings before posting.'
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('type', formData.type);
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('location', formData.location);

            if (formData.acceptsBarter) {
                data.append('acceptsBarter', 'true');
                data.append('barterPreferences', formData.barterPreferences);
            } else {
                data.append('price', formData.price);
            }

            if (formData.includePhone && formData.contactPhone) {
                data.append('contactPhone', formData.contactPhone);
            }
            if (formData.includeWhatsapp && formData.contactWhatsapp) {
                data.append('contactWhatsapp', formData.contactWhatsapp);
            }

            images.forEach(image => data.append('images', image));

            await api.post('/posts', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            success('Post created successfully!');
            // Reset form
            setFormData({
                type: 'job',
                title: '',
                description: '',
                price: '',
                location: '',
                contactPhone: user.contactPhone || '',
                contactWhatsapp: user.contactWhatsapp || '',
                acceptsBarter: false,
                barterPreferences: '',
                includePhone: true,
                includeWhatsapp: true
            });
            setImages([]);
            setPreviews([]);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data.reason) {
                setError({
                    type: 'safety',
                    message: 'Post rejected by AI Moderation System.',
                    reason: err.response.data.reason
                });
            } else {
                setError({
                    type: 'server',
                    message: err.response?.data?.msg || 'Something went wrong. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const postTypes = [
        { id: 'job', label: 'Job' },
        { id: 'service', label: 'Service' },
        { id: 'sell', label: 'Sell' },
        { id: 'rent', label: 'Rent' },
        { id: 'barter', label: 'Barter' }
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Create New Post</h1>
                <p className="text-slate-500 text-sm mt-1">Share what you're offering or looking for</p>
            </div>

            {/* Profile Warning */}
            {user && !user.contactPhone && !user.contactWhatsapp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-yellow-900 font-semibold text-sm">Profile Update Required</h4>
                        <p className="text-yellow-700 text-sm mt-1">
                            Please add your contact details to your profile before creating a post.
                        </p>
                        <button
                            onClick={() => navigate('/edit-profile')}
                            className="mt-2 text-sm text-yellow-800 font-medium hover:underline"
                        >
                            Update Profile →
                        </button>
                    </div>
                </div>
            )}

            {/* Form */}
            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${(!user?.contactPhone && !user?.contactWhatsapp) ? 'opacity-50 pointer-events-none' : ''}`}>
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Post Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Post Type</label>
                        <div className="grid grid-cols-5 gap-2">
                            {postTypes.map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type.id })}
                                    className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${formData.type === type.id
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Need a plumber for leaky tap"
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <textarea
                            name="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the task or item in detail..."
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Barter Option */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="acceptsBarter"
                            name="acceptsBarter"
                            checked={formData.acceptsBarter}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <label htmlFor="acceptsBarter" className="text-sm text-slate-700 cursor-pointer">
                            Accept Barter / Exchange
                        </label>
                    </div>

                    {formData.acceptsBarter && (
                        <input
                            type="text"
                            name="barterPreferences"
                            value={formData.barterPreferences}
                            onChange={handleChange}
                            placeholder="What are you looking for in exchange?"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                        />
                    )}

                    {/* Price & Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder={formData.acceptsBarter ? "Disabled" : "0"}
                                disabled={formData.acceptsBarter}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Sector 18, Noida"
                                required
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact Details to Show</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="includePhone"
                                    checked={formData.includePhone}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 mt-0.5"
                                />
                                <div>
                                    <div className="text-sm font-medium text-slate-700">Phone Number</div>
                                    <div className="text-xs text-slate-500">{formData.contactPhone || 'Not set'}</div>
                                </div>
                            </label>
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="includeWhatsapp"
                                    checked={formData.includeWhatsapp}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 mt-0.5"
                                />
                                <div>
                                    <div className="text-sm font-medium text-slate-700">WhatsApp</div>
                                    <div className="text-xs text-slate-500">{formData.contactWhatsapp || 'Not set'}</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Images (Optional, Max 5)</label>
                        <div className="grid grid-cols-5 gap-3">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border border-slate-200">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {images.length < 5 && (
                                <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center cursor-pointer group">
                                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                                    <span className="text-xs text-slate-400 mt-1">Add</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-red-900 font-semibold text-sm">{error.message}</h4>
                                {error.reason && <p className="text-red-700 text-sm mt-1">{error.reason}</p>}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-black transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Publishing...' : 'Publish Post'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DashboardCreatePost;
