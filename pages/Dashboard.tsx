import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import GlobalSidebar from '../components/GlobalSidebar';
import { 
    ArrowRight,
    Loader2,
    TrendingUp,
    Layout,
    Users,
    MousePointerClick,
    Plus,
    ChevronDown,
    RefreshCw,
    Handshake,
    Check,
    CheckCircle2,
    BarChart3,
    Filter,
    Info,
    Zap,
    ChevronRight,
    ChevronLeft,
    Wallet,
    Network,
    AlertCircle,
    ShieldCheck,
    Smartphone,
    Mail,
    Home,
    FileQuestion,
    ShoppingCart,
    ArrowUpRight,
    Split
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { verifyAndSyncSession } from '../services/stripeService';
import LogoIcon from '../components/LogoIcon';

// Simplified metric interface focusing on visits
interface FunnelStepMetric {
    id: string;
    title: string;
    type: string;
    visits: number;
    isVariant: boolean;
    displayLabel: string;
}

interface StepGroup {
    baseStepId: string;
    index: number;
    steps: FunnelStepMetric[];
}

const STEP_TYPE_LABELS: Record<string, string> = {
    start: 'Landing Page',
    quiz: 'Quiz',
    otp: 'OTP Verification',
    checkout: 'Checkout',
    upsell: 'Upsell',
    end: 'Results Page'
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [availableFunnels, setAvailableFunnels] = useState<any[]>([]);
    const [selectedFunnelId, setSelectedFunnelId] = useState<string>('all');
    const [isFunnelDropdownOpen, setIsFunnelDropdownOpen] = useState(false);
    
    const [metrics, setMetrics] = useState({ visits: 0, leads: 0, rate: 0, funnels: 0 });
    const [agencyMetrics, setAgencyMetrics] = useState({ activeBuyers: 0, distributedLeads: 0, totalRevenue: 0 });
    const [usage, setUsage] = useState({ 
        emailCredits: 0, 
        phoneCredits: 0, 
        leadCredits: 0,
        emailLimit: 100, 
        phoneLimit: 100,
        leadLimit: 100,
        planName: 'Growth'
    });
    const [stepGroups, setStepGroups] = useState<StepGroup[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedFunnel = useMemo(() => availableFunnels.find(f => f.id === selectedFunnelId), [availableFunnels, selectedFunnelId]);

    useEffect(() => {
        const checkoutSessionId = searchParams.get('session_id');
        const workspaceId = localStorage.getItem('active_workspace_id');
        if (checkoutSessionId && workspaceId) handlePaymentSuccess(checkoutSessionId, workspaceId);
        else fetchInitialData();
        const handleWsChange = () => fetchInitialData();
        window.addEventListener('workspaceChanged', handleWsChange);
        return () => window.removeEventListener('workspaceChanged', handleWsChange);
    }, [selectedFunnelId, searchParams]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsFunnelDropdownOpen(false);
        };
        if (isFunnelDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFunnelDropdownOpen]);

    const handlePaymentSuccess = async (sessionId: string, workspaceId: string) => {
        setIsLoading(true);
        try {
            await verifyAndSyncSession(sessionId, workspaceId);
            fetchInitialData();
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    const fetchInitialData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) { setIsLoading(false); setIsRefreshing(false); return; }

            const { data: wsData } = await supabase.from('workspaces').select('plan_type').eq('id', workspaceId).single();
            const plan = (wsData?.plan_type || 'Growth').toLowerCase();
            const emailLimit = plan.includes('scale') ? 2000 : plan.includes('growth') ? 1000 : 1000;
            const phoneLimit = plan.includes('scale') ? 1000 : plan.includes('growth') ? 500 : 500;
            const leadLimit = plan.includes('scale') ? 15000 : plan.includes('growth') ? 5000 : 5000;

            const { data: funnels } = await supabase.from('funnels').select('id, name, slug, visits_count, status').eq('workspace_id', workspaceId).eq('status', 'live');
            setAvailableFunnels(funnels || []);
            let displayVisits = 0, displayLeads = 0, displayFunnelsCount = 0;
            const funnelIds = funnels?.map(f => f.id) || [];
            if (selectedFunnelId === 'all') {
                if (funnelIds.length > 0) {
                    const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('funnel_id', funnelIds);
                    displayLeads = count || 0;
                }
                funnels?.forEach(f => { displayVisits += (f.visits_count || 0); });
                displayFunnelsCount = funnels?.length || 0;
            } else {
                const selected = funnels?.find(f => f.id === selectedFunnelId);
                if (selected) {
                    displayVisits = selected.visits_count || 0;
                    const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('funnel_id', selectedFunnelId);
                    displayLeads = count || 0;
                    displayFunnelsCount = 1;
                }
            }

            const { data: userWorkspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id);
            const userWsIds = userWorkspaces?.map(w => w.id) || [];
            let globalEmailUsed = 0, globalPhoneUsed = 0, globalTotalLeads = 0;
            if (userWsIds.length > 0) {
                const { count: eUsed } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).in('workspace_id', userWsIds).eq('type', 'email');
                globalEmailUsed = eUsed || 0;
                const { count: pUsed } = await supabase.from('usage_logs').select('*', { count: 'exact', head: true }).in('workspace_id', userWsIds).eq('type', 'sms');
                globalPhoneUsed = pUsed || 0;
                const { count: wsTotalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('workspace_id', userWsIds);
                globalTotalLeads = wsTotalLeads || 0;
            }

            setUsage({ emailCredits: globalEmailUsed, phoneCredits: globalPhoneUsed, leadCredits: globalTotalLeads, emailLimit, phoneLimit, leadLimit, planName: plan.includes('scale') ? 'Scale' : 'Growth' });
            setMetrics({ visits: displayVisits, leads: displayLeads, rate: displayVisits > 0 ? parseFloat(((displayLeads / displayVisits) * 100).toFixed(1)) : 0, funnels: displayFunnelsCount });
            const { count: bCount } = await supabase.from('lead_buyers').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'active');
            const { data: bData } = await supabase.from('lead_buyers').select('payment_amount').eq('workspace_id', workspaceId).eq('status', 'active');
            setAgencyMetrics({ activeBuyers: bCount || 0, distributedLeads: displayLeads, totalRevenue: bData?.reduce((acc, curr) => acc + (curr.payment_amount || 0), 0) || 0 });

            if (selectedFunnelId !== 'all') await fetchStepAnalysis(selectedFunnelId);
            else setStepGroups([]);

        } catch (err) { console.error(err); } finally { setIsLoading(false); setIsRefreshing(false); }
    };

    const fetchStepAnalysis = async (funnelId: string) => {
        try {
            const { data: funnelData } = await supabase.from('funnels').select('settings').eq('id', funnelId).single();
            const otpEnabled = funnelData?.settings?.otpVerification?.enabled ?? true;

            const { data: pagesData } = await supabase.from('funnel_pages').select('id, title, type, order_index, parent_id, visits_count, elements').eq('funnel_id', funnelId).order('order_index', { ascending: true });
            let pages = pagesData || [];

            if (!otpEnabled) {
                pages = pages.filter(p => !p.elements?.some((el: any) => el.type === 'quiz-step' && el.content?.quizType === 'otp'));
            }

            if (pages.length === 0) {
                setStepGroups([]);
                return;
            }

            const basePages = pages.filter(p => !p.parent_id);
            
            const stepGroupsRaw = basePages.map((basePage, idx) => ({
                baseStepId: basePage.id,
                index: idx + 1,
                pages: [basePage, ...pages.filter(p => p.parent_id === basePage.id)],
            }));

            const finalGroups: StepGroup[] = stepGroupsRaw.map((group, i) => {
                const hasVariants = group.pages.length > 1;
                const processedSteps: FunnelStepMetric[] = group.pages.map((p: any, vIdx: number) => ({
                    id: p.id,
                    title: p.title,
                    type: p.type,
                    visits: p.visits_count || 0,
                    isVariant: !!p.parent_id,
                    displayLabel: hasVariants ? (vIdx === 0 ? 'A' : 'B') : `${i + 1}`,
                }));

                return {
                    baseStepId: group.baseStepId,
                    index: group.index,
                    steps: processedSteps,
                };
            });

            setStepGroups(finalGroups);

        } catch (err) { 
            console.error("Error fetching step analysis:", err);
            setStepGroups([]); 
        }
    };

    const analysisData = useMemo(() => {
        if (selectedFunnelId === 'all' || stepGroups.length === 0) return [];
        
        const leadsStepGroup: StepGroup = {
            baseStepId: 'leads',
            index: stepGroups.length + 1,
            steps: [{
                id: 'leads-step',
                title: 'Leads',
                type: 'end',
                visits: metrics.leads,
                isVariant: false,
                displayLabel: '✓'
            }]
        };

        const allGroups = [...stepGroups, leadsStepGroup];

        return allGroups.map((group, idx) => {
            let conversionToNext = 0;
            let variantConversions: { label: string, value: number, color: string }[] = [];

            if (idx < allGroups.length - 1) {
                const currentVisits = group.steps.reduce((sum, s) => sum + s.visits, 0);
                const nextVisits = allGroups[idx + 1].steps.reduce((sum, s) => sum + s.visits, 0);
                
                if (currentVisits > 0) {
                    conversionToNext = (nextVisits / currentVisits) * 100;
                }

                // If next step has variants, calculate share to each variant
                const nextGroup = allGroups[idx + 1];
                if (nextGroup.steps.length > 1) {
                    variantConversions = nextGroup.steps.map((s, sIdx) => ({
                        label: s.displayLabel,
                        value: currentVisits > 0 ? (s.visits / currentVisits) * 100 : 0,
                        color: sIdx === 0 ? 'text-blue-500' : 'text-orange-500'
                    }));
                }
            }
            return { group, isLast: idx === allGroups.length - 1, groupIdx: idx, conversionToNext, variantConversions };
        });
    }, [stepGroups, selectedFunnelId, metrics.leads]);

    const scrollSteps = (direction: 'left' | 'right') => {
        if (scrollRef.current) scrollRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    };

    const getStepIcon = (type: string) => {
        switch (type) {
            case 'start': return <Home size={12} />;
            case 'quiz': return <FileQuestion size={12} />;
            case 'otp': return <ShieldCheck size={12} />;
            case 'checkout': return <ShoppingCart size={12} />;
            case 'upsell': return <TrendingUp size={12} />;
            case 'end': return <CheckCircle2 size={12} />;
            default: return <Zap size={12} />;
        }
    };

    const getStepTypeColors = (type: string, isMock: boolean = false) => {
        if (isMock) return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-500', iconColor: 'text-gray-400', badgeBg: 'bg-gray-200', badgeText: 'text-gray-600' };
        switch (type) {
            case 'start': return { bg: 'bg-blue-50/70', border: 'border-blue-200', text: 'text-blue-900', iconColor: 'text-blue-500', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700' };
            case 'quiz': return { bg: 'bg-orange-50/70', border: 'border-orange-200', text: 'text-orange-900', iconColor: 'text-orange-500', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700' };
            case 'otp': return { bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-900', iconColor: 'text-emerald-500', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700' };
            case 'checkout': return { bg: 'bg-purple-50/70', border: 'border-purple-200', text: 'text-purple-900', iconColor: 'text-purple-500', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700' };
            case 'upsell': return { bg: 'bg-green-50/70', border: 'border-green-200', text: 'text-green-900', iconColor: 'text-green-500', badgeBg: 'bg-green-100', badgeText: 'text-green-700' };
            case 'end': return { bg: 'bg-teal-50/70', border: 'border-teal-200', text: 'text-teal-900', iconColor: 'text-teal-500', badgeBg: 'bg-teal-100', badgeText: 'text-teal-700' };
            default: return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-800', iconColor: 'text-gray-500', badgeBg: 'bg-gray-200', badgeText: 'text-gray-600' };
        }
    };

    const renderStepGroup = (group: StepGroup, isLast: boolean, groupIdx: number, isMock: boolean = false, conversionToNext: number = 0, variantConversions: { label: string, value: number, color: string }[] = []) => {
        const isLeadsStep = group.baseStepId === 'leads';
        const hasVariants = group.steps.length > 1;
    
        return (
            <div key={group.baseStepId || groupIdx} className={`flex items-start h-full ${isMock ? 'grayscale' : ''}`}>
                <div className={`${hasVariants ? 'w-[340px]' : 'w-[180px]'} shrink-0 flex flex-col justify-start items-center`}>
                    {isLeadsStep ? (
                        (() => {
                            const step = group.steps[0];
                            return (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: (groupIdx + 1) * 0.1 }} className="flex flex-col items-center text-center w-full">
                                    <div className="h-8 mb-2" /> {/* Placeholder for alignment */}
                                    <div className={`bg-white w-40 h-40 border-2 rounded-[28px] p-4 flex flex-col items-center justify-center shadow-lg border-emerald-500 ring-4 ring-emerald-100`}>
                                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2"><Handshake size={20} /></div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-0 whitespace-nowrap">{step.title}</h4>
                                        <p className="text-4xl font-black tracking-tighter text-emerald-900">{step.visits.toLocaleString()}</p>
                                    </div>
                                </motion.div>
                            );
                        })()
                    ) : (
                        <div className="w-full">
                            {hasVariants ? (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: groupIdx * 0.1 }} className="flex flex-col items-center text-center">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 mb-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap bg-purple-100 text-purple-700 border border-purple-200`}>
                                        <Split size={12} />
                                        <span>A/B TEST: {STEP_TYPE_LABELS[group.steps[0].type] || group.steps[0].type}</span>
                                    </div>
                                    <div className="bg-white w-[320px] h-44 border-2 border-dashed border-gray-200 rounded-[32px] p-1 flex shadow-sm overflow-hidden relative group/split">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-orange-50/30 -z-10" />
                                        {/* Variant A */}
                                        <div className="flex-1 flex flex-col items-center justify-center border-r-2 border-dashed border-gray-100 bg-blue-50/20">
                                            <div className="mb-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase">Variant A</div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Visitors</p>
                                            <p className="text-3xl font-black tracking-tighter text-blue-900">{group.steps[0].visits.toLocaleString()}</p>
                                        </div>
                                        {/* Variant B */}
                                        <div className="flex-1 flex flex-col items-center justify-center bg-orange-50/20">
                                            <div className="mb-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase">Variant B</div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Visitors</p>
                                            <p className="text-3xl font-black tracking-tighter text-orange-900">{group.steps[1].visits.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-3">
                                        {group.steps.map((step, sIdx) => {
                                            const funnelSlug = selectedFunnel?.slug || '';
                                            const pageUrl = funnelSlug ? `https://${funnelSlug}.wiseform.io?page_id=${step.id}` : '#';
                                            return (
                                                <a key={step.id} href={pageUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors ${sIdx === 0 ? 'text-blue-500 hover:text-blue-700' : 'text-orange-500 hover:text-orange-700'}`}>
                                                    View {sIdx === 0 ? 'A' : 'B'} <ArrowUpRight size={10} />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ) : (
                                group.steps.map((step, sIdx) => {
                                    const colors = getStepTypeColors(step.type, isMock);
                                    const funnelSlug = selectedFunnel?.slug || '';
                                    const pageUrl = funnelSlug ? `https://${funnelSlug}.wiseform.io?page_id=${step.id}` : '#';
        
                                    return (
                                        <motion.div key={step.id || sIdx} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: groupIdx * 0.1 }} className="flex flex-col items-center text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 mb-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${colors.badgeBg} ${colors.badgeText} border ${colors.border}`}>
                                                {getStepIcon(step.type)}
                                                <span>{STEP_TYPE_LABELS[step.type] || step.type}</span>
                                            </div>
                                            <div className={`bg-white w-40 h-40 border rounded-[28px] p-4 shadow-sm transition-all duration-300 flex flex-col items-center justify-center ${!isMock ? 'hover:shadow-xl hover:-translate-y-0.5' : ''} ${colors.bg} ${colors.border}`}>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Visitors</p>
                                                <p className={`text-4xl font-black tracking-tighter ${colors.text}`}>{step.visits.toLocaleString()}</p>
                                            </div>
                                            <a
                                                href={pageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground/70 hover:text-primary transition-colors"
                                            >
                                                See this page <ArrowUpRight size={12} />
                                            </a>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
                {!isLast && (
                    <div className="w-[80px] flex flex-col items-center justify-center relative px-2 pt-20">
                        <div className={`absolute top-1/2 left-0 right-0 h-0.5 ${isMock ? 'bg-gray-200' : 'bg-gray-100'} -z-10`} />
                        <div className="space-y-2 flex flex-col items-center bg-[#F9FAFB]/80 backdrop-blur-sm py-2 px-1 rounded-xl">
                            <div className={`px-3 py-1 rounded-xl text-[10px] font-black shadow-sm ${isMock ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                {conversionToNext.toFixed(1)}%
                            </div>
                            
                            {variantConversions.length > 0 && (
                                <div className="flex flex-col items-center gap-1 mt-1 border-t border-gray-100 pt-1">
                                    {variantConversions.map((vc, vIdx) => (
                                        <div key={vIdx} className={`text-[8px] font-black uppercase ${vc.color} flex items-center gap-1`}>
                                            <span>{vc.label}:</span>
                                            <span>{vc.value.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <ArrowRight size={16} className={isMock ? 'text-gray-300' : 'text-gray-300'} strokeWidth={3} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-8">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [0.8, 1.1, 1], opacity: 1, rotate: 360 }} transition={{ rotate: { repeat: Infinity, duration: 2, ease: "linear" }, scale: { duration: 0.5 } }} className="relative"><div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full" /><div className="absolute inset-0 flex items-center justify-center"><LogoIcon className="w-10 h-10 opacity-40" /></div></motion.div>
                <div className="flex flex-col items-center gap-2"><motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="font-black text-2xl tracking-tight text-[#1a2b3b]">Synchronizing dashboard...</motion.p></div>
            </motion.div>
        </AnimatePresence>
    );

    const emailUsagePercent = Math.min(100, (usage.emailCredits / usage.emailLimit) * 100);
    const phoneUsagePercent = Math.min(100, (usage.phoneCredits / usage.phoneLimit) * 100);
    const leadUsagePercent = Math.min(100, (usage.leadCredits / usage.leadLimit) * 100);

    return (
        <div className="flex h-screen overflow-hidden bg-[#F9FAFB] font-sans">
            <GlobalSidebar activeTab="dashboard" onTabChange={(id) => navigate(`/${id}`)} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <WorkspaceNavbar />
                <main className="flex-1 overflow-y-auto scrollbar-hide p-10 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in-down relative z-50">
                        <div className="space-y-1"><div className="flex items-center gap-3"><h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight">Campaign Analytics</h1><button onClick={() => fetchInitialData(true)} className="p-1.5 text-gray-400 hover:text-[#1a2b3b] transition-colors"><RefreshCw size={22} className={isRefreshing ? "animate-spin" : ""} /></button></div><p className="text-muted-foreground font-medium text-sm">Real-time performance monitoring for your active funnels.</p></div>
                        <div className="flex items-center gap-3"><div className={`relative ${isFunnelDropdownOpen ? 'z-[1000]' : 'z-auto'}`} ref={dropdownRef}><button onClick={() => setIsFunnelDropdownOpen(!isFunnelDropdownOpen)} className="h-12 pl-4 pr-12 bg-white border border-border rounded-xl text-sm font-bold text-[#1a2b3b] shadow-sm hover:border-primary transition-all flex items-center gap-3 min-w-[240px] focus:ring-4 focus:ring-primary/10 group"><Layout className="text-gray-400 group-hover:text-primary transition-colors" size={18} /><span className="truncate">{selectedFunnelId === 'all' ? 'Global view (Live Only)' : (selectedFunnel?.name || 'Select Funnel')}</span><ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${isFunnelDropdownOpen ? 'rotate-180' : ''}`} size={18} /></button>
                                {isFunnelDropdownOpen && (<div className="absolute top-full right-0 mt-2 w-72 bg-white border border-border rounded-2xl shadow-2xl z-[1001] overflow-hidden animate-scale-in origin-top-right py-2"><div className="px-4 py-2 border-b border-border/50 mb-1"><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Campaigns</p></div><button onClick={() => { setSelectedFunnelId('all'); setIsFunnelDropdownOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all ${selectedFunnelId === 'all' ? 'bg-primary/5 text-primary' : 'hover:bg-muted/50 text-gray-700'}`}><div className="flex items-center gap-3"><Layout size={16} className={selectedFunnelId === 'all' ? 'text-primary' : 'text-gray-400'} /><span className="text-sm font-bold">Global View</span></div>{selectedFunnelId === 'all' && <Check size={16} strokeWidth={3} />}</button><div className="max-h-60 overflow-y-auto scrollbar-hide">{availableFunnels.map(f => (<button key={f.id} onClick={() => { setSelectedFunnelId(f.id); setIsFunnelDropdownOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all ${selectedFunnelId === f.id ? 'bg-primary/5 text-primary' : 'hover:bg-muted/50 text-gray-700'}`}><div className="flex items-center gap-3"><Zap size={16} className={selectedFunnelId === f.id ? 'text-primary' : 'text-gray-400'} /><span className="text-sm font-bold truncate max-w-[180px]">{f.name}</span></div>{selectedFunnelId === f.id && <Check size={16} strokeWidth={3} />}</button>))}</div></div>)}
                            </div><button onClick={() => navigate('/internal-templates')} className="px-6 py-3 bg-[#1a2b3b] text-white rounded-xl text-sm font-black flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-black/10"><Plus size={18} strokeWidth={3} /> New funnel</button></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-down delay-75 relative z-10">{[{ label: 'LIVE LEADS', val: metrics.leads.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'CONV. RATE', val: `${metrics.rate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'LIVE VISITS', val: metrics.visits.toLocaleString(), icon: MousePointerClick, color: 'text-purple-600', bg: 'bg-purple-50' }, { label: 'ACTIVE FUNNELS', val: metrics.funnels, icon: Layout, color: 'text-orange-600', bg: 'bg-orange-50' }].map((stat, i) => (<motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-[28px] border border-border/60 shadow-sm relative group hover:shadow-xl transition-all duration-500"><div className="flex items-center justify-between mb-4"><div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}><stat.icon size={20} /></div><div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black tracking-widest border border-emerald-100"><TrendingUp size={10} /> LIVE</div></div><div className="space-y-0.5"><p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p><p className="text-[34px] font-black text-[#1a2b3b] leading-tight tracking-tighter">{stat.val}</p></div></motion.div>))}</div>
                    <div className="space-y-6 animate-fade-in-down delay-150 relative z-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><BarChart3 size={20} /></div>
                            <div className="space-y-0.5">
                                <h2 className="text-xl font-black text-[#1a2b3b] tracking-tight uppercase">Funnel Analysis</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">VISITOR FLOW & CONVERSION</p>
                            </div>
                        </div>
                        <div className={`bg-white border border-border rounded-[40px] shadow-sm flex flex-col relative group/main overflow-hidden transition-all duration-700 min-h-[470px]`}>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                {selectedFunnelId === 'all' ? (
                                    <div className="absolute inset-0 z-[100] bg-white/50 backdrop-blur-[4px] flex flex-col items-center justify-center text-center p-8">
                                        <div className="bg-white rounded-[32px] p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)] max-w-sm w-full space-y-6 animate-scale-in border border-border/60">
                                            <div className="w-16 h-16 bg-muted/50 text-muted-foreground/60 rounded-3xl flex items-center justify-center mx-auto"><Filter size={32} /></div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black text-[#1a2b3b]">Select a Campaign</h3>
                                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">Granular intelligence is available for individual funnels. Pick a campaign from the selector to reveal your conversion path.</p>
                                            </div>
                                            <button onClick={() => setIsFunnelDropdownOpen(true)} className="w-full py-4 bg-[#1a2b3b] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-95 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"><Layout size={16} /> Choose a Campaign</button>
                                        </div>
                                    </div>
                                ) : analysisData.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto px-6 py-12">
                                        <div className="w-20 h-20 bg-muted/20 text-muted-foreground/40 rounded-[32px] flex items-center justify-center mx-auto shadow-inner"><AlertCircle size={40} /></div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-black text-[#1a2b3b]">No interaction data yet</h3>
                                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">This campaign doesn't seem to have any visits yet. Ensure your tracking is active and drive traffic to see conversion analysis.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full relative flex-1 flex flex-col justify-center">
                                        <div className="absolute top-1/2 left-6 z-20 -translate-y-1/2"><button onClick={() => scrollSteps('left')} className="w-12 h-12 bg-white text-[#1a2b3b] rounded-full flex items-center justify-center shadow-2xl hover:bg-[#1a2b3b] hover:text-white transition-all active:scale-90 border border-border/50"><ChevronLeft size={24} strokeWidth={3} /></button></div>
                                        <div className="absolute top-1/2 right-6 z-20 -translate-y-1/2"><button onClick={() => scrollSteps('right')} className="w-12 h-12 bg-white text-[#1a2b3b] rounded-full flex items-center justify-center shadow-2xl hover:bg-[#1a2b3b] hover:text-white transition-all active:scale-90 border border-border/50"><ChevronRight size={24} strokeWidth={3} /></button></div>
                                        <div ref={scrollRef} className="w-full flex-1 px-24 overflow-x-auto scrollbar-hide flex items-center">
                                            <div className="flex items-start gap-0 min-w-max pb-4 h-full">
                                                {analysisData.map(({ group, isLast, groupIdx, conversionToNext, variantConversions }) => renderStepGroup(group, isLast, groupIdx, false, conversionToNext, variantConversions))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6 animate-fade-in-down delay-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm"><ShieldCheck size={20} /></div>
                            <div className="space-y-0.5">
                                <h2 className="text-xl font-black text-[#1a2b3b] tracking-tight uppercase">Usage & Infrastructure</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{usage.planName.toUpperCase()} ENFORCED LIMITS</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="bg-white border border-border/60 rounded-[32px] p-8 shadow-sm space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Mail size={120} className="text-[#1a2b3b]" /></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Zap size={20} fill="currentColor" /></div>
                                        <h3 className="font-black text-[#1a2b3b] uppercase text-xs tracking-widest">Email Health</h3>
                                    </div>
                                    <div className="group/tooltip relative cursor-help">
                                        <Info size={14} className="text-gray-300" />
                                        <div className="absolute bottom-full right-0 mb-2 w-32 p-2 bg-[#1A2B3B] text-white text-[10px] font-black uppercase rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 shadow-2xl">$0.06 / extra</div>
                                    </div>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <p className="text-4xl font-black text-[#1a2b3b]">{usage.emailCredits.toLocaleString()}<span className="text-lg text-muted-foreground ml-2">/ {usage.emailLimit.toLocaleString()}</span></p>
                                        <p className="text-xs font-black text-primary">{Math.round(emailUsagePercent)}% used</p>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${emailUsagePercent > 90 ? 'bg-rose-500' : emailUsagePercent > 70 ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${emailUsagePercent}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white border border-border/60 rounded-[32px] p-8 shadow-sm space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Smartphone size={120} className="text-[#1a2b3b]" /></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Smartphone size={20} /></div>
                                        <h3 className="font-black text-[#1a2b3b] uppercase text-xs tracking-widest">SMS Security</h3>
                                    </div>
                                    <div className="group/tooltip relative cursor-help">
                                        <Info size={14} className="text-gray-300" />
                                        <div className="absolute bottom-full right-0 mb-2 w-32 p-2 bg-[#1A2B3B] text-white text-[10px] font-black uppercase rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 shadow-2xl">$0.15 / extra</div>
                                    </div>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <p className="text-4xl font-black text-[#1a2b3b]">{usage.phoneCredits.toLocaleString()}<span className="text-lg text-muted-foreground ml-2">/ {usage.phoneLimit.toLocaleString()}</span></p>
                                        <p className="text-xs font-black text-primary">{Math.round(phoneUsagePercent)}% used</p>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${phoneUsagePercent > 90 ? 'bg-rose-500' : phoneUsagePercent > 70 ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${phoneUsagePercent}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white border border-border/60 rounded-[32px] p-8 shadow-sm space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Users size={120} className="text-[#1a2b3b]" /></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><Users size={20} /></div>
                                        <h3 className="font-black text-[#1a2b3b] uppercase text-xs tracking-widest">Lead Fulfillment</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 py-1 bg-muted/50 rounded-lg">Account Wide</span>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <p className="text-4xl font-black text-[#1a2b3b]">{usage.leadCredits.toLocaleString()}<span className="text-lg text-muted-foreground ml-2">/ {usage.leadLimit.toLocaleString()}</span></p>
                                        <p className="text-xs font-black text-primary">{Math.round(leadUsagePercent)}% used</p>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${leadUsagePercent > 90 ? 'bg-rose-500' : leadUsagePercent > 70 ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${leadUsagePercent}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6 animate-fade-in-down delay-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shadow-sm"><Handshake size={20} /></div>
                            <h2 className="text-xl font-black text-[#1a2b3b] tracking-tight uppercase">Agency analytics</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                            <div className="bg-white border border-border/60 rounded-[32px] p-8 shadow-sm relative group overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Handshake size={100} className="text-[#1a2b3b]" /></div><div className="space-y-4 relative z-10"><div className="space-y-1"><p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">PAID PARTNERS</p><p className="text-5xl font-black text-[#1a2b3b] tracking-tighter leading-none">{agencyMetrics.activeBuyers}</p></div><div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Active Revenue</div></div></div>
                            <div className="bg-white border border-border/60 rounded-[32px] p-8 shadow-sm relative group overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Network size={100} className="text-[#1a2b3b]" /></div><div className="space-y-4 relative z-10"><div className="space-y-1"><p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">DISTRIBUTED LEADS</p><p className="text-5xl font-black text-[#1a2b3b] tracking-tighter leading-none">{agencyMetrics.distributedLeads}</p></div><div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">Fulfilled</div></div></div>
                            <div className="bg-[#059669] rounded-[32px] p-8 shadow-2xl relative group overflow-hidden border border-white/10"><div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Wallet size={100} className="text-white" /></div><div className="space-y-4 relative z-10"><div className="space-y-1"><p className="text-[11px] font-black text-white/60 uppercase tracking-widest">TOTAL MRR REVENUE</p><p className="text-5xl font-black text-white tracking-tighter leading-none">${agencyMetrics.totalRevenue.toLocaleString()}</p></div><div className="inline-flex items-center gap-2 px-3 py-1 bg-black/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-sm">MRR SECURED</div></div></div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
