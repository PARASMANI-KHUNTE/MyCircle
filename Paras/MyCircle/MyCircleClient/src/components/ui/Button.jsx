import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Button = ({ children, className = '', variant = 'primary', size = 'md', ...props }) => {
    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-button',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        outline: 'border-2 border-primary text-primary hover:bg-primary/5',
        ghost: 'text-text-muted hover:text-secondary hover:bg-hover-bg rounded-full',
        danger: 'bg-red-500 text-primary-foreground hover:bg-red-600',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-6 py-2.5 text-[15px]',
        lg: 'px-8 py-3.5 text-[17px]',
    };

    const Component = props.href ? motion.a : motion.button;

    return (
        <Component
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
                'rounded-button font-bold transition-all duration-200 flex items-center justify-center gap-2',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
};

export default Button;
