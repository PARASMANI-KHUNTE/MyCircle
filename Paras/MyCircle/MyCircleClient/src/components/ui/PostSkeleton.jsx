import React from 'react';

const PostSkeleton = () => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col overflow-hidden h-full animate-pulse">
            {/* Image Skeleton - Now at Top */}
            <div className="w-full aspect-[4/3] bg-slate-100" />

            <div className="p-6 flex flex-col flex-grow space-y-4">
                {/* User Info Skeleton */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100" />
                    <div className="space-y-2 flex-1">
                        <div className="w-24 h-3 bg-slate-100 rounded-full" />
                        <div className="w-16 h-2 bg-slate-50 rounded-full" />
                    </div>
                </div>

                {/* Title Skeleton */}
                <div className="w-3/4 h-5 bg-slate-100 rounded-full" />

                {/* Description Skeleton */}
                <div className="space-y-2 flex-grow">
                    <div className="w-full h-3 bg-slate-50 rounded-full" />
                    <div className="w-5/6 h-3 bg-slate-50 rounded-full" />
                </div>

                {/* Footer Skeleton */}
                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                    <div className="space-y-2">
                        <div className="w-20 h-2 bg-slate-50 rounded-full" />
                        <div className="w-16 h-5 bg-slate-100 rounded-full" />
                    </div>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 bg-slate-50 rounded-xl" />
                        <div className="w-8 h-8 bg-slate-50 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostSkeleton;
