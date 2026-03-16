import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ size = 'md', fullscreen = false, text }) => {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16'
    };

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <motion.div
                className={`${sizes[size]} border-4 border-primary/20 border-t-primary rounded-full`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {text && <p className="text-sm text-gray-400">{text}</p>}
        </div>
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default Loading;
