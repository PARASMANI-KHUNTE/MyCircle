import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ size = 'md', fullscreen = false, text }) => {
    const sizes = {
        sm: 'w-6 h-6 border-[3px]',
        md: 'w-10 h-10 border-4',
        lg: 'w-14 h-14 border-4',
    };

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <motion.div
                className={`${sizes[size]} border-primary/20 border-t-primary rounded-full`}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            {text && (
                <p className="text-sm text-foreground-muted font-medium">{text}</p>
            )}
        </div>
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[50] flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default Loading;
