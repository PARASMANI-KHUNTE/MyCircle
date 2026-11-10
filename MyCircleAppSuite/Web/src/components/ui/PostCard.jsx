import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Heart, MapPin, Pause, Pencil, Play, ShoppingBag, Trash2, Zap } from 'lucide-react';
import Button from './Button';
import CheckoutModal from './CheckoutModal';
import { cn } from '../../utils/cn';
import { getAvatarUrl } from '../../utils/avatar';
import { useCurrencySymbol } from '../../context/CurrencySymbolContext';

const typeLabels = {
    service: 'Service',
    hire: 'Hiring',
    trade: 'Trade',
    sell: 'For Sale',
    rent: 'Rental',
    barter: 'Barter',
    request: 'Request',
};

const PostCard = ({
    post,
    currentUserId = null,
    isOwnPost: propIsOwnPost = false,
    onEdit = () => {},
    onDelete = null,
    onToggleStatus = null,
    onAnalytics = null,
    onClick = () => {},
}) => {
    const {
        _id,
        title,
        description,
        type,
        location,
        price,
        user,
        createdAt,
        images,
        likes = [],
        status,
        acceptInAppPayment,
    } = post;

    const navigate = useNavigate();
    const { currencySymbol } = useCurrencySymbol();
    const [showCheckout, setShowCheckout] = useState(false);

    const isOwnPost =
        !!propIsOwnPost ||
        (currentUserId && user?._id && String(currentUserId) === String(user?._id));
    const isLiked = currentUserId && (likes || []).some((id) => String(id) === String(currentUserId));
    const displayDate = createdAt
        ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Recently';
    const hasPrice = Number(price) > 0;
    const canPayOnline = hasPrice && acceptInAppPayment !== false;

    return (
        <>
            <article
                onClick={onClick}
                className="group flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card transition-all duration-200 hover:border-card-border-hover hover:shadow-sm"
            >
                {/* 4:3 Media Frame */}
                <Link to={`/post/${_id}`} className="relative block aspect-[4/3] overflow-hidden bg-background-tertiary">
                    {images?.length > 0 ? (
                        <img
                            src={images[0]}
                            alt={title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <span className="text-2xl font-bold text-foreground-muted/30 uppercase tracking-widest font-display">
                                {title?.charAt(0) || 'M'}
                            </span>
                        </div>
                    )}

                    {/* Floating Price Pill */}
                    {hasPrice ? (
                        <span className="absolute left-2.5 bottom-2.5 rounded-lg bg-background/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-foreground shadow-sm">
                            {currencySymbol}{Number(price).toLocaleString()}
                        </span>
                    ) : (
                        <span className="absolute left-2.5 bottom-2.5 rounded-lg bg-background/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-foreground-muted shadow-sm">
                            Contact for price
                        </span>
                    )}

                    {/* Floating Category Pill */}
                    <span className="absolute right-2.5 top-2.5 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">
                        {typeLabels[type] || type || 'Listing'}
                    </span>

                    {/* Status Overlay if inactive / sold */}
                    {status && status !== 'active' && (
                        <span className="absolute left-2.5 top-2.5 rounded-md bg-foreground/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-background uppercase tracking-wider">
                            {status}
                        </span>
                    )}
                </Link>

                {/* Content */}
                <div className="flex flex-1 flex-col p-3.5 justify-between">
                    <div>
                        {/* Location and In-App Payment Indicator */}
                        <div className="flex items-center justify-between text-[11px] text-foreground-muted mb-1.5">
                            <span className="inline-flex items-center gap-1 truncate max-w-[60%]">
                                <MapPin className="h-3 w-3 shrink-0 text-foreground-muted" />
                                <span className="truncate">{location || 'Nearby'}</span>
                            </span>
                            {acceptInAppPayment === false ? (
                                <span className="text-[10px] font-medium text-foreground-muted">Cash only</span>
                            ) : hasPrice ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                                    <Zap className="h-2.5 w-2.5 fill-primary" />
                                    Online Pay
                                </span>
                            ) : (
                                <span>{displayDate}</span>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                            <Link to={`/post/${_id}`}>
                                {title}
                            </Link>
                        </h3>

                        {/* Description snippet */}
                        {description && (
                            <p className="mt-1 line-clamp-1 text-xs text-foreground-muted leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Footer Row */}
                    <div className="mt-3 flex items-center justify-between border-t border-card-border/60 pt-2.5">
                        <Link 
                            to={user?._id ? `/profile?userId=${user._id}` : '#'}
                            className="flex min-w-0 items-center gap-2 group/author hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={getAvatarUrl(user)}
                                alt={user?.displayName || 'Seller'}
                                className="h-5 w-5 rounded-full object-cover shrink-0"
                            />
                            <span className="truncate text-xs font-medium text-foreground-muted group-hover/author:text-foreground">
                                {user?.displayName?.split(' ')[0] || 'User'}
                            </span>
                        </Link>

                        <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] text-foreground-muted px-1.5 py-0.5">
                                <Heart className={cn('h-3.5 w-3.5', isLiked ? 'fill-primary text-primary' : '')} />
                                <span>{(likes || []).length}</span>
                            </span>

                            {isOwnPost ? (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(post);
                                        }}
                                        aria-label="Edit post"
                                        className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    {onToggleStatus && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleStatus(post);
                                            }}
                                            aria-label={post.isActive === false ? 'Activate post' : 'Pause post'}
                                            className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                                        >
                                            {post.isActive === false ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                                        </button>
                                    )}
                                    {onAnalytics && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAnalytics(post);
                                            }}
                                            aria-label="Analytics"
                                            className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                                        >
                                            <BarChart3 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(post);
                                            }}
                                            aria-label="Delete"
                                            className="p-1 rounded-lg text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    disabled={!hasPrice || !canPayOnline}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (canPayOnline) setShowCheckout(true);
                                        else navigate(`/post/${_id}`);
                                    }}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors flex items-center justify-center",
                                        canPayOnline
                                            ? "text-primary hover:bg-primary/10"
                                            : "text-foreground-muted/40 cursor-not-allowed"
                                    )}
                                    title={canPayOnline ? 'Buy online' : (hasPrice ? 'Cash / Meetup only' : 'View post')}
                                >
                                    <ShoppingBag className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </article>

            {showCheckout && (
                <CheckoutModal
                    post={post}
                    onClose={() => setShowCheckout(false)}
                    onPurchase={() => setShowCheckout(false)}
                />
            )}
        </>
    );
};

export default PostCard;
