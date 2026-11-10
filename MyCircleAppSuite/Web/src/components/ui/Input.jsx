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
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    {label}
                    {props.required && (
                        <span className="text-primary ml-1" aria-hidden="true">*</span>
                    )}
                </label>
            )}

            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
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
                        'w-full rounded-xl px-3.5 py-2 text-sm text-foreground h-10',
                        Icon && 'pl-9',
                        IconRight && 'pr-9',
                        'placeholder:text-input-placeholder placeholder:text-xs',
                        'bg-input border border-input-border',
                        'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
                        'transition-all duration-150',
                        error && 'border-error focus:border-error focus:ring-error/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-card/50',
                        className
                    )}
                    {...props}
                />
                {IconRight && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
                        <IconRight className="w-4 h-4" />
                    </div>
                )}
            </div>

            {error ? (
                <p 
                    id={props.id ? `${props.id}-error` : undefined} 
                    role="alert" 
                    className="text-xs text-error font-medium"
                >
                    {error}
                </p>
            ) : helperText ? (
                <p 
                    id={props.id ? `${props.id}-helper` : undefined} 
                    className="text-[11px] text-foreground-muted"
                >
                    {helperText}
                </p>
            ) : null}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
