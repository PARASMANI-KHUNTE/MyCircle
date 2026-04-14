import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { AlertCircle, Upload, X, Plus, MapPin, Navigation, Loader2, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
    { id: 1, title: 'Category', icon: '📋' },
    { id: 2, title: 'Details', icon: '📝' },
    { id: 3, title: 'Location', icon: '📍' },
    { id: 4, title: 'Photos', icon: '📷' },
];

const CATEGORIES = [
    { id: 'job', emoji: '💼', label: 'Job', desc: 'Find or offer work' },
    { id: 'service', emoji: '⚔️', label: 'Service', desc: 'Professional skills' },
    { id: 'sell', emoji: '💰', label: 'For Sale', desc: 'Items to sell' },
    { id: 'rent', emoji: '🏠', label: 'For Rent', desc: 'Rentals & leases' },
];

const CreatePost = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        description: '',
        price: '',
        location: '',
        latitude: null,
        longitude: null
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle');
    const hasAutoDetected = React.useRef(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
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
                
                setFormData(prev => ({
                    ...prev,
                    latitude,
                    longitude
                }));

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
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('location', formData.location);
            data.append('latitude', formData.latitude);
            data.append('longitude', formData.longitude);
            data.append('price', formData.price);
            images.forEach(image => data.append('images', image));

            await api.post('/posts', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

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
            case 2: return formData.title.trim() && formData.description.trim();
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

    // Auto-detect location when entering step 3
    React.useEffect(() => {
        if (step === 3 && locationStatus === 'idle' && !hasAutoDetected.current) {
            hasAutoDetected.current = true;
            getCurrentLocation();
        }
    }, [step, locationStatus]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-card-border">
                <div className="max-w-xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold">Create Post</h1>
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-card-hover rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Progress Steps */}
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                                    step === s.id ? 'bg-primary text-white' :
                                    step > s.id ? 'bg-green-500/20 text-green-500' :
                                    'bg-card-hover text-foreground-muted'
                                )}>
                                    {step > s.id ? <Check className="w-4 h-4" /> : <span>{s.icon}</span>}
                                    <span className="hidden sm:inline">{s.title}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={cn(
                                        'flex-1 h-0.5 rounded',
                                        step > s.id ? 'bg-green-500' : 'bg-card-border'
                                    )} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 py-6">
                <AnimatePresence mode="wait">
                    {/* Step 1: Category */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-8">
                                <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                                <h2 className="text-2xl font-bold mb-2">What are you posting?</h2>
                                <p className="text-foreground-muted">Choose a category that best fits your post</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: cat.id })}
                                        className={cn(
                                            'p-6 rounded-2xl border-2 text-left transition-all',
                                            formData.type === cat.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-card-border hover:border-primary/50'
                                        )}
                                    >
                                        <span className="text-4xl mb-3 block">{cat.emoji}</span>
                                        <h3 className="font-semibold text-lg">{cat.label}</h3>
                                        <p className="text-sm text-foreground-muted">{cat.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Need a plumber for kitchen repair"
                                    className="w-full px-4 py-3 rounded-xl border border-card-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Describe what you need or offer in detail..."
                                    className="w-full px-4 py-3 rounded-xl border border-card-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Price (₹)</label>
                                <input
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl border border-card-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Location */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-4">
                                <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
                                <h2 className="text-2xl font-bold mb-2">Detect Your Location</h2>
                                <p className="text-foreground-muted">We'll automatically detect your current location</p>
                            </div>

                            <div className={cn(
                                'p-6 rounded-2xl border-2 transition-all',
                                locationStatus === 'found' ? 'border-green-500 bg-green-500/5' :
                                locationStatus === 'error' ? 'border-red-500 bg-red-500/5' :
                                'border-primary/30 bg-primary/5'
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        'w-16 h-16 rounded-2xl flex items-center justify-center',
                                        locationStatus === 'found' ? 'bg-green-500/20' :
                                        locationStatus === 'error' ? 'bg-red-500/20' :
                                        'bg-primary/20'
                                    )}>
                                        {gettingLocation ? (
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        ) : locationStatus === 'found' ? (
                                            <Navigation className="w-8 h-8 text-green-500" />
                                        ) : (
                                            <Navigation className="w-8 h-8 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">
                                            {gettingLocation ? 'Detecting location...' :
                                             locationStatus === 'found' ? 'Location detected!' :
                                             locationStatus === 'error' ? 'Detection failed' :
                                             'Tap to detect'}
                                        </h3>
                                        {formData.latitude && (
                                            <p className="text-sm font-mono text-green-400 mt-1">
                                                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                            </p>
                                        )}
                                        {formData.location && locationStatus === 'found' && (
                                            <p className="text-sm text-foreground-muted mt-1">{formData.location}</p>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant={locationStatus === 'found' ? 'outline' : 'primary'}
                                    onClick={getCurrentLocation}
                                    disabled={gettingLocation}
                                    className="w-full mt-4"
                                >
                                    {gettingLocation ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Detecting...</>
                                    ) : locationStatus === 'found' ? (
                                        <><Navigation className="w-4 h-4 mr-2" /> Re-detect Location</>
                                    ) : (
                                        <><Navigation className="w-4 h-4 mr-2" /> Detect My Location</>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Photos */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-4">
                                <h2 className="text-2xl font-bold mb-2">Add Photos</h2>
                                <p className="text-foreground-muted">Make your post stand out (optional)</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {previews.map((preview, index) => (
                                    <motion.div
                                        key={preview}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative aspect-square rounded-xl overflow-hidden"
                                    >
                                        <img src={preview} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </motion.div>
                                ))}
                                {images.length < 5 && (
                                    <label className="aspect-square rounded-xl border-2 border-dashed border-card-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors">
                                        <Plus className="w-6 h-6 text-foreground-muted mb-1" />
                                        <span className="text-xs text-foreground-muted">Add</span>
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
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error */}
                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-500">{error.message}</p>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-card-border">
                    {step > 1 && (
                        <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    )}
                    {step < 4 ? (
                        <Button type="button" onClick={nextStep} disabled={!canProceed()} className="flex-1">
                            Next <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            disabled={loading || gettingLocation}
                            className="flex-1"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</>
                            ) : (
                                <><Check className="w-4 h-4 mr-2" /> Post</>
                            )}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
