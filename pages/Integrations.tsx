
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import GlobalSidebar from '../components/GlobalSidebar';
import { 
    Network, 
    Search, 
    Zap, 
    Info, 
    X, 
    ShieldCheck, 
    ExternalLink, 
    Loader2, 
    CheckCircle2, 
    ChevronRight, 
    Layout, 
    Clock, 
    Lock,
    Mail,
    User,
    MessageSquare,
    AlertTriangle,
    Plus,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Integration {
    id: string;
    name: string;
    description: string;
    logo: string;
    category: 'CRM' | 'Analytics' | 'Ads' | 'Communication' | 'Automation';
}

const INTEGRATIONS: Integration[] = [
    { 
        id: 'slack', 
        name: 'Slack', 
        description: 'Get real-time lead notifications in your Slack channels.', 
        logo: 'https://api.iconify.design/simple-icons:slack.svg?color=%23f97316',
        category: 'Communication'
    },
    { 
        id: 'instantly', 
        name: 'Instantly', 
        description: 'Push verified leads directly into your cold email campaigns.', 
        logo: 'https://api.iconify.design/lucide:zap.svg?color=%23f97316',
        category: 'Communication'
    },
    { 
        id: 'smartlead', 
        name: 'Smartlead', 
        description: 'Scale your outreach by sending leads to Smartlead campaigns.', 
        logo: 'https://api.iconify.design/lucide:megaphone.svg?color=%23f97316',
        category: 'Communication'
    },
    { 
        id: 'webhook', 
        name: 'Webhook', 
        description: 'Connect to any external API or endpoint with ease.', 
        logo: 'https://api.iconify.design/lucide:webhook.svg?color=%23f97316',
        category: 'Automation'
    },
    { 
        id: 'ga4', 
        name: 'Google Analytics 4', 
        description: 'Track funnel conversions and visitor behavior events.', 
        logo: 'https://api.iconify.design/simple-icons:googleanalytics.svg?color=%23f97316',
        category: 'Analytics'
    },
    { 
        id: 'gtm', 
        name: 'Google Tag Manager', 
        description: 'Manage all your tracking scripts in one central place.', 
        logo: 'https://api.iconify.design/simple-icons:googletagmanager.svg?color=%23f97316',
        category: 'Analytics'
    },
    { 
        id: 'meta', 
        name: 'Meta Ads', 
        description: 'Optimize your FB & IG campaigns with lead feedback loop.', 
        logo: 'https://api.iconify.design/simple-icons:meta.svg?color=%23f97316',
        category: 'Ads'
    },
    { 
        id: 'linkedin', 
        name: 'LinkedIn Ads', 
        description: 'Sync high-quality B2B leads with your LinkedIn campaigns.', 
        logo: 'https://api.iconify.design/simple-icons:linkedin.svg?color=%23f97316',
        category: 'Ads'
    }
];

const WaitlistModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    integrationName: string;
    isRecommendation?: boolean;
}> = ({ isOpen, onClose, integrationName, isRecommendation = false }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [recommendation, setRecommendation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Note: Ensure the 'recommendation' column exists in Supabase.
            // If it doesn't, this request will fail with a PostgREST error.
            const payload: any = { 
                name: name.trim(), 
                email: email.trim().toLowerCase(), 
                source: isRecommendation ? `Integration - Suggestion` : `Integration - ${integrationName}`,
                status: 'waitlist'
            };

            // Only add recommendation if provided to avoid schema issues if the column is missing
            if (isRecommendation && recommendation.trim()) {
                payload.recommendation = recommendation.trim();
            }

            const { error: dbError } = await supabase
                .from('waitlist')
                .insert([payload]);

            if (dbError) {
                if (dbError.code === '23505') {
                    throw new Error("You're already on the list! We'll reach out once this connection is active.");
                }
                if (dbError.message.includes('recommendation')) {
                    throw new Error("Database schema update required. Please run the SQL fix in your Supabase Editor.");
                }
                throw dbError;
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "Request failed. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a2b3b]/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-sm">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1a2b3b] tracking-tight">
                                {isRecommendation ? 'Suggest Integration' : 'Join Waitlist'}
                            </h2>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                {isRecommendation ? 'Help us prioritize' : `Unlock ${integrationName}`}
                            </p>
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
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Requirement Received!</h3>
                                <p className="text-muted-foreground font-medium">We've added your request to our engineering roadmap. We'll notify you as soon as this sync is available.</p>
                            </div>
                            <button onClick={onClose} className="w-full py-4 bg-[#1a2b3b] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all">Back to Integrations</button>
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
                                        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agency@company.com" className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all" />
                                    </div>
                                </div>

                                {isRecommendation && (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Which tool do you need?</label>
                                        <textarea required rows={3} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="e.g. HubSpot, GoHighLevel, WhatsApp..." className="w-full px-5 py-4 bg-muted/30 border-2 border-border rounded-2xl text-sm font-medium focus:border-primary focus:bg-white outline-none transition-all resize-none" />
                                    </div>
                                )}
                            </div>

                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <>{isRecommendation ? 'Submit Suggestion' : 'Get Notified'} <ArrowRight size={20}/></>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const Integrations: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [waitlistState, setWaitlistState] = useState<{ isOpen: boolean; integrationName: string; isRecommendation: boolean }>({ 
        isOpen: false, 
        integrationName: '', 
        isRecommendation: false 
    });

    const filteredIntegrations = INTEGRATIONS.filter(integration => 
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openWaitlist = (name: string, isRec = false) => {
        setWaitlistState({ isOpen: true, integrationName: name, isRecommendation: isRec });
    };

    return (
        <div className="flex min-h-screen bg-[#F9FAFB] font-sans selection:bg-orange-100">
            <GlobalSidebar 
                activeTab="integrations" 
                onTabChange={() => {}} 
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <WorkspaceNavbar />
                
                <main className="flex-1 w-full mx-auto pt-12 pb-32 px-12 overflow-y-auto scrollbar-hide">
                    <div className="max-w-[1600px] mx-auto space-y-10">
                        <div className="animate-fade-in-down">
                            <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight mb-2">Connectivity Hub</h1>
                            <p className="text-muted-foreground font-medium">Sync your leads directly to the apps that power your agency's fulfillment.</p>
                        </div>

                        <div className="flex items-center gap-4 animate-fade-in-down">
                            <div className="relative flex-1 max-w-md">
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Search 100+ planned apps..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[16px] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground shadow-sm"
                                />
                            </div>
                            <div className="bg-orange-50 px-5 py-2.5 rounded-xl flex items-center gap-2 border border-orange-100">
                                <Clock size={16} className="text-orange-500" />
                                <span className="text-xs font-black uppercase text-orange-600 tracking-widest">Enabling Early Access</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in-down pb-10">
                            {filteredIntegrations.map((integration) => (
                                <div 
                                    key={integration.id} 
                                    className="group bg-white border border-border/40 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all flex flex-col h-[400px] relative overflow-hidden"
                                >
                                    <div className="absolute top-8 left-8">
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                                            {integration.category}
                                        </span>
                                    </div>

                                    <div className="absolute top-7 right-8">
                                        <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-border flex items-center gap-1.5 shadow-sm group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                            <Lock size={12} className="shrink-0" />
                                            Enabling
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center relative mt-4">
                                        <div className="w-20 h-20 flex items-center justify-center relative z-10 p-2">
                                            <img 
                                                src={integration.logo} 
                                                alt={integration.name} 
                                                className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0" 
                                            />
                                        </div>
                                    </div>

                                    <div className="text-center space-y-2 mb-8">
                                        <h3 className="font-black text-xl text-[#1a2b3b] group-hover:text-primary transition-colors tracking-tight">
                                            {integration.name}
                                        </h3>
                                        <p className="text-[13px] text-muted-foreground leading-relaxed font-medium line-clamp-2 px-2">
                                            {integration.description}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => openWaitlist(integration.name)}
                                        className="w-full py-4 bg-muted/30 group-hover:bg-[#1a2b3b] text-muted-foreground group-hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                                    >
                                        <Clock size={16} />
                                        Request Early Slot
                                    </button>
                                </div>
                            ))}

                            <div 
                                onClick={() => openWaitlist('', true)}
                                className="group h-[400px] border-2 border-dashed border-border rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all gap-6 shadow-sm p-10 text-center"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                    <Plus size={32} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-[#1a2b3b] group-hover:text-primary transition-colors tracking-tight">Missed Something?</h3>
                                    <p className="text-sm text-muted-foreground font-medium mt-2 leading-relaxed">Let us know what you need. We build the highest requested tools first.</p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest border-2 border-primary/20 px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                                    Suggest Integration
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <WaitlistModal 
                isOpen={waitlistState.isOpen} 
                onClose={() => setWaitlistState({ ...waitlistState, isOpen: false })} 
                integrationName={waitlistState.integrationName}
                isRecommendation={waitlistState.isRecommendation}
            />
        </div>
    );
};

export default Integrations;
