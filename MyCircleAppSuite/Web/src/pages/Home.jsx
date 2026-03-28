import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { 
    ArrowRight, Zap, Shield, Globe, Users, 
    Star, CheckCircle, ArrowUpRight, Sparkles,
    TrendingUp, MapPin, Clock
} from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: Shield,
            title: 'Verified Professionals',
            description: 'Every user is verified with trust scores and real reviews from your community.',
            color: 'text-success',
            bgColor: 'bg-success/10'
        },
        {
            icon: Globe,
            title: 'Local Discovery',
            description: 'Find jobs, services, and items right in your neighborhood. No more long commutes.',
            color: 'text-primary',
            bgColor: 'bg-primary/10'
        },
        {
            icon: Zap,
            title: 'Instant Connections',
            description: 'Connect with providers in seconds. Chat, negotiate, and close deals faster.',
            color: 'text-warning',
            bgColor: 'bg-warning/10'
        },
        {
            icon: Users,
            title: 'Community Trust',
            description: 'Build your reputation through genuine interactions. Your network is your asset.',
            color: 'text-accent',
            bgColor: 'bg-accent/10'
        }
    ];

    const stats = [
        { value: '10K+', label: 'Active Users' },
        { value: '50K+', label: 'Posts Created' },
        { value: '98%', label: 'Satisfaction' },
        { value: '24h', label: 'Avg Response' }
    ];

    const testimonials = [
        {
            name: 'Sarah Chen',
            role: 'Freelance Designer',
            avatar: 'https://i.pravatar.cc/100?img=1',
            text: 'MyCircle helped me find clients in my area. The verification system gives me confidence in who I work with.',
            rating: 5
        },
        {
            name: 'Marcus Johnson',
            role: 'Small Business Owner',
            avatar: 'https://i.pravatar.cc/100?img=3',
            text: 'I listed my moving services here and got 15 bookings in my first week. The barter feature is genius!',
            rating: 5
        },
        {
            name: 'Emily Rodriguez',
            role: 'Student',
            avatar: 'https://i.pravatar.cc/100?img=5',
            text: 'Found an amazing tutor nearby. The trust scores helped me choose someone reliable.',
            rating: 5
        }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="space-y-8"
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Powered by AI insights</span>
                            </motion.div>

                            {/* Heading */}
                            <div className="space-y-4">
                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                                    Your neighborhood,
                                    <br />
                                    <span className="gradient-text">connected.</span>
                                </h1>
                                <p className="text-xl text-foreground-muted max-w-lg leading-relaxed">
                                    Find trusted professionals, unique items, and genuine connections right in your community. No middlemen, no hassle.
                                </p>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    size="xl"
                                    onClick={() => navigate('/feed')}
                                    className="gap-3"
                                >
                                    <span>Get Started</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="xl"
                                    onClick={() => navigate('/feed')}
                                    className="gap-3"
                                >
                                    <span>Explore Feed</span>
                                    <ArrowUpRight className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Trust Indicators */}
                            <div className="flex items-center gap-6 pt-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <img
                                            key={i}
                                            src={`https://i.pravatar.cc/40?img=${i + 10}`}
                                            alt=""
                                            className="w-10 h-10 rounded-full border-2 border-card object-cover"
                                        />
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-foreground-muted">Trusted by 10K+ users</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Content - Visual */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="relative hidden lg:block"
                        >
                            {/* Main Card */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative z-10 bg-card rounded-3xl border border-card-border shadow-2xl overflow-hidden"
                            >
                                <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-6">
                                    <div className="h-full rounded-2xl bg-background-secondary/50 border-2 border-dashed border-card-border flex items-center justify-center">
                                        <div className="text-center space-y-4">
                                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                                                <Zap className="w-10 h-10 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">MyCircle Community</p>
                                                <p className="text-sm text-foreground-muted">Connect • Trade • Grow</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Stats */}
                                <motion.div
                                    animate={{ y: [0, 5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                                    className="absolute -left-4 top-1/4 bg-card rounded-2xl border border-card-border shadow-xl p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">500+</p>
                                            <p className="text-xs text-foreground-muted">New This Week</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
                                    className="absolute -right-4 top-1/3 bg-card rounded-2xl border border-card-border shadow-xl p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <MapPin className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">2.5 km</p>
                                            <p className="text-xs text-foreground-muted">Nearby</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 8, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                                    className="absolute -right-8 bottom-1/4 bg-card rounded-2xl border border-card-border shadow-xl p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-warning" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">2h</p>
                                            <p className="text-xs text-foreground-muted">Response Time</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl -z-10 transform translate-x-4 translate-y-4" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-background-secondary">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <p className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</p>
                                <p className="text-foreground-muted font-medium">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Why choose <span className="gradient-text">MyCircle</span>?
                        </h2>
                        <p className="text-xl text-foreground-muted">
                            We've built the most trusted local marketplace by putting community first.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="group p-6 bg-card rounded-2xl border border-card-border hover:border-card-border-hover hover:shadow-xl transition-all duration-300"
                            >
                                <div className={cn(
                                    'w-14 h-14 rounded-2xl flex items-center justify-center mb-5',
                                    feature.bgColor
                                )}>
                                    <feature.icon className={cn('w-7 h-7', feature.color)} />
                                </div>
                                <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                                <p className="text-foreground-muted text-sm leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-background-secondary">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Simple as <span className="gradient-text">1-2-3</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { step: '01', title: 'Sign Up', desc: 'Create your profile and verify your identity in minutes.' },
                            { step: '02', title: 'Discover', desc: 'Browse local posts or create your own listing.' },
                            { step: '03', title: 'Connect', desc: 'Chat directly and get things done together.' }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className="relative text-center"
                            >
                                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl shadow-glow">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-foreground-muted">{item.desc}</p>
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-card-border" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Loved by the <span className="gradient-text">community</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -4 }}
                                className="p-6 bg-card rounded-2xl border border-card-border"
                            >
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                                    ))}
                                </div>
                                <p className="text-foreground-muted mb-6 leading-relaxed">"{testimonial.text}"</p>
                                <div className="flex items-center gap-4">
                                    <img
                                        src={testimonial.avatar}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-foreground-muted">{testimonial.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-12 md:p-16 text-center"
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full" />
                            <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Ready to join your local circle?
                            </h2>
                            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                                Start connecting with your neighborhood today. It's free, it's local, and it's community-driven.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Button
                                    size="xl"
                                    onClick={() => navigate('/feed')}
                                    className="bg-white text-primary hover:bg-white/90 gap-3"
                                >
                                    <span>Get Started Free</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-card-border">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">My<span className="gradient-text">Circle</span></span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-foreground-muted">
                            <span>© 2024 MyCircle. All rights reserved.</span>
                            <div className="flex items-center gap-4">
                                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                                <a href="#" className="hover:text-primary transition-colors">Terms</a>
                                <a href="#" className="hover:text-primary transition-colors">Contact</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
