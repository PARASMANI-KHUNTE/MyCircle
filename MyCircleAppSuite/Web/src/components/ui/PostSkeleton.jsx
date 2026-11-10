import React from 'react';

const PostSkeleton = () => {
    return (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden flex flex-col" aria-busy="true" aria-label="Loading post">
            {/* 4:3 Image area */}
            <div className="aspect-[4/3] bg-background-tertiary skeleton" />

            <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="skeleton h-3 w-16 rounded-md" />
                        <div className="skeleton h-3 w-12 rounded-md" />
                    </div>
                    <div className="skeleton h-4 w-5/6 rounded-md" />
                    <div className="skeleton h-3 w-full rounded-md" />
                </div>

                <div className="pt-2 border-t border-card-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="skeleton w-6 h-6 rounded-full" />
                        <div className="skeleton h-3 w-20 rounded-md" />
                    </div>
                    <div className="skeleton w-8 h-8 rounded-lg" />
                </div>
            </div>
        </div>
    );
};

export default PostSkeleton;
