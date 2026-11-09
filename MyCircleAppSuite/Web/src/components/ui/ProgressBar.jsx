import React from 'react';

const ProgressBar = ({ progress, showLabel = true, size = 'md', color = 'primary' }) => {
    const sizes = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    const colors = {
        primary: 'bg-primary',
        success: 'bg-success',
        warning: 'bg-warning',
        error: 'bg-error',
    };

    const value = Math.min(100, Math.max(0, Number(progress) || 0));

    return (
        <div className="w-full">
            {showLabel && (
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">Progress</span>
                    <span className="text-sm font-medium text-foreground">{Math.round(value)}%</span>
                </div>
            )}
            <div className={`w-full overflow-hidden rounded-full bg-background-tertiary ${sizes[size]}`}>
                <div
                    className={`${colors[color] || colors.primary} ${sizes[size]} rounded-full transition-[width] duration-300 ease-out`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
