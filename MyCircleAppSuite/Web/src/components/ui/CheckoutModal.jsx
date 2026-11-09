import React, { useMemo, useState } from 'react';
import Dialog from './Dialog';
import Button from './Button';
import { useToast } from './Toast';
import { useAuth } from '../../context/AuthContext';
import { useCurrencySymbol } from '../../context/CurrencySymbolContext';
import { createPaymentIntent } from '../../utils/api';

/**
 * CheckoutModal — minimal escrow checkout for a marketplace post.
 *
 * Calls POST /api/payments/create-intent with the post id. The backend
 * resolves the price/seller from the post and returns a client secret.
 */
const CheckoutModal = ({ post, onClose, onPurchase }) => {
    const { isAuthenticated } = useAuth();
    const { currencySymbol } = useCurrencySymbol();
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);

    const amount = useMemo(() => {
        const value = Number(post?.price);
        return Number.isFinite(value) && value > 0 ? value : 0;
    }, [post]);

    const sellerId = post?.user?._id || post?.user?.id;

    const handlePurchase = async () => {
        if (!isAuthenticated) {
            showError('Please sign in to complete this purchase.');
            return;
        }
        if (amount <= 0) {
            showError('This post does not have a price set.');
            return;
        }

        setLoading(true);
        try {
            const data = await createPaymentIntent(
                post._id,
                sellerId,
                post.title || 'Marketplace item',
                amount
            );

            success('Purchase started. Complete payment to release the escrow.');
            onPurchase?.(data);
            onClose?.();
        } catch (err) {
            showError(
                err?.response?.message ||
                err?.response?.data?.message ||
                err?.response?.data?.msg ||
                'Payment could not be started. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            isOpen
            onClose={() => onClose?.()}
            title="Complete purchase"
            description={post?.title}
            size="sm"
        >
            <div className="space-y-5">
                <div className="flex items-center justify-between rounded-xl border border-card-border bg-background-secondary px-4 py-3">
                    <span className="text-sm text-foreground-muted">Total</span>
                    <span className="text-lg font-semibold text-foreground">
                        {amount > 0 ? `${currencySymbol}${amount.toLocaleString()}` : '—'}
                    </span>
                </div>

                <p className="text-xs text-foreground-muted">
                    Funds are held securely in escrow and released to the seller once you confirm delivery.
                </p>

                <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" size="sm" onClick={() => onClose?.()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handlePurchase}
                        loading={loading}
                        disabled={amount <= 0 || !isAuthenticated}
                    >
                        {amount > 0 ? `Pay ${currencySymbol}${amount.toLocaleString()}` : 'Unavailable'}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
};

export default CheckoutModal;
