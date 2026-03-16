import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { ArrowRight, Briefcase, Download, Eye } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="pt-20 md:pt-32 pb-20">
            {/* Hero Section - Two Column Layout */}
            <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    <div className="space-y-4">
                        <motion.h1
                            className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text-heading leading-[1.1]"
                        >
                            The modern way <br />
                            to find <span className="text-primary italic">tasks.</span>
                        </motion.h1>

                        <p className="text-xl md:text-2xl font-medium text-text-muted max-w-lg leading-relaxed">
                            Find professionals and items in your neighborhood. Secure, fast, and beautiful.
                        </p>
                    </div>

                    <p className="text-text-body text-base md:text-lg max-w-xl leading-relaxed">
                        MyCircle connects you with reliable help and unique items right where you live. Join our growing community and start discovering what's around you today.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <Button
                            size="lg"
                            className="group"
                            onClick={() => navigate('/feed')}
                        >
                            <Briefcase className="w-5 h-5" />
                            <span>Get Started</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="group"
                            onClick={() => navigate('/feed')}
                        >
                            <Eye className="w-5 h-5" />
                            <span>Explore Feed</span>
                        </Button>
                    </div>
                </motion.div>

                {/* Right Content - Profile Image with Glow */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative flex justify-center"
                >
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[80px] rounded-full -z-10" />

                    <div className="relative p-2 rounded-full border border-card-border overflow-hidden bg-card shadow-card">
                        <img
                            src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop"
                            alt="Community"
                            className="w-72 h-72 md:w-96 md:h-96 rounded-full object-cover transition-all duration-500"
                        />
                    </div>

                    {/* Decorative Elements */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -top-4 -right-4 md:top-8 md:right-8 bg-card p-4 rounded-xl shadow-card border border-card-border"
                    >
                        <p className="text-primary font-bold text-lg">500+</p>
                        <p className="text-text-muted text-xs uppercase tracking-widest font-bold">Local Pro</p>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                        className="absolute -bottom-4 -left-4 md:bottom-8 md:left-8 bg-card p-4 rounded-xl shadow-card border border-card-border"
                    >
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-card bg-background-section overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <p className="text-text-muted text-[10px] mt-2 font-bold uppercase tracking-widest">Active Neighbors</p>
                    </motion.div>
                </motion.div>
            </section>

            {/* Content Grid (Centered Content Section) */}
            <section className="max-w-5xl mx-auto mt-32 space-y-12 px-6">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-text-heading">Why MyCircle?</h2>
                    <p className="text-text-muted max-w-2xl mx-auto text-lg leading-relaxed">
                        The easiest and most secure way to connect with your community and find what you need.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: 'Trusted Help', icon: '🤝', text: 'Connect with verified professionals and skilled neighbors in your area.' },
                        { title: 'Local Market', icon: '🛒', text: 'Buy, sell, or rent items within your community with zero hassle.' },
                        { title: 'Secure & Fast', icon: '🔒', text: 'Experience a safe, optimized platform built for modern neighborhood life.' }
                    ].map((card, idx) => (
                        <div key={idx} className="bg-card p-8 rounded-card border border-card-border shadow-card hover:translate-y-[-5px] transition-all duration-300">
                            <span className="text-3xl mb-4 block">{card.icon}</span>
                            <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                            <p className="text-text-body text-sm leading-relaxed">{card.text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
