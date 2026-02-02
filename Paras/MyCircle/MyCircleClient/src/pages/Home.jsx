import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import HeroScene from '../components/3d/HeroScene';
import { ArrowRight, ChevronRight, Download } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    return (
        <div className="relative min-h-[90vh] flex items-center overflow-hidden">
            {/* 3D Background Element */}
            <HeroScene />

            <div className="container mx-auto px-6 relative z-10 mt-20 md:mt-0">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary mb-8 backdrop-blur-md"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Hyperlocal Community Reimagined
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-[1.1] tracking-tight">
                        My<span className="text-accent">Circle</span>.
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/40">
                            Connect. Exchange.
                        </span>
                        <br />
                        <span className="text-primary italic">Thrive Together.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl leading-relaxed font-medium">
                        The modern way to find tasks, offer services, and trade items in your neighborhood. Built on trust, powered by community.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <Button
                            variant="primary"
                            className="h-14 px-10 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/20 group w-full sm:w-auto"
                            onClick={() => navigate('/feed')}
                        >
                            Start Exploring
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 px-10 text-xl font-bold rounded-2xl w-full sm:w-auto"
                            onClick={() => navigate('/feed')}
                        >
                            Public Feed
                        </Button>
                        <motion.a
                            href="/MyCircle.apk"
                            download="MyCircle.apk"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-3 px-6 py-3 bg-secondary/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-secondary/80 transition-all text-muted-foreground hover:text-foreground w-full sm:w-auto justify-center"
                        >
                            <Download className="w-5 h-5 text-accent" />
                            <div className="text-left">
                                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Mobile App</p>
                                <p className="text-sm font-bold">Download APK</p>
                            </div>
                        </motion.a>
                    </div>

                    {/* Features highlight */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60"
                    >
                        {[
                            { label: 'Trusted', value: 'Verified Users' },
                            { label: 'Local', value: 'Your Neighborhood' },
                            { label: 'Secure', value: 'Encrypted Chat' },
                            { label: 'Fast', value: 'Instant Alerts' }
                        ].map((stat, i) => (
                            <div key={i}>
                                <p className="text-xs uppercase tracking-widest font-bold text-accent mb-1">{stat.label}</p>
                                <p className="text-foreground font-semibold">{stat.value}</p>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            {/* Background Gradients */}
            <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/20 blur-[150px] -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/10 blur-[150px] -z-10"></div>
        </div>
    );
};

export default Home;
