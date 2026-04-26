import React from 'react';
import { motion } from 'framer-motion';

/**
 * Loading spinner with multiple size variants
 * 
 * Design rationale:
 * - Uses CSS border instead of border-[3px] for consistency
 * - Fullscreen includes backdrop blur for modal loading
 * - Includes text option for contextual loading states
 */
const Loading = ({ size = 'md', fullscreen = false, text, inline = false }) => {
    const sizes = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <motion.div
                className={`${size === 'sm' ? 'border-2' : 'border-3'} border-primary/20 border-t-primary rounded-full`}
                animate={{ rotate: 360 }}
                transition={{ 
                    duration: size === 'sm' ? 0.6 : 0.8, 
                    repeat: Infinity, 
                    ease: 'linear' 
                }}
            />
            {text && (
                <p className="text-sm text-foreground-muted font-medium">{text}</p>
            )}
        </div>
    );

    if (fullscreen) {
        return (
            <div 
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[var(--z-modal)] flex items-center justify-center"
                role="status"
                aria-live="polite"
                aria-label={text || 'Loading'}
            >
                {spinner}
            </div>
        );
    }

    if (inline) {
        return (
            <span className="inline-flex items-center gap-2 text-sm text-foreground-muted">
                <motion.div
                    className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} border-primary/20 border-t-primary rounded-full`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                {text}
            </span>
        );
    }

    return spinner;
};

/**
 * Skeleton loader for content placeholders
 * 
 * Design rationale:
 * - Uses shimmer animation from design system
 * - Maintains aspect ratio via className prop
 */
export const Skeleton = ({ className = '', ...props }) => (
    <div 
        className={`skeleton ${className}`}
        aria-hidden="true"
        {...props}
    />
);

/**
 * Empty state component for lists and sections
 * 
 * Design rationale:
 * - Clear visual hierarchy (icon, title, description, action)
 * - Icon uses primary color for brand consistency
 */
export const EmptyState = ({ 
    icon: Icon,
    title,
    description,
    action: Action 
}) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        {Icon && (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
            </div>
        )}
        {title && (
            <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
        )}
        {description && (
            <p className="text-sm text-foreground-muted max-w-sm mb-4">{description}</p>
        )}
        {Action && <Action />}
    </div>
);

export default Loading;