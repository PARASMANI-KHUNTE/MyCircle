import React from 'react';

/**
 * PostSkeleton — mirrors the PostCard layout exactly,
 * with a gradient shimmer animation instead of a flat pulse.
 */
const PostSkeleton = () => {
    return (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden" aria-busy="true" aria-label="Loading post">
            {/* Image area */}
            <div className="aspect-[16/10] skeleton" />

            <div className="p-4 sm:p-5 space-y-4">
                {/* Title */}
                <div className="space-y-2">
                    <div className="skeleton h-5 w-5/6 rounded-lg" />
                    <div className="skeleton h-4 w-2/3 rounded-lg" />
                </div>

                {/* Avatar + meta */}
                <div className="flex items-center gap-3">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <div className="skeleton h-3.5 w-36 rounded-full" />
                        <div className="skeleton h-3 w-24 rounded-full" />
                    </div>
                </div>

                {/* Description lines */}
                <div className="space-y-2">
                    <div className="skeleton h-3.5 w-full rounded-lg" />
                    <div className="skeleton h-3.5 w-4/5 rounded-lg" />
                    <div className="skeleton h-3.5 w-3/5 rounded-lg" />
                </div>

                {/* Tags */}
                <div className="flex gap-2">
                    <div className="skeleton h-7 w-24 rounded-full" />
                    <div className="skeleton h-7 w-20 rounded-full" />
                </div>

                {/* Footer actions */}
                <div className="pt-4 border-t border-card-border flex items-center justify-between">
                    <div className="skeleton h-3.5 w-32 rounded-full" />
                    <div className="flex gap-2">
                        <div className="skeleton w-9 h-9 rounded-xl" />
                        <div className="skeleton w-9 h-9 rounded-xl" />
                        <div className="skeleton w-20 h-9 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostSkeleton;
