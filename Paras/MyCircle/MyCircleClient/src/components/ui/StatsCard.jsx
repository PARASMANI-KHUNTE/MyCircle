import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ icon: Icon, label, value, color }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-card p-6 rounded-2xl border border-card-border shadow-sm hover:shadow-md transition-all flex items-center gap-4"
        >
            <div className={`p-3 rounded-xl bg-primary/10 text-primary`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-text-muted text-xs uppercase tracking-widest font-bold mb-0.5">{label}</p>
                <h3 className="text-2xl font-bold text-text-heading">{value}</h3>
            </div>
        </motion.div>
    );
};

export default StatsCard;
