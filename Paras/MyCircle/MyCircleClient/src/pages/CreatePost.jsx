import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react';

const CreatePost = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        type: 'job',
        title: '',
        description: '',
        price: '',
        location: '',
        contactPhone: '',
        contactWhatsapp: '',
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            alert('Maximum 5 images allowed');
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
            // Use FormData for multi-part (images)
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            images.forEach(image => data.append('images', image));

            // Determine whether to use mock or real API
            // For now, if we have a real backend running, we'd use 'api'
            // In mock mode, we'll still call mockApi

            await api.post('/posts', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            navigate('/feed');
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data.reason) {
                // AI Rejection
                setError({
                    type: 'safety',
                    message: 'Post rejected by AI Moderation System.',
                    reason: err.response.data.reason
                });
            } else {
                setError({
                    type: 'server',
                    message: 'Something went wrong. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Create New Post</h1>

            <div className="glass p-8 rounded-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Category Selection */}
                    <div className="grid grid-cols-4 gap-2">
                        {['job', 'service', 'sell', 'rent'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({ ...formData, type })}
                                className={`py-3 rounded-xl font-medium transition-all ${formData.type === type
                                    ? 'bg-primary text-white ring-2 ring-primary/50'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {type.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <Input
                        label="Title"
                        name="title"
                        placeholder="e.g. Need a plumber for leaky tap"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-400 ml-1">Description</label>
                        <textarea
                            name="description"
                            rows="4"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            placeholder="Describe the task or item in detail..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Barter Option */}
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer group w-fit">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.acceptsBarter ? 'bg-primary border-primary' : 'border-gray-500 group-hover:border-primary'}`}>
                                {formData.acceptsBarter && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                name="acceptsBarter"
                                checked={formData.acceptsBarter}
                                onChange={(e) => setFormData({ ...formData, acceptsBarter: e.target.checked })}
                                className="hidden"
                            />
                            <span className="text-gray-300 group-hover:text-white transition-colors">Accept Barter / Exchange</span>
                        </label>

                        <AnimatePresence>
                            {formData.acceptsBarter && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <Input
                                        label="Barter Preferences"
                                        name="barterPreferences"
                                        placeholder="What are you looking for in exchange? (e.g. Graphic Design, Books)"
                                        value={formData.barterPreferences}
                                        onChange={handleChange}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Price / Budget (₹)"
                            name="price"
                            type="number"
                            placeholder="0"
                            value={formData.price}
                            onChange={handleChange}
                        />
                        <Input
                            label="Location"
                            name="location"
                            placeholder="e.g. Sector 18, Noida"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Contact Phone (Hidden)"
                            name="contactPhone"
                            placeholder="+91..."
                            value={formData.contactPhone}
                            onChange={handleChange}
                        />
                        <Input
                            label="WhatsApp (Hidden)"
                            name="contactWhatsapp"
                            placeholder="+91..."
                            value={formData.contactWhatsapp}
                            onChange={handleChange}
                        />
                        <p className="col-span-2 text-xs text-gray-500">
                            * Your contact details will only be shared with users you approve.
                        </p>
                    </div>

                    {/* Image Upload */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-400 ml-1">Images (Max 5)</label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10">
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
                                <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                                    <Upload className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] text-gray-500 mt-1 group-hover:text-primary transition-colors">Add Photo</span>
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
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-red-400 font-semibold">{error.message}</h4>
                                    {error.reason && <p className="text-red-400/80 text-sm mt-1">Reason: {error.reason}</p>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button variant="primary" type="submit" disabled={loading} className="mt-4">
                        {loading ? 'Analyzing Content...' : 'Publish Post'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;
