import React from 'react';
import { motion } from 'framer-motion';

const PostSkeleton = () => {
    return (
        <div className="glass-panel p-6 flex flex-col h-full space-y-4 animate-pulse shadow-card">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-hover-bg ring-1 ring-card-border" />
                    <div className="space-y-2">
                        <div className="w-32 h-4 bg-hover-bg rounded-full" />
                        <div className="w-24 h-3 bg-card/20 rounded-full" />
                    </div>
                </div>
                <div className="w-16 h-6 bg-card/20 rounded-lg" />
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2">
                <div className="w-full h-3 bg-card/20 rounded-full" />
                <div className="w-5/6 h-3 bg-card/20 rounded-full" />
            </div>

            {/* Image Skeleton */}
            <div className="w-full aspect-video bg-card/20 rounded-[2.5rem]" />

            {/* Footer Skeleton */}
            <div className="mt-auto pt-4 border-t border-card-border flex justify-between items-end">
                <div className="space-y-2">
                    <div className="w-20 h-2 bg-card/20 rounded-full" />
                    <div className="w-16 h-5 bg-hover-bg rounded-full" />
                </div>
                <div className="flex gap-2">
                    <div className="w-10 h-10 bg-hover-bg rounded-xl" />
                    <div className="w-10 h-10 bg-hover-bg rounded-xl" />
                    <div className="w-10 h-10 bg-hover-bg rounded-xl" />
                </div>
            </div>
        </div>
    );
};

export default PostSkeleton;
