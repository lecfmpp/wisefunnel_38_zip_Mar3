import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import { 
    CheckCircle2, 
    Mail, 
    Phone, 
    Calendar, 
    ShieldCheck, 
    MessageSquare, 
    ArrowLeft,
    Loader2,
    AlertCircle,
    User,
    ChevronRight,
    MapPin,
    Tag,
    Clock,
    Zap
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

const PublicLeadReport: React.FC = () => {
    const { leadId, funnelId } = useParams<{ leadId: string; funnelId: string }>();
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lead, setLead] = useState<any>(null);
    const [funnel, setFunnel] = useState<any>(null);
    const [pages, setPages] = useState<any[]>([]);

    useEffect(() => {
        if (!leadId || !funnelId) {
            setError("The access link is missing critical parameters.");
            setIsLoading(false);
            return;
        }
        fetchReportData();
    }, [leadId, funnelId]);

    const fetchReportData = async () => {
        setIsLoading(true);
        try {
            const { data: leadData, error: leadError } = await supabase
                .from('leads')
                .select('*')
                .eq('id', leadId)
                .single();
            
            if (leadError || !leadData) throw new Error("Lead intelligence record not found.");
            setLead(leadData);

            const { data: funnelData, error: funnelError } = await supabase
                .from('funnels')
                .select('*')
                .eq('id', funnelId)
                .single();
            
            if (funnelError || !funnelData) throw new Error("Parent campaign no longer exists.");
            setFunnel(funnelData);

            const { data: pagesData } = await supabase
                .from('funnel_pages')
                .select('*')
                .eq('funnel_id', funnelId)
                .order('order_index', { ascending: true });
            
            setPages(pagesData || []);

        } catch (err: any) {
            console.error("Report error:", err.message);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getOrganizedIntelligence = () => {
        if (!lead || !pages) return [];
        const entries: { label: string, value: any, step: string }[] = [];
        const quizAnswers = lead.quiz_answers || {};
        const seenFields = new Set<string>();

        pages.forEach((p, idx) => {
            const stepField = p.elements?.find((el: any) => el.type === 'quiz-step')?.content?.field;
            if (stepField && 
                quizAnswers[stepField] !== undefined && 
                quizAnswers[stepField] !== null && 
                quizAnswers[stepField] !== '' &&
                !seenFields.has(stepField)) {
                
                seenFields.add(stepField);
                entries.push({
                    step: `Logic Step ${idx + 1}`,
                    label: p.title || stepField,
                    value: quizAnswers[stepField]
                });
            }
        });

        const matchedFields = pages.map((p: any) => p.elements?.find((el: any) => el.type === 'quiz-step')?.content?.field).filter(Boolean);
        Object.entries(quizAnswers).forEach(([key, value]) => {
            if (!matchedFields.includes(key) && !['name', 'email', 'phone'].includes(key.toLowerCase()) && value !== null && value !== '') {
                entries.push({
                    step: 'Intelligence',
                    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
                    value
                });
            }
        });

        return entries;
    };

    if (isLoading) return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center gap-8"
            >
                <motion.div 
                    animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                        rotate: { repeat: Infinity, duration: 2.5, ease: "linear" },
                        scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                    }}
                    className="relative"
                >
                    <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full shadow-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LogoIcon className="w-8 h-8 opacity-40" />
                    </div>
                </motion.div>
                <div className="flex flex-col items-center gap-2">
                    <motion.p 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="font-black text-sm uppercase tracking-[0.3em] text-gray-400"
                    >
                        Authenticating Intelligence
                    </motion.p>
                    <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="w-full h-full bg-primary"
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );

    if (error) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-xl">
                <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-black text-[#1a2b3b]">Access Denied</h1>
                <p className="text-gray-500 font-medium max-sm mx-auto">{error}</p>
            </div>
            <button onClick={() => navigate('/')} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all">Return to Home</button>
        </div>
    );

    const primaryColor = funnel?.theme?.primaryColor || '#F97316';
    const intelligence = getOrganizedIntelligence();

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full overflow-y-auto bg-[#F8FAFC] font-sans text-[#1A2B3B] selection:bg-orange-100 scroll-smooth"
        >
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                            {funnel?.settings?.emailNotifications?.logoUrl ? (
                                <img src={funnel.settings.emailNotifications.logoUrl} className="h-6 w-auto object-contain" />
                            ) : (
                                <LogoIcon className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-[#1a2b3b]">Intelligence Report</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Campaign: {funnel.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Secure Live Stream</span>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-10 animate-fade-in-down">
                <div className="bg-white border border-gray-200 rounded-[40px] p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none translate-x-20 -translate-y-20">
                        <ShieldCheck size={256} className="text-primary" />
                    </div>
                    
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] flex items-center justify-center text-white font-black text-4xl shadow-2xl shrink-0" style={{ backgroundColor: primaryColor }}>
                        {lead.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1a2b3b]">{lead.name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold text-gray-400">
                                <div className="flex items-center gap-1.5"><Calendar size={16} /> Captured {new Date(lead.created_at).toLocaleDateString()}</div>
                                <div className="flex items-center gap-1.5"><Clock size={16} /> {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <a href={`mailto:${lead.email}`} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-black/10">
                                <Mail size={16} /> Email Prospect
                            </a>
                            <a href={`tel:${lead.phone}`} className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
                                <Phone size={16} /> Dial Now
                            </a>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm space-y-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 pb-4 border-b border-gray-50">Verified Identity</h3>
                            
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Legal Name</label>
                                    <p className="text-base font-bold text-[#1a2b3b]">{lead.name}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Email Address</label>
                                    <p className="text-base font-bold text-primary break-all">{lead.email}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile Endpoint</label>
                                    <p className="text-base font-bold text-[#1a2b3b]">{lead.phone || 'Not Provided'}</p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                                    <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                                        This contact record has been encrypted and delivered via the Wisefunnel Secure Network.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black text-[#1a2b3b] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <Zap size={18} />
                                </div>
                                Conversion Intelligence
                            </h3>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-muted px-3 py-1 rounded-full text-muted-foreground border border-border/50">
                                {intelligence.length} Records Captured
                            </span>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Source Component</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Insight Record</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {intelligence.length > 0 ? intelligence.map((entry, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">{entry.step}</p>
                                                <p className="text-sm font-bold text-[#1a2b3b]">{entry.label}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-base font-black text-[#1a2b3b] bg-[#F8FAFC] border border-gray-200 px-5 py-2.5 rounded-2xl shadow-sm group-hover:border-primary/20 transition-all">
                                                        {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value?.toString() || '--'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={2} className="px-8 py-20 text-center text-muted-foreground font-medium italic">
                                                No intelligence parameters were specified in this funnel flow.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-8 py-10 text-center space-y-6">
                             <div className="w-px h-12 bg-gradient-to-b from-gray-200 to-transparent mx-auto"></div>
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 max-w-sm mx-auto leading-relaxed">
                                Generated by Wisefunnel Delivery Infrastructure. Unauthorized duplication of this report is strictly prohibited.
                             </p>
                        </div>
                    </div>
                </div>
            </main>
        </motion.div>
    );
};

export default PublicLeadReport;