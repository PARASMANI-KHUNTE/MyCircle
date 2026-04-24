import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { AlertCircle, X, Plus, MapPin, Navigation, Loader2, ArrowRight, ArrowLeft, Check, Sparkles, Zap, Clock, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ position, setPosition }) => {
    const map = useMap();
    
    useMapEvents({
        click(e) {
            if (e?.latlng) {
                setPosition(e.latlng);
            }
        },
    });

    useEffect(() => {
        if (map && position) {
            try {
                const zoom = map.getZoom();
                if (zoom > 0) {
                    map.flyTo(position, Math.max(zoom, 13));
                }
            } catch {
                // ignore flyTo errors
            }
        }
    }, [map, position]);

    return position === null ? null : <Marker position={position} />;
};

const STEPS = [
    { id: 1, title: 'Category', icon: '📋' },
    { id: 2, title: 'Details', icon: '📝' },
    { id: 3, title: 'Location', icon: '📍' },
    { id: 4, title: 'Review', icon: '✓' },
];

const CATEGORIES = [
    { id: 'service', emoji: '💼', label: 'Earn', desc: 'Offer your skills/services' },
    { id: 'job', emoji: '🤝', label: 'Hire', desc: 'Post a job or task' },
    { id: 'sell', emoji: '🛒', label: 'Trade', desc: 'Sell or barter items' },
    { id: 'rent', emoji: '🏠', label: 'Rent', desc: 'Rentals & spaces' },
];

const JOB_TYPES = [
    { id: 'full-time', label: 'Full-time' },
    { id: 'part-time', label: 'Part-time' },
    { id: 'contractual', label: 'Contractual' },
    { id: 'gig-based', label: 'Gig-based' },
    { id: 'freelance', label: 'Freelance' },
    { id: 'internship', label: 'Internship' },
];

const ITEM_CATEGORIES = [
    { id: 'electronics', label: 'Electronics' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'home', label: 'Home & Garden' },
    { id: 'sports', label: 'Sports' },
    { id: 'other', label: 'Other' },
];

const DURATIONS = [
    { id: 15, label: '15 min', desc: 'Quick task' },
    { id: 180, label: '3 hours', desc: 'Short-term' },
    { id: 10080, label: '7 days', desc: '1 week' },
    { id: 40320, label: '28 days', desc: '1 month' },
];

const EXCHANGE_OPTIONS = [
    { id: 'money', label: 'Money', icon: '💰', desc: 'Cash payment' },
    { id: 'barter', label: 'Barter', icon: '🔄', desc: 'Item exchange' },
    { id: 'flexible', label: 'Flexible', icon: '💳', desc: 'Either accepted' },
];

const CreatePost = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        type: '',
        jobType: '',
        itemCategory: '',
        title: '',
        description: '',
        price: '',
        location: '',
        latitude: null,
        longitude: null,
        duration: 10080,
        exchangePreference: 'money',
        isUrgent: false,
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle');
    const [locationMethod, setLocationMethod] = useState('detect');
    const hasAutoDetected = React.useRef(false);

    const titleLimit = 100;
    const descLimit = 1000;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'title' && value.length > titleLimit) return;
        if (name === 'description' && value.length > descLimit) return;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            showError('Geolocation not supported');
            return;
        }

        setGettingLocation(true);
        setLocationStatus('locating');

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

                setGettingLocation(false);
                setLocationStatus('found');
            },
            () => {
                setGettingLocation(false);
                setLocationStatus('error');
                showError('Could not get location');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            showError('Maximum 5 images');
            return;
        }
        setImages([...images, ...files]);
        setPreviews([...previews, ...files.map(file => URL.createObjectURL(file))]);
    };

    const removeImage = (index) => {
        const newImages = [...images];
        const newPreviews = [...previews];
        newImages.splice(index, 1);
        newPreviews.splice(index, 1);
        setImages(newImages);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.latitude || !formData.longitude) {
            setError({ message: 'Please share your location to continue' });
            return;
        }

        setLoading(true);
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
            data.append('duration', formData.duration);
            data.append('exchangePreference', formData.exchangePreference);
            data.append('isUrgent', formData.isUrgent);
            images.forEach(image => data.append('images', image));

            await api.post('/posts', data);

            success('Posted successfully!');
            navigate('/explore');
        } catch (err) {
            console.error(err);
            setError({
                message: err.response?.data?.msg || err.response?.data?.error || 'Something went wrong'
            });
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1: return !!formData.type;
            case 2:
                if (formData.type === 'job') return formData.jobType && formData.title.trim() && formData.description.trim();
                return formData.title.trim() && formData.description.trim();
            case 3: return !!formData.latitude && !!formData.longitude;
            case 4: return true;
            default: return false;
        }
    };

    const nextStep = () => {
        if (canProceed() && step < 4) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    useEffect(() => {
        if (step === 3 && locationStatus === 'idle' && !hasAutoDetected.current) {
            hasAutoDetected.current = true;
            getCurrentLocation();
        }
    }, [step, locationStatus]);

    return (
        <div className="min-h-screen bg-background">
            {/* Sticky step header */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-card-border">
                <div className="max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="icon-btn -ml-2"
                            aria-label="Go back"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-foreground-muted">
                                {STEPS[step - 1]?.title}
                            </span>
                            <p className="text-[10px] text-foreground-muted">Step {step} of 4</p>
                        </div>
                        <div className="w-9" />
                    </div>
                    {/* Progress bar with amber glow */}
                    <div className="flex items-center gap-1 mt-3">
                        {STEPS.map((s) => (
                            <div
                                key={s.id}
                                className={cn(
                                    'flex-1 h-1.5 rounded-full transition-all duration-500',
                                    step > s.id
                                        ? 'bg-primary'
                                        : step === s.id
                                            ? 'bg-primary/60'
                                            : 'bg-card-border'
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                        <div className="text-center py-8">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-7 h-7 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold font-display">What are you posting?</h2>
                                <p className="text-sm text-foreground-muted mt-1">Choose a category to get started</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: cat.id })}
                                        className={cn(
                                            'p-5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group',
                                            formData.type === cat.id
                                                ? 'border-primary bg-primary/8 shadow-md'
                                                : 'border-card-border bg-card hover:border-primary/50 hover:bg-card-hover'
                                        )}
                                    >
                                        {formData.type === cat.id && (
                                            <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="w-3 h-3 text-primary-foreground" />
                                            </div>
                                        )}
                                        <span className="text-3xl mb-3 block">{cat.emoji}</span>
                                        <h3 className="font-bold text-base">{cat.label}</h3>
                                        <p className="text-xs text-foreground-muted mt-0.5 leading-snug">{cat.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {formData.type === 'job' && (
                                <div>
                                    <label className="text-sm font-medium">Job Type</label>
                                    <select
                                        name="jobType"
                                        value={formData.jobType}
                                        onChange={handleChange}
                                        className="w-full mt-1.5 px-4 py-3 rounded-xl border border-card-border bg-card text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    >
                                        <option value="">Select type</option>
                                        {JOB_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {['sell', 'rent'].includes(formData.type) && (
                                <div>
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        name="itemCategory"
                                        value={formData.itemCategory}
                                        onChange={handleChange}
                                        className="w-full mt-1.5 px-4 py-3 rounded-xl border border-card-border bg-card text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    >
                                        <option value="">Select category</option>
                                        {ITEM_CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium">Title</label>
                                    <span className="text-xs text-foreground-muted">{formData.title.length}/{titleLimit}</span>
                                </div>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder={formData.type === 'job' ? "e.g. Need plumber for kitchen" : "e.g. Selling laptop"}
                                    className="w-full mt-1.5 px-4 py-3 rounded-xl border border-card-border bg-card text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium">Description</label>
                                    <span className="text-xs text-foreground-muted">{formData.description.length}/{descLimit}</span>
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe what you need or offer..."
                                    className="w-full mt-1.5 px-4 py-3 rounded-xl border border-card-border bg-card text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Photos (Max 5)</label>
                                {previews.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto py-2 mb-2">
                                        {previews.map((preview, index) => (
                                            <div key={index} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative border border-border">
                                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                                                    title="Remove photo"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium">Price (₹)</label>
                                <input
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0 or leave empty"
                                    className="w-full mt-1.5 px-4 py-3 rounded-xl border border-card-border bg-card text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Duration</label>
                                <div className="grid grid-cols-4 gap-2 mt-1.5">
                                    {DURATIONS.map(d => (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, duration: d.id }))}
                                            className={cn(
                                                'px-2 py-2 rounded-lg border text-xs text-center transition-all',
                                                formData.duration === d.id
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-border hover:border-primary/50'
                                            )}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Exchange</label>
                                <div className="grid grid-cols-3 gap-2 mt-1.5">
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
                                            <span className="block text-lg mb-0.5">{opt.icon}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="text-sm font-medium">Photos ({previews.length}/5)</label>
                                {previews.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto py-2 mb-2">
                                        {previews.map((preview, index) => (
                                            <div key={index} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative border border-border">
                                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {previews.length < 5 && (
                                    <label className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-border cursor-pointer hover:bg-card-hover transition-colors">
                                        <Plus className="w-5 h-5 text-foreground-muted" />
                                        <span className="text-sm text-foreground-muted">Add photos</span>
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

                            <label className="flex items-center gap-3 p-4 rounded-xl border border-card-border cursor-pointer hover:border-primary/40 hover:bg-card-hover transition-all">
                                <input
                                    type="checkbox"
                                    name="isUrgent"
                                    checked={formData.isUrgent}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded accent-primary"
                                />
                                <AlertTriangle className={cn("w-4 h-4", formData.isUrgent ? "text-warning" : "text-foreground-muted")} />
                                <span className="text-sm font-medium">Mark as urgent</span>
                            </label>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="text-center py-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                    <MapPin className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-lg font-bold font-display">Set Location</h2>
                                <p className="text-sm text-foreground-muted">Where is this available?</p>
                            </div>

                            <div className="flex bg-card rounded-xl border border-card-border p-1">
                                <button
                                    type="button"
                                    onClick={() => setLocationMethod('detect')}
                                    className={cn(
                                        'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all',
                                        locationMethod === 'detect' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'
                                    )}
                                >
                                    Auto-detect
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLocationMethod('pin')}
                                    className={cn(
                                        'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all',
                                        locationMethod === 'pin' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'
                                    )}
                                >
                                    Pin on Map
                                </button>
                            </div>

                            {locationMethod === 'detect' ? (
                                <div className={cn(
                                    'p-4 rounded-xl border transition-all',
                                    locationStatus === 'found' ? 'border-success/40 bg-success/5' :
                                    locationStatus === 'error' ? 'border-error/40 bg-error/5' :
                                    'border-card-border'
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            'w-12 h-12 rounded-xl flex items-center justify-center',
                                            locationStatus === 'found' ? 'bg-green-500/20' : 'bg-primary/20'
                                        )}>
                                            {gettingLocation ? (
                                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                            ) : locationStatus === 'found' ? (
                                                <Check className="w-6 h-6 text-green-500" />
                                            ) : (
                                                <Navigation className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">
                                                {gettingLocation ? 'Detecting...' :
                                                 locationStatus === 'found' ? 'Location set' :
                                                 locationStatus === 'error' ? 'Failed' : 'Tap to detect'}
                                            </p>
                                            {formData.location && (
                                        <p className="text-xs text-foreground-muted mt-0.5">{formData.location}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant={locationStatus === 'found' ? 'outline' : 'primary'}
                                        onClick={getCurrentLocation}
                                        disabled={gettingLocation}
                                        className="w-full mt-3"
                                    >
                                        {gettingLocation ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Detecting...</>
                                        ) : locationStatus === 'found' ? (
                                            <><Navigation className="w-4 h-4 mr-2" /> Re-detect</>
                                        ) : (
                                            <><Navigation className="w-4 h-4 mr-2" /> Detect Location</>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <div className="h-[250px] sm:h-[300px] w-full rounded-2xl overflow-hidden border border-card-border">
                                        <MapContainer
                                            center={[formData.latitude || 28.6139, formData.longitude || 77.2090]}
                                            zoom={13}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                            <LocationPicker
                                                position={formData.latitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                                                setPosition={async (pos) => {
                                                    setFormData(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }));
                                                    try {
                                                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`);
                                                        const data = await res.json();
                                                        const addr = data.address || {};
                                                        const parts = [addr.building || addr.house_number, addr.road, addr.neighbourhood || addr.suburb, addr.city || addr.town || addr.village].filter(Boolean);
                                                        setFormData(prev => ({ ...prev, location: parts.join(', ') || `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` }));
                                                    } catch {
                                                        setFormData(prev => ({ ...prev, location: `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` }));
                                                    }
                                                }}
                                            />
                                        </MapContainer>
                                    </div>
                                    {formData.location && (
                                        <div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span className="text-sm">{formData.location}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="text-center py-4">
                                <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                                    <Check className="w-6 h-6 text-success" />
                                </div>
                                <h2 className="text-lg font-bold font-display">Review Your Post</h2>
                                <p className="text-sm text-foreground-muted">Make sure everything looks good before publishing</p>
                            </div>

                            <div className="p-5 rounded-2xl border border-card-border bg-background-secondary space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{CATEGORIES.find(c => c.id === formData.type)?.emoji}</span>
                                    <span className="font-medium">{formData.type}</span>
                                    {formData.isUrgent && (
                                        <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 text-xs">Urgent</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{formData.title || 'Untitled'}</h3>
                                    <p className="text-sm text-foreground-muted mt-1 leading-relaxed line-clamp-3">{formData.description}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted pt-1 border-t border-card-border">
                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                        ₹{formData.price || '—'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {DURATIONS.find(d => d.id === formData.duration)?.label}
                                    </span>
                                    <span className="flex items-center gap-1 truncate">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        {formData.location?.split(',')[0] || 'No location'}
                                    </span>
                                </div>
                            </div>

                            {/* Image Previews */}
                            {previews.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto py-2">
                                    {previews.map((preview, index) => (
                                        <div key={index} className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-card-border">
                                            <img src={preview} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-error shrink-0" />
                        <p className="text-sm text-error">{error.message}</p>
                    </div>
                )}

                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-card-border">
                    {step > 1 && (
                        <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    )}
                    {step < 4 ? (
                        <Button type="button" onClick={nextStep} disabled={!canProceed()} className="flex-1">
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button type="submit" disabled={loading || gettingLocation} className="flex-1">
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</>
                            ) : (
                                <><Check className="w-4 h-4 mr-2" /> Publish</>
                            )}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
