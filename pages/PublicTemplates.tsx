import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Zap, Briefcase, Sun, Shield, Home, Car, TrendingUp, Sparkles } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import LogoIcon from '../components/LogoIcon';
import { supabase } from '../services/supabaseClient';

const PUBLIC_TEMPLATES = [
  { id: 't1', title: 'High-Ticket Business Loan', niche: 'Finance', icon: <Briefcase className="text-blue-500" />, headline: 'Fast Capital for Your Business', subheadline: 'Get approved for up to $250k in 24 hours.', heroImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop' },
  { id: 't2', title: 'Residential Solar Assessment', niche: 'Solar', icon: <Sun className="text-orange-500" />, headline: 'Slash Your Electric Bill to $0', subheadline: 'See if your home qualifies for programs.', heroImage: 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?q=80&w=800&auto=format&fit=crop' },
  { id: 't3', title: 'Commercial Insurance Lead Gen', niche: 'Insurance', icon: <Shield className="text-purple-500" />, headline: 'Protect What Matters Most', subheadline: 'Compare top carriers and save up to 30%.', heroImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop' },
];

const PublicTemplates: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
        };
        checkAuth();
    }, []);

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
                        <Link to="/ai-builder" className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1.5">
                           <Sparkles size={14} /> AI Migration
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Link to="/dashboard" className="px-6 py-2.5 bg-[#1A2B3B] text-white rounded-xl text-sm font-black hover:opacity-90 shadow-lg shadow-black/10 transition-all active:scale-95">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-bold hover:text-orange-500 transition-colors">Sign In</Link>
                                <Link to="/signup" className="px-6 py-2.5 bg-[#1A2B3B] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-black/10">Start Building</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <header className="pt-40 pb-24 px-6 max-w-4xl mx-auto text-center space-y-6">
                <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter">
                    Ready-to-use <span className="text-orange-500">Funnel Blueprints.</span>
                </h1>
                <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">Choose a layout optimized for your specific industry niche and scale your lead generation efficiency.</p>
            </header>

            <section className="max-w-7xl mx-auto px-6 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {PUBLIC_TEMPLATES.map((t) => (
                        <div key={t.id} className="group border border-gray-100 rounded-[40px] p-3 hover:border-orange-200 hover:shadow-2xl transition-all duration-500 bg-white flex flex-col">
                            <div className="aspect-[4/5] bg-slate-50 rounded-[32px] mb-6 relative overflow-hidden flex flex-col border border-gray-100 shadow-inner group-hover:bg-white transition-colors">
                                <div className="px-4 pt-4 flex justify-between items-center opacity-50 scale-90">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-[8px] text-white font-black">W</div>
                                        <div className="w-12 h-2 bg-gray-200 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 flex flex-col justify-center gap-3">
                                    <h4 className="text-xl font-black text-[#1A2B3B] leading-[1.1] tracking-tight group-hover:text-orange-600 transition-colors">{t.headline}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">{t.subheadline}</p>
                                </div>
                            </div>
                            <div className="px-5 pb-5 space-y-4 mt-auto">
                                <h3 className="text-2xl font-black tracking-tight">{t.title}</h3>
                                <Link to="/signup" className="flex items-center justify-between group/link">
                                    <span className="text-sm font-black text-[#1A2B3B]">Deploy Template</span>
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover/link:bg-orange-500 group-hover/link:text-white transition-all"><ArrowRight size={18} /></div>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <PublicFooter />
        </main>
    );
};

export default PublicTemplates;