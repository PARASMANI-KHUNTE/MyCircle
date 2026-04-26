import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Button - Production-grade button with consistent states and micro-interactions
 * 
 * Design rationale:
 * - Uses cubic-bezier for natural, premium feel (0.16, 1, 0.3, 1)
 * - Active state uses subtle scale (0.98) rather than translate for more predictable behavior
 * - Focus ring inherits from design system
 * - All states animate with --duration-normal (200ms)
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
            'bg-primary text-primary-foreground hover:bg-primary-hover',
            'shadow-sm hover:shadow-md',
            'active:shadow-sm'
        ),
        secondary: cn(
            'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
            'shadow-sm hover:shadow-md',
            'active:shadow-sm'
        ),
        accent: cn(
            'bg-accent text-accent-foreground hover:bg-accent-hover',
            'shadow-sm hover:shadow-md',
            'active:shadow-sm'
        ),
        outline: cn(
            'border border-card-border bg-transparent text-foreground',
            'hover:border-card-border-hover hover:bg-card-hover',
            'active:bg-background-secondary'
        ),
        ghost: cn(
            'bg-transparent text-foreground-muted',
            'hover:text-foreground hover:bg-card-hover',
            'active:bg-background-secondary'
        ),
        danger: cn(
            'bg-error text-white hover:bg-error/90',
            'shadow-sm hover:shadow-md',
            'active:shadow-sm'
        ),
        success: cn(
            'bg-success text-white hover:bg-success/90',
            'shadow-sm hover:shadow-md',
            'active:shadow-sm'
        ),
    };

    const sizes = {
        xs: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5 min-h-[32px]',
        sm: 'px-3.5 py-2 text-sm font-semibold rounded-lg gap-2 min-h-[36px]',
        md: 'px-4.5 py-2.5 text-sm font-semibold rounded-xl gap-2 min-h-[44px]',
        lg: 'px-6 py-3 text-base font-semibold rounded-xl gap-2.5 min-h-[52px]',
        xl: 'px-8 py-4 text-lg font-semibold rounded-2xl gap-3 min-h-[60px]',
    };

    const Component = props.href ? 'a' : 'button';
    const isDisabled = disabled || loading;

    return (
        <Component
            className={cn(
                'inline-flex items-center justify-center font-semibold',
                'transition-all duration-200 ease-[var(--ease-smooth)]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'active:scale-[0.98] active:duration-75',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={props.href ? undefined : isDisabled}
            aria-disabled={props.href ? isDisabled : undefined}
            aria-busy={loading}
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
                    {IconRight && <IconRight className={cn('w-4 h-4', size === 'xs' && 'w-3 h-3', size === 'lg' && 'w-5 h-5')} />}
                </>
            )}
        </Component>
    );
};

export default Button;
