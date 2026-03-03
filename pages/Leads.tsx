import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import GlobalSidebar from '../components/GlobalSidebar';
import { 
    Search, 
    ChevronDown, 
    X,
    Check,
    Loader2,
    Layout,
    ExternalLink,
    Filter,
    PhoneCall,
    Trash2,
    Minus,
    Mail,
    CheckCircle2,
    Info as InfoIcon,
    AlertCircle,
    Copy,
    Building2,
    Zap,
    ShieldCheck,
    ShieldAlert,
    Clock,
    User,
    ChevronRight,
    ChevronLeft,
    PhoneForwarded,
    Share2,
    Link as LinkIcon,
    RefreshCw,
    PackageCheck,
    HandMetal,
    Send
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Lead } from '../types';
import { sendLeadNotificationEmail } from '../services/emailService';
import { motion, AnimatePresence } from 'framer-motion';
import LogoIcon from '../components/LogoIcon';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    'new': { label: 'New Lead', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', dot: '#3b82f6' },
    'contacted': { label: 'Contacted', color: 'text-sky-700', bg: 'bg-sky-100', border: 'border-sky-200', dot: '#0ea5e9' },
    'qualified': { label: 'Qualified', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', dot: '#10b981' },
    'unqualified': { label: 'Unqualified', color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', dot: '#ef4444' },
    'converted': { label: 'Converted', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-200', dot: '#8b5cf6' },
};

const VERIFICATION_BADGES: Record<string, { label: string, bg: string, text: string, border: string, icon: any }> = {
    'ok': { label: 'Verified', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: ShieldCheck },
    'valid': { label: 'Verified', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: ShieldCheck },
    'verified': { label: 'Verified', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: ShieldCheck },
    'fail': { label: 'Invalid', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: ShieldAlert },
    'failed': { label: 'Failed', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: ShieldAlert },
    'pending': { label: 'Pending', bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100', icon: Clock },
    'unknown': { label: 'Unknown', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', icon: Clock },
};

const ShareLiveFeedModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    buyers: any[];
    onToast: (msg: string, type: ToastType) => void;
}> = ({ isOpen, onClose, buyers, onToast }) => {
    const [selectedBuyerId, setSelectedBuyerId] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const selectedBuyer = buyers.find(b => b.id === selectedBuyerId);
    const buyerSlug = selectedBuyer?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || 'report';
    const liveLink = selectedBuyerId ? `https://wisefunnel.io/#/reports/live/${selectedBuyerId}/${buyerSlug}` : '';

    const handleCopy = () => {
        if (!liveLink) return;
        navigator.clipboard.writeText(liveLink);
        setCopied(true);
        onToast("Live report link copied to clipboard!", "success");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-[#1a2b3b]/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm"><Share2 size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-[#1a2b3b]">Share Live Feed</h2>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Generate encrypted partner link</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors bg-muted/50 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-10 space-y-8">
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">1. Select Target Lead Buyer</label>
                        <div className="relative">
                            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <select 
                                value={selectedBuyerId} 
                                onChange={(e) => setSelectedBuyerId(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-muted/20 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all appearance-none"
                            >
                                <option value="">Select a partner...</option>
                                {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                    {selectedBuyerId && (
                        <div className="space-y-4 animate-fade-in-down">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">2. Secure Live Link</label>
                            <div className="p-6 bg-slate-50 border-2 border-dashed border-border rounded-[24px] space-y-4">
                                <p className="text-xs font-mono text-primary break-all leading-relaxed">{liveLink}</p>
                                <button 
                                    onClick={handleCopy}
                                    className="w-full py-4 bg-[#1a2b3b] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied to Clipboard' : 'Copy Access Link'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    count: number;
    isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, count, isLoading }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-[#1a2b3b]/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
                <div className="p-12 flex flex-col items-center text-center space-y-8">
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center shadow-xl shadow-rose-500/10 border border-rose-100">
                        <Trash2 size={44} className={isLoading ? "animate-pulse" : ""} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-[#1a2b3b] tracking-tight uppercase">Delete Records?</h2>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                            Are you sure you want to permanently remove <span className="font-bold text-rose-600">{count}</span> lead{count !== 1 ? 's' : ''}?
                        </p>
                    </div>
                    <div className="flex flex-col w-full gap-3 pt-4">
                        <button onClick={onConfirm} disabled={isLoading} className="w-full py-5 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 transition-all shadow-xl shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Permanently Delete"}
                        </button>
                        <button onClick={onClose} disabled={isLoading} className="w-full py-5 bg-gray-50 text-gray-500 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-30">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DispatchConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    leadName: string;
    isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, leadName, isLoading }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-[#1a2b3b]/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
                <div className="p-12 flex flex-col items-center text-center space-y-8">
                    <div className="w-24 h-24 bg-primary/5 text-primary rounded-[32px] flex items-center justify-center shadow-xl shadow-primary/5 border border-primary/10">
                        <PackageCheck size={44} className={isLoading ? "animate-pulse" : ""} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-[#1a2b3b] tracking-tight uppercase">Resend Lead?</h2>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                            This will manually dispatch a fresh email notification for <span className="font-bold text-[#1a2b3b]">{leadName}</span> to all registered recipients.
                        </p>
                    </div>
                    <div className="flex flex-col w-full gap-3 pt-4">
                        <button onClick={onConfirm} disabled={isLoading} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-3">
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> Dispatch Notification</>}
                        </button>
                        <button onClick={onClose} disabled={isLoading} className="w-full py-5 bg-gray-50 text-gray-500 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-30">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusDropdown: React.FC<{
    currentStatus: LeadStatus;
    onSelect: (status: LeadStatus) => void;
    disabled?: boolean;
    isUpdating?: boolean;
}> = ({ currentStatus, onSelect, disabled, isUpdating }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);
    const activeConfig = LEAD_STATUS_CONFIG[currentStatus] || LEAD_STATUS_CONFIG.new;
    return (
        <div className={`relative ${isOpen ? 'z-[200]' : 'z-auto'}`} ref={dropdownRef}>
            <button
                disabled={disabled || isUpdating}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest border transition-all ${activeConfig.bg} ${activeConfig.color} ${activeConfig.border} ${(!disabled && !isUpdating) ? 'hover:shadow-md active:scale-95 cursor-pointer' : 'opacity-70 cursor-not-allowed'} whitespace-nowrap capitalize`}
            >
                {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeConfig.dot }} />}
                {activeConfig.label}
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-border rounded-2xl shadow-2xl z-[200] py-2 overflow-hidden animate-scale-in origin-top-left">
                    {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((status) => {
                        const config = LEAD_STATUS_CONFIG[status];
                        const isSelected = status === currentStatus;
                        return (
                            <button key={status} onClick={(e) => { e.stopPropagation(); onSelect(status); setIsOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-all ${isSelected ? 'bg-muted/30' : 'hover:bg-muted/50'}`}>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.dot }} />
                                    <span className="text-[10px] font-bold tracking-widest leading-none capitalize">{config.label}</span>
                                </div>
                                {isSelected && <Check size={14} className="text-primary" strokeWidth={3} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const CustomCheckbox: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => (
    <div onClick={(e) => { e.stopPropagation(); onChange(); }} className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer ${checked || indeterminate ? 'bg-primary border-primary text-primary-foreground shadow-lg' : 'border-border bg-white hover:border-primary'}`}>
        {checked && <Check size={16} strokeWidth={4} />}
        {!checked && indeterminate && <Minus size={16} strokeWidth={4} />}
    </div>
);

const Leads: React.FC = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [funnelPagesMap, setFunnelPagesMap] = useState<Record<string, any[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [availableFunnels, setAvailableFunnels] = useState<any[]>([]);
    const [availableBuyers, setAvailableBuyers] = useState<any[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFunnelId, setFilterFunnelId] = useState('all');
    const [filterBuyerId, setFilterBuyerId] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set<string>());
    const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
    const [dispatchingLeadId, setDispatchingLeadId] = useState<string | null>(null);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [pendingDispatchLead, setPendingDispatchLead] = useState<Lead | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => typeof id === 'string' && removeToast(id), 4000);
    };
    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    useEffect(() => {
        const init = async () => {
            const funnels = await fetchWorkspaceData();
            if (funnels) {
                fetchLeads(funnels);
            }
        };
        init();
    }, [filterFunnelId, filterBuyerId, filterStatus, currentPage, pageSize, searchTerm]);

    const fetchWorkspaceData = async () => {
        try {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) return null;
            // Updated to select settings and workspace_id for manual email dispatch
            const { data: funnels } = await supabase.from('funnels').select('id, name, slug, settings, workspace_id').eq('workspace_id', workspaceId);
            setAvailableFunnels(funnels || []);
            const { data: buyers } = await supabase.from('lead_buyers').select('id, name, lead_buyer_funnels(funnel_id)').eq('workspace_id', workspaceId).eq('status', 'active');
            setAvailableBuyers(buyers || []);
            return funnels;
        } catch (err) { console.error(err); return null; }
    };

    const fetchLeads = async (funnelsList: any[]) => {
        setIsLoading(true);
        try {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) return;

            let targetFunnelIds: string[] = [];
            if (filterBuyerId !== 'all') {
                const buyer = availableBuyers.find(b => b.id === filterBuyerId);
                targetFunnelIds = buyer?.lead_buyer_funnels?.map((f: any) => f.funnel_id) || [];
            } else {
                targetFunnelIds = funnelsList.map(f => f.id);
            }

            if (filterFunnelId !== 'all') {
                targetFunnelIds = targetFunnelIds.filter(id => id === filterFunnelId);
            }

            if (targetFunnelIds.length === 0) { setLeads([]); setTotalCount(0); setIsLoading(false); return; }

            const { data: pages } = await supabase.from('funnel_pages').select('funnel_id, title, elements').in('funnel_id', targetFunnelIds);
            const pMap: Record<string, any[]> = {};
            pages?.forEach(p => { if (!pMap[p.funnel_id]) pMap[p.funnel_id] = []; pMap[p.funnel_id].push(p); });
            setFunnelPagesMap(pMap);

            let baseQuery = supabase.from('leads').select('*', { count: 'exact' }).in('funnel_id', targetFunnelIds);
            if (searchTerm) baseQuery = baseQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
            if (filterStatus !== 'all') baseQuery = baseQuery.eq('status', filterStatus);

            const { count, data, error } = await baseQuery
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

            if (error) throw error;
            setLeads(data || []);
            setTotalCount(count || 0);
        } finally { setIsLoading(false); }
    };

    const handleUpdateStatus = async (leadId: string, status: LeadStatus) => {
        setUpdatingLeadId(leadId);
        try {
            await supabase.from('leads').update({ status }).eq('id', leadId);
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
            addToast(`Lead status synchronized to ${status}.`, 'success');
        } finally { setUpdatingLeadId(null); }
    };

    const handleManualEmailDispatch = async (lead: Lead) => {
        const funnel = availableFunnels.find(f => f.id === lead.funnel_id);
        const pages = funnelPagesMap[lead.funnel_id];
        
        if (!funnel || !pages) {
            addToast("Funnel context missing. Cannot dispatch.", "error");
            return;
        }

        setDispatchingLeadId(lead.id);
        try {
            const contactData = {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                email_verified_status: lead.email_verified_status,
                phone_verified_status: lead.phone_verified_status
            };

            const res = await sendLeadNotificationEmail(
                contactData,
                lead.quiz_answers,
                pages,
                { ...funnel.settings, workspace_id: funnel.workspace_id },
                funnel.name,
                funnel.id,
                lead.id
            );

            if (res.success) {
                addToast(`Lead notification dispatched to registered recipients.`, 'success');
                setIsDispatchModalOpen(false);
                setPendingDispatchLead(null);
            } else {
                throw new Error(res.error);
            }
        } catch (err: any) {
            addToast(`Dispatch failed: ${err.message}`, "error");
        } finally {
            setDispatchingLeadId(null);
        }
    };

    const confirmDelete = async () => {
        const ids = pendingDeleteId ? [pendingDeleteId] : Array.from(selectedIds);
        if (ids.length === 0) return;
        setIsActionLoading(true);
        try {
            await supabase.from('leads').delete().in('id', ids);
            setSelectedIds(new Set());
            setPendingDeleteId(null);
            setIsDeleteModalOpen(false);
            addToast(`${ids.length} records removed permanently.`, 'success');
            fetchLeads(availableFunnels);
        } finally { setIsActionLoading(false); }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === leads.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(leads.map(l => l.id)));
    };

    const getOrganizedIntelligence = (lead: any) => {
        const pages = funnelPagesMap[lead.funnel_id] || [];
        const entries: { step: string, label: string, value: any }[] = [];
        const quizAnswers = lead.quiz_answers || {};
        const seenFields = new Set<string>();
        pages.forEach((p, idx) => {
            const stepField = p.elements?.find((el: any) => el.type === 'quiz-step')?.content?.field;
            if (stepField && quizAnswers[stepField] !== undefined && !seenFields.has(stepField)) {
                seenFields.add(stepField);
                entries.push({ step: `Step ${idx + 1}`, label: p.title || stepField, value: quizAnswers[stepField] });
            }
        });
        return entries;
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    if (isLoading && leads.length === 0) return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-8">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        scale: [0.8, 1.1, 1],
                        opacity: 1,
                        rotate: 360
                    }} 
                    transition={{ 
                        rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                        scale: { duration: 0.5 }
                    }}
                    className="relative"
                >
                    <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LogoIcon className="w-10 h-10 opacity-40" />
                    </div>
                </motion.div>
                <div className="flex flex-col items-center gap-2">
                    <motion.p 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="font-black text-2xl tracking-tight text-[#1a2b3b]"
                    >
                        Syncing records...
                    </motion.p>
                    <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="w-full h-full bg-primary"
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#F9FAFB] font-sans">
            <style>{`
                .lowercase-typography { text-transform: lowercase; }
                .first-letter-cap::first-letter { text-transform: uppercase; }
                .crm-table-container { overflow: auto; max-height: calc(100vh - 380px); }
            `}</style>
            <GlobalSidebar activeTab="leads" onTabChange={(id) => navigate(`/${id}`)} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <WorkspaceNavbar />
                <main className="flex-1 flex flex-col overflow-hidden p-6 md:p-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-down shrink-0">
                        <div className="space-y-1">
                            <h1 className="text-[34px] font-bold text-[#1a2b3b] tracking-tight">Lead intelligence CRM</h1>
                            <p className="text-muted-foreground font-medium text-sm">Manage and qualify leads captured across all active funnels.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => fetchLeads(availableFunnels)} 
                                disabled={isLoading}
                                className="p-3 bg-white border border-border text-[#1a2b3b] rounded-xl hover:bg-muted transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                title="Refresh Database"
                            >
                                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                            </button>
                            <button onClick={() => setIsShareModalOpen(true)} className="px-6 py-3 bg-white border border-border text-[#1a2b3b] rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-muted transition-all shadow-sm"><Share2 size={18} /> Share Live Feed</button>
                            {selectedIds.size > 0 && <button onClick={() => { setPendingDeleteId(null); setIsDeleteModalOpen(true); }} className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-100 shadow-sm animate-scale-in"><Trash2 size={18} /> Delete ({selectedIds.size})</button>}
                        </div>
                    </div>

                    <div className="bg-white border border-border p-4 rounded-[28px] shadow-sm flex flex-col lg:flex-row gap-4 animate-fade-in-down delay-75 shrink-0">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input type="text" placeholder="Search prospects..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-11 pr-4 py-3 bg-muted/20 border-2 border-border rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all lowercase-typography" />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="relative min-w-[200px]">
                                <select value={filterBuyerId} onChange={e => {setFilterBuyerId(e.target.value); setCurrentPage(1);}} className="w-full pl-4 pr-10 py-3 bg-muted/20 border-2 border-border rounded-xl text-sm font-bold appearance-none outline-none bg-white capitalize">
                                    <option value="all">All Lead Buyers</option>
                                    {availableBuyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                            </div>
                            <div className="relative min-w-[200px]">
                                <select value={filterFunnelId} onChange={e => {setFilterFunnelId(e.target.value); setCurrentPage(1);}} className="w-full pl-4 pr-10 py-3 bg-muted/20 border-2 border-border rounded-xl text-sm font-bold appearance-none outline-none bg-white capitalize">
                                    <option value="all">All Funnels</option>
                                    {availableFunnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                            </div>
                            <div className="relative min-w-[120px]">
                                <select value={pageSize} onChange={e => {setPageSize(Number(e.target.value)); setCurrentPage(1);}} className="w-full pl-4 pr-10 py-3 bg-muted/20 border-2 border-border rounded-xl text-sm font-bold appearance-none outline-none bg-white capitalize">
                                    <option value={25}>25 Per Page</option>
                                    <option value={50}>50 Per Page</option>
                                    <option value={100}>100 Per Page</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-border rounded-[32px] overflow-hidden shadow-sm animate-fade-in-down delay-150 flex flex-col flex-1 min-h-0">
                        <div className="crm-table-container flex-1 scrollbar-hide">
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead className="sticky top-0 z-[100] bg-white border-b border-border shadow-sm">
                                    <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest lowercase-typography">
                                        <th className="px-8 py-5 w-16 text-center bg-white"><CustomCheckbox checked={selectedIds.size === leads.length && leads.length > 0} indeterminate={selectedIds.size > 0 && selectedIds.size < leads.length} onChange={toggleSelectAll} /></th>
                                        <th className="px-2 py-5 w-10 bg-white"></th>
                                        <th className="px-6 py-5 first-letter-cap bg-white">Prospect identity</th>
                                        <th className="px-6 py-5 first-letter-cap bg-white">Source funnel</th>
                                        <th className="px-6 py-5 first-letter-cap bg-white">Current stage</th>
                                        <th className="px-6 py-5 first-letter-cap bg-white">Email status</th>
                                        <th className="px-6 py-5 first-letter-cap bg-white">Phone status</th>
                                        <th className="px-6 py-5 first-letter-cap bg-white">Capture date</th>
                                        <th className="px-8 py-5 text-right pr-12 first-letter-cap bg-white">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {leads.length > 0 ? leads.map((lead) => {
                                        const isExpanded = expandedLeadId === lead.id;
                                        const emailBadge = VERIFICATION_BADGES[lead.email_verified_status || 'pending'] || VERIFICATION_BADGES.pending;
                                        const phoneBadge = VERIFICATION_BADGES[lead.phone_verified_status || 'pending'] || VERIFICATION_BADGES.pending;
                                        const EmailIcon = emailBadge.icon;
                                        const PhoneIcon = phoneBadge.icon;
                                        const funnel = availableFunnels.find(f => f.id === lead.funnel_id);
                                        const funnelUrl = `https://wisefunnel.io/#/funnel/${lead.funnel_id}/${funnel?.slug || 'campaign'}`;

                                        return (
                                            <React.Fragment key={lead.id}>
                                                <tr onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)} className={`group hover:bg-muted/5 transition-all cursor-pointer ${selectedIds.has(lead.id) ? 'bg-primary/[0.02]' : ''} ${isExpanded ? 'bg-primary/5' : ''}`}>
                                                    <td className="px-8 py-6 text-center"><CustomCheckbox checked={selectedIds.has(lead.id)} onChange={() => { const next = new Set(selectedIds); if(next.has(lead.id)) next.delete(lead.id); else next.add(lead.id); setSelectedIds(next); }} /></td>
                                                    <td className="px-2 py-6"><div className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-orange-50 text-white rotate-90 shadow-lg' : 'text-orange-500'}`}><ChevronRight size={18} strokeWidth={3} /></div></td>
                                                    <td className="px-6 py-6"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs lowercase-typography first-letter-cap">{(lead.name || 'L').charAt(0)}</div><div className="min-w-0"><p className="font-bold text-[#1a2b3b] text-sm truncate max-w-[180px] first-letter-cap">{lead.name || 'Lead'}</p><p className="text-[10px] font-normal text-muted-foreground uppercase truncate max-w-[180px] lowercase-typography">{lead.email}</p></div></div></td>
                                                    <td className="px-6 py-6"><a href={funnelUrl} target="_blank" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline group/link whitespace-nowrap capitalize"><span className="truncate max-w-[140px]">{lead.source_funnel_name || 'Active Funnel'}</span><ExternalLink size={12} className="opacity-40 group-hover/link:opacity-100 transition-opacity" /></a></td>
                                                    <td className="px-6 py-6"><StatusDropdown currentStatus={lead.status as LeadStatus} onSelect={(s) => handleUpdateStatus(lead.id, s)} isUpdating={updatingLeadId === lead.id} /></td>
                                                    <td className="px-6 py-6"><div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest border ${emailBadge.bg} ${emailBadge.text} ${emailBadge.border} whitespace-nowrap capitalize`}><EmailIcon size={12} /><span>{emailBadge.label}</span></div></td>
                                                    <td className="px-6 py-6"><div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest border ${phoneBadge.bg} ${phoneBadge.text} ${phoneBadge.border} whitespace-nowrap capitalize`}><PhoneIcon size={12} /><span>{phoneBadge.label}</span></div></td>
                                                    <td className="px-6 py-6"><div className="flex flex-col text-[11px] lowercase-typography"><span className="text-[#1a2b3b] font-bold first-letter-cap">{new Date(lead.created_at).toLocaleDateString()}</span><span className="text-muted-foreground font-normal uppercase tracking-widest opacity-60">{new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></td>
                                                    <td className="px-8 py-6 text-right pr-12"><div className="flex items-center justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); setPendingDispatchLead(lead); setIsDispatchModalOpen(true); }} disabled={dispatchingLeadId === lead.id} className="p-2.5 bg-white border border-border rounded-xl text-[#1a2b3b] hover:text-primary hover:border-primary/30 transition-all shadow-sm disabled:opacity-50" title="Resend lead notification to buyers">{dispatchingLeadId === lead.id ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={18} strokeWidth={2.5} />}</button><a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="p-2.5 bg-white border border-border rounded-xl text-[#1a2b3b] hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"><PhoneForwarded size={16} strokeWidth={2.5} /></a><button onClick={(e) => { e.stopPropagation(); setPendingDeleteId(lead.id); setIsDeleteModalOpen(true); }} className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:text-rose-600 transition-all border border-transparent hover:border-rose-200"><Trash2 size={16} strokeWidth={2.5} /></button></div></td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/50"><td colSpan={9} className="px-12 py-10 animate-fade-in-down border-b border-border shadow-inner"><div className="w-full space-y-8 text-left">
                                                        <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"><Zap size={22} fill="currentColor" strokeWidth={0} /></div><div className="space-y-0.5"><h4 className="text-lg font-bold text-[#1a2b3b] uppercase tracking-tight first-letter-cap">intelligence record</h4><p className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest first-letter-cap">Full behavior profiling</p></div></div>
                                                        <div className="space-y-6">
                                                            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-border/60 pb-3 first-letter-cap">prospect answers</h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                {getOrganizedIntelligence(lead).length > 0 ? getOrganizedIntelligence(lead).map((entry, idx) => (
                                                                    <div key={idx} className="flex flex-col gap-2 p-5 bg-white border border-border rounded-[24px] shadow-sm group hover:border-primary/20 transition-all">
                                                                        <span className="text-sm font-bold text-primary tracking-tight first-letter-cap">
                                                                            {entry.step} — {entry.label}
                                                                        </span>
                                                                        <div className="text-sm font-bold text-[#1a2b3b] leading-relaxed first-letter-cap">
                                                                            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value?.toString() || '--'}
                                                                        </div>
                                                                    </div>
                                                                )) : <p className="text-xs font-normal text-muted-foreground italic first-letter-cap col-span-full">no logic responses recorded.</p>}
                                                            </div>
                                                        </div>
                                                    </div></td></tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    }) : <tr><td colSpan={9} className="px-8 py-32 text-center opacity-30 grayscale pointer-events-none space-y-4"><Search size={64} className="mx-auto" /><p className="font-bold uppercase tracking-widest text-sm">No matches found</p></td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-border/60 bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                            <p className="text-xs font-normal text-muted-foreground first-letter-cap">Showing <span className="text-[#1a2b3b] font-bold">{leads.length}</span> of <span className="text-[#1a2b3b] font-bold">{totalCount}</span> results</p>
                            <div className="flex items-center gap-2">
                                <button disabled={currentPage === 1 || isLoading} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2.5 rounded-xl border border-border bg-white text-muted-foreground hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={18} strokeWidth={3} /></button>
                                <div className="flex items-center gap-1.5 px-4">
                                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                        const pageNum = i + 1;
                                        return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-[#1a2b3b] text-white shadow-lg' : 'bg-white border border-border text-muted-foreground hover:bg-muted'}`}>{pageNum}</button>;
                                    })}
                                    {totalPages > 5 && <span className="text-muted-foreground font-bold px-2">...</span>}
                                </div>
                                <button disabled={currentPage === totalPages || totalPages === 0 || isLoading} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2.5 rounded-xl border border-border bg-white text-muted-foreground hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={18} strokeWidth={3} /></button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => {setIsDeleteModalOpen(false); setPendingDeleteId(null);}} onConfirm={confirmDelete} count={pendingDeleteId ? 1 : selectedIds.size} isLoading={isActionLoading} />
            <DispatchConfirmationModal isOpen={isDispatchModalOpen} onClose={() => {setIsDispatchModalOpen(false); setPendingDispatchLead(null);}} onConfirm={() => pendingDispatchLead && handleManualEmailDispatch(pendingDispatchLead)} leadName={pendingDispatchLead?.name || 'this lead'} isLoading={dispatchingLeadId !== null} />
            <ShareLiveFeedModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} buyers={availableBuyers} onToast={addToast} />
            <div className="fixed bottom-6 right-6 z-[600] flex flex-col gap-3 pointer-events-none">{toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto flex items-center gap-3 px-5 py-4 bg-white border border-border rounded-[16px] shadow-2xl min-w-[320px] animate-slide-in-right overflow-hidden group relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-50 text-green-600' : toast.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{toast.type === 'success' ? <CheckCircle2 size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Zap size={20} />}</div>
                    <div className="flex-1"><p className="text-sm font-bold text-[#1a2b3b] first-letter-cap">{toast.message}</p></div>
                    <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
                </div>
            ))}</div>
        </div>
    );
};

export default Leads;