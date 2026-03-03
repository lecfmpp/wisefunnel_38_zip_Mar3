import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSidebar from '../components/GlobalSidebar';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import { 
    Split, 
    Zap, 
    Plus, 
    ArrowRight, 
    ChevronDown, 
    Building2, 
    Layout, 
    Star, 
    Search,
    ShieldCheck,
    Lock,
    Clock,
    Trash2,
    Settings2,
    CheckCircle2,
    Rocket,
    Loader2,
    Mail,
    User,
    Sparkles,
    AlertCircle,
    Info,
    Check,
    Target,
    Filter,
    Users,
    ChevronRight,
    ChevronLeft,
    ArrowUpRight,
    Save,
    X,
    Equal,
    ChevronUp,
    ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { DistributionRule } from '../types';
import LogoIcon from '../components/LogoIcon';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

const OPERATORS = [
    { id: '>=', label: '≥ (Greater or Equal)', icon: ChevronUp },
    { id: '>', label: '> (Greater Than)', icon: ChevronRight },
    { id: '=', label: '= (Equal To)', icon: Equal },
    { id: '<', label: '< (Less Than)', icon: ChevronLeft },
    { id: '<=', label: '≤ (Less or Equal)', icon: ChevronDownIcon },
    { id: '!=', label: '≠ (Not Equal To)', icon: X },
];

const Distribution: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeFunnelId, setActiveFunnelId] = useState('');
    const [funnels, setFunnels] = useState<any[]>([]);
    const [buyers, setBuyers] = useState<any[]>([]);
    const [rules, setRules] = useState<DistributionRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => typeof id === 'string' && removeToast(id), 4000);
    };
    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    useEffect(() => {
        fetchInitialData();
        window.addEventListener('workspaceChanged', fetchInitialData);
        return () => window.removeEventListener('workspaceChanged', fetchInitialData);
    }, []);

    useEffect(() => {
        if (activeFunnelId) {
            fetchRules();
        }
    }, [activeFunnelId]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) return;

            const { data: fns } = await supabase
                .from('funnels')
                .select('id, name, status, thumbnail_url')
                .eq('workspace_id', workspaceId)
                .eq('status', 'live');
            
            setFunnels(fns || []);
            if (fns && fns.length > 0 && !activeFunnelId) {
                setActiveFunnelId(fns[0].id);
            }

            const { data: buyrs } = await supabase
                .from('lead_buyers')
                .select('*, lead_buyer_funnels(funnel_id)')
                .eq('workspace_id', workspaceId)
                .eq('status', 'active');
            
            setBuyers(buyrs || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRules = async () => {
        if (!activeFunnelId) return;
        try {
            const { data } = await supabase
                .from('distribution_rules')
                .select('*')
                .eq('funnel_id', activeFunnelId);
            setRules(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddRule = () => {
        const workspaceId = localStorage.getItem('active_workspace_id') || '';
        const newRule: DistributionRule = {
            id: `temp-${Date.now()}`,
            workspace_id: workspaceId,
            funnel_id: activeFunnelId,
            operator: '>=',
            min_points: 0,
            buyer_ids: []
        };
        setRules([...rules, newRule]);
    };

    const handleUpdateRule = (id: string, updates: Partial<DistributionRule>) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const handleDeleteRule = async (id: string) => {
        if (!id.startsWith('temp-')) {
            try {
                await supabase.from('distribution_rules').delete().eq('id', id);
            } catch (err) {
                console.error(err);
            }
        }
        setRules(prev => prev.filter(r => r.id !== id));
        addToast("Routing logic removed.", "info");
    };

    const handleSaveRules = async () => {
        setIsActionLoading(true);
        try {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId || !activeFunnelId) return;

            await supabase.from('distribution_rules').delete().eq('funnel_id', activeFunnelId);
            
            const payload = rules.map(r => ({
                workspace_id: workspaceId,
                funnel_id: activeFunnelId,
                operator: r.operator,
                min_points: r.min_points,
                buyer_ids: r.buyer_ids
            }));

            if (payload.length > 0) {
                const { error } = await supabase.from('distribution_rules').insert(payload);
                if (error) throw error;
            }

            addToast("Distribution logic successfully deployed.", "success");
            fetchRules();
        } catch (err: any) {
            addToast(`Logic error: ${err.message}`, "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const connectedBuyers = useMemo(() => {
        return buyers.filter(b => b.lead_buyer_funnels?.some((f: any) => f.funnel_id === activeFunnelId));
    }, [buyers, activeFunnelId]);

    const activeFunnel = funnels.find(f => f.id === activeFunnelId);

    if (isLoading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="relative">
                <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <LogoIcon className="w-10 h-10 opacity-40" />
                </div>
            </motion.div>
            <p className="font-black text-2xl tracking-tight text-[#1a2b3b]">Synchronizing logic nodes...</p>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#F9FAFB] font-sans">
            <GlobalSidebar activeTab="distribution" onTabChange={(id) => navigate(`/${id}`)} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <WorkspaceNavbar />
                
                <main className="flex-1 overflow-y-auto scrollbar-hide p-10 space-y-12">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-down">
                        <div className="space-y-2">
                            <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight mb-2">Lead Distribution Lab</h1>
                            <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-lg">
                                Master your fulfillment logic. Route leads to partners automatically based on the intelligence scores calculated within your funnels.
                            </p>
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-down delay-75">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-[#1a2b3b] text-white flex items-center justify-center font-black text-xs shadow-lg">01</div>
                            <h2 className="text-sm font-black tracking-widest text-[#1a2b3b]">Choose campaign target</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {funnels.length > 0 ? funnels.map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => setActiveFunnelId(f.id)}
                                    className={`relative group bg-white border-2 rounded-[32px] p-5 text-left transition-all duration-300 ${activeFunnelId === f.id ? 'border-primary ring-4 ring-primary/10 shadow-2xl scale-[1.02]' : 'border-border hover:border-primary/40'}`}
                                >
                                    <div className="h-32 bg-slate-50 rounded-[20px] mb-4 overflow-hidden relative">
                                        <img src={f.thumbnail_url || 'https://via.placeholder.com/200'} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        {activeFunnelId === f.id && <div className="absolute top-3 right-3 bg-primary text-white p-1.5 rounded-xl shadow-lg"><Check size={16} strokeWidth={4} /></div>}
                                    </div>
                                    <h4 className="font-black text-sm text-[#1a2b3b] truncate">{f.name}</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest mt-1">Live campaign</p>
                                </button>
                            )) : (
                                <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-border rounded-[40px] space-y-6">
                                    <Layout size={48} className="mx-auto text-muted-foreground/20" />
                                    <div className="space-y-2">
                                        <p className="font-black text-[#1a2b3b]">No live funnels detected</p>
                                        <p className="text-xs text-muted-foreground">You need at least one live funnel to configure distribution.</p>
                                    </div>
                                    <button onClick={() => navigate('/funnels')} className="px-8 py-3 bg-[#1a2b3b] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all">Go to Build</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {activeFunnelId && (
                        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-down delay-150">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-[#1a2b3b] text-white flex items-center justify-center font-black text-xs shadow-lg">02</div>
                                    <h2 className="text-sm font-black tracking-widest text-[#1a2b3b]">Verify lead buyers</h2>
                                </div>
                                <button onClick={() => navigate('/lead-buyers')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                                    Manage partners in Profit Room <ArrowUpRight size={14} />
                                </button>
                            </div>

                            <div className="bg-white border border-border rounded-[40px] p-8 shadow-sm">
                                {connectedBuyers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {connectedBuyers.map(b => (
                                            <div key={b.id} className="p-5 bg-slate-50 border border-border rounded-2xl flex items-center gap-4 group">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary shadow-sm group-hover:bg-[#1a2b3b] group-hover:text-white transition-all">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-sm text-[#1a2b3b] truncate">{b.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground truncate tracking-widest">{b.email}</p>
                                                </div>
                                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 space-y-6">
                                        <Users size={32} className="mx-auto text-muted-foreground/30" />
                                        <div className="space-y-2">
                                            <p className="font-black text-[#1a2b3b]">No partners connected to "{activeFunnel?.name}"</p>
                                            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                                You must link lead buyers to this funnel in the <strong>Profit Room</strong> before setting up distribution rules.
                                            </p>
                                        </div>
                                        <button onClick={() => navigate('/lead-buyers')} className="px-10 py-4 bg-[#1a2b3b] text-white rounded-2xl font-black text-sm shadow-xl shadow-black/10 active:scale-95 transition-all">Connect partners now</button>
                                    </div>
                                )}
                                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                                    <Info size={18} className="text-blue-600 shrink-0" />
                                    <p className="text-xs font-bold text-blue-900 tracking-widest">
                                        Note: Only lead buyers with an 'Active (Paid)' status in your Profit Room pipeline will appear as options here.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeFunnelId && connectedBuyers.length > 0 && (
                        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-down delay-[200ms] pb-24">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-[#1a2b3b] text-white flex items-center justify-center font-black text-xs shadow-lg">03</div>
                                <h2 className="text-sm font-black tracking-widest text-[#1a2b3b]">Logic & scoring laboratory</h2>
                            </div>

                            <div className="bg-[#1a2b3b] rounded-[48px] p-12 shadow-[0_40px_100px_-20px_rgba(26,43,59,0.3)] border border-white/5 space-y-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
                                    <Zap size={240} fill="currentColor" />
                                </div>
                                
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">Flexible Decision Tree</h3>
                                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3 max-w-xl">
                                            <Info size={18} className="text-orange-400 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-orange-100/70 font-medium leading-relaxed tracking-widest">
                                                Assign score modifiers in the <strong>Funnel Builder</strong>. Then, set comparison logic below to route prospects to the correct fulfillment teams.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAddRule}
                                        className="px-8 py-4 bg-white text-[#1a2b3b] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-50 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                                    >
                                        <Plus size={18} strokeWidth={3} /> Add logic row
                                    </button>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    {rules.length > 0 ? rules.map((rule, idx) => (
                                        <div key={rule.id} className="group bg-white/5 border-2 border-white/10 p-8 rounded-[32px] flex flex-col lg:flex-row items-center gap-6 hover:bg-white/10 hover:border-white/20 transition-all animate-scale-in">
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-[11px] font-black text-white/40 tracking-widest">If total points</div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        <select 
                                                            value={rule.operator}
                                                            onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value })}
                                                            className="px-4 py-4 bg-white/10 border-2 border-white/10 rounded-2xl text-white font-black text-xl appearance-none outline-none focus:border-primary transition-all min-w-[70px] text-center"
                                                        >
                                                            {OPERATORS.map(op => <option key={op.id} value={op.id} className="text-black">{op.id}</option>)}
                                                        </select>
                                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={14} />
                                                    </div>
                                                    
                                                    <input 
                                                        type="number" 
                                                        value={rule.min_points}
                                                        onChange={(e) => handleUpdateRule(rule.id, { min_points: parseInt(e.target.value) || 0 })}
                                                        className="w-24 px-4 py-4 bg-white rounded-2xl font-black text-2xl text-[#1a2b3b] text-center focus:ring-4 focus:ring-primary/20 outline-none transition-all shadow-xl"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>

                                            <div className="hidden lg:block">
                                                <ArrowRight size={24} className="text-orange-500/30" strokeWidth={3} />
                                            </div>

                                            <div className="flex-1 flex flex-col gap-3 w-full">
                                                <div className="text-[10px] font-black text-white/40 tracking-widest">Route to partners</div>
                                                <div className="flex flex-wrap gap-2 min-h-[56px] p-2 bg-black/20 rounded-[20px] border border-white/5 content-start">
                                                    {connectedBuyers.map(b => {
                                                        const isSelected = rule.buyer_ids.includes(b.id);
                                                        return (
                                                            <button 
                                                                key={b.id}
                                                                onClick={() => {
                                                                    const next = isSelected 
                                                                        ? rule.buyer_ids.filter(id => id !== b.id)
                                                                        : [...rule.buyer_ids, b.id];
                                                                    handleUpdateRule(rule.id, { buyer_ids: next });
                                                                }}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${isSelected ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                                                            >
                                                                {isSelected ? <Check size={14} strokeWidth={4} /> : <Plus size={14} />}
                                                                {b.name}
                                                            </button>
                                                        );
                                                    })}
                                                    {connectedBuyers.length === 0 && <p className="text-[10px] text-white/20 uppercase font-black p-3">No buyers available for this funnel</p>}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleDeleteRule(rule.id)}
                                                className="p-3 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                                            >
                                                <Trash2 size={22} />
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center space-y-6 opacity-30 grayscale pointer-events-none">
                                            <Split size={64} className="mx-auto text-white" />
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-white tracking-widest">No routing rules created</p>
                                                <p className="text-xs text-white/60">Add a rule to start distributing leads automatically.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {rules.length > 0 && (
                                    <div className="pt-10 border-t border-white/10 flex justify-center relative z-10">
                                        <button 
                                            onClick={handleSaveRules}
                                            disabled={isActionLoading}
                                            className="px-16 py-6 bg-orange-500 text-white rounded-[32px] font-black text-lg uppercase tracking-widest shadow-[0_20px_50px_-10px_rgba(249,115,22,0.4)] hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-4 disabled:opacity-50"
                                        >
                                            {isActionLoading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} fill="currentColor" />}
                                            Deploy Logic Engine
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <div className="fixed bottom-6 right-6 z-[600] flex flex-col gap-3 pointer-events-none">{toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto flex items-center gap-3 px-5 py-4 bg-white border border-border rounded-[16px] shadow-2xl min-w-[320px] animate-slide-in-right overflow-hidden group relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-50 text-green-600' : toast.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{toast.type === 'success' ? <CheckCircle2 size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Zap size={20} />}</div>
                    <div className="flex-1"><p className="text-sm font-bold text-[#1a2b3b]">{toast.message}</p></div>
                    <button onClick={() => removeToast(toast.id)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                        <X size={16} />
                    </button>
                </div>
            ))}</div>
        </div>
    );
};

export default Distribution;