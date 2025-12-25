import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { AlertCircle, ArrowLeft, Upload, X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardEditPost = ({ postId, onBack, onUpdate }) => {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [post, setPost] = useState(null);
    const [formData, setFormData] = useState({
        type: 'job',
        title: '',
        description: '',
        price: '',
        location: '',
        acceptsBarter: false,
        barterPreferences: ''
    });
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fetch post data
    useEffect(() => {
        if (!postId) return;

        const fetchPost = async () => {
            try {
                const res = await api.get(`/posts/${postId}`);
                const p = res.data;
                setPost(p);
                setFormData({
                    type: p.type || 'job',
                    title: p.title || '',
                    description: p.description || '',
                    price: p.price || '',
                    location: p.location || '',
                    acceptsBarter: p.acceptsBarter || false,
                    barterPreferences: p.barterPreferences || ''
                });
                setExistingImages(p.images || []);
                setLoading(false);
            } catch (err) {
                console.error(err);
                showError('Failed to load post');
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

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
        const totalImages = existingImages.length + newImages.length + files.length;
        if (totalImages > 5) {
            showError('Maximum 5 images allowed');
            return;
        }

        setNewImages([...newImages, ...files]);
        const previews = files.map(file => URL.createObjectURL(file));
        setNewPreviews([...newPreviews, ...previews]);
    };

    const removeExistingImage = (index) => {
        const updated = [...existingImages];
        updated.splice(index, 1);
        setExistingImages(updated);
    };

    const removeNewImage = (index) => {
        const updatedImages = [...newImages];
        updatedImages.splice(index, 1);
        setNewImages(updatedImages);

        const updatedPreviews = [...newPreviews];
        updatedPreviews.splice(index, 1);
        setNewPreviews(updatedPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
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

            // Send existing image URLs
            existingImages.forEach(img => data.append('existingImages', img));

            // Send new images
            newImages.forEach(image => data.append('images', image));

            const res = await api.put(`/posts/${postId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            success('Post updated successfully!');
            if (onUpdate) onUpdate(res.data);
            if (onBack) onBack();
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data.reason) {
                setError({
                    type: 'safety',
                    message: 'Update rejected by AI Moderation System.',
                    reason: err.response.data.reason
                });
            } else {
                setError({
                    type: 'server',
                    message: err.response?.data?.msg || err.response?.data?.message || 'Something went wrong. Please try again.'
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const postTypes = [
        { id: 'job', label: 'Job' },
        { id: 'service', label: 'Service' },
        { id: 'sell', label: 'Sell' },
        { id: 'rent', label: 'Rent' },
        { id: 'barter', label: 'Barter' }
    ];

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
    );

    if (!post) return (
        <div className="text-center py-20">
            <p className="text-slate-500">Post not found</p>
            <button onClick={onBack} className="mt-4 text-teal-600 font-medium hover:underline">
                Go back
            </button>
        </div>
    );

    const totalImages = existingImages.length + newImages.length;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <ArrowLeft size={16} />
                </div>
                Back
            </button>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Post</h1>
                <p className="text-slate-500 text-sm mt-1">Update your listing details</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Images (Max 5)</label>
                        <div className="grid grid-cols-5 gap-3">
                            {/* Existing Images */}
                            {existingImages.map((img, index) => (
                                <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden group border border-slate-200">
                                    <img src={img} alt="Existing" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(index)}
                                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {/* New Image Previews */}
                            {newPreviews.map((preview, index) => (
                                <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden group border border-slate-200">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(index)}
                                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {/* Upload Button */}
                            {totalImages < 5 && (
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

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 py-3 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-black transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DashboardEditPost;
