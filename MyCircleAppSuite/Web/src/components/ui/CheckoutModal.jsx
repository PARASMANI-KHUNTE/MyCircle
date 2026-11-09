import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import Dialog from './Dialog';
import { useToast } from './Toast';
import { useAuth } from '../../context/AuthContext';
import { useCurrencySymbol } from '../../context/CurrencySymbolContext';
import { createPaymentIntent, getWallet, topupWallet } from '../../utils/api';
import { ShieldCheck, Wallet, ArrowRight, CheckCircle2, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';

const CheckoutModal = ({
    post,
    onClose,
    onPurchase,
}) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { currencySymbol } = useCurrencySymbol();
    const { success, error: showError } = useToast();

    const [loading, setLoading] = useState(false);
    const [fetchingWallet, setFetchingWallet] = useState(true);
    const [wallet, setWallet] = useState({ balance: 0, pendingBalance: 0 });
    const [amount, setAmount] = useState(() => post?.price || post?.budgetMax || 0);
    const [completedEscrow, setCompletedEscrow] = useState(null);

    const loadWallet = useCallback(async () => {
        try {
            setFetchingWallet(true);
            const data = await getWallet();
            setWallet(data);
        } catch {
            setWallet({ balance: 0, pendingBalance: 0 });
        } finally {
            setFetchingWallet(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            void loadWallet();
        }
    }, [isAuthenticated, loadWallet]);

    useEffect(() => {
        if (post?.price && post.price > 0) {
            setAmount(post.price);
        } else if (post?.budgetMax) {
            setAmount(post.budgetMax);
        }
    }, [post]);

    if (!isAuthenticated || !post) {
        return null;
    }

    const itemTitle = post.title || post.itemTitle || 'Marketplace Item';
    const seller = post.user || {};
    const sellerName = seller.displayName || 'Community Member';
    const hasSufficientBalance = (wallet?.balance || 0) >= amount;
    const shortfall = Math.max(0, amount - (wallet?.balance || 0));

    const handleConfirmPurchase = async () => {
        setLoading(true);
        try {
            // If shortfall exists, top up wallet with difference first
            if (!hasSufficientBalance && shortfall > 0) {
                await topupWallet(shortfall);
            }

            const sellerId = seller._id || seller.id || post.userId;
            const data = await createPaymentIntent(
                post._id,
                sellerId,
                itemTitle,
                amount,
                'INR'
            );

            setCompletedEscrow(data);
            success('Payment secured in Escrow! Seller has been notified.');
            onPurchase?.(data);
        } catch (err) {
            console.error('Checkout failed:', err);
            const msg = err.response?.data?.message || err.response?.data?.msg || 'Checkout failed. Please try again.';
            showError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            isOpen={true}
            onClose={() => onClose?.()}
            title={completedEscrow ? 'Order Secured in Escrow' : 'Buy with Escrow Protection'}
            description={
                completedEscrow
                    ? 'Your payment is safely held until you confirm delivery'
                    : `Purchasing "${itemTitle}" from ${sellerName}`
            }
            size="md"
        >
            {completedEscrow ? (
                /* Post-purchase confirmation state */
                <div className="space-y-5 p-2">
                    <div className="rounded-2xl border border-success/20 bg-success/10 p-5 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <h2 className="text-base font-bold text-foreground">Funds Held in Escrow</h2>
                        <p className="mt-1 text-xs text-foreground-muted">
                            Order ID: <span className="font-mono text-foreground font-semibold">{completedEscrow.orderId || completedEscrow.escrowId}</span>
                        </p>
                        <p className="mt-2 text-sm font-semibold text-primary">
                            Amount: {currencySymbol}{amount}
                        </p>
                    </div>

                    <div className="rounded-xl border border-card-border bg-card p-4 space-y-2.5 text-xs text-foreground-muted">
                        <p className="font-semibold text-foreground text-sm">What happens next?</p>
                        <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">1</span>
                            <span>Message <strong>{sellerName}</strong> to coordinate meetup, pickup, or delivery.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">2</span>
                            <span>Inspect the item or service to make sure it matches your expectations.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">3</span>
                            <span>Release payment from your <strong>Wallet & Orders</strong> page once satisfied.</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                        <Button
                            variant="primary"
                            className="flex-1 justify-center gap-2"
                            onClick={() => {
                                onClose?.();
                                navigate('/chat');
                            }}
                        >
                            <MessageCircle className="h-4 w-4" />
                            Chat with Seller
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 justify-center gap-2"
                            onClick={() => {
                                onClose?.();
                                navigate('/wallet');
                            }}
                        >
                            <Wallet className="h-4 w-4" />
                            View in Wallet
                        </Button>
                    </div>
                </div>
            ) : (
                /* Checkout form */
                <div className="space-y-4 p-1">
                    {/* Protection Explainer */}
                    <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs">
                        <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                        <div>
                            <p className="font-semibold text-foreground text-sm">MyCircle Escrow Guarantee</p>
                            <p className="text-foreground-muted mt-0.5 leading-relaxed">
                                Your money is held in escrow and NOT sent directly to the seller. Funds are released only after you confirm that the item or service has been delivered satisfactorily.
                            </p>
                        </div>
                    </div>

                    {/* Order Breakdown */}
                    <div className="rounded-xl border border-card-border bg-card p-4 space-y-2.5 text-sm">
                        <div className="flex justify-between items-center text-foreground-muted">
                            <span>Item</span>
                            <span className="font-semibold text-foreground truncate max-w-[200px]">{itemTitle}</span>
                        </div>
                        <div className="flex justify-between items-center text-foreground-muted">
                            <span>Seller</span>
                            <span className="font-medium text-foreground">{sellerName}</span>
                        </div>
                        <div className="border-t border-card-border pt-2 flex justify-between items-center">
                            <span className="font-semibold text-foreground">Total Price</span>
                            <span className="text-lg font-bold text-primary">{currencySymbol}{amount}</span>
                        </div>
                    </div>

                    {/* Wallet Balance Card */}
                    <div className="rounded-xl border border-card-border bg-background/50 p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-foreground-muted flex items-center gap-1.5">
                                <Wallet className="h-3.5 w-3.5 text-primary" />
                                Your Wallet Balance
                            </span>
                            {fetchingWallet ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-foreground-muted" />
                            ) : (
                                <span className="font-bold text-foreground text-sm">
                                    {currencySymbol}{wallet?.balance || 0}
                                </span>
                            )}
                        </div>

                        {!fetchingWallet && (
                            hasSufficientBalance ? (
                                <div className="flex items-center gap-1.5 text-xs text-success pt-1">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                    <span>Sufficient balance. Funds will be reserved into Escrow.</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-xs text-warning pt-1">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>
                                        Shortfall of <strong>{currencySymbol}{shortfall}</strong>. Click below to Top-Up &amp; Pay in one step.
                                    </span>
                                </div>
                            )
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-card-border">
                        <button
                            type="button"
                            onClick={() => onClose?.()}
                            className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <Button
                            variant="primary"
                            disabled={loading || fetchingWallet || !amount || amount <= 0}
                            onClick={handleConfirmPurchase}
                            className="gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    <span>Securing Funds...</span>
                                </>
                            ) : hasSufficientBalance ? (
                                <>
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Confirm &amp; Lock {currencySymbol}{amount} in Escrow</span>
                                </>
                            ) : (
                                <>
                                    <span>Top Up {currencySymbol}{shortfall} &amp; Lock in Escrow</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </Dialog>
    );
};

export default CheckoutModal;
