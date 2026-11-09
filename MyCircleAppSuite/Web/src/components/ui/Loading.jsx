import React from 'react';
import { cn } from '../../utils/cn';

const SIZES = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
};

/**
 * Loading spinner — a single orange ring, no decorative effects.
 */
const Loading = ({ size = 'md', fullscreen = false, text, inline = false }) => {
    const spinner = (
        <span className={cn('inline-flex items-center gap-3', inline ? 'flex-row' : 'flex-col')} role="status" aria-live="polite">
            <span
                className={cn(
                    'inline-block animate-spin rounded-full border-primary/20 border-t-primary',
                    SIZES[size] || SIZES.md
                )}
            />
            {text && <span className="text-sm font-medium text-foreground-muted">{text}</span>}
        </span>
    );

    if (fullscreen) {
        return (
            <div
                className="fixed inset-0 z-[30] flex items-center justify-center bg-background"
                aria-label={text || 'Loading'}
            >
                {spinner}
            </div>
        );
    }

    return spinner;
};

export const Skeleton = ({ className = '', ...props }) => (
    <div className={cn('skeleton', className)} aria-hidden="true" {...props} />
);

export const EmptyState = ({ icon: Icon, title, description, action: Action }) => (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        {Icon && (
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
            </div>
        )}
        {title && <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>}
        {description && <p className="mb-4 max-w-sm text-sm text-foreground-muted">{description}</p>}
        {Action && <Action />}
    </div>
);

export default Loading;
