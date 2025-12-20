import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Trash2, ArrowLeft, Moon, Globe } from 'lucide-react';
import Button from '../components/ui/Button';

const Settings = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(true);
    const [publicProfile, setPublicProfile] = useState(true);

    const handleDeleteAccount = () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            // Call API to delete account
            alert("Account deletion is not yet implemented.");
        }
    };

    return (
        <div className="container mx-auto px-6 py-24 text-white max-w-2xl">
            <Button variant="ghost" className="mb-6 pl-0 text-gray-400 hover:text-white" onClick={() => navigate('/profile')}>
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Profile
            </Button>

            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="space-y-6">
                {/* Notifications */}
                <div className="glass p-6 rounded-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" /> Notifications
                    </h2>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-sm text-gray-400">Receive emails about new messages and updates</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>

                {/* Privacy */}
                <div className="glass p-6 rounded-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-500" /> Privacy
                    </h2>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <div className="font-medium">Public Profile</div>
                            <div className="text-sm text-gray-400">Allow others to see your profile details</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={publicProfile} onChange={() => setPublicProfile(!publicProfile)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>

                {/* Appearance (Mock) */}
                <div className="glass p-6 rounded-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" /> Preferences
                    </h2>
                    <div className="flex items-center justify-between py-2 opacity-50 cursor-not-allowed">
                        <div>
                            <div className="font-medium">Dark Mode</div>
                            <div className="text-sm text-gray-400">Toggle application theme</div>
                        </div>
                        <div className="text-xs text-gray-500 font-mono border border-gray-600 px-2 py-1 rounded">ALWAYS ON</div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="glass p-6 rounded-2xl border border-red-500/20">
                    <h2 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" /> Danger Zone
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-white">Delete Account</div>
                            <div className="text-sm text-gray-400">Permanently delete your account and all data</div>
                        </div>
                        <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400" onClick={handleDeleteAccount}>
                            Delete Account
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
