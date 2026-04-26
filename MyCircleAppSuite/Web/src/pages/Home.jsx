import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { 
    CheckCircle2, 
    MessageCircle, 
    Shield, 
    Zap,
    ArrowRight
} from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
                {/* Header - consistent height */}
                <header className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">MyCircle</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                        Sign in
                    </Button>
                </header>

                {/* Session expired alert */}
                {isExpired && (
                    <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning animate-fade-in">
                        Session expired. Please sign in again to continue.
                    </div>
                )}

                {/* Hero section with improved hierarchy */}
                <section className="grid flex-1 grid-cols-1 items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
                    <div className="max-w-xl space-y-5">
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
                            Local marketplace
                        </p>
                        <h2 className="text-3xl/tight font-extrabold tracking-tight sm:text-4xl/tight lg:text-5xl/tight">
                            Find trusted local{' '}
                            <span className="gradient-text">help</span>{' '}
                            in minutes.
                        </h2>
                        <p className="text-base/tight text-foreground-secondary sm:text-lg/tight">
                            Browse nearby posts for jobs, services, and items. Sign in when you want to contact, chat, or manage requests.
                        </p>

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                            <Button 
                                size="lg" 
                                onClick={() => navigate('/login')} 
                                className="group w-full sm:w-auto"
                            >
                                <span>Get Started</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg" 
                                onClick={() => navigate('/explore')} 
                                className="w-full sm:w-auto"
                            >
                                Browse Posts
                            </Button>
                        </div>
                    </div>

                    {/* Enhanced features card */}
                    <aside className="modern-card p-5 sm:p-6">
                        <h3 className="mb-4 text-lg font-bold">How it works</h3>
                        <ol className="space-y-3">
                            <li className="flex gap-3 rounded-lg border border-card-border bg-card/50 p-3.5">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <span className="text-xs font-bold">1</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Explore local posts</p>
                                    <p className="text-xs text-foreground-muted mt-0.5">View opportunities near you without signing in.</p>
                                </div>
                            </li>
                            <li className="flex gap-3 rounded-lg border border-card-border bg-card/50 p-3.5">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <span className="text-xs font-bold">2</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Sign in to interact</p>
                                    <p className="text-xs text-foreground-muted mt-0.5">Like, comment, request contact and start chats.</p>
                                </div>
                            </li>
                            <li className="flex gap-3 rounded-lg border border-card-border bg-card/50 p-3.5">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <span className="text-xs font-bold">3</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Complete work safely</p>
                                    <p className="text-xs text-foreground-muted mt-0.5">Use approval flow to connect confidently.</p>
                                </div>
                            </li>
                        </ol>
                    </aside>
                </section>

                {/* Value propositions - cleaner grid */}
                <section className="mt-10 grid gap-3 border-t border-card-border pt-6 sm:mt-12 sm:grid-cols-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 rounded-lg border border-card-border bg-card px-4 py-3">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium">Verified profiles</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg border border-card-border bg-card px-4 py-3">
                        <MessageCircle className="w-4 h-4 text-secondary" />
                        <span className="text-xs font-medium">Request-first chat</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg border border-card-border bg-card px-4 py-3">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="text-xs font-medium">Clear notifications</span>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;