import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Heart, MapPin, Pause, Pencil, Play, ShoppingBag, Trash2 } from 'lucide-react';
import Button from './Button';
import CheckoutModal from './CheckoutModal';
import { cn } from '../../utils/cn';
import { getAvatarUrl } from '../../utils/avatar';
import { useCurrencySymbol } from '../../context/CurrencySymbolContext';

const typeLabels = {
    service: 'Service',
    hire: 'Hiring',
    trade: 'Trade',
    rent: 'Rent',
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

    return (
        <>
            <article
                onClick={onClick}
                className="group flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card transition-colors duration-150 hover:border-card-border-hover"
            >
                <Link to={`/post/${_id}`} className="relative block aspect-[4/3] overflow-hidden bg-background-secondary">
                    {images?.length > 0 ? (
                        <img
                            src={images[0]}
                            alt={title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <span className="text-3xl font-semibold text-foreground-muted/40">
                                {title?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                        </div>
                    )}
                    {status && status !== 'active' && (
                        <span className="absolute right-2 top-2 rounded-md bg-foreground/80 px-2 py-0.5 text-[11px] font-medium text-background">
                            {status}
                        </span>
                    )}
                </Link>

                <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
                        {type && <span className="text-primary">{typeLabels[type] || type}</span>}
                        {type && location && <span aria-hidden>·</span>}
                        {location && (
                            <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                                <MapPin className="h-3 w-3" />
                                {location}
                            </span>
                        )}
                    </div>

                    <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                        <Link to={`/post/${_id}`} className="hover:text-primary">
                            {title}
                        </Link>
                    </h3>

                    {description && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-foreground-muted">
                            {description}
                        </p>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
                        <span>{displayDate}</span>
                        {hasPrice && (
                            <span className="font-semibold text-foreground">
                                {currencySymbol}{Number(price).toLocaleString()}
                            </span>
                        )}
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-card-border/70 pt-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <img
                                src={getAvatarUrl(user)}
                                alt={user?.displayName || 'Seller'}
                                className="h-6 w-6 rounded-full object-cover"
                            />
                            <span className="truncate text-xs text-foreground-muted">
                                {user?.displayName || 'User'}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
                                <Heart
                                    className={cn('h-3.5 w-3.5', isLiked ? 'fill-primary text-primary' : '')}
                                />
                                {(likes || []).length}
                            </span>

                            {isOwnPost ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-1 px-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(post);
                                        }}
                                        aria-label="Edit post"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    {onToggleStatus && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="px-2 text-foreground-muted"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleStatus(post);
                                            }}
                                            aria-label={post.isActive === false ? 'Activate post' : 'Pause post'}
                                        >
                                            {post.isActive === false ? (
                                                <Play className="h-3.5 w-3.5" />
                                            ) : (
                                                <Pause className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    )}
                                    {onAnalytics && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="px-2 text-foreground-muted"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAnalytics(post);
                                            }}
                                            aria-label="View post analytics"
                                        >
                                            <BarChart3 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="px-2 text-foreground-muted hover:bg-error/10 hover:text-error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(post);
                                            }}
                                            aria-label="Delete post"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 px-2 text-primary hover:text-primary"
                                    disabled={!hasPrice}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (hasPrice) setShowCheckout(true);
                                        else navigate(`/post/${_id}`);
                                    }}
                                    aria-label={hasPrice ? 'Buy this post' : 'View post'}
                                >
                                    <ShoppingBag className="h-3.5 w-3.5" />
                                </Button>
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
