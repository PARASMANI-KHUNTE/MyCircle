import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { ArrowLeft, Save, Camera, MapPin, Phone, MessageCircle, User, FileText, Wrench } from 'lucide-react';
import api from '../utils/api';
import { getAvatarUrl } from '../utils/avatar';

const DashboardEditProfile = ({ onBack }) => {
    const { user, refreshUser } = useAuth();
    const { success, error } = useToast();
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        skills: '',
        contactPhone: '',
        contactWhatsapp: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                bio: user.bio || '',
                location: user.location || '',
                skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
                contactPhone: user.contactPhone || '',
                contactWhatsapp: user.contactWhatsapp || ''
            });
            setAvatarPreview(getAvatarUrl(user));
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

            await refreshUser();
            success("Profile updated successfully!");
            if (onBack) onBack();
        } catch (err) {
            console.error(err);
            error("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <ArrowLeft size={16} />
                </div>
                Back to Profile
            </button>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
                <p className="text-slate-500 text-sm mt-1">Update your personal information</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm">
                                <img
                                    src={avatarPreview || getAvatarUrl(user)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/default-avatar.svg';
                                    }}
                                />
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors shadow-md">
                                <Camera size={14} />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">{user?.displayName}</h3>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                            <p className="text-xs text-slate-400 mt-1">Click camera icon to change photo</p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100" />

                    {/* Display Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <User size={14} className="text-slate-400" />
                            Display Name
                        </label>
                        <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            placeholder="Your name"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <FileText size={14} className="text-slate-400" />
                            Bio
                        </label>
                        <textarea
                            name="bio"
                            rows="3"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell others about yourself..."
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <MapPin size={14} className="text-slate-400" />
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Mumbai, India"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <Wrench size={14} className="text-slate-400" />
                            Skills
                        </label>
                        <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            placeholder="e.g. Web Development, Photography (comma separated)"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                        />
                        <p className="text-xs text-slate-400 mt-1">Separate multiple skills with commas</p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100" />

                    {/* Contact Details Section */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                    <Phone size={14} className="text-slate-400" />
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                    <MessageCircle size={14} className="text-teal-500" />
                                    WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    name="contactWhatsapp"
                                    value={formData.contactWhatsapp}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            These details will be shared with users who request to contact you
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 py-3 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-black transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DashboardEditProfile;
