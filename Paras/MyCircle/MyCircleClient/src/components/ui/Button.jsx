import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Button = ({ children, className, variant = 'primary', ...props }) => {
    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/25',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        outline: 'border border-gray-600 text-foreground hover:bg-white/5',
        ghost: 'hover:bg-white/5 text-gray-300 hover:text-white',
        accent: 'bg-accent text-accent-foreground hover:brightness-110 shadow-lg shadow-accent/25',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default Button;
