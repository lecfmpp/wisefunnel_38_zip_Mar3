import React, { useState, useEffect, useMemo } from 'react';
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
    Loader2, 
    AlertCircle,
    User,
    ChevronRight,
    MapPin,
    Zap,
    Clock,
    Search,
    ChevronDown,
    Filter,
    Building2,
    MessageSquareText,
    Info as InfoIcon,
    ArrowRight
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';

const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    'new': { label: 'New Lead', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', dot: '#3b82f6' },
    'contacted': { label: 'Contacted', color: 'text-sky-700', bg: 'bg-sky-100', border: 'border-sky-200', dot: '#0ea5e9' },
    'qualified': { label: 'Qualified', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', dot: '#10b981' },
    'unqualified': { label: 'Unqualified', color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', dot: '#ef4444' },
    'converted': { label: 'Converted', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-200', dot: '#8b5cf6' },
};

const PublicLiveReport: React.FC = () => {
    const { buyerId } = useParams<{ buyerId: string }>();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buyer, setBuyer] = useState<any>(null);
    const [leads, setLeads] = useState<any[]>([]);
    const [funnelPagesMap, setFunnelPagesMap] = useState<Record<string, any[]>>({});
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

    useEffect(() => {
        if (!buyerId) {
            setError("No partner identifier detected in URL stream.");
            setIsLoading(false);
            return;
        }
        fetchReportData();
    }, [buyerId]);

    const fetchReportData = async () => {
        setIsLoading(true);
        try {
            const { data: buyerData, error: buyerError } = await supabase
                .from('lead_buyers')
                .select('*')
                .eq('id', buyerId)
                .single();
            
            if (buyerError || !buyerData) throw new Error("The partner profile could not be established.");
            setBuyer(buyerData);

            const { data: assignedFunnels } = await supabase
                .from('lead_buyer_funnels')
                .select('funnel_id')
                .eq('buyer_id', buyerId);
            
            const funnelIds = assignedFunnels?.map(f => f.funnel_id) || [];
            if (funnelIds.length === 0) {
                setLeads([]);
                setIsLoading(false);
                return;
            }

            const { data: pages } = await supabase
                .from('funnel_pages')
                .select('funnel_id, title, type, order_index, elements')
                .in('funnel_id', funnelIds)
                .order('order_index', { ascending: true });

            if (pages) {
                const pMap: Record<string, any[]> = {};
                pages.forEach(p => {
                    if (!pMap[p.funnel_id]) pMap[p.funnel_id] = [];
                    pMap[p.funnel_id].push(p);
                });
                setFunnelPagesMap(pMap);
            }

            const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('*')
                .in('funnel_id', funnelIds)
                .order('created_at', { ascending: false });
            
            if (leadsError) throw leadsError;
            setLeads(leadsData || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            const matchesSearch = (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (l.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [leads, searchTerm, filterStatus]);

    const getOrganizedIntelligence = (lead: any) => {
        const pages = funnelPagesMap[lead.funnel_id] || [];
        const entries: { step: string, label: string, value: any }[] = [];
        const seenFields = new Set<string>();
        
        pages.forEach((p, idx) => {
            const pageField = p.elements?.find((el: any) => el.type === 'quiz-step')?.content?.field;
            if (pageField && 
                lead.quiz_answers?.[pageField] !== undefined && 
                lead.quiz_answers?.[pageField] !== null && 
                lead.quiz_answers?.[pageField] !== '' &&
                !seenFields.has(pageField)) {
                
                seenFields.add(pageField);
                entries.push({
                    step: `Step ${idx + 1}`,
                    label: p.title || 'Data Point',
                    value: lead.quiz_answers[pageField]
                });
            }
        });

        const matchedFields = pages.map((p: any) => p.elements?.find((el: any) => el.type === 'quiz-step')?.content?.field).filter(Boolean);
        Object.entries(lead.quiz_answers || {}).forEach(([key, value]) => {
            if (!matchedFields.includes(key) && !['name', 'email', 'phone'].includes(key.toLowerCase()) && value !== null && value !== '') {
                entries.push({
                    step: 'Intelligence',
                    label: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (str) => str.toUpperCase()),
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
                className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center gap-10"
            >
                <motion.div 
                    animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                        rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                        scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
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
                        Loading Intelligence
                    </motion.p>
                    <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="w-full h-full bg-primary/40"
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );

    if (error) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center shadow-xl">
                <AlertCircle size={40} />
            </div>
            <div className="space-y-4">
                <h1 className="text-3xl font-black text-[#1a2b3b]">Intelligence Stream Interrupted</h1>
                <p className="text-gray-500 font-medium max-sm mx-auto leading-relaxed">{error}</p>
            </div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full overflow-y-auto bg-[#F8FAFC] font-sans text-[#1A2B3B] selection:bg-orange-100 scroll-smooth"
        >
            <div className="bg-white border-b border-gray-200 sticky top-0 z-[100] shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-[#1a2b3b]">{buyer?.name || 'Partner Report'}</h2>
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                Real-time Feed
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2">Secured by</span>
                         <LogoIcon className="h-6 w-auto" />
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12 space-y-8 animate-fade-in-down">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Captured Records</p>
                            <p className="text-3xl font-black text-[#1a2b3b]">{leads.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Latest Delivery</p>
                            <p className="text-3xl font-black text-primary">
                                {leads.length > 0 ? new Date(leads[0].created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search leads..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-border rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
                            />
                        </div>
                        <div className="relative min-w-[180px]">
                            <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-11 pr-10 py-3.5 bg-white border border-border rounded-2xl text-sm font-bold appearance-none outline-none cursor-pointer"
                            >
                                <option value="all">Global Pipeline</option>
                                {Object.keys(LEAD_STATUS_CONFIG).map(s => <option key={s} value={s}>{LEAD_STATUS_CONFIG[s as LeadStatus].label}</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-border rounded-[32px] shadow-sm overflow-hidden animate-fade-in-down">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-border">
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Prospect Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Stage</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Capture Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredLeads.map((lead) => {
                                const isExpanded = expandedLeadId === lead.id;
                                const statusConfig = LEAD_STATUS_CONFIG[lead.status as LeadStatus] || LEAD_STATUS_CONFIG.new;
                                return (
                                    <React.Fragment key={lead.id}>
                                        <tr 
                                            onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                                            className={`group hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-primary/5' : ''}`}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 text-[#1a2b3b] flex items-center justify-center font-black text-xs border border-border group-hover:border-primary/20 transition-all shadow-sm">
                                                        {(lead.name || 'L').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[#1a2b3b]">{lead.name || 'Inquiry'}</p>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{lead.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusConfig.dot }} />
                                                    {statusConfig.label}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                    <Calendar size={14} className="opacity-40" />
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                    <span className="opacity-30">•</span>
                                                    <Clock size={14} className="opacity-40" />
                                                    {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isExpanded ? 'bg-[#1a2b3b] text-white shadow-xl' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                                    View Lead Data
                                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-slate-50/30">
                                                <td colSpan={4} className="px-12 py-10 animate-fade-in-down border-b border-gray-100 shadow-inner">
                                                    <div className="max-w-4xl mx-auto space-y-8">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg">
                                                                    <Zap size={18} />
                                                                </div>
                                                                <h4 className="text-sm font-black text-[#1a2b3b] uppercase tracking-widest">Intelligence Dossier</h4>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {lead.phone && (
                                                                    <a href={`tel:${lead.phone}`} className="px-5 py-2.5 bg-white border border-border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm">
                                                                        <Phone size={14} /> Call Now
                                                                    </a>
                                                                )}
                                                                <a href={`mailto:${lead.email}`} className="px-5 py-2.5 bg-white border border-border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
                                                                    <Mail size={14} /> Send Email
                                                                </a>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="bg-white border border-border rounded-[24px] p-6 shadow-sm space-y-4">
                                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-gray-50 pb-3">Identity Record</h5>
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Full Name</label>
                                                                        <p className="font-bold text-[#1a2b3b]">{lead.name || 'Anonymous'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Contact Phone</label>
                                                                        <p className="font-bold text-[#1a2b3b]">{lead.phone || 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-white border border-border rounded-[24px] p-6 shadow-sm space-y-4">
                                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-gray-50 pb-3">Origin</h5>
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Capture Source</label>
                                                                        <p className="font-bold text-[#1a2b3b]">{lead.source_funnel_name || 'Active Campaign'}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                                        <ShieldCheck size={14} /> Securely Transmitted
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white border border-border rounded-[24px] overflow-hidden shadow-sm">
                                                            <table className="w-full text-left">
                                                                <thead>
                                                                    <tr className="bg-slate-50 border-b border-border">
                                                                        <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-1/3">Qualification Step</th>
                                                                        <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subscriber Answer</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {getOrganizedIntelligence(lead).map((entry, idx) => (
                                                                        <tr key={idx} className="group/row hover:bg-slate-50 transition-colors">
                                                                            <td className="px-8 py-4">
                                                                                <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">{entry.step}</p>
                                                                                <p className="text-sm font-bold text-[#1a2b3b]">{entry.label}</p>
                                                                            </td>
                                                                            <td className="px-8 py-4">
                                                                                <span className="text-sm font-black text-[#1a2b3b] bg-[#F8FAFC] px-4 py-2 rounded-xl border border-border group-hover/row:border-primary/20 transition-all shadow-sm">
                                                                                    {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value?.toString() || '--'}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>
        </motion.div>
    );
};

export default PublicLiveReport;