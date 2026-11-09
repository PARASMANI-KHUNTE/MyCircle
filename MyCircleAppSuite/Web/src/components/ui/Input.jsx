import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

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
                        <span className="text-muted-foreground ml-1" aria-hidden="true">*</span>
                    )}
                </label>
            )}

            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
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
                        'w-full rounded-lg px-3.5 py-2.5 text-sm text-foreground min-h-[44px]',
                        Icon && 'pl-10',
                        IconRight && 'pr-10',
                        /* Placeholder */
                        'placeholder-opacity-50 placeholder-text-muted-foreground',
                        /* Base input */
                        'bg-background border-b border-input-border',
                        /* Focus & transition */
                        'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10',
                        'transition-colors duration-150',
                        /* Error state */
                        error && 'border-error focus:ring-error/10',
                        /* Disabled state */
                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-card/50',
                        'disabled:focus:ring-0 disabled:cursor-not-allowed',
                        className
                    )}
                    {...props}
                />
                {IconRight && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        <IconRight className="w-4 h-4" />
                    </div>
                )}
            </div>

            {error && (
                <p 
                    id={props.id ? `${props.id}-error` : undefined} 
                    role="alert" 
                    className="text-xs text-foreground-muted flex items-center gap-1"
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
