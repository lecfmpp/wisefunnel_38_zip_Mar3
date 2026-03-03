import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Sparkles, 
    ArrowRight, 
    Zap, 
    Rocket,
    Cpu,
    Globe,
    ShieldCheck,
    Wand2,
    Clock,
    MousePointer2,
    ZapOff
} from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import LogoIcon from '../components/LogoIcon';
import { supabase } from '../services/supabaseClient';

const PublicAI: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
    };

    return (
        <main className="h-full overflow-y-auto bg-white font-sans text-[#1A2B3B] scroll-smooth">
             <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <LogoIcon className="w-10 h-10" />
                        <span className="font-black text-2xl tracking-tighter text-[#1A2B3B]">wisefunnel</span>
                    </Link>
                    
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/#pricing" className="text-sm font-bold hover:text-orange-500 transition-colors">Pricing</Link>
                        <span className="text-sm font-bold text-purple-600 flex items-center gap-1.5 px-3 py-1 bg-purple-50 rounded-full">
                           <Sparkles size={14} /> AI Engine
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Link to="/dashboard" className="px-6 py-2.5 bg-[#1A2B3B] text-white rounded-xl text-sm font-black hover:opacity-90 shadow-lg shadow-black/10">Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-bold hover:text-orange-500 transition-colors">Log In</Link>
                                <Link to="/signup" className="px-6 py-2.5 bg-[#1A2B3B] text-white rounded-xl text-sm font-black hover:opacity-90 shadow-lg shadow-black/10">Sign Up Free</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <div className="pt-40 pb-32 px-6">
                <div className="max-w-5xl mx-auto text-center space-y-12">
                    <div className="space-y-6 animate-fade-in-down">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 mx-auto">
                             <Clock size={14} /> The Future of Funnel Building is Being Forged
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black leading-[0.95] tracking-tighter">
                            From static site to <span className="text-orange-500 underline decoration-orange-200 underline-offset-8">Money Maker.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed">
                            Stop settling for landing pages that just sit there. We're building an AI Migration tool that takes any URL and converts it into a high-performance Wisefunnel—complete with psychological quiz flows, expert logic, and the kind of "wow" design that makes competitors sweat.
                        </p>
                    </div>

                    <div className="relative max-w-4xl mx-auto">
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-12 md:p-20 text-center space-y-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                <Cpu size={200} />
                            </div>
                            
                            <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl flex items-center justify-center mx-auto relative z-10">
                                <Rocket size={40} className="text-orange-500 animate-pulse" />
                            </div>

                            <div className="space-y-4 relative z-10">
                                <h3 className="text-3xl md:text-4xl font-black text-[#1A2B3B]">Polishing the "Conversion Brain"</h3>
                                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Nailing the structure for 47 high-ticket niches</p>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 relative z-10">
                                <div className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                    <ShieldCheck size={18} className="text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Structure Validation Passing</span>
                                </div>
                                <div className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                    <Wand2 size={18} className="text-purple-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Logic v3.1</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                        <div className="p-10 bg-white border border-gray-100 rounded-[40px] space-y-6 shadow-sm group hover:shadow-xl hover:border-orange-200 transition-all duration-500">
                            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Globe size={28} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black text-xl tracking-tight text-[#1A2B3B]">Total Reconstruction</h4>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed">It’s not a copy-paste. Our AI scans your content to rebuild your structural intent from the ground up for maximum impact.</p>
                            </div>
                        </div>
                        <div className="p-10 bg-white border border-gray-100 rounded-[40px] space-y-6 shadow-sm group hover:shadow-xl hover:border-orange-200 transition-all duration-500">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap size={28} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black text-xl tracking-tight text-[#1A2B3B]">Logic-First Quizzes</h4>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed">The engine automatically maps out the qualification steps needed to turn a casual visitor into a high-intent lead for your clients.</p>
                            </div>
                        </div>
                        <div className="p-10 bg-white border border-gray-100 rounded-[40px] space-y-6 shadow-sm group hover:shadow-xl hover:border-orange-200 transition-all duration-500">
                            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MousePointer2 size={28} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black text-xl tracking-tight text-[#1A2B3B]">Elite Interactivity</h4>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed">Forget boring. We inject micro-interactions and elite design polish that signal "Premium Authority" to every single user who clicks.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-20">
                        <div className="p-8 bg-[#1A2B3B] rounded-[48px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                                 <ZapOff size={180} />
                             </div>
                             <div className="text-left space-y-2 relative z-10">
                                 <h5 className="text-2xl font-black tracking-tight">Want to be the first to test the engine?</h5>
                                 <p className="text-white/60 font-medium">We're opening beta slots to our Scaler-level partners first.</p>
                             </div>
                             <Link to="/signup" className="px-10 py-5 bg-white text-[#1A2B3B] rounded-2xl font-black text-base hover:bg-orange-50 transition-all shadow-xl active:scale-95 relative z-10 flex items-center gap-3">
                                 Secure My Slot <ArrowRight size={20} />
                             </Link>
                        </div>
                    </div>
                </div>
            </div>

            <PublicFooter />
        </main>
    );
};

export default PublicAI;