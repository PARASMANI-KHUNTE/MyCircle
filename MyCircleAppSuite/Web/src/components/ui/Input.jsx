import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * Input component with label, helper text, error state.
 * 
 * Design rationale:
 * - Consistent 44px min-height touch target
 * - Focus uses primary color ring (inherits from design system)
 * - Error state maintains WCAG AA contrast 
 * - Smooth transition on all state changes
 */
const Input = forwardRef(({ 
    className, 
    error, 
    label, 
    helperText, 
    icon: Icon,
    iconRight: IconRight,
    ...props 
}, ref) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-sm font-medium text-foreground">
                    {label}
                    {props.required && (
                        <span className="text-error ml-1" aria-hidden="true">*</span>
                    )}
                </label>
            )}

            <div className="relative">
                {Icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                <input
                    ref={ref}
                    aria-invalid={!!error}
                    aria-describedby={error 
                        ? `${props.id}-error` 
                        : helperText 
                            ? `${props.id}-helper` 
                            : undefined
                    }
                    className={cn(
                        /* Layout & sizing — min 44px touch target */
                        'w-full bg-input border rounded-xl text-sm text-foreground',
                        'px-4 py-3 min-h-[44px]',
                        Icon && 'pl-10',
                        IconRight && 'pr-10',
                        /* Placeholder */
                        'placeholder:text-input-placeholder',
                        /* Border & focus */
                        'border-input-border',
                        'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                        /* Transitions */
                        'transition-all duration-200 ease-[var(--ease-smooth)]',
                        /* Error state - maintains contrast */
                        error && 'border-error focus:border-error focus:ring-error/20',
                        /* Disabled state */
                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-tertiary',
                        'disabled:focus:border-input-border disabled:focus:ring-0',
                        className
                    )}
                    {...props}
                />
                {IconRight && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
                        <IconRight className="w-4 h-4" />
                    </div>
                )}
            </div>

            {error && (
                <p 
                    id={props.id ? `${props.id}-error` : undefined} 
                    role="alert" 
                    className="text-xs text-error font-medium flex items-center gap-1"
                >
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p 
                    id={props.id ? `${props.id}-helper` : undefined} 
                    className="text-xs text-foreground-muted"
                >
                    {helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
