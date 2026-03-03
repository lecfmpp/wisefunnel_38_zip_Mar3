import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Mail } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import LogoIcon from '../components/LogoIcon';
import { supabase } from '../services/supabaseClient';

const Imprint: React.FC = () => {
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
                    {isLoggedIn && (
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="px-6 py-2.5 bg-[#1A2B3B] text-white rounded-xl text-sm font-black hover:opacity-90 shadow-lg shadow-black/10 transition-all active:scale-95">
                                Dashboard
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            <header className="pt-40 pb-20 px-6 bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#1A2B3B]">Legal <span className="text-orange-500">Imprint.</span></h1>
                    <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">Company details for Wisefunnel Technologies.</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-24 space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <h2 className="text-3xl font-black tracking-tight">Wisefunnel Technologies Inc.</h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4"><div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0"><MapPin size={20}/></div><p className="text-lg text-gray-600">82 King St East<br/>Toronto, ON M5C 1E9<br/>Canada</p></div>
                            <div className="flex items-center gap-4"><div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0"><Mail size={20}/></div><p className="text-lg font-bold text-[#1A2B3B]">legal@wisefunnel.io</p></div>
                        </div>
                    </div>
                </div>
                <div className="pt-20">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-black text-orange-500 hover:gap-4 transition-all"><ArrowLeft size={16} /> Return to Homepage</Link>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default Imprint;