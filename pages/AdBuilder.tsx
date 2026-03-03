import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalSidebar from '../components/GlobalSidebar';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import { 
    LayoutTemplate, 
    Sparkles, 
    Zap, 
    Clock, 
    Lock, 
    ChevronRight, 
    ArrowRight,
    Search,
    Megaphone,
    Rocket,
    X,
    Loader2,
    CheckCircle2,
    User,
    Mail,
    AlertTriangle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AdPlatform {
    id: string;
    name: string;
    description: string;
    logo: string;
    category: string;
    status: 'coming_soon' | 'alpha';
}

const AD_PLATFORMS: AdPlatform[] = [
    { 
        id: 'google-ads', 
        name: 'Google Ads', 
        description: 'Auto-generate search and display ads based on your funnel USPs and landing page content.', 
        logo: 'https://api.iconify.design/simple-icons:googleads.svg?color=%23f97316',
        category: 'Search & Display',
        status: 'coming_soon'
    },
    { 
        id: 'meta-ads', 
        name: 'Meta Ads', 
        description: 'Create high-converting Facebook and Instagram ad copy and creative sets optimized for mobile.', 
        logo: 'https://api.iconify.design/simple-icons:meta.svg?color=%23f97316',
        category: 'Social Media',
        status: 'coming_soon'
    },
    { 
        id: 'linkedin-ads', 
        name: 'LinkedIn Ads', 
        description: 'B2B targeted ad generation for professional services, perfectly synced with your quiz logic.', 
        logo: 'https://api.iconify.design/simple-icons:linkedin.svg?color=%23f97316',
        category: 'Professional Network',
        status: 'coming_soon'
    }
];

const WaitlistModal: React.FC<{ isOpen: boolean; onClose: () => void; source?: string }> = ({ isOpen, onClose, source = 'General' }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error: dbError } = await supabase
                .from('waitlist')
                .insert([{ 
                    name: name.trim(), 
                    email: email.trim().toLowerCase(), 
                    source: `AdBuilder - ${source}`,
                    status: 'waitlist'
                }]);

            if (dbError) {
                if (dbError.code === '23505') {
                    throw new Error("You're already on the waitlist! We'll notify you soon.");
                }
                throw dbError;
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1a2b3b]/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-sm">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1a2b3b] tracking-tight">Join the Waitlist</h2>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Early Access Ad Builder</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-muted/50 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-10">
                    {isSuccess ? (
                        <div className="text-center space-y-6 animate-fade-in-down py-4">
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-green-500/10 border border-green-100">
                                <CheckCircle2 size={40} className="animate-bounce" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">You're in line!</h3>
                                <p className="text-muted-foreground font-medium">We'll notify you as soon as the Creative Engine is ready for your agency.</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-full py-4 bg-[#1a2b3b] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-fade-in-down">
                                    <AlertTriangle size={18} /> {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                        <input 
                                            required
                                            type="text" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                        <input 
                                            required
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="agency@company.com"
                                            className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <>Claim Early Access <ArrowRight size={20}/></>}
                            </button>
                            
                            <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                                * Early access members receive 50% off for 6 months.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [waitlistState, setWaitlistState] = useState<{ isOpen: boolean; source: string }>({ 
        isOpen: false, 
        source: '' 
    });

    const filteredPlatforms = AD_PLATFORMS.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openWaitlist = (source: string) => {
        setWaitlistState({ isOpen: true, source });
    };

    return (
        <div className="flex min-h-screen bg-background font-sans selection:bg-orange-100">
            <GlobalSidebar 
                activeTab="ad-builder" 
                onTabChange={(id) => id !== 'ad-builder' && navigate(`/${id}`)} 
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <WorkspaceNavbar />
                
                <main className="flex-1 w-full mx-auto px-12 pt-12 pb-32 overflow-y-auto scrollbar-hide">
                    <div className="max-w-[1600px] mx-auto space-y-10 pb-10">
                        {/* Header Area */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-down">
                            <div className="space-y-2">
                                <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight">Ad Builder</h1>
                                <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
                                    Generate professional ad creatives and high-intent copy directly from your funnel data. Synchronize your messaging from click to conversion.
                                </p>
                            </div>
                        </div>

                        {/* Search & Tool Area */}
                        <div className="flex items-center gap-4 animate-fade-in-down delay-75">
                            <div className="relative flex-1 max-w-md">
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Search ad platforms..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[16px] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground shadow-sm"
                                />
                            </div>
                            <div className="hidden lg:flex bg-muted/40 px-5 py-3 rounded-2xl items-center gap-3 border border-border">
                                <Clock size={18} className="text-muted-foreground" />
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Early Access Coming Soon</span>
                            </div>
                        </div>

                        {/* Platform Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-down delay-150">
                            {filteredPlatforms.map((platform) => (
                                <div 
                                    key={platform.id} 
                                    className="group bg-white border border-border/60 rounded-[28px] p-10 shadow-sm relative overflow-hidden transition-all flex flex-col h-[420px] opacity-100"
                                >
                                    <div className="absolute top-10 left-10 z-20">
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                                            {platform.category}
                                        </span>
                                    </div>

                                    <div className="absolute top-9 right-10 z-20">
                                        <div className="bg-muted text-muted-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-border flex items-center gap-2 shadow-sm group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-100 transition-colors">
                                            <Lock size={12} className="shrink-0" />
                                            Enabling Soon
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center relative mt-4 z-20">
                                        <div className="w-24 h-24 flex items-center justify-center transition-all duration-700">
                                            <img 
                                                src={platform.logo} 
                                                alt={platform.name} 
                                                className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700 opacity-100" 
                                            />
                                        </div>
                                    </div>

                                    <div className="text-center space-y-3 mb-4 z-20">
                                        <h3 className="font-black text-2xl text-[#1a2b3b] tracking-tight group-hover:text-primary transition-colors">
                                            {platform.name}
                                        </h3>
                                        <p className="text-[14px] text-muted-foreground leading-relaxed font-medium line-clamp-2 px-4">
                                            {platform.description}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-border/40 w-full z-20">
                                        <button 
                                            onClick={() => openWaitlist(platform.name)}
                                            className="w-full py-4 bg-muted/30 text-muted-foreground hover:bg-primary hover:text-white transition-all rounded-[20px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                        >
                                            <Rocket size={16} />
                                            Join Waitlist
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Additional Coming Soon Card (AI Smart Creative) */}
                            <div className="group bg-gradient-to-br from-orange-500 to-[#F97316] rounded-[28px] p-10 shadow-xl shadow-orange-500/20 relative overflow-hidden flex flex-col h-[420px] border border-white/10">
                                <div className="absolute top-0 right-0 -translate-y-4 translate-x-4">
                                    <Sparkles size={160} className="text-white/10 rotate-12" />
                                </div>
                                
                                <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-center">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                        <Megaphone size={32} className="text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-white leading-tight tracking-tight">AI Smart Creative</h3>
                                        <p className="text-white/80 font-medium text-base leading-relaxed">
                                            Our proprietary neural network will soon analyze your funnel conversions to auto-adjust ad headlines in real-time.
                                        </p>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-auto pt-6">
                                    <button 
                                        onClick={() => openWaitlist('AI Smart Creative')}
                                        className="w-full py-4 bg-white text-primary rounded-[20px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-50 transition-all shadow-lg active:scale-95"
                                    >
                                        <Zap size={16} fill="currentColor" />
                                        Secure Early Slot
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <WaitlistModal 
                isOpen={waitlistState.isOpen}
                onClose={() => setWaitlistState({ ...waitlistState, isOpen: false })} 
                source={waitlistState.source}
            />
        </div>
    );
};

export default AdBuilder;