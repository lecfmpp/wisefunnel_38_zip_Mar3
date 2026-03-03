import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import GlobalSidebar from '../components/GlobalSidebar';
import { 
    Search, 
    UserPlus, 
    Phone, 
    Mail, 
    Key, 
    MoreHorizontal, 
    Loader2, 
    X,
    Trash2,
    Edit3,
    Building2,
    CheckCircle2,
    ArrowRight,
    Layout,
    AlertCircle,
    ArrowUpDown,
    Filter,
    ChevronDown,
    ShieldCheck,
    Plus,
    Target,
    Check,
    DollarSign,
    Users,
    TrendingUp,
    XCircle,
    Radar,
    Sparkles
} from 'lucide-react';
import { LeadBuyerExtended, BuyerStatus } from '../types';
import { supabase } from '../services/supabaseClient';
import PhoneInput from '../components/PhoneInput';
import LogoIcon from '../components/LogoIcon';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG: Record<BuyerStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    'active': { label: 'Active (Paid)', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    'hold': { label: 'On Hold', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
    'not-contacted': { label: 'Not Contacted', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
    'contacted': { label: 'Contacted', color: 'text-sky-700', bg: 'bg-sky-100', border: 'border-sky-200', dot: 'bg-sky-500' },
    'negotiation': { label: 'In Negotiation', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500' },
    'rejected': { label: 'Rejected', color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', dot: 'bg-rose-500' },
};

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[600] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto flex items-center gap-3 px-5 py-4 bg-white border border-border rounded-[16px] shadow-[0_15px_40px_-5px_rgba(0,0,0,0.15)] min-w-[320px] animate-slide-in-right overflow-hidden group relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-50 text-green-600' : toast.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Target size={20} />}
                    </div>
                    <div className="flex-1"><p className="text-sm font-bold text-[#1a2b3b]">{toast.message}</p></div>
                    <button onClick={() => onRemove(toast.id)} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
                </div>
            ))}
        </div>
    );
};

const BuyerModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (buyer: Partial<LeadBuyerExtended>) => void; 
    availableFunnels: { id: string, name: string }[]; 
    initialData?: LeadBuyerExtended | null;
}> = ({ isOpen, onClose, onSave, availableFunnels, initialData }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        phone: '', 
        notes: '', 
        status: 'not-contacted' as BuyerStatus, 
        funnelIds: [] as string[],
        paymentAmount: 0
    });
    const [paymentInputValue, setPaymentInputValue] = useState<string>('');
    const [isFunnelDropdownOpen, setIsFunnelDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                email: initialData.email,
                phone: initialData.phone,
                notes: initialData.notes,
                status: initialData.status,
                funnelIds: initialData.funnelIds,
                paymentAmount: initialData.paymentAmount || 0
            });
            setPaymentInputValue(initialData.paymentAmount ? initialData.paymentAmount.toString() : '');
        } else {
            setFormData({ name: '', email: '', phone: '', notes: '', status: 'not-contacted', funnelIds: [], paymentAmount: 0 });
            setPaymentInputValue('');
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsFunnelDropdownOpen(false);
            }
        };
        if (isFunnelDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFunnelDropdownOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        onSave({
            ...formData,
            paymentAmount: paymentInputValue === '' ? 0 : parseFloat(paymentInputValue)
        }); 
        onClose(); 
    };

    const toggleFunnel = (id: string) => {
        setFormData(prev => ({
            ...prev,
            funnelIds: prev.funnelIds.includes(id) 
                ? prev.funnelIds.filter(fid => fid !== id) 
                : [...prev.funnelIds, id]
        }));
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-[24px] overflow-hidden shadow-2xl animate-scale-in">
                <div className="p-8 border-b border-border bg-muted/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            {initialData ? <Edit3 size={20} /> : <UserPlus size={20} />}
                        </div>
                        <h2 className="text-xl font-black text-[#1a2b3b]">{initialData ? 'Edit Partner' : 'Add New Buyer'}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[75vh] scrollbar-hide">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Company Identity</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm" placeholder="Enter company name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Email</label>
                            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm" placeholder="email@company.com" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Phone</label>
                            <PhoneInput 
                                value={formData.phone} 
                                onChange={val => setFormData({...formData, phone: val})} 
                                inputClassName="w-full px-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Pipeline Status</label>
                        <div className="relative">
                            <select 
                                value={formData.status} 
                                onChange={(e) => setFormData({...formData, status: e.target.value as BuyerStatus})}
                                className="w-full px-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm appearance-none bg-white"
                            >
                                {Object.keys(STATUS_CONFIG).map((s) => (
                                    <option key={s} value={s}>{STATUS_CONFIG[s as BuyerStatus].label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {formData.status === 'active' && (
                        <div className="animate-fade-in-down">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Monthly Retainer / Payment ($)</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    required 
                                    type="number" 
                                    value={paymentInputValue} 
                                    onChange={e => setPaymentInputValue(e.target.value)} 
                                    className="w-full pl-11 pr-4 py-3 bg-emerald-50/30 border-2 border-emerald-100 rounded-xl focus:border-emerald-500 outline-none font-bold text-sm text-emerald-900" 
                                    placeholder="Enter amount"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Connected Funnels</label>
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                type="button"
                                onClick={() => setIsFunnelDropdownOpen(!isFunnelDropdownOpen)}
                                className="w-full flex items-center justify-between px-4 py-3.5 bg-muted/30 border-2 border-border rounded-xl text-sm font-bold text-foreground transition-all hover:bg-muted/50"
                            >
                                <span className="truncate">
                                    {formData.funnelIds.length === 0 
                                        ? "Select funnels to distribute to..." 
                                        : `${formData.funnelIds.length} Funnel${formData.funnelIds.length === 1 ? '' : 's'} Linked`}
                                </span>
                                <ChevronDown size={18} className={`text-muted-foreground transition-transform ${isFunnelDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFunnelDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-2xl z-[510] py-2 max-h-60 overflow-y-auto animate-scale-in origin-top">
                                    {availableFunnels.length > 0 ? (
                                        availableFunnels.map(f => (
                                            <div 
                                                key={f.id}
                                                onClick={() => toggleFunnel(f.id)}
                                                className="px-5 py-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${formData.funnelIds.includes(f.id) ? 'bg-primary border-primary' : 'border-border bg-white'}`}>
                                                        {formData.funnelIds.includes(f.id) && <Check size={10} className="text-white" strokeWidth={4} />}
                                                    </div>
                                                    <span className="text-sm font-bold text-[#1a2b3b]">{f.name}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-5 py-4 text-center">
                                            <p className="text-xs font-medium text-muted-foreground">No active funnels found.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <button 
                            type="button"
                            onClick={() => navigate('/internal-templates')}
                            className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg border border-dashed border-primary/30 transition-all"
                        >
                            <Plus size={14} strokeWidth={3} /> Create a Funnel for this Partner
                        </button>

                        {formData.funnelIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {formData.funnelIds.map(fid => (
                                    <div key={fid} className="flex items-center gap-1.5 px-2 py-1 bg-[#1a2b3b]/5 text-[#1a2b3b] rounded-lg border border-border group">
                                        <span className="text-[10px] font-black uppercase truncate max-w-[120px]">
                                            {availableFunnels.find(f => f.id === fid)?.name || 'Funnel'}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => toggleFunnel(fid)}
                                            className="p-0.5 text-muted-foreground hover:text-rose-50"
                                        >
                                            <X size={10} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Partner Notes</label>
                        <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-primary outline-none font-medium text-sm resize-none" placeholder="Add specific requirements..." />
                    </div>
                    <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95 mt-4 uppercase tracking-widest">
                        {initialData ? 'Update Partner Records' : 'Register Lead Buyer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const LeadBuyers: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [nicheFilter, setNicheFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'az' | 'za'>('newest');

    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => typeof id === 'string' && removeToast(id), 4000);
    };
    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    const [buyers, setBuyers] = useState<LeadBuyerExtended[]>([]);
    const [availableFunnels, setAvailableFunnels] = useState<{ id: string, name: string }[]>([]);
    const [isLoadingBuyers, setIsLoadingBuyers] = useState(true);
    const [modalState, setModalState] = useState<{ isOpen: boolean; initialData: LeadBuyerExtended | null }>({ isOpen: false, initialData: null });
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    useEffect(() => {
        fetchBuyersAndFunnels();
        window.addEventListener('workspaceChanged', fetchBuyersAndFunnels);
        return () => window.removeEventListener('workspaceChanged', fetchBuyersAndFunnels);
    }, []);

    const fetchBuyersAndFunnels = async () => {
        setIsLoadingBuyers(true);
        try {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) return;

            const { data: funnels } = await supabase.from('funnels').select('id, name').eq('workspace_id', workspaceId);
            setAvailableFunnels(funnels || []);

            const { data, error } = await supabase
                .from('lead_buyers')
                .select('*, lead_buyer_funnels(funnel_id)')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBuyers(data.map(b => ({
                id: b.id,
                name: b.name,
                email: b.email,
                phone: b.phone,
                notes: b.notes || '',
                status: b.status as BuyerStatus,
                statusReason: b.status_reason,
                paymentAmount: b.payment_amount || 0,
                assignedLeads: 0, 
                funnelIds: b.lead_buyer_funnels?.map((f: any) => f.funnel_id) || []
            })));
        } catch (err) {
            console.error("Error fetching buyers:", err);
        } finally {
            setIsLoadingBuyers(false);
        }
    };

    const handleUpdateStatus = async (e: React.MouseEvent, buyerId: string, status: BuyerStatus) => {
        e.stopPropagation();
        try {
            const { error } = await supabase.from('lead_buyers').update({ status }).eq('id', buyerId);
            if (error) throw error;
            
            setBuyers(prev => prev.map(b => b.id === buyerId ? { ...b, status } : b));
            addToast(`Status updated to ${STATUS_CONFIG[status].label}`, 'success');

            if (status === 'active') {
                const buyer = buyers.find(b => b.id === buyerId);
                if (buyer) {
                    setModalState({ isOpen: true, initialData: { ...buyer, status } });
                }
            }
        } catch (err: any) {
            addToast(`Sync Failed: ${err.message}`, 'error');
        }
        setActiveMenuId(null);
    };

    const deleteBuyer = async (e: React.MouseEvent, buyer: LeadBuyerExtended) => {
        e.stopPropagation();
        if (window.confirm(`Permanently remove ${buyer.name} from your network?`)) {
            try {
                await supabase.from('lead_buyers').delete().eq('id', buyer.id);
                setBuyers(prev => prev.filter(b => b.id !== buyer.id));
                addToast(`${buyer.name} removed from network`, 'info');
            } catch (err) { console.error(err); }
            setActiveMenuId(null);
        }
    };

    const handleSavePartner = async (data: Partial<LeadBuyerExtended>) => {
        const workspaceId = localStorage.getItem('active_workspace_id');
        if (!workspaceId) return;

        try {
            if (modalState.initialData) {
                const { error } = await supabase.from('lead_buyers').update({ 
                    name: data.name, 
                    email: data.email, 
                    phone: data.phone, 
                    notes: data.notes,
                    status: data.status,
                    payment_amount: data.paymentAmount
                }).eq('id', modalState.initialData.id);
                
                if (error) throw error;

                await supabase.from('lead_buyer_funnels').delete().eq('buyer_id', modalState.initialData.id);
                if (data.funnelIds && data.funnelIds.length > 0) {
                    const connections = data.funnelIds.map(fid => ({ buyer_id: modalState.initialData!.id, funnel_id: fid }));
                    await supabase.from('lead_buyer_funnels').insert(connections);
                }
                addToast(`Updated records for ${data.name}`, 'success');
            } else {
                const { data: newBuyer, error } = await supabase.from('lead_buyers').insert([{ 
                    workspace_id: workspaceId, 
                    name: data.name, 
                    email: data.email, 
                    phone: data.phone, 
                    notes: data.notes, 
                    status: data.status || 'not-contacted',
                    payment_amount: data.paymentAmount || 0
                }]).select().single();
                
                if (error) throw error;

                if (data.funnelIds && data.funnelIds.length > 0) {
                    const connections = data.funnelIds.map(fid => ({ buyer_id: newBuyer.id, funnel_id: fid }));
                    await supabase.from('lead_buyer_funnels').insert(connections);
                }
                addToast(`Successfully registered ${newBuyer.name}`, 'success');
            }
            fetchBuyersAndFunnels();
        } catch (err: any) { addToast(`Failed: ${err.message}`, "error"); }
    };

    const filteredBuyers = useMemo(() => {
        let result = [...buyers];
        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            result = result.filter(b => b.name.toLowerCase().includes(low) || b.email.toLowerCase().includes(low));
        }
        if (nicheFilter !== 'all') {
            result = result.filter(b => b.funnelIds.includes(nicheFilter));
        }
        if (sortOrder === 'az') result.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortOrder === 'za') result.sort((a, b) => b.name.localeCompare(a.name));
        return result;
    }, [buyers, searchTerm, nicheFilter, sortOrder]);

    const stats = useMemo(() => {
        const total = buyers.length;
        const activeCount = buyers.filter(b => b.status === 'active').length;
        const rejectedCount = buyers.filter(b => b.status === 'rejected').length;
        const conversionRate = total > 0 ? ((activeCount / total) * 100).toFixed(1) : '0';
        
        return [
            { label: 'Recruited', val: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active', val: activeCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Rejected', val: rejectedCount, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Conv. Rate', val: `${conversionRate}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
        ];
    }, [buyers]);

    const truncateEmail = (email: string) => email.length > 24 ? email.substring(0, 21) + '...' : email;

    if (isLoadingBuyers && buyers.length === 0) return (
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
                <div className="flex flex-col items-center gap-2 text-center">
                    <motion.p 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="font-black text-2xl tracking-tight text-[#1a2b3b]"
                    >
                        Syncing profit room...
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
        <div className="flex min-h-screen bg-background font-sans overflow-hidden">
            <GlobalSidebar activeTab="lead-buyers" onTabChange={(id) => navigate(`/${id}`)} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <WorkspaceNavbar />
                
                <main className="flex-1 w-full mx-auto px-12 pt-12 pb-32 overflow-y-auto scrollbar-hide space-y-12">
                    <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-down">
                        <div className="space-y-1">
                            <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight">The Profit Room</h1>
                            <p className="text-muted-foreground font-medium">Your command center for closing deals. Manage your pipeline, track follow-ups, and turn prospects into paying partners.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate('/client-finder')} 
                                className="px-6 py-3 bg-[#F97316] text-white rounded-xl text-sm font-black flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-orange-500/20 whitespace-nowrap"
                            >
                                <Radar size={18} strokeWidth={3} /> Find with AI
                            </button>
                            <button 
                                onClick={() => setModalState({ isOpen: true, initialData: null })} 
                                className="px-6 py-3 bg-[#1a2b3b] text-white rounded-xl text-sm font-black flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-black/10 whitespace-nowrap"
                            >
                                <UserPlus size={18} strokeWidth={3} /> Add a Buyer
                            </button>
                        </div>
                    </div>

                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-down delay-75">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white border border-border rounded-[24px] p-8 shadow-sm group hover:shadow-xl hover:border-primary/20 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <stat.icon size={24} />
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp size={10} /> Live
                                    </div>
                                </div>
                                <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</h3>
                                <p className="text-3xl font-black text-[#1a2b3b]">{stat.val}</p>
                            </div>
                        ))}
                    </div>

                    <section className="max-w-[1400px] mx-auto animate-fade-in-down delay-150">
                        <div className="bg-white border border-border p-4 rounded-[28px] shadow-sm flex flex-col lg:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by company or email..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-muted/20 border-2 border-border rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="relative min-w-[200px]">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <select 
                                        value={nicheFilter}
                                        onChange={e => setNicheFilter(e.target.value)}
                                        className="w-full pl-10 pr-10 py-3 bg-muted/20 border-2 border-border rounded-xl text-sm font-bold appearance-none outline-none cursor-pointer"
                                    >
                                        <option value="all">All Niches</option>
                                        {availableFunnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                                </div>
                                <div className="relative min-w-[180px]">
                                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <select 
                                        value={sortOrder}
                                        onChange={e => setSortOrder(e.target.value as any)}
                                        className="w-full pl-10 pr-10 py-3 bg-muted/20 border-2 border-border rounded-xl text-sm font-bold appearance-none outline-none cursor-pointer"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="az">A to Z</option>
                                        <option value="za">Z to A</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="max-w-[1400px] mx-auto animate-fade-in-down delay-[200ms]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
                            {filteredBuyers.length > 0 ? filteredBuyers.map((buyer) => (
                                <div 
                                    key={buyer.id} 
                                    onClick={() => {
                                        if (!activeMenuId) {
                                            setModalState({ isOpen: true, initialData: buyer });
                                        }
                                    }}
                                    className={`group bg-white border border-border/60 rounded-[32px] p-6 shadow-sm hover:shadow-2xl hover:border-primary/50 transition-all cursor-pointer flex flex-col h-[440px] relative active:scale-[0.98] ${activeMenuId === buyer.id ? 'z-[100] cursor-default' : 'z-10'}`}
                                >
                                    {activeMenuId === buyer.id && (
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} 
                                        />
                                    )}

                                    <div className="h-32 bg-slate-50 rounded-[24px] mb-6 relative flex items-center justify-center">
                                        <Building2 size={48} className="text-primary/10 group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute top-4 right-4 z-50">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setActiveMenuId(activeMenuId === buyer.id ? null : buyer.id); 
                                                }} 
                                                className={`p-2 rounded-xl bg-white/90 backdrop-blur shadow-sm hover:text-primary transition-all ${activeMenuId === buyer.id ? 'text-primary ring-2 ring-primary/20' : 'text-muted-foreground'}`}
                                            >
                                                <MoreHorizontal size={20}/>
                                            </button>
                                            {activeMenuId === buyer.id && (
                                                <div 
                                                    className="absolute right-0 top-full mt-2 w-60 bg-white border border-border rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] z-[200] py-3 animate-scale-in origin-top-right overflow-visible"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="px-5 py-2 mb-1 border-b border-border/50">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.15em]">Update Status</p>
                                                    </div>
                                                    {(Object.keys(STATUS_CONFIG) as BuyerStatus[]).map((status) => (
                                                        <button 
                                                            key={status} 
                                                            onClick={(e) => handleUpdateStatus(e, buyer.id, status)} 
                                                            className={`w-full text-left flex items-center gap-3.5 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${buyer.status === status ? 'bg-orange-50/50' : 'hover:bg-muted/50'}`}
                                                        >
                                                            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[status].dot} shrink-0`} />
                                                            <span className={buyer.status === status ? 'text-[#f97316]' : 'text-[#1a2b3b]'}>{STATUS_CONFIG[status].label}</span>
                                                        </button>
                                                    ))}
                                                    
                                                    <div className="h-px bg-border/60 my-2 mx-4" />
                                                    
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setModalState({ isOpen: true, initialData: buyer }); setActiveMenuId(null); }} 
                                                        className="w-full text-left flex items-center gap-3.5 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-[#1a2b3b] hover:bg-muted/50 transition-all"
                                                    >
                                                        <Edit3 size={16} /> <span>Edit Partner</span>
                                                    </button>

                                                    {buyer.status === 'active' && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); addToast(`Invite link sent to ${buyer.email}`, 'info'); setActiveMenuId(null); }} 
                                                            className="w-full text-left flex items-center gap-3.5 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-primary hover:bg-orange-50/50 transition-all"
                                                        >
                                                            <Key size={16} /> <span>Reset Password</span>
                                                        </button>
                                                    )}
                                                    
                                                    <div className="h-px bg-border/60 my-2 mx-4" />
                                                    
                                                    <button 
                                                        onClick={(e) => deleteBuyer(e, buyer)} 
                                                        className="w-full text-left flex items-center gap-3.5 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50/50 transition-all"
                                                    >
                                                        <Trash2 size={16} /> <span>Delete Partner</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-4 left-4">
                                            <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 shadow-sm transition-all duration-300 ${STATUS_CONFIG[buyer.status]?.bg} ${STATUS_CONFIG[buyer.status]?.color} ${STATUS_CONFIG[buyer.status]?.border}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[buyer.status]?.dot || 'bg-gray-400'}`} />
                                                {STATUS_CONFIG[buyer.status]?.label}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between px-1">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-black text-2xl text-[#1a2b3b] mb-1.5 truncate tracking-tight">{buyer.name}</h3>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2.5 text-[11px] font-black text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors"><Mail size={14} className="opacity-40" /> {truncateEmail(buyer.email)}</div>
                                                    <div className="flex items-center gap-2.5 text-[11px] font-black text-muted-foreground uppercase tracking-wider"><Phone size={14} className="opacity-40" /> {buyer.phone}</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2"><Layout size={10} /> Distribution Channels</span>
                                                <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-[60px]">
                                                    {buyer.funnelIds.length > 0 ? (buyer.funnelIds.slice(0, 3).map(fid => (
                                                        <span key={fid} className="px-2 py-0.5 bg-muted/40 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border/50">
                                                            {availableFunnels.find(f => f.id === fid)?.name || 'Campaign'}
                                                        </span>
                                                    ))) : (<span className="text-[9px] italic text-muted-foreground/40 font-bold">No connected funnels</span>)}
                                                    {buyer.funnelIds.length > 3 && <span className="text-[9px] font-black text-primary px-1">+{buyer.funnelIds.length - 3} more</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
                                            <div className="h-8 px-3 bg-primary/10 text-primary text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center shadow-inner">0 Leads</div>
                                            <div className="flex items-center gap-2">
                                                {buyer.status === 'active' && <ShieldCheck size={14} className="text-emerald-500" />}
                                                <span className="text-[9px] font-black text-[#1a2b3b] uppercase tracking-widest opacity-30">Partner Profile</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-32 text-center space-y-4 opacity-30 grayscale pointer-events-none">
                                    <Search size={64} className="mx-auto" />
                                    <p className="font-black uppercase tracking-widest text-sm">No buyers found in network</p>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>

            <BuyerModal 
                isOpen={modalState.isOpen} 
                onClose={() => setModalState({ isOpen: false, initialData: null })} 
                availableFunnels={availableFunnels} 
                initialData={modalState.initialData}
                onSave={handleSavePartner} 
            />

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};

export default LeadBuyers;