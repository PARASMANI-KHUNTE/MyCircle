import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ progress, showLabel = true, size = 'md', color = 'primary' }) => {
    const sizes = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3'
    };

    const colors = {
        primary: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500'
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
                </div>
            )}
            <div className={`w-full bg-white/5 rounded-full overflow-hidden ${sizes[size]}`}>
                <motion.div
                    className={`${colors[color]} ${sizes[size]} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
