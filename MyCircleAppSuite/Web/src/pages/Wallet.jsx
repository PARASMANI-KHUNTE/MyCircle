import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Wallet as WalletIcon, ShieldCheck, ArrowUpRight, CheckCircle2, Clock, AlertTriangle, RefreshCw, MessageCircle, CreditCard } from 'lucide-react';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { useToast } from '../components/ui/Toast';
import { useDialog } from '../hooks/useDialog';
import { useCurrencySymbol } from '../context/CurrencySymbolContext';
import { getWallet, topupWallet, getEscrowHistory, releaseEscrow, refundEscrow, getStripeConnectStatus, createStripeConnect } from '../utils/api';
import { cn } from '../utils/cn';

const TOPUP_PRESETS = [500, 1000, 2000, 5000];

const WalletPage = () => {
    const { currencySymbol } = useCurrencySymbol();
    const { success, error: showError } = useToast();
    const dialog = useDialog();

    const [wallet, setWallet] = useState({ balance: 0, pendingBalance: 0 });
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' | 'seller'
    const [escrows, setEscrows] = useState([]);
    const [loadingEscrows, setLoadingEscrows] = useState(true);

    const [topupAmount, setTopupAmount] = useState('');
    const [topupLoading, setTopupLoading] = useState(false);
    const [actionInFlight, setActionInFlight] = useState(null);
    const [connectStatus, setConnectStatus] = useState(null);
    const [connectLoading, setConnectLoading] = useState(false);

    const loadWalletData = useCallback(async () => {
        try {
            setLoadingWallet(true);
            const data = await getWallet();
            setWallet(data);
        } catch {
            showError('Could not load wallet data.');
        } finally {
            setLoadingWallet(false);
        }
    }, [showError]);

    const loadEscrows = useCallback(async (role) => {
        try {
            setLoadingEscrows(true);
            const data = await getEscrowHistory(role);
            setEscrows(Array.isArray(data) ? data : []);
        } catch {
            setEscrows([]);
        } finally {
            setLoadingEscrows(false);
        }
    }, []);

    useEffect(() => {
        void loadWalletData();
    }, [loadWalletData]);

    useEffect(() => {
        void loadEscrows(activeTab);
    }, [activeTab, loadEscrows]);

    useEffect(() => {
        let active = true;
        getStripeConnectStatus()
            .then((data) => {
                if (active) setConnectStatus(data);
            })
            .catch(() => {
                if (active) setConnectStatus(null);
            });
        return () => {
            active = false;
        };
    }, []);

    const handleTopup = async (amountToAdd) => {
        const amt = Number(amountToAdd || topupAmount);
        if (!amt || amt < 10) {
            showError('Minimum top-up amount is ₹10.');
            return;
        }

        setTopupLoading(true);
        try {
            const data = await topupWallet(amt);
            setWallet((prev) => ({
                ...prev,
                balance: data.balance !== undefined ? data.balance : prev.balance + amt,
                pendingBalance: data.pendingBalance !== undefined ? data.pendingBalance : prev.pendingBalance,
            }));
            setTopupAmount('');
            success(`₹${amt} added to your wallet successfully!`);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Top-up failed. Please try again.';
            showError(msg);
        } finally {
            setTopupLoading(false);
        }
    };

    const handleRelease = async (escrow) => {
        const confirmed = await dialog.confirm(
            `Confirm you have received "${escrow.post?.title || 'the item'}" in good condition? This will release ${currencySymbol}${escrow.amount} to the seller immediately.`,
            'Release Payment to Seller'
        );
        if (!confirmed) return;

        setActionInFlight(escrow._id);
        try {
            await releaseEscrow(escrow._id);
            success('Payment released to seller! Transaction completed.');
            void loadWalletData();
            void loadEscrows(activeTab);
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not release payment.';
            showError(msg);
        } finally {
            setActionInFlight(null);
        }
    };

    const handleRefund = async (escrow) => {
        const confirmed = await dialog.confirm(
            `Request a refund for "${escrow.post?.title || 'this order'}"? Funds of ${currencySymbol}${escrow.amount} will be returned to your wallet balance.`,
            'Cancel & Refund Escrow'
        );
        if (!confirmed) return;

        setActionInFlight(escrow._id);
        try {
            await refundEscrow(escrow._id, 'Buyer requested cancellation');
            success('Funds returned to your wallet balance.');
            void loadWalletData();
            void loadEscrows(activeTab);
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not process refund.';
            showError(msg);
        } finally {
            setActionInFlight(null);
        }
    };

    const handleConnect = async () => {
        setConnectLoading(true);
        try {
            const data = await createStripeConnect();
            if (data?.onboardingUrl) {
                window.location.href = data.onboardingUrl;
                return;
            }
            success('Payout account connected.');
            setConnectStatus({ connected: true });
        } catch (err) {
            showError(
                err.response?.data?.message ||
                err.response?.data?.msg ||
                'Stripe payouts are not configured on this server.'
            );
        } finally {
            setConnectLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Wallet &amp; Orders</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your funds, track escrow purchases, and release payments safely.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 self-start sm:self-auto">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Escrow Protected</span>
                </div>
            </div>

            {/* Wallet Summary Card */}
            <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm mb-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Available Balance */}
                    <div className="p-4 rounded-xl bg-background/50 border border-card-border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <WalletIcon className="h-4 w-4 text-primary" />
                            Available Balance
                        </span>
                        {loadingWallet ? (
                            <div className="mt-2 h-8 w-24 bg-card-hover animate-pulse rounded" />
                        ) : (
                            <p className="text-3xl font-extrabold text-foreground mt-1">
                                {currencySymbol}{wallet.balance || 0}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Ready to use for purchasing products and services.
                        </p>
                    </div>

                    {/* Escrow Pending Balance */}
                    <div className="p-4 rounded-xl bg-background/50 border border-card-border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-warning" />
                            Funds in Escrow
                        </span>
                        {loadingWallet ? (
                            <div className="mt-2 h-8 w-24 bg-card-hover animate-pulse rounded" />
                        ) : (
                            <p className="text-3xl font-extrabold text-warning mt-1">
                                {currencySymbol}{wallet.pendingBalance || 0}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Secured in active transactions until delivery confirmation.
                        </p>
                    </div>
                </div>

                {/* Quick Top-up Bar */}
                <div className="border-t border-card-border pt-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">Top Up Wallet</span>
                        <span className="text-xs text-muted-foreground">Add funds instantly for seamless checkout</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {TOPUP_PRESETS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                disabled={topupLoading}
                                onClick={() => handleTopup(preset)}
                                className="px-3.5 py-1.5 rounded-lg border border-card-border bg-background hover:bg-card-hover text-xs font-semibold transition-colors"
                            >
                                +{currencySymbol}{preset}
                            </button>
                        ))}

                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <input
                                type="number"
                                min="10"
                                placeholder="Custom amount"
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-card-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <Button
                                size="sm"
                                variant="primary"
                                disabled={topupLoading || !topupAmount}
                                onClick={() => handleTopup(topupAmount)}
                                className="shrink-0 text-xs gap-1.5"
                            >
                                {topupLoading ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                )}
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seller Payouts */}
            <div className="mb-8 rounded-2xl border border-card-border bg-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-card-border bg-background-secondary text-primary">
                            <CreditCard className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Seller payouts</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {connectStatus?.connected
                                    ? connectStatus?.details?.payoutsEnabled === false
                                        ? 'Your Stripe account is connected, but payouts are not enabled yet. Finish onboarding to receive funds.'
                                        : 'Stripe is connected. Released escrow funds can be paid out to your bank account.'
                                    : 'Connect a Stripe account to receive payouts when buyers release escrow payments.'}
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 self-start sm:self-auto">
                        {connectStatus?.connected ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Connected
                            </span>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={connectLoading}
                                onClick={handleConnect}
                                className="gap-1.5 text-xs"
                            >
                                {connectLoading ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <CreditCard className="h-3.5 w-3.5" />
                                )}
                                Connect Stripe
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Escrow Orders Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-card-border pb-3">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('buyer')}
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                                activeTab === 'buyer'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'
                            )}
                        >
                            My Purchases (Buying)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('seller')}
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                                activeTab === 'seller'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'
                            )}
                        >
                            My Sales (Selling)
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => loadEscrows(activeTab)}
                        className="icon-btn"
                        title="Refresh transactions"
                    >
                        <RefreshCw className={cn('h-4 w-4', loadingEscrows && 'animate-spin')} />
                    </button>
                </div>

                {/* Orders List */}
                {loadingEscrows ? (
                    <div className="py-12 flex justify-center">
                        <Loading text="Loading transactions..." />
                    </div>
                ) : escrows.length === 0 ? (
                    <div className="py-16 text-center rounded-2xl border border-dashed border-card-border p-8">
                        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                        <h2 className="text-base font-semibold text-foreground">
                            {activeTab === 'buyer' ? 'No purchases yet' : 'No sales yet'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            {activeTab === 'buyer'
                                ? 'When you buy items or services with Escrow protection, your orders and release controls will appear here.'
                                : 'When members purchase your listings, funds will be held in escrow until delivery is confirmed.'}
                        </p>
                        {activeTab === 'buyer' && (
                            <Link to="/" className="inline-block mt-4">
                                <Button size="sm" variant="outline">
                                    Explore Marketplace
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {escrows.map((escrow) => {
                            const post = escrow.post || {};
                            const otherUser = activeTab === 'buyer' ? escrow.seller : escrow.buyer;
                            const isPending = escrow.status === 'pending';
                            const isFunded = escrow.status === 'funded';
                            const isHeld = escrow.status === 'held';
                            const isActive = isPending || isFunded || isHeld;
                            const canRefund = activeTab === 'buyer' && (isPending || isFunded);
                            const canRelease = activeTab === 'buyer' && (isFunded || isHeld);
                            const isReleased = escrow.status === 'released';
                            const isRefunded = escrow.status === 'refunded';

                            return (
                                <article
                                    key={escrow._id}
                                    className="p-4 sm:p-5 rounded-2xl border border-card-border bg-card space-y-3 transition-colors hover:border-card-border-hover"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            {post.images && post.images.length > 0 ? (
                                                <img
                                                    src={post.images[0]}
                                                    alt={post.title}
                                                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-card-border"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl bg-background/50 flex items-center justify-center shrink-0 border border-card-border text-xs font-bold text-muted-foreground">
                                                    {post.type ? post.type[0].toUpperCase() : 'P'}
                                                </div>
                                            )}
                                            <div>
                                                <Link
                                                    to={`/post/${post._id}`}
                                                    className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                                                >
                                                    {post.title || 'Marketplace Item'}
                                                </Link>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {activeTab === 'buyer' ? 'Seller' : 'Buyer'}:{' '}
                                                    <span className="font-medium text-foreground">{otherUser?.displayName || 'Member'}</span>
                                                    {' • '}
                                                    {new Date(escrow.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                                                    Escrow #{String(escrow._id).slice(-8)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                                            <span className="text-lg font-bold text-primary">
                                                {currencySymbol}{escrow.amount}
                                            </span>

                                            {/* Status Badge */}
                                            {isActive && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
                                                    <Clock className="h-3 w-3" />
                                                    Funds in Escrow
                                                </span>
                                            )}
                                            {isReleased && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Completed
                                                </span>
                                            )}
                                            {isRefunded && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Refunded
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Bar for Active Escrows */}
                                    {isActive && (
                                        <div className="pt-3 border-t border-card-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <p className="text-xs text-muted-foreground">
                                                {activeTab === 'buyer'
                                                    ? 'Inspect the item or service. Once satisfied, click "Confirm & Release" to pay the seller.'
                                                    : 'Deliver the goods or complete the service to receive payment.'}
                                            </p>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <Link to="/chat">
                                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                        Chat
                                                    </Button>
                                                </Link>

                                                {(canRefund || canRelease) && (
                                                    <>
                                                        {canRefund && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={actionInFlight === escrow._id}
                                                                onClick={() => handleRefund(escrow)}
                                                                className="text-xs text-destructive hover:bg-destructive/10"
                                                            >
                                                                Refund
                                                            </Button>
                                                        )}
                                                        {canRelease && (
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                disabled={actionInFlight === escrow._id}
                                                                onClick={() => handleRelease(escrow)}
                                                                className="text-xs gap-1.5"
                                                            >
                                                                {actionInFlight === escrow._id ? (
                                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                )}
                                                                Confirm &amp; Release
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletPage;
