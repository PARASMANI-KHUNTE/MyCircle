import React from 'react';

/**
 * Loading spinner with multiple size variants - CSS only, no animations library
 */
const Loading = ({ size = 'md', fullscreen = false, text, inline = false }) => {
    const spinnerSize = size === 'sm' ? 'w-6 h-6 border-2' : 'w-8 h-8 border-3';
    const inlineSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <div
                className={`${spinnerSize} border-primary/20 border-t-primary rounded-full`}
                role="status"
                aria-label={text || 'Loading'}
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
                <div
                    className={`${inlineSize} border-primary/20 border-t-primary rounded-full`}
                    role="status"
                    aria-label={text || 'Loading'}
                />
                {text}
            </span>
        );
    }

    return spinner;
};

/**
 * Skeleton loader for content placeholders
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