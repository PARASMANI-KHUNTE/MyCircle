import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Briefcase,
    ShoppingBag,
    Utensils,
    Wrench,
    Heart,
    Truck,
    Star,
    ShieldCheck,
    Users,
    CheckCircle2,
    Zap, // Added for Logo
    Menu,
    X,
    UserCircle // Added for Auth
} from 'lucide-react';

// --- Unified Navbar Component ---
const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Detect scroll for subtle styling changes
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Main Navbar Container - Fixed & Transparent */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-6'}`}>
                <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between relative">
                    
                    {/* 1. Left: Brand Logo */}
                    <div className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform">
                            <Zap size={20} className="fill-white" />
                        </div>
                        <span className="font-serif font-bold text-2xl text-slate-900 tracking-tight">MyCircle.</span>
                    </div>

                    {/* 2. Center: Floating Navigation Pill (Hidden on Mobile) */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <motion.div 
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/40 rounded-full p-1.5 flex items-center gap-1"
                        >
                            <NavButton text="Marketplace" />
                            <NavButton text="Services" />
                            <NavButton text="Events" />
                            
                            <div className="w-px h-6 bg-slate-200 mx-1" /> {/* Divider */}
                            
                            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2">
                                Get App
                            </button>
                        </motion.div>
                    </div>

                    {/* 3. Right: Auth / Actions */}
                    <div className="flex items-center gap-3">
                        <button className="hidden lg:flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                            <UserCircle size={18} />
                            Sign in
                        </button>
                        
                        {/* Mobile Menu Toggle */}
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-700"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
                    >
                        <div className="flex flex-col gap-4 text-center">
                            <a href="#" className="text-xl font-bold text-slate-900 py-3 border-b border-slate-100">Marketplace</a>
                            <a href="#" className="text-xl font-bold text-slate-900 py-3 border-b border-slate-100">Services</a>
                            <a href="#" className="text-xl font-bold text-slate-900 py-3 border-b border-slate-100">Events</a>
                            <button className="bg-slate-900 text-white w-full py-4 rounded-xl font-bold mt-4">Get the App</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const NavButton = ({ text }) => (
    <a href="#" className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-all">
        {text}
    </a>
);

// --- Rest of the Page Components ---

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ y: -5 }}
        className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 group cursor-pointer"
    >
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors duration-300">
            <Icon className="w-6 h-6 text-emerald-700 group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="font-serif text-2xl font-semibold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </motion.div>
);

const ServicePill = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm min-w-[200px] hover:border-emerald-200 transition-colors cursor-pointer group">
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
            <Icon size={18} />
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available</span>
            <span className="text-slate-900 font-semibold">{label}</span>
        </div>
    </div>
);

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-[#FAFAF9] min-h-screen font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
            
            <Navbar />

            {/* --- Hero Section --- */}
            {/* Added pt-32 to account for fixed navbar */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-emerald-50/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                
                <div className="container mx-auto max-w-7xl">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative z-10"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-bold tracking-wide text-slate-600 uppercase">Live in your area</span>
                            </div>

                            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl text-slate-900 leading-[0.95] mb-8">
                                Connect. <br />
                                <span className="italic font-light text-slate-400">Trust.</span> <br />
                                Thrive.
                            </h1>
                            
                            <p className="text-lg text-slate-500 max-w-md mb-10 leading-relaxed">
                                The modern neighborhood marketplace. Buy, sell, and find help within a circle you can actually trust.
                            </p>

                            <div className="flex flex-wrap items-center gap-4">
                                <button 
                                    onClick={() => navigate('/feed')}
                                    className="h-14 px-8 rounded-full bg-emerald-900 text-white font-semibold text-lg hover:bg-emerald-800 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-900/20 flex items-center gap-2"
                                >
                                    Join Your Circle <ArrowRight size={18} />
                                </button>
                                <button className="h-14 w-14 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-emerald-200 text-slate-900 transition-colors shadow-sm">
                                    <span className="sr-only">Play Video</span>
                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-slate-900 border-b-[6px] border-b-transparent ml-1"></div>
                                </button>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative lg:h-[600px] w-full"
                        >
                            <div className="absolute right-0 top-0 w-full h-full lg:w-[90%] rounded-[3rem] rounded-tr-[10rem] overflow-hidden shadow-2xl border-4 border-white">
                                <img 
                                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2664&auto=format&fit=crop" 
                                    alt="Community" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute bottom-8 left-8 text-white">
                                    <p className="font-serif text-2xl">The best cookies are <br/> next door.</p>
                                </div>
                            </div>

                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -left-4 bottom-20 bg-white p-5 rounded-3xl shadow-xl border border-slate-100 max-w-[240px]"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces" className="w-10 h-10 rounded-full object-cover" alt="User" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Bike Repair</p>
                                        <p className="text-xs text-slate-500">2 blocks away</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-emerald-500 text-emerald-500" />)}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* --- Quick Access Bar --- */}
            <div className="w-full overflow-x-auto pb-12 no-scrollbar">
                <div className="container mx-auto px-6 flex gap-6 min-w-max justify-center">
                    <ServicePill icon={Wrench} label="Repairs" />
                    <ServicePill icon={Utensils} label="Homemade Food" />
                    <ServicePill icon={ShoppingBag} label="Thrift Store" />
                    <ServicePill icon={Truck} label="Moving Help" />
                </div>
            </div>

            {/* --- Features Grid --- */}
            <section className="py-24 bg-white rounded-t-[4rem] relative z-20 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.05)]">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <span className="text-emerald-600 font-bold tracking-widest uppercase text-xs mb-4 block">Why MyCircle?</span>
                        <h2 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">Rediscover the village.</h2>
                        <p className="text-slate-500 text-lg">
                            Technology usually isolates us. MyCircle uses it to bring back the feeling of a tight-knit community.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard 
                            icon={Briefcase}
                            title="Local Gigs"
                            desc="Hire a neighbor for gardening, cleaning, or tech support. Keep the money in the community."
                            delay={0.1}
                        />
                        <FeatureCard 
                            icon={ShoppingBag}
                            title="Secure Marketplace"
                            desc="Buy and sell items without shipping fees or sketchy meetups. Just walk down the street."
                            delay={0.2}
                        />
                        <FeatureCard 
                            icon={ShieldCheck}
                            title="Verified Residents"
                            desc="We verify addresses so you know you are talking to real people living nearby."
                            delay={0.3}
                        />
                        <FeatureCard 
                            icon={Utensils}
                            title="Food Sharing"
                            desc="Too many lemons on your tree? Baked too much bread? Share it with neighbors."
                            delay={0.4}
                        />
                        <FeatureCard 
                            icon={Users}
                            title="Interest Groups"
                            desc="Find your walking buddies, board game groups, or morning yoga squad."
                            delay={0.5}
                        />
                         <FeatureCard 
                            icon={Heart}
                            title="Community Care"
                            desc="Organize meal trains for new parents or check-ins for elderly neighbors."
                            delay={0.6}
                        />
                    </div>
                </div>
            </section>

             {/* --- Interactive Preview / Split Section --- */}
            <section className="py-24 bg-emerald-900 relative overflow-hidden text-white">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="container mx-auto px-6 max-w-7xl relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-emerald-300 font-bold tracking-widest uppercase text-sm mb-4 block">Safety First</span>
                            <h2 className="font-serif text-4xl md:text-5xl mb-6">A social network that <br/> respects your privacy.</h2>
                            <ul className="space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="bg-emerald-800 p-2 rounded-lg">
                                        <CheckCircle2 className="text-emerald-300" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Private Circles</h4>
                                        <p className="text-emerald-200/80 text-sm">Your posts are only visible to verified neighbors within your radius.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="bg-emerald-800 p-2 rounded-lg">
                                        <ShieldCheck className="text-emerald-300" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">No Data Selling</h4>
                                        <p className="text-emerald-200/80 text-sm">We don't sell your personal data to advertisers. Ever.</p>
                                    </div>
                                </li>
                            </ul>
                            <button className="mt-10 bg-white text-emerald-900 px-8 py-4 rounded-full font-bold hover:bg-emerald-50 transition-colors">
                                Read our Privacy Promise
                            </button>
                        </div>
                        
                        {/* Mockup Card */}
                        <div className="relative">
                            <div className="bg-white rounded-3xl p-6 shadow-2xl text-slate-900 max-w-md mx-auto rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-serif text-xl font-bold">Offer: Vintage Lamp</h3>
                                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">$25</span>
                                </div>
                                <div className="h-48 bg-slate-100 rounded-xl mb-4 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop" className="w-full h-full object-cover" alt="Lamp" />
                                </div>
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" alt="Avatar" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">Alice M.</p>
                                        <p className="text-xs text-slate-500">3 mins walk away</p>
                                    </div>
                                    <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Message</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="bg-[#FAFAF9] pt-20 pb-10 border-t border-slate-200">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-16">
                        <div>
                            <h2 className="font-serif text-4xl text-slate-900 mb-6">Start connecting today.</h2>
                            <div className="flex gap-4">
                                <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-black transition-colors">
                                    Download on iOS
                                </button>
                                <button className="bg-slate-200 text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-colors">
                                    Get Android App
                                </button>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="font-serif font-bold text-2xl text-slate-900 block mb-2">MyCircle.</span>
                             <p className="text-slate-500 text-sm">© 2024 MyCircle Inc.</p>
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-8 flex flex-wrap gap-8 text-sm text-slate-500 font-medium">
                        <a href="#" className="hover:text-emerald-700">Privacy Policy</a>
                        <a href="#" className="hover:text-emerald-700">Terms of Service</a>
                        <a href="#" className="hover:text-emerald-700">Cookie Settings</a>
                        <a href="#" className="hover:text-emerald-700">Guidelines</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;