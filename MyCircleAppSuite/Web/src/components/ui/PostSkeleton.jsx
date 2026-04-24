import React from 'react';

const PostSkeleton = () => {
    return (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-[16/10] bg-background-tertiary" />

            <div className="p-4 sm:p-5 space-y-4">
                <div className="space-y-2">
                    <div className="h-5 w-5/6 rounded-lg bg-background-tertiary" />
                    <div className="h-4 w-2/3 rounded-lg bg-background-tertiary" />
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-background-tertiary" />
                    <div className="space-y-2 flex-1">
                        <div className="h-3.5 w-40 rounded-full bg-background-tertiary" />
                        <div className="h-3 w-24 rounded-full bg-background-tertiary" />
                    </div>
                </div>

                <div className="h-12 rounded-xl bg-background-tertiary" />

                <div className="flex gap-2">
                    <div className="h-7 w-24 rounded-full bg-background-tertiary" />
                    <div className="h-7 w-20 rounded-full bg-background-tertiary" />
                </div>

                <div className="pt-4 border-t border-card-border flex items-center justify-between">
                    <div className="h-3.5 w-32 rounded-full bg-background-tertiary" />
                    <div className="flex gap-2">
                        <div className="w-9 h-9 rounded-xl bg-background-tertiary" />
                        <div className="w-9 h-9 rounded-xl bg-background-tertiary" />
                        <div className="w-9 h-9 rounded-xl bg-background-tertiary" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostSkeleton;
