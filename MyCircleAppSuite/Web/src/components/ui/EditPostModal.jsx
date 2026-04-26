import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Package, Tag, Repeat } from 'lucide-react';
import Button from './Button';
import api from '../../utils/api';
import { useToast } from './Toast';
import { useCurrencySymbol } from '../../context/CurrencySymbolContext';

const EditPostModal = ({ post, isOpen, onClose, onUpdate }) => {
    const { success, error: showError } = useToast();
    const { currencySymbol } = useCurrencySymbol();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: post.title || '',
        description: post.description || '',
        price: post.price || '',
        acceptsBarter: post.acceptsBarter || false,
        type: post.type || 'job'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put(`/posts/${post._id}`, formData);
            success('Post updated successfully!');
            onUpdate(res.data);
            onClose();
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to update post');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="glass-panel w-full max-w-lg shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-card-border bg-hover-bg/30">
                        <h2 className="text-xl font-bold text-text-heading flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" /> Edit Post
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-hover-bg rounded-full transition-colors group">
                            <X className="w-5 h-5 text-text-muted group-hover:text-text-heading transition-colors" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black tracking-widest text-text-muted px-1">TITLE</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-card border border-card-border hover:bg-hover-bg focus:bg-hover-bg rounded-xl px-4 py-3 text-text-heading placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium shadow-inner"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black tracking-widest text-text-muted px-1">DESCRIPTION</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-card border border-card-border hover:bg-hover-bg focus:bg-hover-bg rounded-xl px-4 py-3 text-text-body placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all min-h-[120px] resize-none text-sm leading-relaxed font-medium shadow-inner"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black tracking-widest text-text-muted px-1">PRICE ({currencySymbol})</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-card border border-card-border hover:bg-hover-bg focus:bg-hover-bg rounded-xl pl-10 pr-4 py-3 text-text-heading focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col justify-end pb-3 pl-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-10 h-6 rounded-full transition-colors relative ${formData.acceptsBarter ? 'bg-primary' : 'bg-card/20 border border-card-border'}`}>
                                        <motion.div
                                            animate={{ x: formData.acceptsBarter ? 18 : 2 }}
                                            className="absolute top-1 left-0 w-4 h-4 bg-foreground rounded-full shadow-sm"
                                        />
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.acceptsBarter}
                                        onChange={(e) => setFormData({ ...formData, acceptsBarter: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-foreground">Accepts Barter</span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 justify-center py-3"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="flex-1 justify-center py-3"
                            >
                                {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditPostModal;
