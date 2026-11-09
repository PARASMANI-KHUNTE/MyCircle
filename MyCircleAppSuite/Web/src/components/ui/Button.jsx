import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Minimalist Button - Reduced surface, focus on type and accessibility
 * 
 * Variants: primary, secondary, outline, ghost
 * Sizes: sm, md, lg
 * No decorative shadows or gradients - relies on color system
 */
const Button = ({ 
    children, 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    ...props 
}) => {
    const variants = {
        primary: cn(
            'bg-primary text-primary-foreground hover:bg-primary-hover'
        ),
        secondary: cn(
            'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
        ),
        outline: cn(
            'border border-input-border bg-transparent text-foreground hover:border-input-placeholder',
            'hover:bg-card-hover'
        ),
        ghost: cn(
            'bg-transparent text-foreground-muted hover:text-foreground hover:bg-card-hover'
        ),
    };

    const sizeMap = {
        sm: 'px-3 py-1.5 text-sm font-medium rounded min-h-[36px]',
        md: 'px-4 py-2.5 text-sm font-medium rounded-xl min-h-[44px]',
        lg: 'px-6 py-3 text-base font-medium rounded-xl min-h-[48px]',
    };

    const Component = props.href ? 'a' : 'button';
    const isDisabled = disabled || loading;

    return (
        <Component
            className={cn(
                'inline-flex items-center justify-center font-medium transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                variants[variant],
                sizeMap[size],
                className
            )}
            disabled={props.href ? undefined : isDisabled}
            aria-disabled={props.href ? isDisabled : undefined}
            aria-busy={loading}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {Icon && <Icon className="w-4 h-4 mr-2" />}
                    {children}
                    {IconRight && <IconRight className="w-4 h-4 mr-2" />}
                </>
            )}
        </Component>
    );
};

export default Button;
