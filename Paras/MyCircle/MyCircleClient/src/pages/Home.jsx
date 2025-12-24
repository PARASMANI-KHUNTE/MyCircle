import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    ArrowRight, Shield, Globe, Zap, Smartphone, ChevronRight,
    Briefcase, ShoppingBag, Truck, Repeat, Star,
    MessageSquare, Lock, Eye, Brain
} from 'lucide-react';

const AppleLogo = () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.48-.93 3.96-.84 1.57.09 2.77.63 3.53 1.74-.03.04-2.12 1.25-2.09 3.69.04 2.92 2.58 3.89 2.62 3.91-.04.14-.41 1.4-1.35 2.76-.85 1.22-1.74 2.43-2.75 2.43-.98 0-1.3-.61-1.95-.61s-1 .61-1.99.61c-.95.03-1.72-.94-2.43-1.96-1-1.54-1.85-4.22.68-6.4 1.25-1.07 3.49-1.18 4.6-.26.23-1.42-.03-2.61-.7-3.79-.88-1.57-2.31-2.19-3.41-2.27v-.03c-.22.02-.42.06-.61.12zM12.03 7.25c-.23-1.61.64-3.08 1.46-3.99.93-1.02 2.49-1.49 3.94-1.28.2 1.55-.42 3.14-1.43 4.21-1 1.05-2.64 1.6-3.97 1.06z" />
    </svg>
);

const GooglePlayLogo = () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M5 3.5L5 20.5 14.5 12 5 3.5zM6 2L20 10.5 6 19 6 2z m.5 2.2l 10.6 6.3 -1.8 1.3 -8.8 -7.6z m-0.5 12.6l 8.8 -7.6 1.8 1.3 -10.6 6.3z m11.1 -6.8l 3.7 2.2 -3.7 2.2 -1.4 -0.8 -1.4 -1.4 2.8 -2.2z" />
    </svg>
);

const FeatureCard = ({ icon: Icon, title, description, color = "bg-slate-100" }) => (
    <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 text-slate-900`}>
            <Icon size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm">
            {description}
        </p>
    </div>
);

const StepCard = ({ number, title, description }) => (
    <div className="relative pl-8 md:pl-0">
        <div className="md:hidden absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200"></div>
        <div className="flex flex-col md:items-center text-left md:text-center relative">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg mb-6 shadow-xl shadow-black/20 z-10 relative">
                {number}
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
            <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
                {description}
            </p>
        </div>
    </div>
);

const CategoryPill = ({ label, icon: Icon }) => (
    <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-black/10 hover:shadow-md transition-all cursor-pointer group">
        <Icon size={20} className="text-slate-400 group-hover:text-black transition-colors" />
        <span className="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
    </div>
);

const Home = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-black selection:text-white overflow-hidden">
            {/* --- Navbar --- */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                            <span className="text-xl">M</span>
                        </div>
                        MyCircle.
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.href = 'http://localhost:5000/auth/google'}
                            className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-black/20"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 px-6 overflow-hidden">
                {/* Abstract Background Blobs */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 -z-10" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 -z-10" />

                <div className="container mx-auto max-w-5xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Alpha v0.5 Live
                        </span>

                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.95] mb-8 text-slate-900">
                            Your neighborhood, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-200">unlocked.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
                            The unified marketplace for jobs, services, selling, and renting.
                            Connect with verified neighbors in a circle you can trust.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/feed')}
                                className="h-14 px-8 rounded-full bg-black text-white hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 w-full sm:w-auto justify-center shadow-xl shadow-black/20"
                            >
                                <span className="text-sm font-bold">Explore Content</span>
                                <ArrowRight size={20} />
                            </button>
                            <a
                                href="/mycircle.apk"
                                download
                                className="h-14 px-8 rounded-full bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-3 w-full sm:w-auto justify-center shadow-sm"
                            >
                                <Smartphone size={20} />
                                <span className="text-sm font-bold">Download App</span>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- Unified Ecosystem (Categories) --- */}
            <section className="py-20 border-y border-slate-50 bg-slate-50/50">
                <div className="container mx-auto px-6">
                    <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">One Platform. Any Exchange.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <CategoryPill label="Local Jobs" icon={Briefcase} />
                        <CategoryPill label="Services" icon={Zap} />
                        <CategoryPill label="Sell Items" icon={ShoppingBag} />
                        <CategoryPill label="Rentals" icon={Truck} />
                        <CategoryPill label="Barter" icon={Repeat} />
                    </div>
                </div>
            </section>

            {/* --- How It Works --- */}
            <section className="py-32 px-6 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Simple. Safe. Local.</h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            We've stripped away the complexity of global platforms to focus on what matters: your community.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-200 via-slate-200 to-slate-200" />

                        <StepCard
                            number="1"
                            title="Discover"
                            description="Browse a real-time feed of opportunities and items right on your block."
                        />
                        <StepCard
                            number="2"
                            title="Connect"
                            description="Use our smart chat to negotiate. Phone numbers are hidden until you approve."
                        />
                        <StepCard
                            number="3"
                            title="Exchange"
                            description="Meet centrally or arrange pickup. Build reputation with every successful exchange."
                        />
                    </div>
                </div>
            </section>

            {/* --- Feature Deep Dive --- */}
            <section className="py-32 bg-slate-900 text-white rounded-[3rem] mx-4 lg:mx-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="container mx-auto px-6 max-w-6xl relative z-10">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <span className="text-emerald-400 font-bold tracking-widest uppercase text-xs mb-4 block">Intelligent Platform</span>
                            <h2 className="text-5xl font-bold tracking-tighter mb-8 leading-tight">
                                Built with AI,<br />
                                <span className="text-slate-400">Centered on Trust.</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                                MyCircle isn't just a noticeboard. It's a smart system acting as a moderator, concierge, and safety agent all at once.
                            </p>

                            <ul className="space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="p-2 bg-slate-800 rounded-lg text-emerald-400"><Brain size={24} /></div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">AI-Powered Moderation</h4>
                                        <p className="text-slate-400 text-sm">Gemini AI scans every post for safety, ensuring a scam-free environment.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-2 bg-slate-800 rounded-lg text-purple-400"><MessageSquare size={24} /></div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Smart Chat & Privacy</h4>
                                        <p className="text-slate-400 text-sm">Contextual replies and a secure "Request Contact" flow keep you safe.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="p-2 bg-slate-800 rounded-lg text-blue-400"><Shield size={24} /></div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Verified Identity</h4>
                                        <p className="text-slate-400 text-sm">Connect with real neighbors. No bots, no ghosts, no anonymity.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="relative">
                            <motion.div
                                style={{ y }}
                                className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl"
                            >
                                {/* Artificial UI Mockup */}
                                <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold">JD</div>
                                        <div>
                                            <div className="font-bold">John Doe</div>
                                            <div className="text-xs text-emerald-400">Verified Resident</div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-slate-700 text-xs font-bold uppercase">Selling</div>
                                </div>
                                <div className="space-y-4 mb-8">
                                    <div className="h-40 w-full bg-slate-700/50 rounded-xl animate-pulse"></div>
                                    <div className="h-6 w-3/4 bg-slate-700/50 rounded"></div>
                                    <div className="h-4 w-1/2 bg-slate-700/50 rounded"></div>
                                </div>
                                <div className="p-4 bg-emerald-900/20 border border-emerald-900/30 rounded-xl flex gap-3 items-start">
                                    <Shield size={18} className="text-emerald-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-400 mb-1">Safety Check Passed</p>
                                        <p className="text-xs text-slate-400">AI analysis confirms this post meets community guidelines.</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Footer Redesign --- */}
            <footer className="bg-white pt-32 pb-12 px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid md:grid-cols-4 gap-12 mb-24">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter mb-6">
                                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                                    <span className="text-xl">M</span>
                                </div>
                                MyCircle.
                            </div>
                            <p className="text-slate-500 text-lg max-w-xs mb-8">
                                Redefining local exchange with trust, technology, and community at the core.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><Globe size={18} /></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><MessageSquare size={18} /></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><Shield size={18} /></a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6">Platform</h4>
                            <ul className="space-y-4 text-slate-500 font-medium">
                                <li><a href="#" className="hover:text-black transition-colors">Marketplace</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Services</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Safety</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Mobile App</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6">Community</h4>
                            <ul className="space-y-4 text-slate-500 font-medium">
                                <li><a href="#" className="hover:text-black transition-colors">Guidelines</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-black transition-colors">Support</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-slate-400 text-sm font-medium">
                            &copy; 2024 MyCircle Inc. All rights reserved.
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Systems Operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;