import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AlertCircle, CheckCircle, Upload, X, PlusCircle, MapPin, Navigation, Loader2, Shield } from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const CreatePost = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    const [formData, setFormData] = useState({
        type: 'job',
        title: '',
        description: '',
        price: '',
        budgetMin: '',
        budgetMax: '',
        location: 'Detecting...',
        availability: '',
        acceptsBarter: false,
        barterPreferences: '',
        latitude: null,
        longitude: null
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle');

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

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            showError('Geolocation is not supported by your browser');
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
                    
                    const address = data.address;
                    let locationString = '';
                    
                    if (address.neighbourhood || address.suburb) {
                        locationString = address.neighbourhood || address.suburb;
                    }
                    if (address.road) {
                        locationString += locationString ? `, ${address.road}` : address.road;
                    }
                    if (address.city || address.town || address.village) {
                        locationString += locationString ? `, ${address.city || address.town || address.village}` : (address.city || address.town || address.village);
                    }
                    if (address.state) {
                        locationString += locationString ? `, ${address.state}` : address.state;
                    }
                    
                    setFormData(prev => ({
                        ...prev,
                        location: locationString || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                    }));
                } catch {
                    setFormData(prev => ({
                        ...prev,
                        location: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`
                    }));
                }

                setGettingLocation(false);
                setLocationStatus('found');
                success('Location captured! Your post will appear on the map.');
            },
            () => {
                setGettingLocation(false);
                setLocationStatus('error');
                showError('Could not get your location. Please enable location services.');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
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

        if (!formData.latitude || !formData.longitude) {
            setError({
                type: 'location',
                message: 'Please share your location before posting.'
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
            data.append('latitude', formData.latitude);
            data.append('longitude', formData.longitude);

            if (formData.acceptsBarter) {
                data.append('acceptsBarter', 'true');
                data.append('barterPreferences', formData.barterPreferences);
            } else {
                data.append('price', formData.price);
            }
            data.append('budgetMin', formData.budgetMin);
            data.append('budgetMax', formData.budgetMax);
            data.append('availability', formData.availability);

            images.forEach(image => data.append('images', image));

            await api.post('/posts', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            success('Quest posted! It will appear on the map.');
            navigate('/explore');
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
                    message: err.response?.data?.msg || err.response?.data?.error || 'Something went wrong. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto pb-20 pt-10 px-4"
        >
            <div className="flex flex-col gap-2 mb-10">
                <h1 className="text-5xl font-black text-text-heading tracking-tight leading-none">
                    Create <span className="text-primary italic">Quest</span>
                </h1>
                <p className="text-text-muted font-medium">Share your quest with adventurers nearby.</p>
            </div>

            <div className="glass-panel p-10 shadow-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    <div className="space-y-3">
                        <label className="text-[10px] font-black tracking-widest text-text-muted uppercase px-1">Select Category</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'job', emoji: '💼', label: 'Job' },
                                { id: 'service', emoji: '⚔️', label: 'Service' },
                                { id: 'sell', emoji: '💰', label: 'For Sale' },
                                { id: 'rent', emoji: '🏠', label: 'For Rent' },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type.id })}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-300 uppercase tracking-widest group",
                                        formData.type === type.id
                                            ? "bg-primary text-primary-foreground shadow-button scale-105"
                                            : "bg-background-section text-text-muted hover:text-text-heading hover:bg-hover-bg border border-card-border"
                                    )}
                                >
                                    <span>{type.emoji}</span>
                                    <span>{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Input
                        label="Title"
                        name="title"
                        placeholder="e.g. Need a plumber for leaky tap"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className=""
                        error={null}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-muted ml-1">Description</label>
                        <textarea
                            name="description"
                            rows={4}
                            className="w-full bg-card/10 border border-card-border rounded-xl px-4 py-3 text-text-body placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                            placeholder="Describe the task or item in detail..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer group w-fit">
                            <div className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                formData.acceptsBarter ? 'bg-primary border-primary' : 'border-card-border group-hover:border-primary'
                            )}>
                                {formData.acceptsBarter && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                            </div>
                            <input
                                type="checkbox"
                                name="acceptsBarter"
                                checked={formData.acceptsBarter}
                                onChange={handleChange}
                                className="hidden"
                            />
                            <span className="text-text-muted group-hover:text-text-heading transition-colors">Accept Barter / Exchange</span>
                        </label>

                        {formData.acceptsBarter && (
                            <div className="overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                <Input
                                    label="Barter Preferences"
                                    name="barterPreferences"
                                    placeholder="What are you looking for in exchange?"
                                    value={formData.barterPreferences}
                                    onChange={handleChange}
                                    className=""
                                    error={null}
                                />
                            </div>
                        )}
                    </div>

                    {/* Location Section - Only geolocation */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black tracking-widest text-text-muted uppercase px-1">Your Location</label>
                        <div className="flex flex-col gap-3">
                            <div className={cn(
                                "relative p-4 rounded-xl border-2 border-dashed transition-all",
                                locationStatus === 'found' ? 'border-green-500/50 bg-green-500/5' : 
                                locationStatus === 'error' ? 'border-red-500/50 bg-red-500/5' :
                                'border-card-border bg-card/10'
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        locationStatus === 'found' ? 'bg-green-500/20' : 
                                        locationStatus === 'error' ? 'bg-red-500/20' :
                                        'bg-primary/20'
                                    )}>
                                        {gettingLocation ? (
                                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                        ) : locationStatus === 'found' ? (
                                            <MapPin className="w-6 h-6 text-green-500" />
                                        ) : (
                                            <Navigation className="w-6 h-6 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-text-heading">
                                            {gettingLocation ? 'Finding your location...' : 
                                             locationStatus === 'found' ? 'Location Set!' :
                                             locationStatus === 'error' ? 'Location Failed' :
                                             'Share your location'}
                                        </p>
                                        <p className="text-sm text-text-muted">
                                            {formData.location}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <Button
                                type="button"
                                variant={locationStatus === 'found' ? 'outline' : 'primary'}
                                onClick={getCurrentLocation}
                                disabled={gettingLocation}
                                className="w-full"
                            >
                                {gettingLocation ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Getting Location...</span>
                                    </div>
                                ) : locationStatus === 'found' ? (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>Update Location</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        <span>Share My Location</span>
                                    </div>
                                )}
                            </Button>
                            
                            {locationStatus === 'error' && (
                                <p className="text-sm text-red-500 text-center">
                                    Please enable location services in your browser settings
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Price (₹)"
                            name="price"
                            type="number"
                            placeholder="0"
                            value={formData.price}
                            onChange={handleChange}
                            disabled={formData.acceptsBarter}
                            className=""
                            error={null}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Budget From (Optional)"
                            name="budgetMin"
                            type="number"
                            placeholder="e.g. 300"
                            value={formData.budgetMin}
                            onChange={handleChange}
                            className=""
                            error={null}
                        />
                        <Input
                            label="Budget To (Optional)"
                            name="budgetMax"
                            type="number"
                            placeholder="e.g. 800"
                            value={formData.budgetMax}
                            onChange={handleChange}
                            className=""
                            error={null}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-muted ml-1">Availability</label>
                        <textarea
                            name="availability"
                            rows={2}
                            className="w-full bg-card/10 border border-card-border rounded-xl px-4 py-3 text-text-body placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                            placeholder="e.g. Weekdays after 5 PM, weekends full-day"
                            value={formData.availability}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black tracking-widest text-text-muted uppercase px-1">Visuals (Max 5)</label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            <AnimatePresence>
                                {previews.map((preview, index) => (
                                    <motion.div
                                        key={preview}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="relative aspect-square rounded-xl overflow-hidden group border border-card-border shadow-md"
                                    >
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <div className="bg-red-500 p-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                <X className="w-4 h-4 text-primary-foreground" />
                                            </div>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {images.length < 5 && (
                                <label className="aspect-square rounded-xl border-2 border-dashed border-card-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center cursor-pointer group shadow-sm">
                                    <Upload className="w-8 h-8 text-text-muted group-hover:text-primary transition-all group-hover:-translate-y-1" />
                                    <span className="text-[10px] text-text-muted mt-2 font-black uppercase tracking-widest group-hover:text-primary">Add Photo</span>
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

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-red-500 font-semibold">{error.message}</h4>
                                {error.reason && <p className="text-red-500/80 text-sm mt-1">Reason: {error.reason}</p>}
                            </div>
                        </div>
                    )}

                    <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={loading || !formData.latitude || !formData.longitude || gettingLocation} 
                        className="mt-6 py-5 rounded-2xl text-[14px] font-black tracking-widest uppercase shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                <span>Publishing...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <PlusCircle className="w-5 h-5" />
                                <span>Publish Quest</span>
                            </div>
                        )}
                    </Button>
                </form>
            </div>
        </motion.div>
    );
};

export default CreatePost;
