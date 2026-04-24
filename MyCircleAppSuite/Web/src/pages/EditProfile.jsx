import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../utils/api';
import { getAvatarUrl } from '../utils/avatar';

const EditProfile = () => {
    const { user, refreshUser } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        skills: '',
        contactPhone: '',
        contactWhatsapp: ''
    });

    React.useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                bio: user.bio || '',
                location: user.location || '',
                skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
                contactPhone: user.contactPhone || '',
                contactWhatsapp: user.contactWhatsapp || ''
            });
            setAvatarPreview(user.avatar || "");
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            // Process skills to array
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s !== '');
            const submissionData = { ...formData, skills: skillsArray };

            Object.keys(submissionData).forEach(key => {
                if (key === 'skills') {
                    submissionData[key].forEach(skill => data.append('skills[]', skill));
                } else {
                    data.append(key, submissionData[key]);
                }
            });

            if (avatarFile) data.append('avatar', avatarFile);

            await api.put('/user/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Refresh user data in context to update UI immediately
            await refreshUser();

            success("Profile Updated Successfully!");
            navigate('/profile');
        } catch (err) {
            console.error(err);
            error(err.response?.data?.msg || err.response?.data?.error || "Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 py-20 sm:py-24 text-text-body max-w-2xl">
            <Button variant="ghost" className="mb-6 pl-0 text-text-muted hover:text-text-heading" onClick={() => navigate('/profile')}>
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Profile
            </Button>

            <h1 className="text-3xl font-bold mb-8 text-text-heading">Edit Profile</h1>

            <div className="glass-panel p-8 shadow-card">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="w-20 h-20 rounded-full bg-background-section overflow-hidden border border-card-border">
                            <img
                                src={avatarPreview || getAvatarUrl(user)}
                                alt="Avatar"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    const target = e.target;
                                    target.onerror = null;
                                    target.src = '/default-avatar.png';
                                }}
                            />
                        </div>
                        <label className="cursor-pointer">
                            <div className="bg-hover-bg border border-card-border hover:opacity-80 text-text-heading px-4 py-2 rounded-xl text-sm transition-all font-bold uppercase tracking-widest">
                                Change Avatar
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                    </div>

                    <Input
                        label="Display Name"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        className=""
                        error={null}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-black uppercase tracking-widest text-text-muted ml-1">Bio</label>
                        <textarea
                            name="bio"
                            rows="4"
                            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-text-body placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            value={formData.bio}
                            onChange={handleChange}
                        />
                    </div>

                    <Input
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className=""
                        error={null}
                    />

                    <Input
                        label="Skills (Comma separated)"
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Phone"
                            name="contactPhone"
                            value={formData.contactPhone}
                            onChange={handleChange}
                            className=""
                            error={null}
                        />
                        <Input
                            label="WhatsApp"
                            name="contactWhatsapp"
                            value={formData.contactWhatsapp}
                            onChange={handleChange}
                        />
                    </div>

                    <Button variant="primary" type="submit" className="mt-4" disabled={loading}>
                        <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </div>

            {loading && <Loading fullscreen text="Updating profile..." />}
        </div>
    );
};

export default EditProfile;
