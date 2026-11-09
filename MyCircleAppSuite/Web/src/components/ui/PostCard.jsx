import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { cn } from '../../utils/cn';
import { getAvatarUrl } from '../../utils/avatar';
import CheckoutModal from './CheckoutModal';

const PostCard = ({
    post,
    currentUserId = null,
    isOwnPost: propIsOwnPost = false,
    onDelete = () => {},
    onEdit = () => {},
    onClick = () => {},
}) => {
    const { title, type, location, price, user, createdAt, images, likes, status } = post;
    const navigate = useNavigate();
    const { currencySymbol } = useCurrencySymbol();
    const isLiked = currentUserId && (likes || []).includes(currentUserId);
    const displayDate = createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently';
    const displayLocation = location || '—';
    const isOwnPost = !!propIsOwnPost || (currentUserId && user?._id && String(currentUserId) === String(user?._id));
    const [showCheckout, setShowCheckout] = useState(false);

    return (
        <article
            className={cn(
                'group border-b border-card-border/50 hover:border-card-border/75 transition-colors cursor-pointer',
                !isActive && 'opacity-50'
            )}
            onClick={onClick}
        >
            <div className="h-48 sm:h-56 bg-background-secondary overflow-hidden rounded-t-lg">
                {images && images.length > 0 ? (
                    <a href={`/post/${post._id}`} className="block w-full h-full" onClick={(e) => e.stopPropagation()}>
                        <img src={images[0]} alt={title} className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90" />
                    </a>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">{type ? type[0] : '—'}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                {status && (
                    <div className="absolute top-2 right-2 text-xs font-medium bg-black/60 text-white px-2 py-0.5 rounded">
                        {status}
                    </div>
                )}
            </div>

            <div className="p-3 sm:p-4">
                <h3 className="font-medium text-sm leading-snapped line-clamp-2 line-clamp-2-sm line-clamp-md:line-clamp-2 group-hover/title:underline group-hover/title:text-primary transition-colors mb-2">
                    <a href={`/post/${post._id}`} className="underline underline-offset-2 hover:no-underline">{title}</a>
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-2 line-clamp-2-sm line-clamp-md:line-clamp-2">
                    {post.description || ''}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <span>{displayDate}</span>
                    <span>•</span>
                    <span>{displayLocation}</span>
                </div>

                <footer className="mt-3 pt-3 border-t border-card-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {user?.displayName || 'User'}
                    </div>
                    <div className="flex items-center gap-2">
                        {isLiked ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="stroke-primary">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="stroke-primary/40">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        )}
                        <span className="text-[2] ml-1">{likes?.length || 0}</span>
                    </div>
                    {isOwnPost && (
                        <Button variant="ghost" size="sm" className="text-foreground-muted hover:text-primary" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                            Edit
                        </Button>
                    )}
                    {!isOwnPost && (
                        <Button variant="ghost" size="sm" className="text-foreground-muted hover:text-primary" onClick={(e) => { e.stopPropagation(); setShowCheckout(true); }}>
                            Buy
                        </Button>
                    )}
                </footer>
            </div>

            {showCheckout && (
                <CheckoutModal
                    post={post}
                    onClose={() => setShowCheckout(false)}
                    onPurchase={(orderId, clientSecret, amount, platformFee, sellerAmount) => {
                        // Handle successful payment - could redirect to order page
                        setShowCheckout(false);
                        // TODO: In a full integration, redirect to order confirmation page
                        // or show a confirmation modal
                        alert(`Order #${orderId} created! Amount: $${amount}. Payment ID: ${clientSecret}`);
                    }}
                />
            )}
        </article>
    );
};

export default PostCard;