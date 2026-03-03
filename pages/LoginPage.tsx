import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Star, AlertCircle, Quote, Loader2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import LogoIcon from '../components/LogoIcon';

const LOGIN_TESTIMONIALS = [
    {
        quote: "Wisefunnel didn't just build funnels, they built a high-speed money machine for my agency.",
        author: "Bilal Ahmad",
        role: "Founder, GrowthScale Roofing",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
    },
    {
        quote: "The lead distribution saves us 10 hours a week. Our clients get leads instantly, doubling their close rate.",
        author: "Saman Malik",
        role: "Operations Lead, SolarFlow Solutions",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
    },
    {
        quote: "Cleanest verification stack in the industry. Fake phone numbers have been eliminated from our client deliveries.",
        author: "Briana Patton",
        role: "Growth Manager, HomeHub Services",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
    },
    {
        quote: "The Client Finder helped us land three high-ticket insurance clients in a week. It's like an AI scout for agencies.",
        author: "Marcello Costa",
        role: "CEO, LeadPioneers Insurance",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop"
    },
    {
        quote: "Professional, white-labeled, and high-speed. Our conversion rates are up 40% across all wealth management funnels.",
        author: "Sarah Jenkins",
        role: "Director of Acquisition, Jenk Wealth",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop"
    }
];

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'login' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [testimonialIndex, setTestimonialIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((prev) => (prev + 1) % LOGIN_TESTIMONIALS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || "Invalid credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#/reset-password`,
            });
            if (resetError) throw resetError;
            setSuccess("Check your email! We've sent you a secure link to reset your password.");
        } catch (err: any) {
            setError(err.message || "Failed to send reset email.");
        } finally {
            setIsLoading(false);
        }
    };

    const currentTestimonial = LOGIN_TESTIMONIALS[testimonialIndex];

    return (
        <div className="flex min-h-screen bg-white font-sans text-[#1A2B3B]">
            <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-24 justify-center">
                <div className="max-w-md w-full mx-auto space-y-10">
                    <Link to="/" className="flex items-center gap-2 mb-8 w-fit">
                        <LogoIcon className="w-10 h-10" />
                        <span className="font-black text-2xl tracking-tighter text-[#1A2B3B]">wisefunnel</span>
                    </Link>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-[#1A2B3B] tracking-tight">
                            {view === 'login' ? 'Welcome back!' : 'Reset Password'}
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            {view === 'login' 
                                ? 'Join 500+ partners scaling their lead fulfillment.' 
                                : 'Enter your email and we\'ll send you a recovery link.'}
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 animate-fade-in-down">
                            <AlertCircle size={20}/>
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 rounded-2xl flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-600 animate-fade-in-down">
                            <CheckCircle2 size={20}/>
                            <p className="text-sm font-bold">{success}</p>
                        </div>
                    )}

                    {view === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all" />
                                </div>
                                <div className="flex justify-end px-1">
                                    <button 
                                        type="button"
                                        onClick={() => { setView('forgot'); setError(null); setSuccess(null); }}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </div>
                            <button disabled={isLoading} className="w-full py-5 bg-[#F97316] text-white rounded-[16px] font-black text-base shadow-xl shadow-orange-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-70">
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Login <ArrowRight size={20} /></>}
                            </button>
                            <p className="text-center text-sm font-medium text-gray-500 pt-4">
                                Don't have an account? <Link to="/signup" className="text-orange-500 font-bold hover:underline">Sign Up</Link>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all" />
                                </div>
                            </div>
                            <button disabled={isLoading} className="w-full py-5 bg-[#1A2B3B] text-white rounded-[16px] font-black text-base shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-70">
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Send Reset Link <ArrowRight size={20} /></>}
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setView('login'); setError(null); setSuccess(null); }}
                                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all pt-2"
                            >
                                <ChevronLeft size={16} /> Back to Login
                            </button>
                        </form>
                    )}
                </div>
            </div>
            
            <div className="hidden lg:flex w-1/2 bg-[#1A2B3B] relative items-center justify-center p-20 text-white overflow-hidden">
                <div className="absolute top-0 right-0 p-20 opacity-5 rotate-12 pointer-events-none">
                    <LogoIcon className="w-96 h-96 opacity-10" />
                </div>
                
                <div className="max-w-lg w-full relative z-10 h-[480px] flex flex-col justify-center">
                    <div key={testimonialIndex} className="space-y-10 animate-[fadeInDown_0.6s_ease-out_forwards]">
                        <div className="space-y-6">
                            <div className="flex text-yellow-400 gap-1">
                                {[...Array(5)].map((_, i) => <Star key={i} size={28} fill="currentColor" strokeWidth={0} />)}
                            </div>
                            <h2 className="text-[42px] leading-[1.1] font-black tracking-tight relative">
                                <Quote className="absolute -top-10 -left-10 text-white/5 w-24 h-24 rotate-12" />
                                "{currentTestimonial.quote}"
                            </h2>
                        </div>
                        
                        <div className="flex items-center gap-5 pt-10 border-t border-white/10">
                            <img 
                                src={currentTestimonial.avatar} 
                                className="w-20 h-20 rounded-[28px] border-2 border-white/10 object-cover shadow-2xl" 
                                alt={currentTestimonial.author} 
                            />
                            <div className="space-y-1">
                                <h4 className="font-black text-2xl tracking-tight">{currentTestimonial.author}</h4>
                                <p className="text-sm font-black text-orange-500 uppercase tracking-widest">{currentTestimonial.role}</p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 flex gap-2">
                        {LOGIN_TESTIMONIALS.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === testimonialIndex ? 'w-10 bg-orange-500' : 'w-2 bg-white/20'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
