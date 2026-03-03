import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Network, Mail, MessageSquare, Database, Share2, ChevronRight, Sparkles } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import LogoIcon from '../components/LogoIcon';
import { supabase } from '../services/supabaseClient';

const APPS = [
    { name: "Slack", category: "Communication", desc: "Real-time alerts for your sales team when a new lead qualifies.", icon: <MessageSquare size={32} /> },
    { name: "Instantly", category: "Outreach", desc: "Push verified leads directly into your cold email automation sequences.", icon: <Mail size={32} /> },
    { name: "Meta Ads", category: "Advertising", desc: "Sync conversion events back to Facebook Pixel and CAPI.", icon: <Share2 size={32} /> },
    { name: "GoHighLevel", category: "CRM", desc: "Direct funnel-to-CRM injection for immediate client follow-up.", icon: <Database size={32} /> },
    { name: "Zapier", category: "Automation", desc: "Connect to 5,000+ external apps via our native Zapier app.", icon: <Network size={32} /> },
    { name: "Smartlead", category: "Email", desc: "Automate high-volume personalized outreach to your new contacts.", icon: <Zap size={32} /> },
];

const PublicIntegrations: React.FC = () => {
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
                                <Link to="/signup" className="px-6 py-2.5 bg-[#1A2B3B] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-black/10">Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <header className="pt-40 pb-32 px-6 max-w-5xl mx-auto text-center space-y-8">
                <h1 className="text-5xl md:text-8xl font-black leading-[0.95] tracking-tighter">
                    Lead data, <span className="text-orange-500">delivered everywhere.</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed">
                    Wisefunnel connects natively to your agency's tech stack. No more manual G-Sheet exports. Sync conversions in milliseconds.
                </p>
            </header>

            <section className="max-w-7xl mx-auto px-6 py-20 pb-40">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {APPS.map((app) => (
                        <div key={app.name} className="p-10 border border-gray-100 rounded-[40px] hover:border-orange-200 hover:shadow-2xl transition-all duration-500 space-y-6 bg-white group flex flex-col">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors text-gray-400">{app.icon}</div>
                            <div className="space-y-2 flex-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{app.category}</span>
                                <h3 className="text-2xl font-black text-[#1A2B3B]">{app.name}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{app.desc}</p>
                            </div>
                            <div className="pt-6 flex items-center gap-2 text-sm font-black text-orange-500">Connect Integration <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></div>
                        </div>
                    ))}
                </div>
            </section>

            <PublicFooter />
        </main>
    );
};

export default PublicIntegrations;