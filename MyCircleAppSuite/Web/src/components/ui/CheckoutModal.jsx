import React, { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import Button from './Button';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import { createPaymentIntent } from '../../utils/api';

const CheckoutModal = ({
    post,
    onClose,
    onPurchase,
}) => {
    const { user, isAuthenticated } = useAuth();
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(null);

    // Determine the price from the post
    const determineAmount = useCallback(() => {
        if (post.price && post.price > 0) {
            setAmount(post.price);
        } else if (post.budgetMin && post.budgetMax) {
            setAmount(post.budgetMax); // Use max budget
        } else {
            setAmount(0);
        }
    }, [post]);

    if (!isAuthenticated) {
        return onClose ? () => onClose() : null;
    }

    if (!amount || amount <= 0) {
        return null;
    }

    const handlePurchase = async () => {
        setLoading(true);
        try {
            const sellerId = post.user?._id || post.user?.id;
            const { clientSecret, orderId, amount: paidAmount, platformFee, sellerAmount } = await createPaymentIntent(
                post._id,
                sellerId,
                post.title || itemTitle || 'Post',
                amount
            );

            // In a real Stripe integration, we'd use Stripe.confirmPayment()
            // For now, simulate successful payment
            setLoading(false);

            // Mark order as confirmed via the delivery confirmation endpoint
            // This would normally happen after actual payment completion
            onPurchase?.(orderId, clientSecret, paidAmount, platformFee, sellerAmount);

            success('Payment successful! Thank you for your purchase.');
            onClose?.();
        } catch (err) {
            console.error('Payment failed:', err);
            showError(err.response?.data?.msg || 'Payment failed. Please try again.');
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Dialog
            isOpen={true}
            onClose={() => onClose?.()}
            title="Complete Purchase"
            description={amount > 0 ? `Pay $${amount} for this post` : 'Enter amount'}
            size="md"
            actions={(
                <div className="flex items-center justify-end gap-3">
                    {loading ? (
                        <Button variant="primary" size="sm" disabled>
                            <span className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                        </Button>
                    ) : (
                        <Button variant="primary" size="sm" onClick={handlePurchase}>
                            <span className="w-4 h-4 mr-2" />
                            Pay ${
                                amount > 999 ? (amount / 100).toLocaleString() : amount
                            }
                        </Button>
                    )}
                    <button onClick={() => onClose?.()} className="text-foreground-muted hover:text-foreground">
                        Cancel
                    </button>
                </div>
            )}
        >
            {/* Payment details */}
            {amount > 0 && (
                <div className="p-4 text-sm text-foreground-muted">
                    <p className="font-medium">Total: ${amount > 999 ? (amount / 100).toLocaleString() : amount}</p>
                    <p className="text-xs opacity-80">Platform fee will be automatically applied</p>
                </div>
            )}
        </Dialog>
    );
};

export default CheckoutModal;