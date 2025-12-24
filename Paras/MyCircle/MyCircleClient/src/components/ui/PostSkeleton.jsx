import React from 'react';

const PostSkeleton = () => {
    return (
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col h-full space-y-4 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100" />
                    <div className="space-y-2">
                        <div className="w-32 h-4 bg-slate-100 rounded-full" />
                        <div className="w-24 h-3 bg-slate-50 rounded-full" />
                    </div>
                </div>
                <div className="w-16 h-6 bg-slate-100 rounded-full" />
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2">
                <div className="w-full h-3 bg-slate-50 rounded-full" />
                <div className="w-5/6 h-3 bg-slate-50 rounded-full" />
            </div>

            {/* Image Skeleton */}
            <div className="w-full aspect-video bg-slate-100 rounded-2xl" />

            {/* Footer Skeleton */}
            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-end">
                <div className="space-y-2">
                    <div className="w-20 h-2 bg-slate-50 rounded-full" />
                    <div className="w-16 h-5 bg-slate-100 rounded-full" />
                </div>
                <div className="flex gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-full" />
                    <div className="w-8 h-8 bg-slate-100 rounded-full" />
                    <div className="w-8 h-8 bg-slate-100 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default PostSkeleton;
