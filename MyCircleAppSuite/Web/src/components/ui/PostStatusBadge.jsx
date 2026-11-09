import React from 'react';
import { cn } from '../../utils/cn';

const statusStyles = {
    active: 'bg-success/10 text-success border-success/20',
    inactive: 'bg-background-tertiary text-foreground-muted border-card-border',
    sold: 'bg-info/10 text-info border-info/20',
    completed: 'bg-primary/10 text-primary border-primary/20',
    archived: 'bg-error/10 text-error border-error/20',
};

const PostStatusBadge = ({ status, className = '' }) => {
    const style = statusStyles[status] || statusStyles.inactive;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
                style,
                className
            )}
        >
            {status}
        </span>
    );
};

export default PostStatusBadge;
