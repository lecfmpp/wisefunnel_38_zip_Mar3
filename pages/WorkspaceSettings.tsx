import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlobalSidebar from '../components/GlobalSidebar';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import { 
    Building, 
    Users, 
    Move, 
    Copy, 
    Shield, 
    Plus, 
    X, 
    MoreHorizontal, 
    Mail, 
    Trash2, 
    ChevronRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Building2,
    Zap,
    Layout,
    ArrowRightLeft,
    Monitor,
    Globe,
    Key,
    User,
    ChevronDown,
    Check,
    ShieldAlert,
    ShieldCheck,
    ArrowRight,
    Target,
    TrendingUp,
    Send,
    Play,
    Youtube,
    ArrowLeft,
    Search,
    Copy as CopyIcon,
    ExternalLink,
    Rocket,
    Briefcase,
    Activity,
    Smartphone,
    Lock,
    Database,
    Info,
    CreditCard,
    Clock,
    RefreshCw
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Funnel } from '../types';

type WorkspaceTab = 'general' | 'team' | 'goals' | 'funnels' | 'outbound' | 'security' | 'tutorials';

interface WorkspaceMember {
    id: string;
    email: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    joinedAt: string;
    status: 'active' | 'pending';
}

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

const ROLES = [
    { id: 'editor', label: 'Role: Editor (Full Builder Access)' },
    { id: 'viewer', label: 'Role: Viewer (Analytics Only)' },
    { id: 'admin', label: 'Role: Admin (Settings + Builder)' }
];

const WorkspaceSettings: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('general');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [workspace, setWorkspace] = useState<any>(null);
    const [otherWorkspaces, setOtherWorkspaces] = useState<any[]>([]);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [totalAccountUniqueMembers, setTotalAccountUniqueMembers] = useState<number>(1);
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    const [editName, setEditName] = useState('');
    const [editTimezone, setEditTimezone] = useState('Eastern Time (US & Canada)');
    const [editLanguage, setEditLanguage] = useState('English (US)');
    const [editNiche, setEditNiche] = useState('');
    const [editVolume, setEditVolume] = useState('');
    
    const [senderName, setSenderName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [senderEmailPrefix, setSenderEmailPrefix] = useState('');
    const [customDomain, setCustomDomain] = useState('');
    const [sendingMode, setSendingMode] = useState<'shared' | 'custom'>('shared');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [monthlyLeadGoal, setMonthlyLeadGoal] = useState<number>(500);
    const [outboundTutUrl, setOutboundTutUrl] = useState('');
    const [clientFinderTutUrl, setClientFinderTutUrl] = useState('');

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const roleDropdownRef = useRef<HTMLDivElement>(null);

    const [isMigrateOpen, setIsMigrateOpen] = useState(false);
    const [selectedFunnelForAction, setSelectedFunnelForAction] = useState<Funnel | null>(null);
    const [migrationMode, setMigrationMode] = useState<'move' | 'copy'>('move');
    const [targetWorkspaceId, setTargetWorkspaceId] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferEmail, setTransferEmail] = useState('');

    const ADMIN_EMAIL = 'lecfmpp@gmail.com';
    const isAdminUser = useMemo(() => currentUser?.email === ADMIN_EMAIL, [currentUser?.email]);
    const isFromOutbound = searchParams.get('from') === 'outbound';

    const isPaidPlan = useMemo(() => {
        const plan = workspace?.plan_type?.toLowerCase() || '';
        return plan.includes('growth') || plan.includes('scale');
    }, [workspace]);

    const planLimits = useMemo(() => {
        const plan = workspace?.plan_type?.toLowerCase() || '';
        if (plan.includes('scale')) return { freeSeats: 10, extraCost: 19 };
        if (plan.includes('growth')) return { freeSeats: 3, extraCost: 29 };
        return { freeSeats: 1, extraCost: 0 };
    }, [workspace?.plan_type]);

    const currentSeatsExceeded = useMemo(() => {
        return totalAccountUniqueMembers >= planLimits.freeSeats;
    }, [totalAccountUniqueMembers, planLimits.freeSeats]);

    useEffect(() => {
        fetchWorkspaceData();
        
        const tabParam = searchParams.get('tab');
        if (tabParam === 'team') {
            setActiveTab('team');
            setIsInviteOpen(true);
        } else if (['funnels', 'security', 'general', 'goals', 'outbound', 'tutorials'].includes(tabParam || '')) {
            setActiveTab(tabParam as WorkspaceTab);
        }
    }, [searchParams]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Fix: Changed 'dropdownRef' to 'roleDropdownRef' to fix the compilation error
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
                setIsRoleDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchWorkspaceData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }
            setCurrentUser(user);

            let workspaceId = localStorage.getItem('active_workspace_id');

            let ws;
            if (workspaceId) {
                const { data } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
                ws = data;
            } else {
                const { data } = await supabase.from('workspaces').select('*').eq('owner_id', user.id).limit(1).single();
                ws = data;
                if (ws) localStorage.setItem('active_workspace_id', ws.id);
            }
            
            if (ws) {
                // Admin override for consistency
                if (user?.email === ADMIN_EMAIL) {
                    ws = { ...ws, plan_type: 'Scale', subscription_status: 'active' };
                }
                setWorkspace(ws);
                setEditName(ws.name || '');
                setEditTimezone(ws.metadata?.timezone || 'Eastern Time (US & Canada)');
                setEditLanguage(ws.metadata?.language || 'English (US)');
                setEditNiche(ws.metadata?.niche || ws.metadata?.primary_niche || 'Not Set');
                setEditVolume(ws.metadata?.volume || ws.metadata?.volume_target || 'Not Set');
                setMonthlyLeadGoal(ws.metadata?.monthly_lead_goal || 500);
                
                const mode = ws.metadata?.sending_mode || 'shared';
                setSendingMode(mode);
                setSenderName(ws.metadata?.sender_name || user.user_metadata?.full_name || '');
                
                const fullEmail = ws.metadata?.sender_email || user.email || '';
                setSenderEmail(fullEmail);
                setSenderEmailPrefix(fullEmail.split('@')[0]);
                
                setCustomDomain(ws.metadata?.custom_sending_domain || '');

                const { data: fns } = await supabase.from('funnels').select('*').eq('workspace_id', ws.id);
                setFunnels(fns || []);
                
                const { data: mems } = await supabase.from('workspace_members').select('*').eq('workspace_id', ws.id);
                if (mems && mems.length > 0) {
                    setMembers(mems.map(m => ({
                        id: m.id,
                        email: m.email,
                        role: m.role,
                        joinedAt: m.created_at,
                        status: m.user_id ? 'active' : 'pending'
                    })));
                } else {
                    setMembers([{ id: user.id, email: user.email!, role: 'owner', joinedAt: ws.created_at, status: 'active' }]);
                }

                const { data: allUserWs } = await supabase.from('workspaces').select('id').eq('owner_id', user.id);
                const wsIds = allUserWs?.map(w => w.id) || [];
                if (wsIds.length > 0) {
                    const { data: allMems } = await supabase
                        .from('workspace_members')
                        .select('user_id')
                        .in('workspace_id', wsIds)
                        .not('user_id', 'is', null);
                    
                    const uniqueUserIds = new Set(allMems?.map(m => m.user_id));
                    setTotalAccountUniqueMembers(Math.max(1, uniqueUserIds.size));
                }
            }

            const { data: allWs } = await supabase.from('workspaces').select('id, name').eq('owner_id', user.id).eq('is_archived', false);
            setOtherWorkspaces(allWs?.filter(w => w.id !== ws?.id) || []);

            const { data: tuts } = await supabase.from('tutorials').select('*');
            const outboundTut = tuts?.find(t => t.key === 'outbound_masterclass');
            if (outboundTut) setOutboundTutUrl(outboundTut.video_url);
            const clientFinderTut = tuts?.find(t => t.key === 'client_finder_masterclass');
            if (clientFinderTut) setClientFinderTutUrl(clientFinderTut.video_url);

        } catch (err) {
            console.error("Settings load error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateWorkspaceInfo = async () => {
        if (!workspace || !editName.trim()) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('workspaces')
                .update({ 
                    name: editName.trim(),
                    metadata: {
                        ...workspace.metadata,
                        timezone: editTimezone,
                        language: editLanguage,
                        niche: editNiche,
                        volume: editVolume
                    }
                })
                .eq('id', workspace.id);

            if (error) throw error;

            setWorkspace({
                ...workspace,
                name: editName.trim(),
                metadata: {
                    ...workspace.metadata,
                    timezone: editTimezone,
                    language: editLanguage,
                    niche: editNiche,
                    volume: editVolume
                }
            });

            alert("Workspace identity updated successfully!");
            window.dispatchEvent(new Event('workspaceChanged'));
        } catch (err: any) {
            alert(`Update failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateOutboundSettings = async () => {
        if (!workspace) return;
        setActionLoading(true);
        try {
            const finalSenderEmail = sendingMode === 'shared' 
                ? `${senderEmailPrefix}@leads.wisefunnel.io` 
                : senderEmail.trim().toLowerCase();

            const { error } = await supabase
                .from('workspaces')
                .update({ 
                    metadata: {
                        ...workspace.metadata,
                        sender_name: senderName.trim(),
                        sender_email: finalSenderEmail,
                        custom_sending_domain: sendingMode === 'custom' ? customDomain.trim().toLowerCase() : '',
                        sending_mode: sendingMode
                    }
                })
                .eq('id', workspace.id);

            if (error) throw error;

            setWorkspace({
                ...workspace,
                metadata: {
                    ...workspace.metadata,
                    sender_name: senderName.trim(),
                    sender_email: finalSenderEmail,
                    custom_sending_domain: sendingMode === 'custom' ? customDomain.trim().toLowerCase() : '',
                    sending_mode: sendingMode
                }
            });

            alert("Outbound sender settings saved!");
        } catch (err: any) {
            alert(`Update failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateGoals = async () => {
        if (!workspace) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('workspaces')
                .update({ 
                    metadata: {
                        ...workspace.metadata,
                        monthly_lead_goal: monthlyLeadGoal
                    }
                })
                .eq('id', workspace.id);

            if (error) throw error;

            setWorkspace({
                ...workspace,
                metadata: {
                    ...workspace.metadata,
                    monthly_lead_goal: monthlyLeadGoal
                }
            });

            alert("Workspace goals updated successfully!");
            window.dispatchEvent(new Event('workspaceChanged'));
        } catch (err: any) {
            alert(`Update failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateTutorials = async () => {
        if (currentUser.email !== ADMIN_EMAIL) return;
        setActionLoading(true);
        try {
            const updates = [
                { key: 'outbound_masterclass', video_url: outboundTutUrl.trim() },
                { key: 'client_finder_masterclass', video_url: clientFinderTutUrl.trim() }
            ];

            for (const update of updates) {
                const { error } = await supabase
                    .from('tutorials')
                    .upsert(update, { onConflict: 'key' });
                if (error) throw error;
            }

            alert("Masterclass video placements synchronized!");
        } catch (err: any) {
            alert(`Tutorial update failed: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleArchiveWorkspace = async () => {
        if (!workspace) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('workspaces')
                .update({ is_archived: true })
                .eq('id', workspace.id);

            if (error) throw error;

            localStorage.removeItem('active_workspace_id');
            alert("Workspace archived successfully.");
            navigate('/onboarding');
        } catch (err: any) {
            alert(`Archive failed: ${err.message}`);
        } finally {
            setActionLoading(false);
            setIsArchiveModalOpen(false);
        }
    };

    const handleTransferOwnership = async () => {
        if (!workspace || !transferEmail) return;
        setActionLoading(true);
        try {
            const { data: recipient, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', transferEmail.trim().toLowerCase())
                .single();

            if (profileError || !recipient) {
                throw new Error("Recipient must be a registered user to take ownership.");
            }

            const { error: wsError } = await supabase
                .from('workspaces')
                .update({ owner_id: recipient.id })
                .eq('id', workspace.id);

            if (wsError) throw wsError;

            // Upsert original owner as admin to ensure they retain access
            await supabase
                .from('workspace_members')
                .upsert({
                    workspace_id: workspace.id,
                    email: currentUser.email,
                    role: 'admin',
                    user_id: currentUser.id
                }, { 
                    onConflict: 'workspace_id, email'
                });

            // Upsert new owner with the 'owner' role
            await supabase
                .from('workspace_members')
                .upsert({ 
                    workspace_id: workspace.id, 
                    email: transferEmail.trim().toLowerCase(), 
                    role: 'owner' 
                }, { 
                    onConflict: 'workspace_id, email'
                });

            alert(`Ownership transferred to ${transferEmail}.`);
            window.location.reload();
        } catch (err: any) {
            alert(`Transfer failed: ${err.message}`);
        } finally {
            setActionLoading(false);
            setIsTransferModalOpen(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail || !workspace) return;
        setActionLoading(true);
        try {
            const { error: dbError } = await supabase.from('workspace_members').insert([{
                workspace_id: workspace.id,
                email: inviteEmail.trim().toLowerCase(),
                role: inviteRole
            }]);
            
            if (dbError) throw dbError;

            const { error: functionError } = await supabase.functions.invoke('send-team-invite', {
                body: {
                    email: inviteEmail.trim().toLowerCase(),
                    workspace_id: workspace.id,
                    workspace_name: workspace.name,
                    inviter_name: currentUser?.user_metadata?.full_name || currentUser?.email || 'Your agency partner',
                    role: inviteRole
                }
            });

            if (functionError) {
                console.warn("[Invite] Email dispatch failed, but member added to DB:", functionError);
            }

            setIsInviteOpen(false);
            setInviteEmail('');
            setInviteRole('editor');
            fetchWorkspaceData();
            addToast(`Invitation sent to ${inviteEmail}!`, 'success');
        } catch (err: any) {
            alert(`Error inviting user: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedFunnelForAction || !targetWorkspaceId) return;
        setActionLoading(true);
        
        try {
            if (migrationMode === 'move') {
                const { error } = await supabase
                    .from('funnels')
                    .update({ workspace_id: targetWorkspaceId })
                    .eq('id', selectedFunnelForAction.id);

                if (error) throw error;
                
                setFunnels(prev => prev.filter(f => f.id !== selectedFunnelForAction.id));
                alert(`Funnel "${selectedFunnelForAction.name}" moved successfully.`);
            } else {
                const { data: newFunnel, error: funnelError } = await supabase
                    .from('funnels')
                    .insert([{
                        workspace_id: targetWorkspaceId,
                        name: `${selectedFunnelForAction.name} (Mirror)`,
                        status: 'draft',
                        theme: selectedFunnelForAction.theme,
                        settings: selectedFunnelForAction.settings,
                        thumbnail_url: selectedFunnelForAction.thumbnailUrl,
                        last_edited: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (funnelError) throw funnelError;

                const { data: sourcePages, error: pagesFetchError } = await supabase
                    .from('funnel_pages')
                    .select('*')
                    .eq('funnel_id', selectedFunnelForAction.id);

                if (pagesFetchError) throw pagesFetchError;

                if (sourcePages && sourcePages.length > 0) {
                    const pagesToInsert = sourcePages.map(p => ({
                        funnel_id: newFunnel.id,
                        title: p.title,
                        type: p.type,
                        elements: p.elements,
                        order_index: p.order_index,
                        confetti: p.confetti || false
                    }));
                    
                    const { error: insertError } = await supabase.from('funnel_pages').insert(pagesToInsert);
                    if (insertError) throw insertError;
                }
                
                alert(`Funnel mirrored successfully to the target workspace.`);
            }
            
            setIsMigrateOpen(false);
            setSelectedFunnelForAction(null);
            setTargetWorkspaceId('');
        } catch (err: any) {
            console.error("Funnel logistics failure:", err);
            alert(`Logistics error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const renderTabItem = (id: WorkspaceTab, label: string, icon: React.ElementType) => {
        const Icon = icon;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group ${
                    activeTab === id 
                        ? 'bg-primary/10 text-primary shadow-sm' 
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
            >
                <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={activeTab === id ? 2.5 : 2} />
                    <span className={`text-sm font-bold ${activeTab === id ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>{label}</span>
                </div>
                <ChevronRight size={16} className={`transition-transform duration-300 ${activeTab === id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
            </button>
        );
    };

    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => typeof id === 'string' && removeToast(id), 4000);
    };
    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <div className="flex h-screen overflow-hidden bg-background font-sans">
            <GlobalSidebar activeTab="settings" onTabChange={() => {}} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <WorkspaceNavbar />
                
                <main className="flex-1 w-full mx-auto py-12 px-12 overflow-y-auto scrollbar-hide">
                    <div className="max-w-[1200px] mx-auto animate-fade-in-down pb-20">
                        <div className="mb-10">
                            <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight mb-2">Workspace Settings</h1>
                            <p className="text-muted-foreground font-medium">Control agency permissions, organize team access, and manage cross-workspace funnel logistics.</p>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-12 items-start">
                            <div className="w-full lg:w-72 shrink-0 space-y-1.5">
                                {renderTabItem('general', 'Workspace Info', Building)}
                                {renderTabItem('team', 'Team & Members', Users)}
                                {renderTabItem('goals', 'Performance Goals', Target)}
                                {renderTabItem('funnels', 'Funnel Logistics', Layout)}
                                {renderTabItem('outbound', 'Outbound Sender', Send)}
                                {isAdminUser && renderTabItem('tutorials', 'System Tutorials', Play)}
                                {renderTabItem('security', 'Advanced Settings', Shield)}
                            </div>

                            <div className="flex-1 w-full">
                                {isLoading ? (
                                    <div className="h-64 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-primary" size={32} />
                                    </div>
                                ) : (
                                    <div className="animate-scale-in">
                                        {activeTab === 'general' && (
                                            <div className="space-y-8">
                                                <div className="bg-white border border-border rounded-[16px] p-8 shadow-sm space-y-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-20 h-20 rounded-[24px] bg-blue-500 border-4 border-white flex items-center justify-center text-white font-black text-2xl shadow-xl">
                                                            {editName?.charAt(0) || workspace?.name?.charAt(0) || 'W'}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-black text-[#1a2b3b]">Agency Branding</h3>
                                                            <p className="text-sm text-muted-foreground font-medium">This name appears on client-facing reports and invoices.</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-6 pt-4 border-t border-border/60">
                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Workspace Name</label>
                                                            <input 
                                                                type="text" 
                                                                value={editName} 
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                className="w-full px-5 py-3.5 bg-muted/20 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary outline-none transition-all" 
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                             <div className="space-y-2">
                                                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Timezone</label>
                                                                <select 
                                                                    value={editTimezone}
                                                                    onChange={(e) => setEditTimezone(e.target.value)}
                                                                    className="w-full px-5 py-3.5 bg-muted/20 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary outline-none appearance-none bg-white"
                                                                >
                                                                    <option value="Eastern Time (US & Canada)">Eastern Time (US & Canada)</option>
                                                                    <option value="London (GMT)">London (GMT)</option>
                                                                    <option value="San Francisco (PST)">San Francisco (PST)</option>
                                                                    <option value="Berlin (CET)">Berlin (CET)</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Default Language</label>
                                                                <select 
                                                                    value={editLanguage}
                                                                    onChange={(e) => setEditLanguage(e.target.value)}
                                                                    className="w-full px-5 py-3.5 bg-muted/20 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary outline-none appearance-none bg-white"
                                                                >
                                                                    <option value="English (US)">English (US)</option>
                                                                    <option value="Portuguese (BR)">Portuguese (BR)</option>
                                                                    <option value="Spanish">Spanish</option>
                                                                    <option value="French">French</option>
                                                                    <option value="German">German</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/40">
                                                            <div className="space-y-2">
                                                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                                    <Briefcase size={12} /> Primary Niche
                                                                </label>
                                                                <input 
                                                                    type="text" 
                                                                    value={editNiche} 
                                                                    onChange={(e) => setEditNiche(e.target.value)}
                                                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary outline-none transition-all" 
                                                                    placeholder="e.g. Roofing, Solar"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                                    <Activity size={12} /> Expected Volume
                                                                </label>
                                                                <select 
                                                                    value={editVolume}
                                                                    onChange={(e) => setEditVolume(e.target.value)}
                                                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary outline-none appearance-none bg-white"
                                                                >
                                                                    <option value="Not Set">Not Set</option>
                                                                    <option value="&lt; 100 leads">&lt; 100 leads</option>
                                                                    <option value="100 - 500 leads">100 - 500 leads</option>
                                                                    <option value="500 - 2000 leads">500 - 2000 leads</option>
                                                                    <option value="2000+ leads">2000+ leads</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={handleUpdateWorkspaceInfo}
                                                    disabled={actionLoading || !editName.trim()}
                                                    className="px-8 py-3.5 bg-[#1a2b3b] text-white rounded-xl font-black text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-black/10 flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                                    Update Workspace Identity
                                                </button>
                                            </div>
                                        )}

                                        {activeTab === 'team' && (
                                            <div className="space-y-8">
                                                <div className="bg-white border border-border rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                                                    <div className="space-y-1">
                                                        <h3 className="text-xl font-black text-[#1a2b3b]">Account Seat Usage</h3>
                                                        <p className="text-sm text-muted-foreground font-medium">Seats are unique users shared across all your workspaces.</p>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Seats Used</span>
                                                            <div className={`text-3xl font-black ${currentSeatsExceeded ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                                {totalAccountUniqueMembers} <span className="text-lg text-gray-300">/ {planLimits.freeSeats}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-px h-10 bg-border"></div>
                                                        <button 
                                                            onClick={() => setIsInviteOpen(true)}
                                                            className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-3 active:scale-95"
                                                        >
                                                            <Plus size={18} strokeWidth={3} />
                                                            Invite Member
                                                        </button>
                                                    </div>
                                                </div>

                                                {currentSeatsExceeded && (
                                                    <div className="p-6 bg-orange-50 border-2 border-orange-100 rounded-[28px] flex items-start gap-4 animate-fade-in-down shadow-sm">
                                                        <CreditCard className="text-orange-600 shrink-0 mt-1" size={24} />
                                                        <div className="space-y-1">
                                                            <h4 className="font-black text-orange-900">Seat Threshold Reached</h4>
                                                            <p className="text-sm text-orange-800/80 font-medium leading-relaxed">
                                                                You've used all {planLimits.freeSeats} free seats in your <span className="font-bold">{workspace.plan_type}</span> plan. 
                                                                Each additional unique member will cost <span className="font-black">${planLimits.extraCost}/mo</span>.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-white border border-border rounded-[24px] overflow-hidden shadow-sm">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-muted/30 border-b border-border">
                                                            <tr>
                                                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Workspace User</th>
                                                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Role</th>
                                                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Joined</th>
                                                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/50">
                                                            {members.map((m) => (
                                                                <tr key={m.id} className="group hover:bg-muted/10 transition-colors">
                                                                    <td className="px-8 py-5">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-xs font-black text-[#1a2b3b] border border-border group-hover:bg-white group-hover:border-primary/20 transition-all">
                                                                                {m.email.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-bold text-[#1a2b3b]">{m.email}</p>
                                                                                {m.role === 'owner' && <span className="text-[9px] font-black uppercase text-primary tracking-widest">Workspace Creator</span>}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-5">
                                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${m.role === 'owner' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                                            {m.role}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-5">
                                                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${m.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                                            {m.status === 'active' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                                            {m.status}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                                                                        {new Date(m.joinedAt).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-8 py-5 text-right">
                                                                        {m.role !== 'owner' && (
                                                                            <button className="p-2 text-muted-foreground hover:text-rose-50 hover:bg-rose-50 rounded-xl transition-all">
                                                                                <Trash2 size={18} />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                
                                                <div className="p-6 bg-slate-50 border border-border rounded-2xl flex gap-3">
                                                    <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] text-slate-500 font-medium">
                                                        Invitations are sent directly to the email address provided. If the user doesn't have a Wisefunnel account, they will be prompted to create one to join your agency.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'goals' && (
                                            <div className="space-y-8">
                                                <div className="bg-white border border-border rounded-[16px] p-8 shadow-sm space-y-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 rounded-[20px] bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                                            <Target size={32} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-black text-[#1a2b3b]">Performance Targets</h3>
                                                            <p className="text-sm text-muted-foreground font-medium">Define benchmarks to track agency progress on your dashboard.</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border/60">
                                                        <div className="space-y-6">
                                                            <div className="space-y-3">
                                                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Monthly Lead Goal</label>
                                                                <div className="relative">
                                                                    <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                                    <input 
                                                                        type="number" 
                                                                        value={monthlyLeadGoal} 
                                                                        onChange={(e) => setMonthlyLeadGoal(parseInt(e.target.value) || 0)}
                                                                        className="w-full pl-11 pr-4 py-4 bg-muted/20 border-2 border-border rounded-[20px] text-lg font-black focus:border-primary outline-none transition-all text-[#1a2b3b]" 
                                                                        placeholder="500"
                                                                    />
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground font-medium ml-1">This goal will feed the 'Workspace Goal' progress card in your main dashboard.</p>
                                                            </div>
                                                            <button 
                                                                onClick={handleUpdateGoals}
                                                                disabled={actionLoading}
                                                                className="px-8 py-4 bg-[#1a2b3b] text-white rounded-xl font-black text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                                                            >
                                                                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                                                Save Benchmark
                                                            </button>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dashboard Preview</label>
                                                            <div className="bg-slate-50 border border-border rounded-[32px] p-6 space-y-6 shadow-inner pointer-events-none scale-95 origin-top-left opacity-80">
                                                                <h3 className="text-base font-black text-[#1a2b3b] flex items-center gap-2">
                                                                    <TrendingUp className="text-primary" size={16} />
                                                                    Workspace Goal
                                                                </h3>
                                                                <div className="space-y-4">
                                                                    <div className="flex justify-between items-end mb-1">
                                                                        <span className="text-[9px] font-black uppercase text-muted-foreground">Monthly Target</span>
                                                                        <span className="text-xs font-black text-primary">0/{monthlyLeadGoal}</span>
                                                                    </div>
                                                                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                                                        <div className="h-full bg-primary/20 w-0"></div>
                                                                    </div>
                                                                    <p className="text-column text-muted-foreground font-medium">You've reached 0% of your lead goal this month.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'funnels' && (
                                            <div className="space-y-8">
                                                <div className="bg-orange-50 border border-orange-100 p-6 rounded-[24px] flex gap-5">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                                                        <ArrowRightLeft size={24} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="font-black text-orange-900">Organizational Hub</h4>
                                                        <p className="text-sm text-orange-800/70 font-medium leading-relaxed">
                                                            Keep your agency tidy. Move funnels between workspaces as clients transition or clone established winning flows into new workspace buckets.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-white border border-border rounded-[24px] overflow-hidden shadow-sm">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-muted/30 border-b border-border">
                                                            <tr>
                                                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Funnel</th>
                                                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                                                <th className="px-8 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Quick Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/50">
                                                            {funnels.map((f) => (
                                                                <tr key={f.id} className="group hover:bg-muted/10 transition-colors">
                                                                    <td className="px-8 py-6">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-12 h-10 rounded-lg bg-muted overflow-hidden border border-border">
                                                                                <img src={f.thumbnailUrl || 'https://via.placeholder.com/80'} className="w-full h-full object-cover" />
                                                                            </div>
                                                                            <span className="text-sm font-black text-[#1a2b3b]">{f.name}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${f.status === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                            {f.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-6 text-right">
                                                                        <div className="flex items-center justify-end gap-3">
                                                                            <button 
                                                                                onClick={() => { setMigrationMode('move'); setSelectedFunnelForAction(f); setIsMigrateOpen(true); }}
                                                                                className="px-4 py-2 bg-muted/50 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all flex items-center gap-2"
                                                                            >
                                                                                <Move size={14} /> Move
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => { setMigrationMode('copy'); setSelectedFunnelForAction(f); setIsMigrateOpen(true); }}
                                                                                className="px-4 py-2 bg-muted/50 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center gap-2"
                                                                            >
                                                                                <Copy size={14} /> Mirror
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'outbound' && (
                                            <div className="space-y-8 pb-10">
                                                <div className="bg-white border border-border rounded-[24px] p-10 shadow-sm space-y-12">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                                                <Send size={32} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-2xl font-black text-[#1a2b3b]">Outbound Delivery Engine</h3>
                                                                <p className="text-sm text-muted-foreground font-medium">Reach partners with verified infrastructure.</p>
                                                            </div>
                                                        </div>
                                                        {isFromOutbound && (
                                                            <button 
                                                                onClick={() => navigate('/outbound')}
                                                                className="flex items-center gap-2 px-6 py-3 bg-muted text-[#1a2b3b] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted/70 transition-all active:scale-95"
                                                            >
                                                                <ArrowLeft size={16} /> Back to Outreach
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="bg-muted/20 border-2 border-border rounded-[32px] p-8 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <h4 className="font-black text-[#1a2b3b]">Sending Mode</h4>
                                                                <p className="text-xs text-muted-foreground font-medium">Choose between shared infrastructure or your own custom domain.</p>
                                                            </div>
                                                            <div className="flex bg-white border border-border rounded-2xl p-1.5 shadow-sm">
                                                                <button 
                                                                    onClick={() => setSendingMode('shared')}
                                                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sendingMode === 'shared' ? 'bg-[#1a2b3b] text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                                                                >
                                                                    Shared Domain
                                                                </button>
                                                                <button 
                                                                    onClick={() => { if (isPaidPlan) setSendingMode('custom'); else setShowUpgradeModal(true); }}
                                                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sendingMode === 'custom' ? 'bg-[#1a2b3b] text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                                                                >
                                                                    Custom Domain
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                                        <div className="space-y-8">
                                                            <div className="space-y-6">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                                                                    <User size={14} /> Sender Identity
                                                                </h4>
                                                                <div className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Friendly Name</label>
                                                                        <input 
                                                                            type="text" 
                                                                            value={senderName} 
                                                                            onChange={(e) => setSenderName(e.target.value)}
                                                                            className="w-full px-5 py-4 bg-muted/20 border-2 border-border rounded-[20px] text-sm font-bold focus:border-primary outline-none transition-all" 
                                                                            placeholder="e.g. John Doe"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sender Email</label>
                                                                        {sendingMode === 'shared' ? (
                                                                            <div className="flex items-center gap-2 px-5 py-4 bg-muted/20 border-2 border-border rounded-[20px] focus-within:border-primary transition-all">
                                                                                <input 
                                                                                    type="text" 
                                                                                    value={senderEmailPrefix} 
                                                                                    onChange={(e) => setSenderEmailPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                                                                                    className="bg-transparent outline-none font-bold text-sm text-[#1a2b3b] w-full"
                                                                                    placeholder="mailbox"
                                                                                />
                                                                                <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">@leads.wisefunnel.io</span>
                                                                            </div>
                                                                        ) : (
                                                                            <input 
                                                                                type="email" 
                                                                                value={senderEmail} 
                                                                                onChange={(e) => setSenderEmail(e.target.value)}
                                                                                className="w-full px-5 py-4 bg-muted/20 border-2 border-border rounded-[20px] text-sm font-bold focus:border-primary outline-none transition-all" 
                                                                                placeholder="e.g. john@youragency.com"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {sendingMode === 'custom' && (
                                                                <div className="space-y-6 animate-fade-in-down">
                                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                                                                        <Globe size={14} /> Custom Domain Setup
                                                                    </h4>
                                                                    <div className="space-y-4">
                                                                        <div className="space-y-2">
                                                                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sending Domain</label>                                                                            <input 
                                                                                type="text" 
                                                                                value={customDomain} 
                                                                                onChange={(e) => setCustomDomain(e.target.value)}
                                                                                className="w-full px-5 py-4 bg-muted/20 border-2 border-border rounded-[20px] text-sm font-bold focus:border-primary outline-none transition-all" 
                                                                                placeholder="e.g. youragency.com"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <button 
                                                                onClick={handleUpdateOutboundSettings}
                                                                disabled={actionLoading || !senderName || (sendingMode === 'shared' ? !senderEmailPrefix : !senderEmail)}
                                                                className="w-full py-5 bg-[#1a2b3b] text-white rounded-[24px] font-black text-sm hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-black/10 flex items-center justify-center gap-3 disabled:opacity-50"
                                                            >
                                                                {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} fill="currentColor" />}
                                                                Synchronize Identity
                                                            </button>
                                                        </div>

                                                        <div className="space-y-8">
                                                            {sendingMode === 'shared' ? (
                                                                <div className="p-8 bg-orange-50 border-2 border-orange-100 rounded-[40px] space-y-4 shadow-sm animate-fade-in-down">
                                                                    <div className="flex items-center gap-3">
                                                                        <Zap size={24} className="text-orange-600" fill="currentColor" />
                                                                        <h4 className="text-xl font-black text-orange-900">Shared Domain Mode</h4>
                                                                    </div>
                                                                    <p className="text-sm text-orange-800/80 leading-relaxed font-medium">
                                                                        Sending via <span className="font-bold text-orange-900">@leads.wisefunnel.io</span>. This is our pre-configured, high-deliverability infrastructure.
                                                                        <br/><br/>
                                                                        <span className="px-2 py-1 bg-white rounded-lg border border-orange-200 text-[11px] font-black uppercase text-orange-700 mr-2">Test Limit:</span> 
                                                                        You have <span className="font-black">50 test emails</span> per month on this shared domain. Connect your own domain to unlock unlimited scale.
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-slate-900 rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden animate-fade-in-down">
                                                                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                                                        <Globe size={120} className="text-white" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <h4 className="text-white font-black text-lg">DNS Records</h4>
                                                                        <p className="text-slate-400 text-xs font-medium">Configure these records in your domain registrar to verify your identity.</p>
                                                                    </div>
                                                                    <div className="space-y-3 relative z-10">
                                                                        {[
                                                                            { type: 'MX', host: '@', value: 'feedback-smtp.us-east-1.amazonses.com', priority: '10' },
                                                                            { type: 'TXT', host: '_amazonses', value: 'resend-verification-id-goes-here' },
                                                                            { type: 'CNAME', host: 'resend._domainkey', value: 'dkim.resend.com' }
                                                                        ].map((record, i) => {
                                                                            const valueId = `dns-val-${i}`;
                                                                            const hostId = `dns-host-${i}`;
                                                                            return (
                                                                                <div key={i} className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-2 group">
                                                                                    <div className="flex justify-between items-center">
                                                                                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[9px] font-black uppercase tracking-widest">{record.type}</span>
                                                                                        <button 
                                                                                            onClick={() => handleCopy(record.value, valueId)} 
                                                                                            className={`transition-all ${copiedId === valueId ? 'text-emerald-400 scale-110' : 'text-slate-500 hover:text-white'}`}
                                                                                        >
                                                                                            {copiedId === valueId ? <Check size={14} strokeWidth={3} /> : <CopyIcon size={14}/>}
                                                                                        </button>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Host: {record.host}</p>
                                                                                        <p className="text-[11px] text-slate-300 font-mono break-all">{record.value}</p>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                                        <ShieldCheck size={14} className="text-emerald-500" /> Verification Pending
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'tutorials' && (
                                            <div className="space-y-8">
                                                <div className="bg-white border border-border rounded-[16px] p-8 shadow-sm space-y-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 rounded-[20px] bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                                                            <Youtube size={32} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-black text-[#1a2b3b]">Tutorial Management</h3>
                                                            <p className="text-sm text-muted-foreground font-medium">Add instructions to help agency partners master the Wisefunnel stack.</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-6 pt-8 border-t border-border/60 max-w-xl">
                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Outbound Masterclass URL</label>
                                                            <div className="relative">
                                                                <Play className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                                <input 
                                                                    type="url" 
                                                                    value={outboundTutUrl} 
                                                                    onChange={(e) => setOutboundTutUrl(e.target.value)}
                                                                    className="w-full pl-11 pr-4 py-3.5 bg-muted/20 border-2 border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" 
                                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Client Finder Masterclass URL</label>
                                                            <div className="relative">
                                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                                <input 
                                                                    type="url" 
                                                                    value={clientFinderTutUrl} 
                                                                    onChange={(e) => setClientFinderTutUrl(e.target.value)}
                                                                    className="w-full pl-11 pr-4 py-3.5 bg-muted/20 border-2 border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" 
                                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="pt-4">
                                                            <button 
                                                                onClick={handleUpdateTutorials}
                                                                disabled={actionLoading}
                                                                className="px-8 py-3.5 bg-[#1a2b3b] text-white rounded-xl font-black text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg"
                                                            >
                                                                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Synchronize Instructions'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'security' && (
                                            <div className="space-y-8">
                                                <div className="bg-white border border-border rounded-[16px] p-8 shadow-sm space-y-6">
                                                    <h3 className="text-xl font-black text-rose-600 flex items-center gap-2">
                                                        <AlertCircle size={20} /> Dangerous Territory
                                                    </h3>
                                                    <div className="p-6 border-2 border-rose-50 rounded-[20px] bg-rose-50/20 space-y-6">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h4 className="font-bold text-[#1a2b3b]">Transfer Workspace</h4>
                                                                <p className="text-sm text-muted-foreground">Give full ownership of this agency space to another user.</p>
                                                            </div>
                                                            <button 
                                                                disabled={!(workspace?.owner_id === currentUser?.id)}
                                                                onClick={() => setIsTransferModalOpen(true)}
                                                                className="px-5 py-2.5 bg-white border border-rose-200 text-rose-500 rounded-xl text-xs font-black hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                            >
                                                                Transfer
                                                            </button>
                                                        </div>
                                                        <div className="h-px bg-rose-100"></div>
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h4 className="font-bold text-[#1a2b3b]">Archive Workspace</h4>
                                                                <p className="text-sm text-muted-foreground">Hide this workspace from your list. No data is deleted.</p>
                                                            </div>
                                                            <button 
                                                                disabled={!(workspace?.owner_id === currentUser?.id)}
                                                                onClick={() => setIsArchiveModalOpen(true)}
                                                                className="px-5 py-2.5 bg-white border border-rose-200 text-rose-500 rounded-xl text-xs font-black hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                            >
                                                                Archive
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {isInviteOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1a2b3b]/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-scale-in">
                        <div className="p-12 text-center space-y-8">
                            <div className="w-20 h-20 bg-[#fff5f2] rounded-3xl flex items-center justify-center mx-auto">
                                <Users size={40} className="text-[#f97316]" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-[#1a2b3b] tracking-tight">Expand Your Team</h3>
                                <p className="text-[#64748b] font-medium leading-relaxed px-4">
                                    Invite a collaborator. 
                                    {totalAccountUniqueMembers >= planLimits.freeSeats ? (
                                        <span className="block mt-2 text-orange-600 font-bold">
                                            Warning: This invite will incur a ${planLimits.extraCost}/mo recurring seat charge upon account creation.
                                        </span>
                                    ) : (
                                        <span>
                                            You have {planLimits.freeSeats - totalAccountUniqueMembers} free slots remaining.
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={20} />
                                    <input 
                                        type="email" 
                                        placeholder="colleague@agency.com" 
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full pl-14 pr-6 py-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-base font-medium focus:border-[#f97316] focus:bg-white outline-none transition-all placeholder:text-[#94a3b8]" 
                                    />
                                </div>

                                <div className="relative" ref={roleDropdownRef}>
                                    <button 
                                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                        type="button"
                                        className="w-full flex items-center justify-between pl-6 pr-5 py-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-base font-bold text-[#1a2b3b] hover:bg-[#f1f5f9] transition-all"
                                    >
                                        <span className="truncate">{ROLES.find(r => r.id === inviteRole)?.label}</span>
                                        <ChevronDown size={20} className={`text-[#94a3b8] transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isRoleDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#6b5b54] rounded-2xl shadow-2xl z-[210] py-2 overflow-hidden animate-fade-in-down border border-white/10">
                                            {ROLES.map((role) => (
                                                <button
                                                    key={role.id}
                                                    onClick={() => { setInviteRole(role.id); setIsRoleDropdownOpen(false); }}
                                                    className={`w-full flex items-center justify-between px-6 py-4 text-left text-sm font-bold text-white transition-all ${inviteRole === role.id ? 'bg-black/20' : 'hover:bg-white/10'}`}
                                                >
                                                    {role.label}
                                                    {inviteRole === role.id && <Check size={18} className="text-white" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleInvite}
                                    disabled={actionLoading || !inviteEmail}
                                    className="w-full py-5 bg-[#F97316] text-white rounded-[24px] font-black text-lg hover:opacity-90 shadow-xl shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : 'SEND INVITE'}
                                </button>
                                
                                <button 
                                    onClick={() => setIsInviteOpen(false)} 
                                    className="block w-full py-2 text-[13px] font-black uppercase tracking-[0.2em] text-[#94a3b8] hover:text-[#1a2b3b] transition-all pt-4"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="fixed bottom-6 right-6 z-[600] flex flex-col gap-3 pointer-events-none">{toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto flex items-center gap-3 px-5 py-4 bg-white border border-border rounded-[16px] shadow-2xl min-w-[320px] animate-slide-in-right overflow-hidden group relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-50 text-green-600' : toast.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{toast.type === 'success' ? <CheckCircle2 size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Zap size={20} />}</div>
                    <div className="flex-1"><p className="text-sm font-bold text-[#1a2b3b]">{toast.message}</p></div>
                    <button onClick={() => removeToast(toast.id)} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
                </div>
            ))}</div>
        </div>
    );
};

export default WorkspaceSettings;