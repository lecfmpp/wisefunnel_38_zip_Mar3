import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import LogoIcon from '../components/LogoIcon';
import { supabase } from '../services/supabaseClient';

const Cookies: React.FC = () => {
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
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <LogoIcon className="w-10 h-10" />
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100"><Cookie size={12} /> Cookie Policy</div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#1A2B3B]">Cookie <span className="text-orange-500">Policy.</span></h1>
                    <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">We use cookies to provide a secure and seamless Wisefunnel experience.</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-24 space-y-12">
                <section className="space-y-6">
                    <h2 className="text-3xl font-black tracking-tight">Essential Cookies</h2>
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50"><span className="font-bold">_wisefunnel_session</span><span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">Essential</span></div>
                        <p className="text-sm text-gray-500 font-medium">Stores your Wisefunnel login session securely.</p>
                    </div>
                </section>
                <div className="pt-20 border-t border-gray-100">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-black text-orange-500 hover:gap-4 transition-all"><ArrowLeft size={16} /> Return to Homepage</Link>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default Cookies;