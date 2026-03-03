import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import LogoIcon from '../components/LogoIcon';
import { supabase } from '../services/supabaseClient';

const Terms: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
        };
        checkAuth();
    }, []);

    return (
        <div className="h-full overflow-y-auto bg-[#F8FAFC] font-sans text-[#1A2B3B] scroll-smooth">
             <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <LogoIcon className="w-8 h-8" />
                        <span className="font-black text-2xl tracking-tighter text-[#1A2B3B]">wisefunnel</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {isLoggedIn ? (
                            <Link to="/dashboard" className="px-6 py-2.5 bg-[#1A2B3B] text-white rounded-xl text-sm font-black hover:opacity-90 shadow-lg shadow-black/10 transition-all active:scale-95">
                                Dashboard
                            </Link>
                        ) : (
                            <Link to="/signup" className="text-sm font-black px-6 py-2 bg-[#1A2B3B] text-white rounded-xl hover:opacity-90 transition-all">Get Started</Link>
                        )}
                    </div>
                </div>
            </nav>

            <header className="pt-40 pb-20 px-6 bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                        <FileText size={12} /> Last updated: Oct 24, 2023
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#1A2B3B]">Terms of <span className="text-orange-500">Service.</span></h1>
                    <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">Please read these terms carefully before using Wisefunnel.</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-24 space-y-16">
                <section className="space-y-6">
                    <h2 className="text-3xl font-black tracking-tight">1. Acceptable Use</h2>
                    <p className="text-lg text-gray-600 leading-relaxed">Wisefunnel is designed for professional lead generation agencies. You agree not to use the platform for any illegal activities.</p>
                </section>
                <div className="pt-20 border-t border-gray-100">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-black text-orange-500 hover:gap-4 transition-all"><ArrowLeft size={16} /> Return to Homepage</Link>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default Terms;