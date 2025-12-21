import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ icon: Icon, label, value, color }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-2xl border ${color} bg-opacity-10 backdrop-blur-md`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color.replace('border-', 'bg-').replace('/20', '/10')} text-white`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-gray-400 text-sm font-medium">{label}</p>
                    <h3 className="text-2xl font-bold text-white">{value}</h3>
                </div>
            </div>
        </motion.div>
    );
};

export default StatsCard;
