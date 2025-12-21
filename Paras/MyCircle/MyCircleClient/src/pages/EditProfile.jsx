import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../utils/api';

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
            error("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-6 py-24 text-white max-w-2xl">
            <Button variant="ghost" className="mb-6 pl-0 text-gray-400 hover:text-white" onClick={() => navigate('/profile')}>
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Profile
            </Button>

            <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

            <div className="glass p-8 rounded-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden border border-white/10">
                            <img
                                src={avatarPreview || '/default-avatar.svg'}
                                alt="User"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default-avatar.svg';
                                }}
                            />
                        </div>
                        <label className="cursor-pointer">
                            <div className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm transition-all">
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
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-400 ml-1">Bio</label>
                        <textarea
                            name="bio"
                            rows="4"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            value={formData.bio}
                            onChange={handleChange}
                        />
                    </div>

                    <Input
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                    />

                    <Input
                        label="Skills (Comma separated)"
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Phone"
                            name="contactPhone"
                            value={formData.contactPhone}
                            onChange={handleChange}
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
