import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * Input component with label, helper text, error state.
 * Meets 44px min-height touch target (py-3 + text = ~44px).
 */
const Input = forwardRef(({ className, error, label, helperText, icon: Icon, ...props }, ref) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-sm font-medium text-foreground-secondary">
                    {label}
                    {props.required && <span className="text-error ml-1" aria-hidden="true">*</span>}
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
                    aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
                    className={cn(
                        /* Layout & sizing — min 44px touch target */
                        'w-full bg-input border rounded-xl text-sm text-foreground',
                        'px-4 py-3 min-h-[44px]',
                        Icon && 'pl-10',
                        /* Placeholder */
                        'placeholder:text-input-placeholder',
                        /* Border & focus */
                        'border-input-border',
                        'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                        /* Transitions */
                        'transition-all duration-200',
                        /* Error state */
                        error && 'border-error focus:border-error focus:ring-error/20',
                        /* Disabled state */
                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-secondary',
                        className
                    )}
                    {...props}
                />
            </div>

            {error && (
                <p id={props.id ? `${props.id}-error` : undefined} role="alert" className="text-xs text-error font-medium flex items-center gap-1">
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p id={props.id ? `${props.id}-helper` : undefined} className="text-xs text-foreground-muted">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
