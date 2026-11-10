import React from 'react';
import { cn } from '../../utils/cn';

const statusConfigs = {
    active: {
        label: 'Active',
        badge: 'bg-success/10 text-success border-success/20',
        dot: 'bg-success',
    },
    inactive: {
        label: 'Paused',
        badge: 'bg-secondary text-foreground-muted border-card-border',
        dot: 'bg-foreground-muted',
    },
    sold: {
        label: 'Sold',
        badge: 'bg-info/10 text-info border-info/20',
        dot: 'bg-info',
    },
    completed: {
        label: 'Completed',
        badge: 'bg-primary/10 text-primary border-primary/20',
        dot: 'bg-primary',
    },
    archived: {
        label: 'Archived',
        badge: 'bg-error/10 text-error border-error/20',
        dot: 'bg-error',
    },
};

const PostStatusBadge = ({ status, className = '' }) => {
    const config = statusConfigs[status] || statusConfigs.inactive;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight',
                config.badge,
                className
            )}
        >
            <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
            <span>{config.label}</span>
        </span>
    );
};

export default PostStatusBadge;
