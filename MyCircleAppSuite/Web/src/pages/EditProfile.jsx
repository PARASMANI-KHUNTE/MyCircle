import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import api from '../utils/api';
import { getAvatarUrl } from '../utils/avatar';

const EditProfile = () => {
    const { user, refreshUser } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        skills: '',
        contactPhone: '',
        contactWhatsapp: '',
    });

    useEffect(() => {
        if (!user) return;
        setFormData({
            displayName: user.displayName || '',
            bio: user.bio || '',
            location: user.location || '',
            skills: Array.isArray(user.skills) ? user.skills.join(', ') : user.skills || '',
            contactPhone: user.contactPhone || '',
            contactWhatsapp: user.contactWhatsapp || '',
        });
        setAvatarPreview(user.avatar || '');
    }, [user]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            const skillsArray = formData.skills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            Object.entries({ ...formData, skills: skillsArray }).forEach(([key, value]) => {
                if (key === 'skills') {
                    value.forEach((skill) => data.append('skills[]', skill));
                } else {
                    data.append(key, value);
                }
            });

            if (avatarFile) data.append('avatar', avatarFile);

            await api.put('/user/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await refreshUser();

            success('Profile updated successfully.');
            navigate('/profile');
        } catch (err) {
            error(
                err.response?.data?.msg ||
                err.response?.data?.error ||
                'Failed to update profile. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
            <button
                type="button"
                onClick={() => navigate('/profile')}
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to profile
            </button>

            <header className="mb-5">
                <h1 className="text-xl font-semibold text-foreground">Edit profile</h1>
                <p className="mt-1 text-sm text-foreground-muted">
                    Update how others see you in the community.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-card-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img
                        src={avatarPreview || getAvatarUrl(user)}
                        alt="Avatar"
                        className="h-20 w-20 rounded-full border border-card-border object-cover"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/default-avatar.png';
                        }}
                    />
                    <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-card-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover sm:w-auto">
                        Change avatar
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                </div>

                <Input
                    label="Display name"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                />

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="bio" className="text-sm font-medium text-foreground">
                        Bio
                    </label>
                    <textarea
                        id="bio"
                        name="bio"
                        rows="4"
                        className="input-modern resize-none"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell people a little about yourself."
                    />
                </div>

                <Input label="Location" name="location" value={formData.location} onChange={handleChange} />

                <Input
                    label="Skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    helperText="Separate skills with commas."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="flex justify-end border-t border-card-border pt-4">
                    <Button type="submit" loading={loading}>
                        <Save className="mr-1.5 h-4 w-4" />
                        {loading ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </form>

            {loading && <Loading fullscreen text="Updating profile..." />}
        </div>
    );
};

export default EditProfile;
