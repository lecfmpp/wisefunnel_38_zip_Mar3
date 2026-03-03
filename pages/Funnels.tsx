import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import GlobalSidebar from '../components/GlobalSidebar';
import { 
    ChevronsUpDown, 
    MoreHorizontal, 
    Plus, 
    Search, 
    Check,
    LayoutGrid,
    Star,
    Edit3,
    Link2,
    Power,
    Archive,
    Share2,
    Copy,
    BarChart3,
    Trash2,
    ExternalLink,
    X,
    AlertTriangle,
    Loader2,
    Zap,
    ImageIcon,
    MousePointerClick,
    Users
} from 'lucide-react';
import { Funnel } from '../types';
import { supabase } from '../services/supabaseClient';
import { generateUniqueFunnelName } from '../services/funnelService';
import LogoIcon from '../components/LogoIcon';

const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop';

const FUNNEL_FILTER_OPTIONS = [
    { id: 'all', label: 'All funnels', icon: LayoutGrid },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'drafts', label: 'Drafts', icon: Edit3 },
    { id: 'live', label: 'Live', icon: Link2 },
    { id: 'offline', label: 'Offline', icon: Power },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'shared', label: 'Shared', icon: Share2 },
];

const FunnelFilterDropdown: React.FC<{
    isOpen: boolean;
    position: { top: number; left: number };
    onClose: () => void;
    currentFilter: string;
    onSelectFilter: (id: string) => void;
}> = ({ isOpen, position, onClose, currentFilter, onSelectFilter }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) onClose();
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);
    if (!isOpen) return null;

    return (
        <div 
            ref={dropdownRef}
            className="fixed z-[100] w-[260px] bg-white rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] border border-gray-100 py-2 animate-scale-in origin-top-left"
            style={{ top: position.top, left: position.left }}
        >
            <div className="px-3 space-y-1">
                {FUNNEL_FILTER_OPTIONS.map((option) => {
                    const isActive = currentFilter === option.id;
                    const Icon = option.icon;
                    return (
                        <button
                            key={option.id}
                            onClick={() => { onSelectFilter(option.id); onClose(); }}
                            className={`w-full text-left px-3 py-2.5 text-[15px] font-medium flex items-center gap-3 transition-all rounded-xl ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Icon size={18} className={isActive ? 'text-orange-500' : 'text-gray-400'} />
                            <span className="flex-1">{option.label}</span>
                            {isActive && <Check size={16} className="text-orange-500" strokeWidth={3} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const DeleteFunnelModal: React.FC<{
    funnel: Funnel;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ funnel, onClose, onConfirm }) => {
    const [confirmText, setConfirmText] = useState('');
    const isValid = confirmText.toLowerCase() === 'delete';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="p-8 pb-0 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Delete funnel?</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        This action cannot be undone. You are about to permanently delete <span className="font-bold text-gray-900">"{funnel.name}"</span> and all its associated data.
                    </p>
                    <div className="w-full space-y-4">
                        <div className="text-left">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Type "Delete" to confirm</label>
                            <input autoFocus type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Delete" className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-gray-900" />
                        </div>
                    </div>
                </div>
                <div className="p-8 pt-6 flex flex-col gap-3">
                    <button onClick={onConfirm} disabled={!isValid} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 disabled:opacity-30 transition-all shadow-xl shadow-red-500/20 active:scale-[0.98]">Delete permanently</button>
                    <button onClick={onClose} className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const Funnels: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [currentFilter, setCurrentFilter] = useState('all');
    const [filterDropdownState, setFilterDropdownState] = useState({ isOpen: false, position: { top: 0, left: 0 } });
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [funnelToDelete, setFunnelToDelete] = useState<Funnel | null>(null);

    const filteredFunnels = useMemo(() => {
        if (currentFilter === 'all') return funnels;
        if (currentFilter === 'favorites') return funnels.filter(f => f.is_template);
        if (currentFilter === 'drafts') return funnels.filter(f => f.status === 'draft');
        if (currentFilter === 'live') return funnels.filter(f => f.status === 'live');
        return funnels.filter(f => f.status === currentFilter);
    }, [funnels, currentFilter]);

    useEffect(() => {
        fetchFunnels();
        const handleWsChange = () => fetchFunnels();
        window.addEventListener('workspaceChanged', handleWsChange);
        return () => window.removeEventListener('workspaceChanged', handleWsChange);
    }, []);

    const fetchFunnels = async () => {
        setIsLoading(true);
        try {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) { setFunnels([]); setIsLoading(false); return; }
            
            const { data: funnelsData, error } = await supabase
                .from('funnels')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('last_edited', { ascending: false });

            if (error) throw error;
            const funnelIds = (funnelsData || []).map(f => f.id);
            let uniqueCountsMap: Record<string, number> = {};
            if (funnelIds.length > 0) {
                const { data: leadsData } = await supabase.from('leads').select('email, funnel_id').in('funnel_id', funnelIds);
                const uniqueMap = new Map<string, Set<string>>();
                (leadsData || []).forEach(l => {
                    if (!uniqueMap.has(l.funnel_id)) uniqueMap.set(l.funnel_id, new Set());
                    uniqueMap.get(l.funnel_id)!.add(l.email.toLowerCase().trim());
                });
                uniqueMap.forEach((set, fid) => { uniqueCountsMap[fid] = set.size; });
            }
            setFunnels((funnelsData || []).map((f: any) => ({
                id: f.id,
                workspaceId: f.workspace_id,
                name: f.name,
                status: f.status,
                theme: f.theme,
                settings: f.settings,
                slug: f.slug,
                thumbnailUrl: f.thumbnail_url,
                lastEdited: f.last_edited,
                contactsCount: uniqueCountsMap[f.id] || 0,
                visits_count: f.visits_count || 0,
                is_template: f.is_template,
                pages: [] 
            })));
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    const handleFilterClick = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setFilterDropdownState({ isOpen: true, position: { top: rect.bottom + window.scrollY + 8, left: rect.left } });
    };

    const handleMoreClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleSaveAsTemplate = async (funnel: Funnel) => {
        try {
            await supabase.from('funnels').update({ is_template: !funnel.is_template }).eq('id', funnel.id);
            fetchFunnels();
        } catch (err) { console.error(err); }
        setOpenMenuId(null);
    };

    const handleDuplicate = async (funnel: Funnel) => {
        try {
            const uniqueName = await generateUniqueFunnelName(`${funnel.name} (Copy)`);
            const { data: newFunnel, error } = await supabase.from('funnels').insert([{ workspace_id: funnel.workspaceId, name: uniqueName, status: 'draft', theme: funnel.theme, settings: funnel.settings, thumbnail_url: funnel.thumbnailUrl, last_edited: new Date().toISOString() }]).select().single();
            if (error) throw error;
            const { data: pages } = await supabase.from('funnel_pages').select('*').eq('funnel_id', funnel.id);
            if (pages) {
                const newPages = pages.map(p => ({ funnel_id: newFunnel.id, title: p.title, type: p.type, elements: p.elements, order_index: p.order_index, confetti: p.confetti }));
                await supabase.from('funnel_pages').insert(newPages);
            }
            fetchFunnels();
        } catch (err) { console.error(err); }
        setOpenMenuId(null);
    };

    const formatStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    if (isLoading) return (
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
                        Accessing funnels...
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
            <GlobalSidebar activeTab="build" onTabChange={() => {}} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            <div className="flex-1 flex flex-col min-w-0">
                <WorkspaceNavbar />
                <main className="flex-1 w-full mx-auto pt-12 pb-32 px-12 overflow-y-auto scrollbar-hide">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex flex-col gap-2 mb-10">
                            <div className="flex items-center gap-3 cursor-pointer group w-fit" onClick={handleFilterClick}>
                                <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight">Funnels</h1>
                                <ChevronsUpDown size={28} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </div>
                            <p className="text-muted-foreground font-medium">Build battle-tested, niche-specific funnels in minutes. Use validated templates to capture the high-intent leads buyers crave.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in-down pb-10">
                            <div onClick={() => navigate('/internal-templates')} className={`group h-[420px] border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center transition-all gap-6 shadow-sm border-border cursor-pointer hover:border-primary hover:bg-primary/5`}>
                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all bg-primary/10 group-hover:bg-primary/20`}><Plus size={40} className='text-primary' /></div>
                                <div className="text-center px-10"><h3 className={`text-xl font-black transition-colors text-foreground group-hover:text-primary`}>New funnel</h3><p className="text-sm text-muted-foreground/70 mt-2 font-medium">Start from a template</p></div>
                            </div>

                            {filteredFunnels.map((funnel, idx) => (
                                <motion.div 
                                    key={funnel.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => navigate(`/builder?id=${funnel.id}`)} 
                                    className="group bg-white border border-border/60 rounded-[32px] p-5 shadow-sm hover:shadow-2xl hover:border-primary/50 transition-all cursor-pointer flex flex-col h-[480px] relative"
                                >
                                    <div className="h-56 bg-muted rounded-[24px] overflow-hidden mb-6 relative group/thumb">
                                        <img src={funnel.thumbnailUrl || DEFAULT_THUMBNAIL} alt={funnel.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        {funnel.is_template && <div className="absolute top-4 left-4 bg-amber-500 text-white p-2 rounded-xl shadow-lg z-10"><Star size={16} fill="currentColor" /></div>}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between px-1">
                                        <div>
                                            <h3 className="font-black text-[22px] text-[#1a2b3b] mb-1.5 truncate group-hover:text-primary transition-colors tracking-tight leading-tight">{funnel.name}</h3>
                                            <p className="text-[11px] text-muted-foreground font-black lowercase tracking-[0.1em]">{funnel.lastEdited ? `Last edited ${new Date(funnel.lastEdited).toLocaleDateString()}` : 'New funnel'}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-5">
                                            <div className="flex-1 flex flex-col items-center gap-1.5 px-4 py-3 bg-muted/30 rounded-2xl border border-border/40 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all shadow-sm">
                                                <div className="flex items-center gap-2"><MousePointerClick size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors" /><span className="text-[10px] font-black lowercase tracking-widest text-muted-foreground/70">Visits</span></div>
                                                <span className="text-xl font-black text-[#1a2b3b] leading-none">{funnel.visits_count || 0}</span>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center gap-1.5 px-4 py-3 bg-muted/30 rounded-2xl border border-border/40 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all shadow-sm">
                                                <div className="flex items-center gap-2"><Users size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors" /><span className="text-[10px] font-black lowercase tracking-widest text-muted-foreground/70">Leads</span></div>
                                                <span className="text-xl font-black text-[#1a2b3b] leading-none">{funnel.contactsCount || 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
                                            <div className="flex items-center gap-2"><span className={`h-8 px-4 text-[10px] font-black tracking-widest rounded-xl flex items-center transition-all ${funnel.status === 'live' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-500/10' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>{funnel.status === 'live' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />}{formatStatus(funnel.status || 'draft')}</span></div>
                                            <div className="relative">
                                                <button onClick={(e) => handleMoreClick(e, funnel.id)} className="p-2.5 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-[#1a2b3b]"><MoreHorizontal size={24} /></button>
                                                {openMenuId === funnel.id && (
                                                    <div className="absolute right-0 bottom-full mb-3 w-56 bg-white rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)] border border-gray-100 py-2 z-50 animate-scale-in origin-bottom-right" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => navigate(`/builder?id=${funnel.id}`)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-3"><Edit3 size={16} /> Edit funnel</button>
                                                        <button onClick={() => handleSaveAsTemplate(funnel)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-amber-50 hover:text-orange-600 transition-colors flex items-center gap-3"><Star size={16} className={funnel.is_template ? 'fill-amber-500 text-amber-500' : ''} /> {funnel.is_template ? 'Remove template' : 'Save as template'}</button>
                                                        <button onClick={() => handleDuplicate(funnel)} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-3"><Copy size={16} /> Duplicate</button>
                                                        <div className="h-px bg-gray-100 my-1.5 mx-3"></div>
                                                        <button onClick={() => { setFunnelToDelete(funnel); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3"><Trash2 size={16} /> Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
            {funnelToDelete && <DeleteFunnelModal funnel={funnelToDelete} onClose={() => setFunnelToDelete(null)} onConfirm={async () => { await supabase.from('funnels').delete().eq('id', funnelToDelete.id); fetchFunnels(); setFunnelToDelete(null); }} />}
            <FunnelFilterDropdown isOpen={filterDropdownState.isOpen} position={filterDropdownState.position} onClose={() => setFilterDropdownState(prev => ({ ...prev, isOpen: false }))} currentFilter={currentFilter} onSelectFilter={setCurrentFilter} />
        </div>
    );
};

export default Funnels;