import React, { useState } from 'react'; // Added useEffect import explicitly
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CreatePost = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Get user from context
    console.log('CreatePost Render:', { user });
    const { error: showError } = useToast();
    const [formData, setFormData] = useState({
        type: 'job',
        title: '',
        description: '',
        price: '',
        location: '',
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
        <div className="max-w-2xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-foreground mb-8">Create New Post</h1>

            <div className="glass p-8 rounded-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Category Selection */}
                    <div className="grid grid-cols-5 gap-2">
                        {['job', 'service', 'sell', 'rent', 'barter'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({ ...formData, type })}
                                className={`py-3 rounded-xl font-medium transition-all ${formData.type === type
                                    ? 'bg-primary text-white ring-2 ring-primary/50'
                                    : 'bg-card/10 text-muted-foreground hover:bg-card/20 border border-card-border'
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
                        <label className="text-sm font-medium text-muted-foreground ml-1">Description</label>
                        <textarea
                            name="description"
                            rows="4"
                            className="w-full bg-card/10 border border-card-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
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
                                {formData.acceptsBarter && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                name="acceptsBarter"
                                checked={formData.acceptsBarter}
                                onChange={handleChange}
                                className="hidden"
                            />
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Accept Barter / Exchange</span>
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
                            />
                        </div>
                        <Input
                            label="Location"
                            name="location"
                            placeholder="e.g. Sector 18, Noida"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Images (Optional, Max 5)</label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-card-border">
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
                                <label className="aspect-square rounded-xl border-2 border-dashed border-card-border hover:border-primary/50 hover:bg-card/10 transition-all flex flex-col items-center justify-center cursor-pointer group">
                                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] text-muted-foreground mt-1 group-hover:text-primary transition-colors">Add Photo</span>
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
                                <h4 className="text-red-400 font-semibold">{error.message}</h4>
                                {error.reason && <p className="text-red-400/80 text-sm mt-1">Reason: {error.reason}</p>}
                            </div>
                        </div>
                    )}

                    <Button variant="primary" type="submit" disabled={loading} className="mt-4">
                        {loading ? 'Analyzing Content...' : 'Publish Post'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;
