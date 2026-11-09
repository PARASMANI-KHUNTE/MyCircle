import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import Dialog from './Dialog';
import { useToast } from './Toast';
import { useAuth } from '../../context/AuthContext';
import { useCurrencySymbol } from '../../context/CurrencySymbolContext';
import { 
    createPaymentIntent, 
    getWallet, 
    createRazorpayOrder, 
    verifyRazorpayPayment 
} from '../../utils/api';
import { 
    ShieldCheck, 
    Wallet, 
    ArrowRight, 
    CheckCircle2, 
    MessageCircle, 
    AlertCircle, 
    RefreshCw, 
    CreditCard,
    Smartphone,
    Zap
} from 'lucide-react';
import { cn } from '../../utils/cn';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const CheckoutModal = ({
    post,
    onClose,
    onPurchase,
}) => {
    const navigate = useNavigate();
    const { isAuthenticated, user: currentUser } = useAuth();
    const { currencySymbol } = useCurrencySymbol();
    const { success, error: showError } = useToast();

    const [loading, setLoading] = useState(false);
    const [fetchingWallet, setFetchingWallet] = useState(true);
    const [wallet, setWallet] = useState({ balance: 0, pendingBalance: 0 });
    const [amount, setAmount] = useState(() => post?.price || post?.budgetMax || 0);
    const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'wallet'
    const [paymentTiming, setPaymentTiming] = useState(() => post?.paymentTiming || 'escrow');
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
        if (post?.paymentTiming && post.paymentTiming !== 'flexible') {
            setPaymentTiming(post.paymentTiming);
        }
    }, [post]);

    if (!isAuthenticated || !post) {
        return null;
    }

    const itemTitle = post.title || post.itemTitle || 'Marketplace Item';
    const seller = post.user || {};
    const sellerName = seller.displayName || 'Community Member';
    const sellerId = seller._id || seller.id || post.userId;
    const hasSufficientBalance = (wallet?.balance || 0) >= amount;
    const isAdvance = paymentTiming === 'advance';

    // Handle Razorpay Payment flow
    const handleRazorpayPay = async () => {
        setLoading(true);
        try {
            // 1. Create order on server
            const orderRes = await createRazorpayOrder({
                postId: post._id,
                amount,
                paymentTiming,
                recipientId: sellerId,
            });

            if (!orderRes || !orderRes.orderId) {
                throw new Error('Failed to create Razorpay payment order');
            }

            // 2. Load script if needed
            const scriptLoaded = await loadRazorpayScript();

            // If real Razorpay key is configured and script is available
            if (scriptLoaded && window.Razorpay && !orderRes.isMock) {
                const options = {
                    key: orderRes.keyId,
                    amount: orderRes.amount,
                    currency: orderRes.currency || 'INR',
                    name: 'MyCircle Community Marketplace',
                    description: `${isAdvance ? 'Advance Payment' : 'Escrow Hold'}: ${itemTitle}`,
                    order_id: orderRes.orderId,
                    prefill: {
                        name: currentUser?.displayName || '',
                        email: currentUser?.email || '',
                    },
                    theme: {
                        color: '#6366f1',
                    },
                    handler: async (response) => {
                        try {
                            const verifyRes = await verifyRazorpayPayment({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                postId: post._id,
                                amount,
                                paymentTiming,
                                recipientId: sellerId,
                            });
                            setCompletedEscrow(verifyRes);
                            success(verifyRes.message || 'Payment completed successfully!');
                            onPurchase?.(verifyRes);
                        } catch (err) {
                            showError(err.response?.data?.msg || err.message || 'Payment verification failed');
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            setLoading(false);
                        },
                    },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
                return;
            }

            // 3. Fallback / Dev Simulator (handles sandbox mode or mock orders seamlessly)
            const mockPaymentId = `pay_mock_${Date.now()}`;
            const mockSig = `mock_sig_${orderRes.orderId}_${mockPaymentId}`;

            const verifyRes = await verifyRazorpayPayment({
                orderId: orderRes.orderId,
                paymentId: mockPaymentId,
                signature: mockSig,
                postId: post._id,
                amount,
                paymentTiming,
                recipientId: sellerId,
            });

            setCompletedEscrow(verifyRes);
            success(verifyRes.message || 'Payment completed successfully!');
            onPurchase?.(verifyRes);
        } catch (err) {
            console.error('Razorpay payment failed:', err);
            const msg = err.response?.data?.message || err.response?.data?.msg || err.message || 'Payment processing failed';
            showError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Handle Wallet balance purchase
    const handleWalletPay = async () => {
        setLoading(true);
        try {
            const data = await createPaymentIntent(
                post._id,
                sellerId,
                itemTitle,
                amount,
                'INR'
            );

            setCompletedEscrow(data);
            success('Payment secured in Escrow from your Wallet balance!');
            onPurchase?.(data);
        } catch (err) {
            console.error('Wallet payment failed:', err);
            const msg = err.response?.data?.message || err.response?.data?.msg || err.message || 'Wallet payment failed';
            showError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPurchase = () => {
        if (paymentMethod === 'razorpay') {
            return handleRazorpayPay();
        }
        return handleWalletPay();
    };

    return (
        <Dialog
            isOpen={true}
            onClose={() => onClose?.()}
            title={
                completedEscrow 
                    ? (isAdvance ? 'Payment Transferred' : 'Order Secured in Escrow') 
                    : (isAdvance ? 'Pay Advance to Seller' : 'Buy with Escrow Protection')
            }
            description={
                completedEscrow
                    ? (isAdvance ? `Payment sent directly to ${sellerName}` : 'Your payment is safely held until you confirm delivery')
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
                        <h2 className="text-base font-bold text-foreground">
                            {isAdvance ? 'Advance Payment Complete' : 'Funds Safely Held in Escrow'}
                        </h2>
                        <p className="mt-1 text-xs text-foreground-muted">
                            Order ID: <span className="font-mono text-foreground font-semibold">{completedEscrow.orderId || completedEscrow.escrowId || 'COMPLETED'}</span>
                        </p>
                        <p className="mt-2 text-sm font-semibold text-primary">
                            Amount: {currencySymbol}{amount}
                        </p>
                    </div>

                    <div className="rounded-xl border border-card-border bg-card p-4 space-y-2.5 text-xs text-foreground-muted">
                        <p className="font-semibold text-foreground text-sm">Next Steps</p>
                        <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">1</span>
                            <span>Message <strong>{sellerName}</strong> in chat to coordinate handover, pickup, or service.</span>
                        </div>
                        {!isAdvance && (
                            <>
                                <div className="flex items-start gap-2.5">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">2</span>
                                    <span>Inspect the item or service to make sure it matches your agreement.</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">3</span>
                                    <span>Release payment to the seller from your <strong>Wallet &amp; Orders</strong> page once satisfied.</span>
                                </div>
                            </>
                        )}
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
                            View in Wallet &amp; Orders
                        </Button>
                    </div>
                </div>
            ) : (
                /* Checkout form */
                <div className="space-y-4 p-1">
                    {/* Protection Explainer */}
                    <div className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 text-xs",
                        isAdvance 
                            ? "border-warning/30 bg-warning/5"
                            : "border-primary/20 bg-primary/5"
                    )}>
                        {isAdvance ? (
                            <Zap className="h-5 w-5 shrink-0 text-warning mt-0.5" />
                        ) : (
                            <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                        )}
                        <div>
                            <p className="font-semibold text-foreground text-sm">
                                {isAdvance ? 'Advance Payment' : 'MyCircle Escrow Protection'}
                            </p>
                            <p className="text-foreground-muted mt-0.5 leading-relaxed">
                                {isAdvance
                                    ? 'Funds will be transferred directly to the seller upon checkout. Best for booking deposits or services requiring upfront materials.'
                                    : 'Your payment is safely held in escrow and NOT released until you receive and inspect the item or service.'}
                            </p>
                        </div>
                    </div>

                    {/* Order Breakdown */}
                    <div className="rounded-xl border border-card-border bg-card p-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center text-foreground-muted">
                            <span>Item / Listing</span>
                            <span className="font-semibold text-foreground truncate max-w-[200px]">{itemTitle}</span>
                        </div>
                        <div className="flex justify-between items-center text-foreground-muted">
                            <span>Seller</span>
                            <span className="font-medium text-foreground">{sellerName}</span>
                        </div>

                        {/* Flexible Timing Toggle if listing allows flexible */}
                        {post?.paymentTiming === 'flexible' && (
                            <div className="border-t border-card-border pt-2">
                                <label className="text-xs font-medium text-foreground-muted block mb-1.5">Payment Timing</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentTiming('escrow')}
                                        className={cn(
                                            'p-2 rounded-lg border text-left text-xs transition-all',
                                            paymentTiming === 'escrow'
                                                ? 'border-primary bg-primary/10 text-foreground font-semibold'
                                                : 'border-border text-foreground-muted hover:border-primary/40'
                                        )}
                                    >
                                        🛡️ Escrow Hold
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentTiming('advance')}
                                        className={cn(
                                            'p-2 rounded-lg border text-left text-xs transition-all',
                                            paymentTiming === 'advance'
                                                ? 'border-primary bg-primary/10 text-foreground font-semibold'
                                                : 'border-border text-foreground-muted hover:border-primary/40'
                                        )}
                                    >
                                        ⚡ Direct Advance
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-card-border pt-2 flex justify-between items-center">
                            <span className="font-semibold text-foreground">Total Price</span>
                            <span className="text-lg font-bold text-primary">{currencySymbol}{amount}</span>
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Choose Payment Method</label>
                        
                        {/* Razorpay Option */}
                        <div
                            onClick={() => setPaymentMethod('razorpay')}
                            className={cn(
                                "rounded-xl border p-3.5 cursor-pointer transition-all flex items-center justify-between",
                                paymentMethod === 'razorpay'
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-card-border bg-card hover:border-primary/40"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Smartphone className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        UPI / NetBanking / Cards
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                            Razorpay
                                        </span>
                                    </p>
                                    <p className="text-xs text-foreground-muted mt-0.5">
                                        Google Pay, PhonePe, Paytm, BHIM QR, 50+ Banks &amp; Cards
                                    </p>
                                </div>
                            </div>
                            <input
                                type="radio"
                                name="paymentMethod"
                                checked={paymentMethod === 'razorpay'}
                                onChange={() => setPaymentMethod('razorpay')}
                                className="h-4 w-4 text-primary"
                            />
                        </div>

                        {/* MyCircle Wallet Option */}
                        <div
                            onClick={() => hasSufficientBalance && setPaymentMethod('wallet')}
                            className={cn(
                                "rounded-xl border p-3.5 transition-all flex items-center justify-between",
                                !hasSufficientBalance ? "opacity-60 cursor-not-allowed border-card-border bg-card" : "cursor-pointer",
                                paymentMethod === 'wallet' && hasSufficientBalance
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-card-border bg-card hover:border-primary/40"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-background-secondary text-foreground">
                                    <Wallet className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        MyCircle Wallet Balance
                                    </p>
                                    <p className="text-xs text-foreground-muted mt-0.5">
                                        Available: <strong className="text-foreground">{currencySymbol}{wallet?.balance || 0}</strong>
                                        {!hasSufficientBalance && ` (Need ${currencySymbol}${amount - (wallet?.balance || 0)} more)`}
                                    </p>
                                </div>
                            </div>
                            <input
                                type="radio"
                                name="paymentMethod"
                                checked={paymentMethod === 'wallet'}
                                disabled={!hasSufficientBalance}
                                onChange={() => hasSufficientBalance && setPaymentMethod('wallet')}
                                className="h-4 w-4 text-primary"
                            />
                        </div>
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
                                    <span>Processing...</span>
                                </>
                            ) : paymentMethod === 'razorpay' ? (
                                <>
                                    <CreditCard className="h-4 w-4" />
                                    <span>Pay {currencySymbol}{amount} with Razorpay</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Pay {currencySymbol}{amount} from Wallet</span>
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
