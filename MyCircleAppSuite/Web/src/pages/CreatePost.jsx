import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AlertCircle, CheckCircle, Upload, X, PlusCircle, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const CreatePost = () => {
    const navigate = useNavigate();

    const { error: showError } = useToast();

    const [formData, setFormData] = useState({
        type: 'job',
        title: '',
        description: '',
        price: '',
        budgetMin: '',
        budgetMax: '',
        location: '',
        availability: '',
        acceptsBarter: false,
        barterPreferences: ''
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };

            // Barter Logic: if acceptsBarter is true, price is disabled/cleared
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

        // Generate previews
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

        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            // Append basic fields
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
            data.append('budgetMin', formData.budgetMin);
            data.append('budgetMax', formData.budgetMax);
            data.append('availability', formData.availability);

            images.forEach(image => data.append('images', image));

            await api.post('/posts', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            navigate('/feed');
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data.reason) {
                setError({
                    type: 'safety',
                    message: 'Post rejected by AI Moderation System.',
                    reason: err.response.data.reason
                });
            } else {
                // Check for duplicate key error or other specific mongo errors
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
                    Create <span className="text-primary italic">Circle</span>
                </h1>
                <p className="text-text-muted font-medium">Post your request, service, or items to your local community.</p>
            </div>

            <div className="glass-panel p-10 shadow-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Category Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black tracking-widest text-text-muted uppercase px-1">Select Category</label>
                        <div className="flex flex-wrap gap-2">
                            {['job', 'service', 'sell', 'rent', 'barter'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type })}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-300 uppercase tracking-widest group",
                                        formData.type === type
                                            ? "bg-primary text-primary-foreground shadow-button scale-105"
                                            : "bg-background-section text-text-muted hover:text-text-heading hover:bg-hover-bg border border-card-border"
                                    )}
                                >
                                    <span className={cn("w-2 h-2 rounded-full", formData.type === type ? "bg-primary-foreground" : "bg-text-muted group-hover:bg-primary")} />
                                    {type}
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

                    {/* Barter Option */}
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer group w-fit">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.acceptsBarter ? 'bg-primary border-primary' : 'border-card-border group-hover:border-primary'}`}>
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

                        {/* Barter Preferences with simple conditional rendering */}
                        {formData.acceptsBarter && (
                            <div className="overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                <Input
                                    label="Barter Preferences"
                                    name="barterPreferences"
                                    placeholder="What are you looking for in exchange? (e.g. Graphic Design, Books)"
                                    value={formData.barterPreferences}
                                    onChange={handleChange}
                                    className=""
                                    error={null}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Input
                                label="Price / Budget (₹)"
                                name="price"
                                type="number"
                                placeholder={formData.acceptsBarter ? "Disabled" : "0"}
                                value={formData.price}
                                onChange={handleChange}
                                disabled={formData.acceptsBarter}
                                className=""
                                error={null}
                            />
                        </div>
                        <Input
                            label="Location"
                            name="location"
                            placeholder="e.g. Sector 18, Noida"
                            value={formData.location}
                            onChange={handleChange}
                            required
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
                            rows={3}
                            className="w-full bg-card/10 border border-card-border rounded-xl px-4 py-3 text-text-body placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                            placeholder="e.g. Weekdays after 5 PM, weekends full-day, available near campus"
                            value={formData.availability}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Image Upload */}
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

                    {/* Error Feedback */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-red-500 font-semibold">{error.message}</h4>
                                {error.reason && <p className="text-red-500/80 text-sm mt-1">Reason: {error.reason}</p>}
                            </div>
                        </div>
                    )}

                    <Button variant="primary" type="submit" disabled={loading} className="mt-6 py-5 rounded-2xl text-[14px] font-black tracking-widest uppercase shadow-[0_20px_50px_rgba(245,158,11,0.2)]">
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                <span>Verifying Your Orbit...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <PlusCircle className="w-5 h-5" />
                                <span>Publish to Your Circle</span>
                            </div>
                        )}
                    </Button>
                </form>
            </div>
        </motion.div>
    );
};

export default CreatePost;
