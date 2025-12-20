import React from 'react';
import { cn } from '../../utils/cn';

const Input = ({ className, error, label, ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-sm font-medium text-gray-400 ml-1">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500',
                    'focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50',
                    'transition-all duration-200',
                    error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                    className
                )}
                {...props}
            />
            {error && (
                <span className="text-xs text-red-500 ml-1">{error}</span>
            )}
        </div>
    );
};

export default Input;
