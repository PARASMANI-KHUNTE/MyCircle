import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ icon: Icon, label, value, color }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-2xl glass hover:bg-white/5 transition-all ${color}`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color.replace('border-', 'bg-').replace('/20', '/10')} text-foreground`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-muted-foreground text-sm font-medium">{label}</p>
                    <h3 className="text-2xl font-bold text-foreground">{value}</h3>
                </div>
            </div>
        </motion.div>
    );
};

export default StatsCard;
