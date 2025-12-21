import React from 'react';

const PostStatusBadge = ({ status, className = '' }) => {
    const getStatusColor = (s) => {
        switch (s) {
            case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'inactive': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            case 'sold': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'completed': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'archived': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(status)} ${className}`}>
            {status.toUpperCase()}
        </span>
    );
};

export default PostStatusBadge;
