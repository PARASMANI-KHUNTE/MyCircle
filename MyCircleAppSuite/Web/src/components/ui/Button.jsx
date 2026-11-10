import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Minimalist Button - Precision sizing, crisp micro-interactions, no decorative noise.
 * 
 * Variants: primary, secondary, outline, ghost, destructive
 * Sizes: xs, sm, md, lg
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
            'bg-primary text-primary-foreground font-semibold hover:bg-primary-hover shadow-sm active:scale-[0.98]'
        ),
        secondary: cn(
            'bg-secondary text-secondary-foreground hover:bg-secondary-hover border border-card-border/60 active:scale-[0.98]'
        ),
        outline: cn(
            'border border-card-border bg-card text-foreground hover:border-card-border-hover hover:bg-card-hover active:scale-[0.98]'
        ),
        ghost: cn(
            'bg-transparent text-foreground-muted hover:text-foreground hover:bg-card-hover active:scale-[0.98]'
        ),
        destructive: cn(
            'bg-error/10 text-error hover:bg-error/20 border border-error/20 active:scale-[0.98]'
        ),
    };

    const sizeMap = {
        xs: 'px-2.5 py-1 text-xs font-medium rounded-lg h-7 gap-1',
        sm: 'px-3 py-1.5 text-xs font-medium rounded-lg h-8 gap-1.5',
        md: 'px-4 py-2 text-sm font-medium rounded-xl h-10 gap-2',
        lg: 'px-5 py-2.5 text-base font-medium rounded-xl h-12 gap-2.5',
    };

    const Component = props.href ? 'a' : 'button';
    const isDisabled = disabled || loading;

    return (
        <Component
            className={cn(
                'inline-flex items-center justify-center font-medium transition-all duration-150 select-none',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                variants[variant] || variants.primary,
                sizeMap[size] || sizeMap.md,
                className
            )}
            disabled={props.href ? undefined : isDisabled}
            aria-disabled={props.href ? isDisabled : undefined}
            aria-busy={loading}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                    <span>{children}</span>
                </>
            ) : (
                <>
                    {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    <span>{children}</span>
                    {IconRight && <IconRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
                </>
            )}
        </Component>
    );
};

export default Button;
