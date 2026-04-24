import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const Button = ({ 
    children, 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    disabled = false,
    icon: Icon,
    ...props 
}) => {
    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        accent: 'bg-accent text-accent-foreground hover:bg-accent-hover',
        outline: 'border border-card-border bg-transparent text-foreground hover:border-card-border-hover hover:bg-card-hover',
        ghost: 'bg-transparent text-foreground-muted hover:text-foreground hover:bg-card-hover',
        danger: 'bg-error text-white hover:bg-error/90',
        success: 'bg-success text-white hover:bg-success/90',
    };

    const sizes = {
        xs: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
        sm: 'px-4 py-2 text-sm font-semibold rounded-xl gap-2',
        md: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
        lg: 'px-8 py-3.5 text-base font-semibold rounded-2xl gap-2.5',
        xl: 'px-10 py-4 text-lg font-semibold rounded-2xl gap-3',
    };

    const Component = props.href ? motion.a : motion.button;

    return (
        <Component
            whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            className={cn(
                'inline-flex items-center justify-center font-semibold transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
                'focus-visible:ring-2 focus-visible:ring-primary/20',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {Icon && <Icon className={cn('w-4 h-4', size === 'xs' && 'w-3 h-3', size === 'lg' && 'w-5 h-5')} />}
                    {children}
                </>
            )}
        </Component>
    );
};

export default Button;
