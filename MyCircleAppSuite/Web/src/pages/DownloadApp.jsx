import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import {
    Download,
    Smartphone,
    ShieldCheck,
    Zap,
    CheckCircle2,
    ArrowLeft,
    FileText,
    ExternalLink
} from 'lucide-react';

const LOCAL_APK_URL = '/mycircle.apk';
const GITHUB_APK_URL = 'https://github.com/PARASMANI-KHUNTE/MyCircle/releases/download/v1.0.0/mycircle.apk';
const RELEASES_PAGE_URL = 'https://github.com/PARASMANI-KHUNTE/MyCircle/releases/tag/v1.0.0';

const DownloadApp = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
                {/* Header */}
                <header className="flex items-center justify-between py-4 border-b border-card-border mb-8">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/welcome')}>
                        <img
                            src="/logo.png"
                            alt="MyCircle"
                            className="w-9 h-9 rounded-xl object-contain shadow-md"
                        />
                        <div>
                            <span className="text-xl font-bold tracking-tight">
                                MyCircle<span className="text-primary">.</span>
                            </span>
                            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Mobile App
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/welcome')} className="gap-1.5">
                            <ArrowLeft className="w-4 h-4" />
                            <span>Home</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                            Sign In
                        </Button>
                    </div>
                </header>

                {/* Hero / Download Card */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
                    <div className="lg:col-span-7 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Official Android Release (v1.0.0)</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                            Experience MyCircle on your <span className="gradient-text">Android device</span>
                        </h1>
                        <p className="text-foreground-secondary text-base sm:text-lg leading-relaxed">
                            Stay connected on the go. Chat in real-time with verified local neighbors, post requests, and get instant push notifications right in your pocket.
                        </p>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
                            <a
                                href={LOCAL_APK_URL}
                                download="MyCircle.apk"
                                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-base cursor-pointer"
                            >
                                <Download className="w-5 h-5" />
                                <span>Download APK (Direct)</span>
                            </a>
                            <a
                                href={GITHUB_APK_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-card-border bg-card hover:bg-card-hover font-semibold transition-all text-sm cursor-pointer"
                            >
                                <ExternalLink className="w-4 h-4 text-primary" />
                                <span>GitHub Mirror</span>
                            </a>
                            <a
                                href={RELEASES_PAGE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-card-border bg-card/60 hover:bg-card-hover font-medium transition-all text-sm cursor-pointer"
                            >
                                <span>Release v1.0.0</span>
                            </a>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => navigate('/explore')}
                                className="w-full sm:w-auto"
                            >
                                Use Web Version
                            </Button>
                        </div>

                        {/* Package Info Pills */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-foreground-muted">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card-border bg-card">
                                <Smartphone className="w-3.5 h-3.5 text-primary" />
                                Android 8.0+ (API 26+)
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card-border bg-card">
                                <FileText className="w-3.5 h-3.5 text-secondary" />
                                ~75 MB (Release APK)
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card-border bg-card">
                                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                                Verified & Signed
                            </span>
                        </div>
                    </div>

                    {/* App Showcase Card */}
                    <div className="lg:col-span-5">
                        <div className="modern-card p-6 border border-card-border bg-gradient-to-b from-card to-card-soft shadow-xl">
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-card-border">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                                    M
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">MyCircle Mobile</h3>
                                    <p className="text-xs text-foreground-muted">Package: com.mycirclemobilebare</p>
                                    <p className="text-xs text-accent font-medium mt-0.5">Ready for Sideloading</p>
                                </div>
                            </div>

                            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-4">
                                Included Capabilities
                            </h4>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>Instant Google OAuth 2.0 Mobile Sign-In</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>Location-aware local community explore feed</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>Real-time WebSocket chat and typing indicators</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>Over-the-Air (OTA) updates support</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Installation Guide */}
                <section className="mb-12 border-t border-card-border pt-10">
                    <div className="text-center max-w-xl mx-auto mb-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-2">How to Install the APK</h2>
                        <p className="text-sm text-foreground-secondary">
                            Follow these 3 quick steps to install MyCircle directly on your phone.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="modern-card p-5 border border-card-border">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-4">
                                1
                            </div>
                            <h3 className="font-semibold text-base mb-1.5">Download APK</h3>
                            <p className="text-xs text-foreground-muted leading-relaxed">
                                Tap the <strong>Download APK</strong> button above to download the verified <code className="text-primary font-medium">mycircle.apk</code> directly to your device.
                            </p>
                        </div>

                        <div className="modern-card p-5 border border-card-border">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-lg mb-4">
                                2
                            </div>
                            <h3 className="font-semibold text-base mb-1.5">Allow Install</h3>
                            <p className="text-xs text-foreground-muted leading-relaxed">
                                If prompted with <em>"File might be harmful"</em> or <em>"Install unknown apps"</em>, open Settings and enable <strong>Allow from this source</strong>.
                            </p>
                        </div>

                        <div className="modern-card p-5 border border-card-border">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-lg mb-4">
                                3
                            </div>
                            <h3 className="font-semibold text-base mb-1.5">Open & Enjoy</h3>
                            <p className="text-xs text-foreground-muted leading-relaxed">
                                Tap the downloaded APK to install. Once installed, tap <strong>Open</strong> to launch MyCircle and sign in!
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-auto border-t border-card-border pt-6 text-center text-xs text-foreground-muted">
                    <p>© 2026 MyCircle. High-performance community platform.</p>
                </footer>
            </main>
        </div>
    );
};

export default DownloadApp;
