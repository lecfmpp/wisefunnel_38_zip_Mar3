import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { 
    ArrowRight, 
    Mail, 
    Lock, 
    User, 
    AlertCircle, 
    Star, 
    Quote, 
    Loader2, 
    CheckCircle2,
    Home,
    Sun,
    Shield,
    Briefcase,
    TrendingUp,
    ChevronRight,
    ShieldCheck,
    LayoutDashboard,
    RefreshCw,
    PenLine
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import LogoIcon from '../components/LogoIcon';

const SIGNUP_TESTIMONIALS = [
    {
        quote: "Finally, a builder that understands the solar sales cycle. The logic branching handles complex utility questions perfectly.",
        author: "Elena Rodriguez",
        role: "Operations, SunPath Energy",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
    },
    {
        quote: "The speed of the Wisefunnel CDN is incredible. Our real estate buyer leads stay on the page because it loads instantly.",
        author: "Jordan Smith",
        role: "Principal, Prime Realty Group",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
    },
    {
        quote: "It's the only tool we trust for our wealth management lead generation funnels. Professional and compliant.",
        author: "Sarah Miller",
        role: "Director of Marketing, Miller Wealth",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop"
    }
];

const ONBOARDING_STEPS = [
    { 
        id: 'niche', 
        question: "What's your primary niche?", 
        subtext: "We'll optimize your templates based on this.", 
        options: [ 
            { label: 'Roofing', icon: <Home size={20} /> }, 
            { label: 'Solar', icon: <Sun size={20} /> }, 
            { label: 'Insurance', icon: <Shield size={20} /> }, 
            { label: 'Financial', icon: <Briefcase size={20} /> }, 
            { label: 'Other Agency', icon: <TrendingUp size={20} />, isOther: true } 
        ] 
    },
    { 
        id: 'volume', 
        question: "What's your typical volume?", 
        subtext: "Expected monthly leads across all clients.", 
        options: [ 
            { label: '< 100 leads' }, 
            { label: '100 - 500 leads' }, 
            { label: '500 - 2000 leads' }, 
            { label: '2000+ leads' } 
        ] 
    }
];

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    
    const [step, setStep] = useState<'form' | 'onboarding' | 'success'>('form');
    const [onboardingIndex, setOnboardingIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [testimonialIndex, setTestimonialIndex] = useState(0);

    // Custom Niche State
    const [showCustomNiche, setShowCustomNiche] = useState(false);
    const [customNicheValue, setCustomNicheValue] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((prev) => (prev + 1) % SIGNUP_TESTIMONIALS.length);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setIsDuplicate(false);
        setResetSent(false);

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: { 
                    data: { full_name: formData.name },
                    emailRedirectTo: `${window.location.origin}/#/dashboard${location.search}`
                }
            });
            
            if (authError) throw authError;

            // In Supabase, if email confirmation is on, identities will be empty if the user exists
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                setIsDuplicate(true);
                throw new Error("This agency email is already registered. Please login or reset your password.");
            }

            if (data.user) {
                setStep('onboarding');
                sessionStorage.setItem('wf_verification_pending', 'true');
                sessionStorage.setItem('wf_pending_email', formData.email);
            }
        } catch (err: any) {
            setError(err.message || "Failed to create account.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setIsResetting(true);
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/#/reset-password`,
            });
            if (resetError) throw resetError;
            setResetSent(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset link.");
        } finally {
            setIsResetting(false);
        }
    };

    const handleOnboardingSelect = (value: string, isOther: boolean = false) => {
        if (isOther && onboardingIndex === 0) {
            setShowCustomNiche(true);
            return;
        }

        const stepId = ONBOARDING_STEPS[onboardingIndex].id;
        const nextAnswers = { ...answers, [stepId]: value };
        setAnswers(nextAnswers);
        
        if (onboardingIndex < ONBOARDING_STEPS.length - 1) {
            setOnboardingIndex(prev => prev + 1);
            setShowCustomNiche(false);
        } else {
            queueInfrastructure(nextAnswers);
        }
    };

    const handleCustomNicheSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customNicheValue.trim()) return;
        handleOnboardingSelect(customNicheValue.trim());
    };

    const queueInfrastructure = (finalAnswers: Record<string, string>) => {
        const pendingSetup = {
            name: formData.name,
            email: formData.email,
            answers: finalAnswers,
            plan: searchParams.get('plan'),
            cycle: searchParams.get('cycle') || 'monthly',
            timestamp: Date.now()
        };
        
        localStorage.setItem('wf_pending_setup', JSON.stringify(pendingSetup));
        setStep('success');
    };

    const currentTestimonial = SIGNUP_TESTIMONIALS[testimonialIndex];

    return (
        <div className="flex min-h-screen bg-white font-sans text-[#1A2B3B]">
            <div className="hidden lg:flex w-1/2 bg-[#F97316] relative overflow-hidden items-center justify-center p-20 text-white">
                <div className="absolute -top-20 -right-20 p-40 opacity-10 rotate-45 pointer-events-none">
                    <LogoIcon className="w-[600px] h-[600px] opacity-10" />
                </div>
                
                <div className="max-w-lg w-full relative z-10 h-[480px] flex flex-col justify-center">
                    <div key={testimonialIndex} className="space-y-10 animate-[fadeInDown_0.6s_ease-out_forwards]">
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
                    </div>

                    <div className="absolute bottom-0 left-0 flex gap-2">
                        {SIGNUP_TESTIMONIALS.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === testimonialIndex ? 'w-10 bg-white' : 'w-2 bg-white/20'}`} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-24 justify-center relative bg-white">
                <div className="absolute top-12 left-8 lg:left-24">
                    <Link to="/" className="flex items-center gap-2">
                        <LogoIcon className="w-10 h-10" />
                        <span className="font-black text-2xl tracking-tighter text-[#1A2B3B]">wisefunnel</span>
                    </Link>
                </div>

                <div className="max-w-md w-full mx-auto space-y-10">
                    {step === 'form' && (
                        <div className="space-y-10 animate-fade-in-down">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-black text-[#1A2B3B] tracking-tight">Create your account.</h1>
                                <p className="text-gray-500 font-medium">Join 500+ partners scaling their lead fulfillment.</p>
                            </div>

                            {error && (
                                <div className={`p-5 rounded-3xl flex flex-col gap-4 border shadow-sm animate-scale-in ${isDuplicate ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold leading-tight">{error}</p>
                                            {isDuplicate && !resetSent && (
                                                <button 
                                                    onClick={handleResetPassword}
                                                    disabled={isResetting}
                                                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {isResetting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} strokeWidth={3} />}
                                                    Reset My Password
                                                </button>
                                            )}
                                            {resetSent && (
                                                <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest pt-1">
                                                    <CheckCircle2 size={14} /> Recovery Link Sent!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSignupSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter your name" className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-[16px] text-sm font-bold outline-none focus:border-primary transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="your@agency.com" className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end mb-1 px-1">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Password</label>
                                        <button 
                                            type="button"
                                            onClick={() => navigate('/login')}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input required type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min. 8 characters" className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all" />
                                    </div>
                                </div>
                                <button disabled={isLoading} className="w-full py-5 bg-[#1A2B3B] text-white rounded-[16px] font-black text-base shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-70">
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Continue <ArrowRight size={20} /></>}
                                </button>
                                <p className="text-center text-sm font-medium text-gray-500 pt-4">
                                    Already have an account? <Link to="/login" className="text-orange-500 font-bold hover:underline">Log In</Link>
                                </p>
                            </form>
                        </div>
                    )}

                    {step === 'onboarding' && (
                        <div className="space-y-12 animate-fade-in-down">
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    {ONBOARDING_STEPS.map((_, i) => (
                                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${i <= onboardingIndex ? 'bg-orange-500 shadow-sm' : 'bg-gray-100'}`} />
                                    ))}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Qualify Workspace Step {onboardingIndex + 1}</p>
                                <h2 className="text-[42px] font-black text-[#1A2B3B] leading-[1.1] tracking-tight">{ONBOARDING_STEPS[onboardingIndex].question}</h2>
                                <p className="text-gray-500 font-medium text-lg leading-relaxed">{ONBOARDING_STEPS[onboardingIndex].subtext}</p>
                            </div>

                            {showCustomNiche ? (
                                <form onSubmit={handleCustomNicheSubmit} className="space-y-6 animate-scale-in">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Type your agency niche</label>
                                        <div className="relative">
                                            <PenLine size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input 
                                                autoFocus
                                                required 
                                                type="text" 
                                                value={customNicheValue} 
                                                onChange={(e) => setCustomNicheValue(e.target.value)} 
                                                placeholder="e.g. Medical, E-commerce, Real Estate..." 
                                                className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary outline-none transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowCustomNiche(false)}
                                            className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
                                        >
                                            Back
                                        </button>
                                        <button 
                                            type="submit"
                                            className="flex-[2] py-4 bg-[#1A2B3B] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            Continue <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {ONBOARDING_STEPS[onboardingIndex].options.map((opt: any, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleOnboardingSelect(opt.label, opt.isOther)} 
                                            className="group flex items-center justify-between p-6 bg-white border-2 border-gray-100 rounded-[28px] hover:border-orange-500 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-left active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4">
                                                {opt.icon && <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 rounded-xl flex items-center justify-center transition-colors">
                                                    {opt.icon}
                                                </div>}
                                                <span className="text-xl font-bold text-[#1A2B3B]">{opt.label}</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border-2 border-gray-100 group-hover:border-orange-500 flex items-center justify-center transition-all">
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-10 animate-fade-in-down">
                            <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-[32px] flex items-center justify-center shadow-xl border border-orange-100 mx-auto">
                                <Mail size={48} className="animate-bounce" />
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black text-[#1A2B3B] tracking-tight leading-tight">Welcome to Wisefunnel.</h1>
                                <p className="text-gray-500 font-medium max-sm mx-auto leading-relaxed text-lg">
                                    We've sent a verification link to <span className="font-bold text-[#1A2B3B]">{formData.email}</span>. You can start building your agency right now while we confirm your email.
                                </p>
                            </div>
                            
                            <div className="p-8 bg-blue-50 border border-blue-100 rounded-[32px] text-left flex gap-4">
                                <ShieldCheck size={24} className="text-blue-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase text-blue-900 tracking-widest">Secure Handshake</p>
                                    <p className="text-[11px] text-blue-800/80 font-medium leading-relaxed">
                                        Your agency data and leads are encrypted. Verification ensures only you can access your private dashboard long-term.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-5 bg-[#F97316] text-white rounded-[20px] font-black text-lg shadow-xl shadow-orange-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    Go to Dashboard <ArrowRight size={22} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignupPage;