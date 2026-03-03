import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, 
    Check, 
    ChevronRight, 
    Home, 
    Sun, 
    Shield, 
    Briefcase, 
    TrendingUp, 
    Loader2, 
    ArrowLeft, 
    Star, 
    Quote,
    Building2,
    Landmark,
    Zap
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { MOCK_FUNNEL } from '../constants';
import LogoIcon from '../components/LogoIcon';
import { createCheckoutSession, getPriceId } from '../services/stripeService';

const STEPS = [
    { id: 'niche', question: "What's your primary niche?", subtext: "We'll optimize your templates based on this.", options: [ { label: 'Roofing', icon: <Home size={20} /> }, { label: 'Solar', icon: <Sun size={20} /> }, { label: 'Insurance', icon: <Shield size={20} /> }, { label: 'Financial', icon: <Briefcase size={20} /> }, { label: 'Something else', icon: <TrendingUp size={20} /> } ] },
    { id: 'volume', question: "What's your typical lead volume?", subtext: "Monthly leads generated across all clients.", options: [ { label: '< 100 leads' }, { label: '100 - 500 leads' }, { label: '500 - 2,000 leads' }, { label: '2,000+ leads' } ] },
];

const ONBOARDING_TESTIMONIALS = [
    { quote: "Wisefunnel tripled our roofing leads in two months. The pre-qualification quiz is a total game charger for our sales team.", author: "Mark Stevens", role: "Founder, Stevens Roofing Co.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" },
    { quote: "Finally, a builder that understands the solar sales cycle. The logic branching handles complex utility questions perfectly.", author: "Elena Rodriguez", role: "Operations, SunPath Energy", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" },
    { quote: "Our cost per lead dropped by 40% since migrating. The phone verification stack alone is worth the subscription price.", author: "David Chen", role: "CEO, Chen Group Insurance", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" }
];

const OnboardingQuiz: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isFinishing, setIsFinishing] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [testimonialIndex, setTestimonialIndex] = useState(0);

    const targetFunnelId = searchParams.get('funnelId');
    const planIntent = searchParams.get('plan');
    const cycleIntent = searchParams.get('cycle') || 'monthly';

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            setIsChecking(false);
        };
        checkStatus();
    }, [navigate]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((prev) => (prev + 1) % ONBOARDING_TESTIMONIALS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const finishOnboarding = async (finalAnswers: Record<string, string>) => {
        setIsFinishing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const workspaceId = localStorage.getItem('active_workspace_id');
            const workspaceName = `${user.user_metadata?.full_name?.split(' ')[0] || 'My'}'s Agency`;
            
            let workspace;
            
            if (workspaceId) {
                const { data: existingWs, error: updateError } = await supabase
                    .from('workspaces')
                    .update({ 
                        plan_type: planIntent ? (planIntent.toLowerCase().includes('scale') ? 'Scale' : 'Growth') : 'Free',
                        metadata: {
                            primary_niche: finalAnswers.niche,
                            volume_target: finalAnswers.volume,
                            onboarding_completed: true,
                            intent_plan: planIntent,
                            intent_cycle: cycleIntent
                        }
                    })
                    .eq('id', workspaceId)
                    .select()
                    .single();
                
                if (updateError) throw updateError;
                workspace = existingWs;
            } else {
                const { data: newWs, error: wsError } = await supabase.from('workspaces').insert({ 
                    owner_id: user.id, 
                    name: workspaceName, 
                    plan_type: planIntent ? (planIntent.toLowerCase().includes('scale') ? 'Scale' : 'Growth') : 'Free',
                    metadata: {
                        primary_niche: finalAnswers.niche,
                        volume_target: finalAnswers.volume,
                        onboarding_completed: true,
                        intent_plan: planIntent,
                        intent_cycle: cycleIntent
                    }
                }).select().single();

                if (wsError) throw wsError;
                workspace = newWs;
            }

            if (workspace) {
                localStorage.setItem('active_workspace_id', workspace.id);
                await supabase.from('workspace_members').upsert({ workspace_id: workspace.id, email: user.email?.toLowerCase(), role: 'owner' });
                await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
                
                if (planIntent) {
                    try {
                        const priceId = getPriceId(planIntent, cycleIntent);
                        await createCheckoutSession({
                            priceId,
                            workspaceId: workspace.id,
                            successUrl: `${window.location.origin}/#/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                            cancelUrl: `${window.location.origin}/#/dashboard`,
                        });
                        return;
                    } catch (stripeErr) {
                        console.error("[Onboarding] Stripe redirection failed:", stripeErr);
                    }
                }
            }

            if (targetFunnelId) {
                navigate(`/builder?id=${targetFunnelId}`);
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) { 
            console.error("Onboarding completion error:", err);
            alert(`Failed to finalize workspace: ${err.message}`);
        } finally {
            setIsFinishing(false);
        }
    };

    const handleSelect = (value: string) => {
        const stepId = STEPS[currentStep].id;
        const nextAnswers = { ...answers, [stepId]: value };
        setAnswers(nextAnswers);

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            finishOnboarding(nextAnswers);
        }
    };

    const currentTestimonial = ONBOARDING_TESTIMONIALS[testimonialIndex];

    if (isChecking) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-6">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                    <Loader2 className="text-primary" size={48} />
                </motion.div>
                <motion.p 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="font-black text-xl uppercase tracking-tighter text-[#1a2b3b]"
                >
                    Authenticating Session...
                </motion.p>
            </div>
        );
    }

    if (isFinishing) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-8 text-center p-8">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        scale: [0.8, 1.1, 1],
                        opacity: 1,
                        rotate: 360
                    }} 
                    transition={{ 
                        rotate: { repeat: Infinity, duration: 2.5, ease: "linear" },
                        scale: { duration: 0.5 }
                    }}
                    className="relative"
                >
                    <div className="w-28 h-28 border-4 border-primary/20 border-t-primary rounded-full"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LogoIcon className="w-12 h-12" />
                    </div>
                </motion.div>
                <div className="space-y-4">
                    <motion.h2 
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-3xl font-black text-[#1a2b3b] tracking-tight uppercase"
                    >
                        Provisioning Agency
                    </motion.h2>
                    <p className="text-gray-500 font-medium max-w-sm mx-auto">We're setting up your workspace and lead distribution nodes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white font-sans text-[#1A2B3B]">
            <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-24 justify-center relative bg-white">
                <div className="absolute top-12 left-8 lg:left-24">
                    <Link to="/" className="flex items-center gap-2">
                        <LogoIcon className="w-10 h-10" />
                        <span className="font-black text-2xl tracking-tighter text-[#1A2B3B]">wisefunnel</span>
                    </Link>
                </div>

                <div className="max-w-md w-full mx-auto space-y-12">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            {STEPS.map((_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${i <= currentStep ? 'bg-orange-500 shadow-sm' : 'bg-gray-100'}`} />
                            ))}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Step {currentStep + 1} of {STEPS.length}</p>
                        <h2 className="text-[42px] font-black text-[#1A2B3B] leading-[1.1] tracking-tight">{STEPS[currentStep].question}</h2>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed">{STEPS[currentStep].subtext}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {STEPS[currentStep].options.map((opt: any, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleSelect(opt.label)} 
                                className="group flex items-center justify-between p-6 bg-white border-2 border-gray-100 rounded-[28px] hover:border-orange-500 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-left active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    {opt.icon && <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 rounded-xl flex items-center justify-center transition-colors">
                                        {opt.icon}
                                    </div>}
                                    <span className="text-xl font-bold text-[#1A2B3B]">{opt.label}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full border-2 border-gray-100 group-hover:border-orange-50 flex items-center justify-center transition-all">
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    {currentStep > 0 && (
                        <button 
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-[#1a2b3b] transition-all"
                        >
                            <ArrowLeft size={16} /> Back to previous step
                        </button>
                    )}
                </div>
            </div>

            <div className="hidden lg:flex w-1/2 bg-[#F97316] relative overflow-hidden items-center justify-center p-20 text-white">
                <div className="absolute -top-20 -right-20 p-40 opacity-10 rotate-45 pointer-events-none">
                    <LogoIcon className="w-[600px] h-[600px] opacity-10" />
                </div>
                
                <div className="max-w-lg w-full relative z-10 h-[480px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={testimonialIndex}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-10"
                        >
                            <div className="space-y-6">
                                <div className="flex text-white/50 gap-1">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={28} fill="currentColor" strokeWidth={0} />)}
                                </div>
                                <h2 className="text-[48px] leading-[1] font-black tracking-tighter">
                                    <Quote className="absolute -top-10 -left-10 text-white/10 w-24 h-24 rotate-12" />
                                    "{currentTestimonial.quote}"
                                </h2>
                            </div>

                            <div className="flex items-center gap-5 pt-8 border-t border-white/20">
                                <img 
                                    src={currentTestimonial.avatar} 
                                    className="w-20 h-20 rounded-[28px] border-2 border-white/20 object-cover shadow-2xl" 
                                    alt={currentTestimonial.author} 
                                />
                                <div className="space-y-1">
                                    <h4 className="font-black text-2xl tracking-tight">{currentTestimonial.author}</h4>
                                    <p className="text-sm font-black text-white/70 uppercase tracking-widest">{currentTestimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="absolute bottom-0 left-0 flex gap-2">
                        {ONBOARDING_TESTIMONIALS.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === testimonialIndex ? 'w-10 bg-white' : 'w-2 bg-white/20'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingQuiz;