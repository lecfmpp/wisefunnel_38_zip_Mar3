import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    ArrowRight, 
    Zap, 
    Check,
    Rocket,
    Loader2,
    Sparkles,
    AlertCircle,
    Minus,
    Menu,
    X,
    CheckCircle2,
    ShieldCheck,
    Smartphone,
    Mail,
    Users,
    Globe,
    Layout,
    TrendingUp,
    Target,
    Activity,
    MousePointerClick,
    Building2,
    BarChart3,
    Info,
    MessageCircle,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    Network,
    MessageSquareText,
    Split,
    Radar,
    Send,
    Plus,
    Star,
    Quote,
    Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicFooter from '../components/PublicFooter';
import LogoIcon from '../components/LogoIcon';
import { createCheckoutSession, getPriceId } from '../services/stripeService';
import { supabase } from '../services/supabaseClient';

const FEATURES = [
    {
        id: 'funnels',
        label: 'Funnels',
        icon: Layout,
        title: 'High-Conversion Funnel Engine',
        description: 'Build intelligent landing pages and quiz systems with advanced branching logic. Route visitors through personalized paths to capture deeper intent and higher-quality lead data effortlessly.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
        color: 'text-blue-500',
        activeBg: 'bg-blue-50'
    },
    {
        id: 'ab-testing',
        label: 'A/B Testing',
        icon: Split,
        title: 'Multi-Step A/B Testing',
        description: 'Optimize every interaction with precision split-testing. Run experiments across quiz steps and landing pages to identify the copy and hooks that drive the lowest cost-per-lead.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
        color: 'text-orange-500',
        activeBg: 'bg-orange-50'
    },
    {
        id: 'crm',
        label: 'CRM',
        icon: Users,
        title: 'Intelligence-Driven CRM',
        description: 'Manage, score, and distribute leads from a central command center. Access intelligence reports populated with quiz data and distribute leads to your clients with a single click.',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200',
        color: 'text-blue-500',
        activeBg: 'bg-blue-50'
    },
    {
        id: 'reporting',
        label: 'Reporting',
        icon: BarChart3,
        title: 'Transparent Live Client Reporting',
        description: 'Build unbreakable trust with real-time, one-page performance reports. Give clients a Live Report dashboard to view lead flow and quality, increasing transparency and retention.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
        color: 'text-orange-500',
        activeBg: 'bg-orange-50'
    },
    {
        id: 'notifications',
        label: 'Alerts',
        icon: Mail,
        title: 'White-Labeled Lead Notifications',
        description: 'Deliver leads instantly via automated or manual notifications. Keep sales teams fast with white-labeled alerts that put your agency brand front and center.',
        image: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&q=80&w=1200',
        color: 'text-blue-500',
        activeBg: 'bg-blue-50'
    },
    {
        id: 'verification',
        label: 'Verify',
        icon: ShieldCheck,
        title: 'Built-In Lead Verification Stack',
        description: 'Verify email and phone data in real-time to eliminate junk leads. Use integrated OTP and syntax checks to guarantee elite lead quality and maximize your agency profit.',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200',
        color: 'text-orange-500',
        activeBg: 'bg-orange-50'
    },
    {
        id: 'ai-buyer',
        label: 'Ai Scout',
        icon: Radar,
        title: 'AI Buyer Intelligence (Find Buyer AI)',
        description: 'Secure profit by identifying high-intent lead buyers before you build. Our AI engine scrapes verified B2B data to find paying partners in your niche so you can close deals faster.',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
        color: 'text-blue-500',
        activeBg: 'bg-blue-50'
    },
    {
        id: 'outreach',
        label: 'Pitch',
        icon: Send,
        title: 'Automated Outreach Machine (Email & Pitch)',
        description: 'Convert prospect data into signed contracts with personalized outbound sequences. Use our integrated composer and proven templates to sell your agency services at scale automatically.',
        image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=1200',
        color: 'text-orange-500',
        activeBg: 'bg-orange-50'
    }
];

const TESTIMONIALS = [
    {
        name: "Alex Rivera",
        role: "Founder, ScaleGen Media",
        avatar: "https://i.pravatar.cc/150?u=alex",
        text: "Wisefunnel completely eliminated our reliance on fragile Zapier connections. We reduced our tech stack costs by 40% while doubling our lead conversion rates.",
        rating: 5
    },
    {
        name: "Sarah Chen",
        role: "Head of Growth, Zenith Ads",
        avatar: "https://i.pravatar.cc/150?u=sarah",
        text: "The multi-step quiz logic is the best I've ever seen. We're now capturing intent data that our clients actually value, allowing us to charge premium retainers.",
        rating: 5
    },
    {
        name: "Marcus Thorne",
        role: "CEO, LeadPulse Agency",
        avatar: "https://i.pravatar.cc/150?u=marcus",
        text: "The built-in verification stack is a game changer. No more disputing lead quality with clients – the reports speak for themselves. Truly built for agencies.",
        rating: 5
    }
];

const FAQS = [
    {
        question: "How does the 7-day free trial work?",
        answer: "You get full access to all features of your chosen plan for 7 days. No credit card is required to start. You can explore the funnel builder, setup your first campaign, and even test the lead verification stack risk-free."
    },
    {
        question: "Can I switch plans or cancel at any time?",
        answer: "Yes, absolutely. Wisefunnel is a month-to-month service (unless you choose the yearly option for savings). You can upgrade, downgrade, or cancel your subscription directly from your account settings with one click."
    },
    {
        question: "Does Wisefunnel replace my existing CRM?",
        answer: "It can! Wisefunnel includes a robust Lead Management CRM. However, if you already use a specialized CRM like HubSpot or Salesforce, you can easily export your leads or use our API to sync data instantly."
    }
];

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
    const [activeFaq, setActiveFaq] = useState<number | null>(0);
    const isYearly = billingCycle === 'yearly';

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (location.hash === '#pricing') {
            const element = document.getElementById('pricing');
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [location.hash]);

    const handleUpgrade = async (plan: 'growth' | 'scale') => {
        setIsProcessing(plan);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                navigate(`/signup?plan=${plan}&cycle=${billingCycle}`);
                return;
            }

            let workspaceId = localStorage.getItem('active_workspace_id');
            
            if (!workspaceId) {
                const { data: workspaces } = await supabase
                    .from('workspaces')
                    .select('id')
                    .eq('owner_id', session.user.id)
                    .eq('is_archived', false)
                    .limit(1);
                
                if (workspaces && workspaces.length > 0) {
                    workspaceId = workspaces[0].id;
                    localStorage.setItem('active_workspace_id', workspaceId);
                }
            }

            if (!workspaceId) {
                navigate(`/onboarding?plan=${plan}&cycle=${billingCycle}`);
                return;
            }

            const priceId = getPriceId(plan, billingCycle);

            await createCheckoutSession({
                priceId,
                workspaceId,
                successUrl: `${window.location.origin}/#/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/#/pricing`,
            });
        } catch (err: any) {
            console.error("Payment initiation failed:", err);
            alert(`Payment gateway error: ${err.message || "Unknown error"}.`);
        } finally {
            setIsProcessing(null);
        }
    };

    const scrollToSection = (id: string) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const toggleMobileMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleCustomPlanChat = () => {
        const msg = encodeURIComponent("Hi! I'm interested in a custom plan tailored to my agency's specific needs.");
        window.open(`https://wa.me/16478623292?text=${msg}`, '_blank');
    };

    const currentFeature = FEATURES[activeFeatureIndex];

    const nextFeature = () => setActiveFeatureIndex((prev) => (prev + 1) % FEATURES.length);
    const prevFeature = () => setActiveFeatureIndex((prev) => (prev - 1 + FEATURES.length) % FEATURES.length);

    return (
        <div className="h-full overflow-y-auto bg-white font-sans text-[#1A2B3B] selection:bg-orange-100 scroll-smooth">
            <AnimatePresence>
                {isProcessing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-[#1A2B3B]/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center"
                    >
                        <div className="relative mb-8">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-24 h-24 border-4 border-orange-500/20 border-t-orange-500 rounded-full"
                            ></motion.div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LogoIcon className="w-10 h-10 animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">securingSession</h2>
                        <p className="text-white/60 font-medium max-w-sm">Redirecting to Stripe's encrypted payment gateway...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center">
                <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 relative z-[60]">
                        <LogoIcon className="w-10 h-10" />
                        <span className="font-black text-2xl tracking-tighter text-[#1A2B3B]">wisefunnel</span>
                    </Link>
                    
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('pricing')} className="text-sm font-bold hover:text-orange-50 transition-colors">Pricing</button>
                        {/* <Link to="/ai-builder" className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1.5">
                           <Sparkles size={14} /> AI Migration
                        </Link> */}
                    </div>

                    <div className="flex items-center gap-4 relative z-[60]">
                        {isLoggedIn ? (
                            <Link to="/dashboard" className="hidden md:block px-6 py-2.5 bg-[#1A2B3B] text-white rounded-xl text-sm font-black hover:opacity-90 shadow-lg shadow-black/10 transition-all active:scale-95">
                                Dashboard
                            </Link>
                        ) : (
                            <div className="hidden md:flex items-center gap-4">
                                <Link to="/login" className="text-sm font-bold hover:text-orange-500 transition-colors">Sign In</Link>
                                <Link to="/signup" className="px-6 py-2.5 bg-[#F97316] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-orange-500/20">
                                    Start 7-Day Trial
                                </Link>
                            </div>
                        )}
                        <button 
                            type="button"
                            onClick={toggleMobileMenu}
                            className="md:hidden p-3 text-[#1A2B3B] hover:bg-gray-100 rounded-xl transition-all active:scale-90"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-xl md:hidden z-40 overflow-hidden"
                        >
                            <div className="flex flex-col p-6 gap-4">
                                <button onClick={() => scrollToSection('pricing')} className="text-left text-base font-bold text-gray-700 hover:text-orange-500 transition-colors py-2">Pricing</button>
                                {/**
                                <Link to="/ai-builder" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-2 py-2">
                                    <Sparkles size={16} /> AI Migration
                                </Link>
                                */}
                                <div className="!my-4 h-px bg-gray-100 w-full"></div>
                                {isLoggedIn ? (
                                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 bg-[#1A2B3B] text-white rounded-xl text-center font-bold text-sm shadow-lg shadow-black/10">Dashboard</Link>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 border border-gray-200 rounded-xl text-center font-bold text-sm text-[#1A2B3B]">Sign In</Link>
                                        <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 bg-[#F97316] text-white rounded-xl text-center font-bold text-sm shadow-lg shadow-orange-500/20">Start 7-Day Trial</Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <header className="pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B3B] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-12">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-[8px] md:text-[10px] font-black uppercase tracking-widest animate-fade-in-down whitespace-nowrap overflow-hidden max-w-[90vw]"
                    >
                        <Zap size={10} className="text-orange-500 shrink-0 md:w-[12px] md:h-[12px]" fill="currentColor" />
                        <span className="truncate">FOR LEAD GEN AGENCIES TIRED OF FRAGILE ZAPS</span>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-7xl mx-auto space-y-8"
                    >
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
                            The Agency Engine That Replaces Your Duct-Taped Stack of Landing Page and Quiz Builders
                        </h1>
                        <p className="text-lg md:text-xl text-white/60 font-medium max-w-5xl mx-auto leading-relaxed">
                            Stop settling for fragile automations and manual spreadsheets. Wisefunnel is the only high-performance engine that handles your landing pages, quiz logic, and lead delivery in one sleek Agency stack.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center gap-6 pt-4"
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-2xl">
                            <button onClick={() => scrollToSection('pricing')} className="w-full sm:w-auto px-12 py-6 bg-[#F97316] text-white rounded-2xl font-black text-xl hover:opacity-90 shadow-2xl shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                                Start My 7-Day Trial <ArrowRight size={22} />
                            </button>
                            <button onClick={() => scrollToSection('features')} className="w-full sm:w-auto px-10 py-6 bg-white/5 text-white border border-white/20 rounded-2xl font-black text-xl hover:bg-white/10 transition-all active:scale-[0.98]">
                                Explore the Platform
                            </button>
                        </div>
                        <div className="text-white/30 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                           <Check size={14} className="text-emerald-500" /> No credit card required to start <div className="w-1 h-1 bg-white/10 rounded-full"></div> Cancel Anytime
                        </div>
                    </motion.div>
                    
                    {/* VIDEO PLACEHOLDER SECTION - MOVED & ANIMATED */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.4 }}
                        className="max-w-5xl mx-auto"
                    >
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-2 md:p-4 backdrop-blur-sm shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
                            <div className="relative w-full aspect-video rounded-[24px] overflow-hidden bg-black/50 group cursor-pointer border border-white/5">
                                {/* Placeholder UI */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A2B3B]/80 group-hover:bg-[#1A2B3B]/60 transition-all duration-500">
                                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                        <Play size={32} className="text-white fill-white ml-1" />
                                    </div>
                                    <p className="mt-6 text-white/80 font-black uppercase tracking-[0.2em] text-sm">Watch 2-Min Demo</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative background element to blend sections */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            </header>

            {/* INTERACTIVE FEATURES SECTION - ENHANCED TABULAR SYSTEM */}
            <section id="features" className="py-[60px] bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-6 mb-20 animate-fade-in-down">
                        <h2 className="text-4xl md:text-6xl font-black text-[#1A2B3B] tracking-tighter leading-tight">
                            All You Need to Grow in One Place
                        </h2>
                        <p className="text-gray-500 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
                            The fastest growth software you’ll ever use. Build your first high-converting funnel in just 30 minutes, track key metrics, and manage leads in a full CRM.
                        </p>
                    </div>

                    {/* Highly Refined Segmented Tab Control - Stacked Layout */}
                    <div className="flex justify-center mb-16 px-4">
                        <div className="relative bg-gray-50/80 backdrop-blur-sm p-2 rounded-[40px] border border-gray-100 flex items-stretch overflow-x-auto scrollbar-hide max-w-full lg:w-full lg:max-w-7xl h-32">
                            {FEATURES.map((feature, idx) => (
                                <button
                                    key={feature.id}
                                    onClick={() => setActiveFeatureIndex(idx)}
                                    className={`relative z-20 flex-1 min-w-[120px] lg:min-w-0 flex flex-col items-center justify-center gap-2 px-4 rounded-[32px] transition-all duration-300 whitespace-nowrap group ${
                                        activeFeatureIndex === idx ? 'text-[#1A2B3B]' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {activeFeatureIndex === idx && (
                                        <motion.div 
                                            layoutId="activeFeatureTab"
                                            className="absolute inset-0 bg-white shadow-[0_8px_30px_-5px_rgba(0,0,0,0.1)] border border-gray-100 z-10 rounded-[32px]"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                                        />
                                    )}
                                    <div className={`relative z-20 p-2.5 rounded-xl transition-all duration-300 ${
                                        activeFeatureIndex === idx ? 'bg-primary/10 text-primary scale-110' : 'bg-gray-100/50 text-gray-400 group-hover:bg-gray-200/50'
                                    }`}>
                                        <feature.icon size={20} strokeWidth={activeFeatureIndex === idx ? 3 : 2} />
                                    </div>
                                    <span className={`relative z-20 text-[12px] font-bold transition-colors ${activeFeatureIndex === idx ? 'text-[#1A2B3B]' : 'text-gray-400'}`}>
                                        {feature.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feature Display Area - Redesigned to 65/35 split */}
                    <div className="relative group/display">
                        <div className="absolute top-1/2 -left-4 md:-left-8 -translate-y-1/2 z-30">
                            <button 
                                onClick={prevFeature}
                                className="w-12 h-12 md:w-16 md:h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[#1A2B3B] shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] hover:bg-[#1A2B3B] hover:text-white transition-all active:scale-90"
                            >
                                <ChevronLeft size={28} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="absolute top-1/2 -right-4 md:-right-8 -translate-y-1/2 z-30">
                            <button 
                                onClick={nextFeature}
                                className="w-12 h-12 md:w-16 md:h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[#1A2B3B] shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] hover:bg-[#1A2B3B] hover:text-white transition-all active:scale-90"
                            >
                                <ChevronRight size={28} strokeWidth={3} />
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeatureIndex}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="bg-white border border-gray-100 rounded-[56px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] flex flex-col lg:flex-row items-stretch min-h-[600px]"
                            >
                                {/* Media Section - 65% area */}
                                <div className="lg:w-[65%] p-0 bg-gray-50 flex items-center justify-center overflow-hidden">
                                    <div className="relative w-full h-full group-hover/display:scale-[1.02] transition-transform duration-1000 overflow-hidden rounded-l-[56px] rounded-r-none">
                                        <img 
                                            src={currentFeature.image} 
                                            alt={currentFeature.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/5"></div>
                                    </div>
                                </div>

                                {/* Text Section - 35% area */}
                                <div className={`lg:w-[35%] p-10 md:p-14 flex flex-col justify-center gap-8 bg-white transition-colors duration-500`}>
                                    <div className="space-y-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-100 ${currentFeature.color}`}>
                                            <Zap size={12} fill="currentColor" /> {currentFeature.label} Blueprint
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-black text-[#1A2B3B] leading-[1.05] tracking-tighter">
                                            {currentFeature.title}
                                        </h3>
                                        <p className="text-gray-500 text-base font-medium leading-relaxed">
                                            {currentFeature.description}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            'Premium Logic API',
                                            'Mobile-First Engine',
                                            'Encrypted Delivery'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-xs font-bold text-[#1A2B3B] bg-slate-50 p-4 rounded-2xl border border-gray-100">
                                                <div className={`w-5 h-5 rounded-full bg-[#1A2B3B] text-white flex items-center justify-center shrink-0`}>
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                                {item}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4">
                                        <button onClick={() => navigate('/signup')} className="group/btn w-full flex items-center justify-center gap-4 px-8 py-5 bg-[#1A2B3B] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:opacity-90 transition-all active:scale-95">
                                            Scale Now <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS SECTION - NEW MODERN LAYOUT */}
            <section className="py-[60px] bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-4 mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                             Proven by Elite Agencies
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-[#1A2B3B] tracking-tight">The Engine of Growth</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div 
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-gray-50/50 border border-gray-100 p-8 md:p-10 rounded-[40px] flex flex-col gap-8 relative group transition-all duration-300 hover:bg-white hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] hover:border-orange-200"
                            >
                                <div className="absolute top-8 right-10 text-orange-200 group-hover:text-orange-500 transition-colors">
                                    <Quote size={40} fill="currentColor" opacity={0.2} />
                                </div>
                                
                                <div className="flex gap-1">
                                    {[...Array(t.rating)].map((_, i) => <Star key={i} size={16} fill="#F97316" className="text-[#F97316]" />)}
                                </div>

                                <p className="text-lg md:text-xl font-medium text-[#1A2B3B] leading-relaxed relative z-10">
                                    "{t.text}"
                                </p>

                                <div className="flex items-center gap-4 mt-auto">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-black text-[#1A2B3B] text-base">{t.name}</p>
                                        <p className="text-sm font-bold text-gray-400">{t.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="pricing" className="py-[60px] bg-[#fcfaf2]">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center space-y-8 mb-20">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 mx-auto">
                             Automate Your Agency ROI • Risk-Free 7-Day Trial
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-[#1A2B3B] tracking-tight">Scale without the technical debt</h2>
                        
                        <div className="flex items-center justify-center gap-6 py-2">
                            <span className={`text-lg font-black transition-colors ${!isYearly ? 'text-orange-500' : 'text-gray-400'}`}>Monthly</span>
                            <button 
                                onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}
                                className={`w-20 h-10 rounded-full relative transition-all duration-300 p-1 ${isYearly ? 'bg-orange-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-8 h-8 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isYearly ? 'translate-x-10' : 'translate-x-0'}`} />
                            </button>
                            <div className="flex items-center gap-3">
                                <span className={`text-lg font-black transition-colors ${isYearly ? 'text-orange-500' : 'text-gray-400'}`}>Yearly</span>
                                <div className={`px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase rounded-lg transition-all duration-500 transform ${isYearly ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}>
                                    Save 20%
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto items-stretch mb-20">
                        {/* GROWTH PLAN */}
                        <motion.div 
                            whileHover={{ y: -10 }}
                            className="group bg-white border border-gray-200 rounded-[48px] p-10 hover:border-orange-500 hover:shadow-xl transition-all duration-500 flex flex-col relative overflow-hidden"
                        >
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-3xl font-black text-orange-500">Growth</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 px-3 py-1 rounded-lg border border-orange-100">Fulfillment</span>
                                </div>
                                <p className="text-base text-gray-500 font-medium leading-relaxed">Essential fulfillment for scaling agencies.</p>
                            </div>
                            
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-7xl font-black text-[#1A2B3B] tracking-tighter leading-none">
                                    ${isYearly ? '158' : '197'}
                                </span>
                                <span className="text-xl font-bold text-gray-400">/mo</span>
                            </div>

                            {isYearly && <p className="text-sm font-black text-orange-600 mb-8">Billed as $1,896 per year.</p>}

                            <div className="space-y-8 flex-1 pt-8 border-t border-gray-100">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Core Infrastructure</p>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {[
                                            'Quiz Funnel Builder (Conditional Logic)',
                                            'Landing Page Builder',
                                            'Step-by-Step Funnel Tracking',
                                            'Live Client Report',
                                            'CRM Lead Management',
                                            'Manual & Automatic Lead Notifications',
                                            'GDPR-Compliant Infrastructure'
                                        ].map((feat, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#1A2B3B]">
                                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Account Limits</p>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {[
                                            '5,000 Total Monthly Leads',
                                            '3 Client Workspaces',
                                            '3 Included Team Seats ($29/extra)',
                                            '10 Included Custom Domains'
                                        ].map((feat, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#1A2B3B]">
                                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Lead Verification</p>
                                        <div className="group/tooltip relative">
                                            <Info size={14} className="text-gray-300 hover:text-gray-500 transition-colors cursor-help" />
                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-[#1A2B3B] text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
                                                Additional usage is billed monthly:
                                                <div className="mt-2 flex justify-between text-orange-400"><span>Extra Email:</span> <span>$0.06/ea</span></div>
                                                <div className="mt-1 flex justify-between text-orange-400"><span>Extra OTP:</span> <span>$0.15/ea</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Email Verification</p>
                                            <p className="text-lg font-black text-orange-600">1,000<span className="text-[10px] ml-1 text-gray-400">/mo</span></p>
                                            <p className="text-[8px] font-black text-gray-400 mt-1 uppercase">$0.06 / extra</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Phone Verification</p>
                                            <p className="text-lg font-black text-orange-600">500<span className="text-[10px] ml-1 text-gray-400">/mo</span></p>
                                            <p className="text-[8px] font-black text-gray-400 mt-1 uppercase">$0.15 / extra</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleUpgrade('growth')}
                                disabled={!!isProcessing}
                                className="w-full mt-10 py-5 bg-[#1A2B3B] text-white rounded-2xl font-black text-base hover:opacity-90 shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {isProcessing === 'growth' ? <Loader2 className="animate-spin" /> : <>Select Growth Plan <ArrowRight size={20} /></>}
                            </button>
                        </motion.div>

                        {/* SCALE PLAN */}
                        <motion.div 
                            whileHover={{ y: -10 }}
                            className="group bg-white border-4 border-orange-500 rounded-[48px] p-10 shadow-2xl relative flex flex-col transform transition-all duration-500"
                        >
                            <div className="absolute top-8 right-10">
                                <div className="px-5 py-2 bg-[#1A2B3B] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" /> Elite Revenue
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-8">
                                <h3 className="text-3xl font-black text-orange-500">Scale</h3>
                                <p className="text-base text-gray-500 font-medium leading-relaxed">Built for high-volume revenue maxing.</p>
                            </div>
                            
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-7xl font-black text-[#1A2B3B] tracking-tighter leading-none">
                                    ${isYearly ? '318' : '397'}
                                </span>
                                <span className="text-xl font-bold text-gray-400">/mo</span>
                            </div>

                            {isYearly && <p className="text-sm font-black text-orange-600 mb-8">Billed as $3,816 per year.</p>}

                            <div className="space-y-8 flex-1 pt-8 border-t border-gray-100">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Elite Capabilities</p>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {[
                                            'Everything in Growth Plan',
                                            'A/B Testing Engine',
                                            'Dedicated Success Lead Support'
                                        ].map((feat, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#1A2B3B]">
                                                <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                                                    <Check size={14} strokeWidth={4} />
                                                </div>
                                                {feat}
                                            </li>
                                        ))}
                                        <li className="flex items-center gap-3 text-sm font-black text-orange-600">
                                            <div className="w-6 h-6 bg-orange-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-md">
                                                <Zap size={14} fill="currentColor" />
                                            </div>
                                            Lead Scoring Distribution (Multiple Buyers) <span className="ml-1 text-[8px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">Soon</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm font-black text-orange-600">
                                            <div className="w-6 h-6 bg-orange-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-md">
                                                <Zap size={14} fill="currentColor" />
                                            </div>
                                            Find Buyer AI Engine
                                        </li>
                                        <li className="flex items-center gap-3 text-sm font-black text-orange-600">
                                            <div className="w-6 h-6 bg-orange-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-md">
                                                <Zap size={14} fill="currentColor" />
                                            </div>
                                            Email & Pitch Machine
                                        </li>
                                        <li className="flex items-center gap-3 text-sm font-black text-orange-600">
                                            <div className="w-6 h-6 bg-orange-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-md">
                                                <Zap size={14} fill="currentColor" />
                                            </div>
                                            AI Ad Blueprint Generator <span className="ml-1 text-[8px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">Soon</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Account Limits</p>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {[
                                            '15,000 Total Monthly Leads',
                                            'Unlimited Client Workspaces',
                                            '10 Included Team Seats ($19/extra)',
                                            '20 Included Custom Domains'
                                        ].map((feat, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#1A2B3B]">
                                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Lead Verification</p>
                                        <div className="group/tooltip relative">
                                            <Info size={14} className="text-gray-300 hover:text-gray-500 transition-colors cursor-help" />
                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-[#1A2B3B] text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
                                                Additional usage is billed monthly:
                                                <div className="mt-2 flex justify-between text-orange-400"><span>Extra Email:</span> <span>$0.06/ea</span></div>
                                                <div className="mt-1 flex justify-between text-orange-400"><span>Extra OTP:</span> <span>$0.15/ea</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                            <p className="text-[9px] font-black uppercase text-orange-700 mb-1">Email Verification</p>
                                            <p className="text-lg font-black text-[#1A2B3B]">2,000<span className="text-[10px] ml-1 text-gray-400">/mo</span></p>
                                            <p className="text-[8px] font-black text-orange-600 mt-1 uppercase">$0.06 / extra</p>
                                        </div>
                                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                            <p className="text-[9px] font-black uppercase text-orange-700 mb-1">Phone Verification</p>
                                            <p className="text-lg font-black text-[#1A2B3B]">1,000<span className="text-[10px] ml-1 text-gray-400">/mo</span></p>
                                            <p className="text-[8px] font-black text-orange-600 mt-1 uppercase">$0.15 / extra</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleUpgrade('scale')}
                                disabled={!!isProcessing}
                                className="w-full mt-10 py-5 bg-[#F97316] text-white rounded-2xl font-black text-base hover:opacity-90 shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {isProcessing === 'scale' ? <Loader2 className="animate-spin" /> : <><Zap size={22} fill="currentColor" /> Scale Without Limits</>}
                            </button>
                        </motion.div>
                    </div>

                    {/* CUSTOM PLAN CALL TO ACTION */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-6xl mx-auto"
                    >
                        <div className="bg-[#1A2B3B] rounded-[48px] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden border border-white/5 group">
                            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 transition-transform duration-1000 group-hover:scale-110">
                                <Sparkles size={240} className="text-white" />
                            </div>
                            
                            <div className="text-center md:text-left space-y-6 relative z-10 max-w-xl">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-orange-500/20">
                                    <Building2 size={12} /> Enterprise & Custom 
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                                    Require a custom engine tailored for your <span className="text-orange-500">Global Scale?</span>
                                </h3>
                                <div className="text-white/60 text-lg font-medium leading-relaxed">
                                    If you're an established agency generating 15k+ leads monthly or have specific multi-region security requirements, let's build a dedicated roadmap for you.
                                </div>
                            </div>

                            <div className="relative z-10 shrink-0">
                                <button 
                                    onClick={handleCustomPlanChat}
                                    className="px-12 py-6 bg-white text-[#1A2B3B] rounded-3xl font-black text-xl hover:bg-orange-50 transition-all shadow-xl active:scale-95 flex items-center gap-4 group/btn"
                                >
                                    <MessageCircle size={28} className="text-orange-500" fill="currentColor" />
                                    <span>Talk to Founder</span>
                                    <ArrowRight size={24} className="transition-transform group-hover/btn:translate-x-2" />
                                </button>
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest text-center mt-4">
                                    Response time: &lt; 2 hours
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FAQ SECTION - NEW MODERN LAYOUT */}
            <section className="py-[60px] bg-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                             Knowledge Hub
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-[#1A2B3B] tracking-tight">Common Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                            <motion.div 
                                key={i}
                                initial={false}
                                className={`group border transition-all duration-300 rounded-[32px] overflow-hidden ${activeFaq === i ? 'bg-[#1A2B3B] border-[#1A2B3B] shadow-2xl shadow-black/10' : 'bg-gray-50/50 border-gray-100 hover:border-orange-200 hover:bg-white'}`}
                            >
                                <button 
                                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-8 text-left"
                                >
                                    <span className={`text-xl font-black tracking-tight transition-colors ${activeFaq === i ? 'text-white' : 'text-[#1A2B3B]'}`}>
                                        {faq.question}
                                    </span>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeFaq === i ? 'bg-orange-500 text-white rotate-45' : 'bg-white border border-gray-100 text-[#1A2B3B]'}`}>
                                        <Plus size={20} />
                                    </div>
                                </button>
                                
                                <AnimatePresence initial={false}>
                                    {activeFaq === i && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-8 pb-8">
                                                <div className="h-px bg-white/10 mb-6 w-full" />
                                                <p className="text-lg font-medium text-white/70 leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16 p-10 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl font-black text-[#1A2B3B]">Still have questions?</h4>
                            <p className="text-gray-500 font-medium">We're here to help your agency scale faster.</p>
                        </div>
                        <button onClick={handleCustomPlanChat} className="px-8 py-4 bg-white border border-gray-200 text-[#1A2B3B] rounded-2xl font-black hover:bg-orange-50 transition-all shadow-sm active:scale-95 flex items-center gap-3">
                            <MessageCircle size={20} className="text-orange-500" /> Chat with Support
                        </button>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default LandingPage;