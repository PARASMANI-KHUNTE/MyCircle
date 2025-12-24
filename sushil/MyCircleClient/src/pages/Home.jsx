import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import HeroScene from '../components/3d/HeroScene';
import { ArrowRight, ChevronRight, Download } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    return (
        <div className="relative min-h-[80vh] flex items-center">
            {/* 3D Background Element */}
            <HeroScene />

            <div className="max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary mb-6 inline-block backdrop-blur-sm">
                        Hyperlocal Exchange Reimagined
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Connect, Exchange, <br />
                        <span className="text-primary">Thrive Locally.</span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
                        The modern way to find tasks, offer services, and trade items in your neighborhood. Secure, fast, and beautiful.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            variant="primary"
                            className="h-12 px-8 text-lg"
                            onClick={() => navigate('/feed')}
                        >
                            Get Started <ArrowRight className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 px-8 text-lg"
                            onClick={() => navigate('/feed')}
                        >
                            Explore Feed
                        </Button>
                        <Button
                            variant="accent"
                            className="h-12 px-8 text-lg"
                            href="/mycircle.apk"
                            download="MyCircle.apk"
                        >
                            Download App <Download className="w-5 h-5" />
                        </Button>
                    </div>
                </motion.div>

                {/* Stats / trust indicators could go here */}
            </div>
        </div>
    );
};

export default Home;
