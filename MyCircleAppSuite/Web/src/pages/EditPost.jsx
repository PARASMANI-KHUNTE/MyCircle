import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { 
    X, Plus, MapPin, Navigation, Loader2, ArrowRight, ArrowLeft, Check, 
    Sparkles, Zap, Clock, AlertTriangle, ArrowLeftRight, Trash2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { POST_TYPES, ITEM_CATEGORIES as ITEM_CATEGORIES_IDS, JOB_TYPES as JOB_TYPE_IDS } from '../constants';
import { useCurrencySymbol } from '../context/CurrencySymbolContext';

const CATEGORIES = POST_TYPES.map(id => {
    const configs = {
        service: { emoji: '💼', label: 'Earn', desc: 'Offer your skills/services' },
        job: { emoji: '🤝', label: 'Hire', desc: 'Post a job or task' },
        sell: { emoji: '🛒', label: 'Trade', desc: 'Sell or barter items' },
        rent: { emoji: '🏠', label: 'Rent', desc: 'Rentals & spaces' },
        barter: { emoji: '🔄', label: 'Barter', desc: 'Exchange items or services' },
        request: { emoji: '📝', label: 'Request', desc: 'Request an item or service' },
    };
    return { id, ...(configs[id] || { label: id, desc: '' }) };
});

const JOB_TYPES_LIST = JOB_TYPE_IDS.map(id => ({ id, label: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }));

const ITEM_CATEGORIES_LIST = ITEM_CATEGORIES_IDS.map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }));

const DURATIONS = [
    { id: 15, label: '15 min' },
    { id: 180, label: '3 hours' },
    { id: 10080, label: '7 days' },
    { id: 40320, label: '28 days' },
];

const EXCHANGE_OPTIONS = [
    { id: 'money', label: 'Money', icon: '💰' },
    { id: 'barter', label: 'Barter', icon: '🔄' },
    { id: 'flexible', label: 'Flexible', icon: '💳' },
];

const EditPost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const { user } = useAuth();
    const { currencySymbol } = useCurrencySymbol();
    const currentUserId = user?._id || user?.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        type: '',
        jobType: '',
        itemCategory: '',
        title: '',
        description: '',
        price: '',
        budgetMin: '',
        budgetMax: '',
        location: '',
        latitude: null,
        longitude: null,
        duration: 10080,
        exchangePreference: 'money',
        isUrgent: false,
        availability: '',
        barterPreferences: '',
        contactPhone: '',
        contactWhatsapp: '',
        acceptsBarter: false,
        status: 'active',
    });
    const [images, setImages] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [error, setError] = useState(null);

    const titleLimit = 100;
    const descLimit = 1000;

    const fetchPost = useCallback(async () => {
        // Check auth first
        if (!currentUserId) {
            showError('Please sign in to edit posts');
            navigate('/login');
            return;
        }

        try {
            const res = await api.get(`/posts/${id}`);
            const post = res.data;
            
            // Check ownership
            const postOwnerId = post.user?._id || post.user;
            if (postOwnerId?.toString() !== currentUserId?.toString()) {
                showError('You can only edit your own posts');
                navigate('/my-posts');
                return;
            }
            
            setFormData({
                type: post.type || '',
                jobType: post.jobType || '',
                itemCategory: post.itemCategory || '',
                title: post.title || '',
                description: post.description || '',
                price: post.price ?? '',
                budgetMin: post.budgetMin ?? '',
                budgetMax: post.budgetMax ?? '',
                location: post.location || '',
                latitude: post.locationCoords?.coordinates?.[1] ?? null,
                longitude: post.locationCoords?.coordinates?.[0] ?? null,
                duration: post.duration || 10080,
                exchangePreference: post.exchangePreference || 'money',
                isUrgent: post.isUrgent || false,
                availability: post.availability || '',
                barterPreferences: post.barterPreferences || '',
                contactPhone: post.contactPhone || '',
                contactWhatsapp: post.contactWhatsapp || '',
                acceptsBarter: post.acceptsBarter || false,
                status: post.status || 'active',
            });

            if (post.images && post.images.length > 0) {
                setExistingImages(post.images);
            }
        } catch (err) {
            console.error(err);
            showError('Failed to load post');
            navigate('/my-posts');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, showError, currentUserId]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'title' && value.length > titleLimit) return;
        if (name === 'description' && value.length > descLimit) return;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length + existingImages.length > 5) {
            showError('Maximum 5 images');
            return;
        }
        setImages([...images, ...files]);
        setNewImagePreviews((prev) => [...prev, ...files.map(file => URL.createObjectURL(file))]);
    };

    const removeImage = (index, isExisting = false) => {
        if (isExisting) {
            const newExisting = [...existingImages];
            newExisting.splice(index, 1);
            setExistingImages(newExisting);
        } else {
            const newImages = [...images];
            const newPreviews = [...newImagePreviews];
            newImages.splice(index, 1);
            newPreviews.splice(index, 1);
            setImages(newImages);
            setNewImagePreviews(newPreviews);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            showError('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({ ...prev, latitude, longitude }));

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await response.json();
                    const addr = data.address || {};
                    const parts = [
                        addr.building || addr.house_number,
                        addr.road,
                        addr.neighbourhood || addr.suburb,
                        addr.city || addr.town || addr.village
                    ].filter(Boolean);
                    
                    setFormData(prev => ({
                        ...prev,
                        location: parts.join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                    }));
                } catch {
                    setFormData(prev => ({
                        ...prev,
                        location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    }));
                }
            },
            () => showError('Could not get location')
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.latitude || !formData.longitude) {
            setError({ message: 'Please share your location to continue' });
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('type', formData.type);
            data.append('jobType', formData.jobType || '');
            data.append('itemCategory', formData.itemCategory || '');
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('location', formData.location);
            data.append('latitude', formData.latitude);
            data.append('longitude', formData.longitude);
            data.append('price', formData.price);
            data.append('budgetMin', formData.budgetMin ?? '');
            data.append('budgetMax', formData.budgetMax ?? '');
            data.append('duration', formData.duration);
            data.append('exchangePreference', formData.exchangePreference);
            data.append('isUrgent', formData.isUrgent);
            data.append('availability', formData.availability || '');
            data.append('barterPreferences', formData.barterPreferences || '');
            data.append('contactPhone', formData.contactPhone || '');
            data.append('contactWhatsapp', formData.contactWhatsapp || '');
            data.append('acceptsBarter', formData.acceptsBarter);
            data.append('status', formData.status);

            data.append('existingImages', JSON.stringify(existingImages));

            images.forEach(image => data.append('images', image));

            await api.put(`/posts/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            success('Post updated successfully!');
            navigate(`/post/${id}`);
        } catch (err) {
            console.error(err);
            setError({
                message: err.response?.data?.msg || err.response?.data?.error || 'Failed to update post'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = (status) => {
        setFormData(prev => ({ ...prev, status }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
                <div className="max-w-lg mx-auto px-3 sm:px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-card rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-semibold">Edit Post</h1>
                        <div className="w-9" />
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-3 sm:px-4 py-6 space-y-6">
                {/* Status Toggle */}
                <div className="flex gap-2 p-1 bg-card-border/50 rounded-xl">
                    {['active', 'inactive', 'archived'].map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => handleStatusChange(s)}
                            className={cn(
                                'flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                                formData.status === s 
                                    ? 'bg-background shadow-sm' 
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Type */}
                <div>
                    <label className="text-sm font-medium">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, type: cat.id })}
                                className={cn(
                                    'p-3 rounded-xl border text-center transition-all',
                                    formData.type === cat.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                )}
                            >
                                <span className="text-xl block">{cat.emoji}</span>
                                <span className="text-xs mt-1 block">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Job/Category Type */}
                {formData.type === 'job' ? (
                    <div>
                        <label className="text-sm font-medium">Job Type</label>
                        <select
                            name="jobType"
                            value={formData.jobType}
                            onChange={handleChange}
                            className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                        >
                            <option value="">Select type</option>
                            {JOB_TYPES_LIST.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                ) : formData.type ? (
                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <select
                            name="itemCategory"
                            value={formData.itemCategory}
                            onChange={handleChange}
                            className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                        >
                            <option value="">Select category</option>
                            {ITEM_CATEGORIES_LIST.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                ) : null}

                {/* Title */}
                <div>
                    <div className="flex justify-between">
                        <label className="text-sm font-medium">Title</label>
                        <span className="text-xs text-muted-foreground">{formData.title.length}/{titleLimit}</span>
                    </div>
                    <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                    />
                </div>

                {/* Description */}
                <div>
                    <div className="flex justify-between">
                        <label className="text-sm font-medium">Description</label>
                        <span className="text-xs text-muted-foreground">{formData.description.length}/{descLimit}</span>
                    </div>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none resize-none"
                    />
                </div>

                {/* Price */}
                <div>
                    <label className="text-sm font-medium">Price ({currencySymbol})</label>
                    <input
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium">Budget Min</label>
                        <input
                            name="budgetMin"
                            type="number"
                            value={formData.budgetMin ?? ''}
                            onChange={handleChange}
                            className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Budget Max</label>
                        <input
                            name="budgetMax"
                            type="number"
                            value={formData.budgetMax ?? ''}
                            onChange={handleChange}
                            className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                            placeholder="Optional"
                        />
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <label className="text-sm font-medium">Duration</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                        {DURATIONS.map(d => (
                            <button
                                key={d.id}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, duration: d.id }))}
                                className={cn(
                                    'px-2 py-2 rounded-lg border text-xs text-center transition-all',
                                    formData.duration === d.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                )}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Exchange */}
                <div>
                    <label className="text-sm font-medium">Exchange Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                        {EXCHANGE_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, exchangePreference: opt.id }))}
                                className={cn(
                                    'px-2 py-2 rounded-lg border text-xs text-center transition-all',
                                    formData.exchangePreference === opt.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                )}
                            >
                                <span className="block text-lg">{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <label className="flex items-center gap-2 p-3 rounded-lg border border-border cursor-pointer">
                    <input
                        type="checkbox"
                        name="acceptsBarter"
                        checked={formData.acceptsBarter}
                        onChange={handleChange}
                        className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm">Accept barter offers</span>
                </label>

                {/* Urgent */}
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border cursor-pointer">
                    <input
                        type="checkbox"
                        name="isUrgent"
                        checked={formData.isUrgent}
                        onChange={handleChange}
                        className="w-4 h-4 rounded accent-primary"
                    />
                    <AlertTriangle className={cn("w-4 h-4", formData.isUrgent ? "text-orange-500" : "text-muted-foreground")} />
                    <span className="text-sm">Mark as urgent</span>
                </label>

                <div>
                    <label className="text-sm font-medium">Availability</label>
                    <input
                        name="availability"
                        value={formData.availability || ''}
                        onChange={handleChange}
                        className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                        placeholder="Weekdays, weekends, evenings..."
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">Barter Preferences</label>
                    <textarea
                        name="barterPreferences"
                        value={formData.barterPreferences || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none resize-none"
                        placeholder="What would you accept in exchange?"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium">Contact Phone</label>
                        <input
                            name="contactPhone"
                            value={formData.contactPhone || ''}
                            onChange={handleChange}
                            className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">WhatsApp</label>
                        <input
                            name="contactWhatsapp"
                            value={formData.contactWhatsapp || ''}
                            onChange={handleChange}
                            className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                            placeholder="Optional"
                        />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label className="text-sm font-medium">Location</label>
                    <div className="flex gap-2 mt-1.5">
                        <input
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:border-primary outline-none"
                            placeholder="Location"
                        />
                        <Button type="button" variant="outline" onClick={getCurrentLocation}>
                            <Navigation className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Images */}
                <div>
                    <label className="text-sm font-medium">Photos</label>
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                        {existingImages.map((preview, index) => (
                            <div key={index} className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative group">
                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index, true)}
                                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ))}
                        {newImagePreviews.map((preview, index) => (
                            <div key={`new-${index}`} className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative group">
                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index, false)}
                                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ))}
                        {(existingImages.length + newImagePreviews.length < 5) && (
                            <label className="w-20 h-20 rounded-lg border border-dashed border-border flex items-center justify-center shrink-0 cursor-pointer hover:border-primary/50">
                                <Plus className="w-5 h-5 text-muted-foreground" />
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

                {/* Error */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                        {error.message}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving} className="flex-1">
                        {saving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                            <><Check className="w-4 h-4 mr-2" /> Save Changes</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditPost;
