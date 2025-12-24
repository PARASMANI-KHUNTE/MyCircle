import React from 'react';
import { motion } from 'framer-motion';

const PostSkeleton = () => {
    return (
        <div className="glass rounded-[3rem] p-6 flex flex-col h-full space-y-4 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/10 ring-1 ring-white/5" />
                    <div className="space-y-2">
                        <div className="w-32 h-4 bg-white/10 rounded-full" />
                        <div className="w-24 h-3 bg-white/5 rounded-full" />
                    </div>
                </div>
                <div className="w-16 h-6 bg-white/5 rounded-lg" />
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2">
                <div className="w-full h-3 bg-white/5 rounded-full" />
                <div className="w-5/6 h-3 bg-white/5 rounded-full" />
            </div>

            {/* Image Skeleton */}
            <div className="w-full aspect-video bg-white/5 rounded-[2.5rem]" />

            {/* Footer Skeleton */}
            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-end">
                <div className="space-y-2">
                    <div className="w-20 h-2 bg-white/5 rounded-full" />
                    <div className="w-16 h-5 bg-white/10 rounded-full" />
                </div>
                <div className="flex gap-2">
                    <div className="w-10 h-10 bg-white/10 rounded-xl" />
                    <div className="w-10 h-10 bg-white/10 rounded-xl" />
                    <div className="w-10 h-10 bg-white/10 rounded-xl" />
                </div>
            </div>
        </div>
    );
};

export default PostSkeleton;
