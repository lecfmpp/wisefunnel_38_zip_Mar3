import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    ChevronsUpDown, 
    UserPlus, 
    User, 
    Settings, 
    CreditCard, 
    LogOut, 
    Check, 
    Loader2, 
    Sparkles, 
    Plus,
    X,
    Lock,
    Zap,
    AlertCircle,
    Building2,
    ArrowRight,
    Bell,
    Users,
    ReceiptText,
    Trash2,
    CheckCircle2,
    Clock,
    Circle,
    BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';

interface Notification {
    id: string;
    type: 'leads' | 'usage' | 'billing';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    link?: string;
}

const WorkspaceNavbar: React.FC = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifSettings, setNotifSettings] = useState({ leads: true, usage: true, billing: true });
  const [isNotifLoading, setIsNotifLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentPlan = useMemo(() => {
    const plan = (activeWorkspace?.plan_type || 'Growth').toLowerCase();
    return plan.includes('scale') ? 'Scale' : 'Growth';
  }, [activeWorkspace]);

  const isTrial = useMemo(() => {
    return activeWorkspace?.subscription_status === 'trialing' || !activeWorkspace?.subscription_status;
  }, [activeWorkspace]);

  const workspaceLimit = useMemo(() => {
    if (currentPlan === 'Scale') return Infinity;
    return 3; // Growth limit
  }, [currentPlan]);

  const canCreateWorkspace = workspaces.length < workspaceLimit;
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  useEffect(() => {
    fetchData();
    window.addEventListener('workspaceChanged', fetchData);
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) setIsWorkspaceOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('workspaceChanged', fetchData);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        setUser(authUser);

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        setUserProfile(profile);
        if (profile?.notification_settings) setNotifSettings(profile.notification_settings);

        // 1. Fetch workspaces owned by user
        const { data: ownedWs } = await supabase
            .from('workspaces')
            .select('*')
            .eq('owner_id', authUser.id)
            .eq('is_archived', false);

        // 2. Fetch workspaces where user is a member
        const { data: memberWs } = await supabase
            .from('workspace_members')
            .select('role, workspace:workspaces(*)')
            .eq('email', authUser.email?.toLowerCase());

        const memberWsCleaned = memberWs?.map(m => ({ 
            ...(m.workspace as any), 
            user_role: m.role 
        })).filter(ws => ws && !ws.is_archived) || [];

        const ownedWsCleaned = ownedWs?.map(ws => ({
            ...ws,
            user_role: 'owner'
        })) || [];

        // 3. Merge uniquely by ID
        const allWsMap = new Map();
        [...ownedWsCleaned, ...memberWsCleaned].forEach(ws => {
            if (!allWsMap.has(ws.id)) allWsMap.set(ws.id, ws);
        });
        
        let wsList = Array.from(allWsMap.values());
        
        // Admin override
        if (authUser.email === 'lecfmpp@gmail.com') {
            wsList = wsList.map(ws => ({ ...ws, plan_type: 'Scale', subscription_status: 'active' }));
        }

        setWorkspaces(wsList);
        if (wsList.length > 0) {
            const savedId = localStorage.getItem('active_workspace_id');
            const current = wsList.find(w => w.id === savedId) || wsList[0];
            setActiveWorkspace(current);
            if (current && savedId !== current.id) { 
                localStorage.setItem('active_workspace_id', current.id); 
                window.dispatchEvent(new Event('workspaceChanged')); 
            }
            fetchNotifications(authUser.id, profile?.notification_settings);
        }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const fetchNotifications = async (userId: string, settings: any) => {
    setIsNotifLoading(true);
    try {
        const enabledTypes = [];
        if (settings?.leads) enabledTypes.push('leads');
        if (settings?.usage) enabledTypes.push('usage');
        if (settings?.billing) enabledTypes.push('billing');
        if (enabledTypes.length === 0) { setNotifications([]); return; }

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .in('type', enabledTypes)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        setNotifications(data || []);
    } catch (err) { console.error(err); } finally { setIsNotifLoading(false); }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleClearIndividual = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
        await supabase.from('notifications').delete().eq('id', id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    if (notifications.length === 0) return;
    try {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
            await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    } catch (err) { console.error(err); }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    try {
        const ids = notifications.map(n => n.id);
        await supabase.from('notifications').delete().in('id', ids);
        setNotifications([]);
    } catch (err) { console.error(err); }
  };

  const handleSwitchWorkspace = (ws: any) => { 
    localStorage.setItem('active_workspace_id', ws.id); 
    setActiveWorkspace(ws); 
    setIsWorkspaceOpen(false); 
    window.dispatchEvent(new Event('workspaceChanged')); 
  };
  
  const handleSignOut = async () => { 
    try { 
        await supabase.auth.signOut(); 
        localStorage.removeItem('active_workspace_id'); 
        window.location.href = '/#/login'; 
    } catch (err) { window.location.href = '/#/login'; } 
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim() || !user) return;
    
    setIsCreating(true);
    try {
        // Default to Growth for new workspaces if not explicitly inherited
        const newPlan = activeWorkspace?.plan_type || 'Growth';
        
        const { data: newWs, error: wsError } = await supabase.from('workspaces').insert({
            owner_id: user.id,
            name: newWorkspaceName.trim(),
            plan_type: newPlan
        }).select().single();

        if (wsError) throw wsError;

        // CRITICAL: Ensure the owner is also in the membership table
        await supabase.from('workspace_members').insert({
            workspace_id: newWs.id,
            email: user.email?.toLowerCase(),
            role: 'owner'
        });

        localStorage.setItem('active_workspace_id', newWs.id);
        setNewWorkspaceName('');
        setIsCreateModalOpen(false);
        window.dispatchEvent(new Event('workspaceChanged'));
    } catch (err: any) {
        alert(`Failed to create workspace: ${err.message}`);
    } finally {
        setIsCreating(false);
    }
  };

  const getNotifIcon = (type: string) => {
      switch(type) {
          case 'leads': return <Users size={14} />;
          case 'usage': return <Zap size={14} />;
          case 'billing': return <ReceiptText size={14} />;
          default: return <Bell size={14} />;
      }
  };

  return (
    <nav className="h-16 px-8 border-b border-gray-100 flex items-center justify-between bg-white z-[500] shrink-0">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative" ref={workspaceRef}>
          <button onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)} className="flex items-center gap-3 px-3 py-1.5 hover:bg-muted/50 rounded-xl transition-all group border-2 border-transparent hover:border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/20">{activeWorkspace ? activeWorkspace.name.charAt(0).toUpperCase() : 'W'}</div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-black text-[#1a2b3b] leading-tight">{activeWorkspace ? activeWorkspace.name : (isLoading ? 'Syncing...' : 'No workspace found')}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5 opacity-40">Workspace</p>
            </div>
            <ChevronsUpDown size={16} className="text-muted-foreground group-hover:text-[#1a2b3b] transition-colors ml-1" />
          </button>
          
          <AnimatePresence>
            {isWorkspaceOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-border py-2 z-[510] origin-top-left"
              >
                <div className="max-h-60 overflow-y-auto scrollbar-hide">
                    {workspaces.map((ws) => (
                      <button key={ws.id} onClick={() => handleSwitchWorkspace(ws)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-all text-left group">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${activeWorkspace?.id === ws.id ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground'}`}>{ws.name.charAt(0).toUpperCase()}</div>
                        <div className="flex-1 min-w-0"><p className={`text-sm font-bold truncate ${activeWorkspace?.id === ws.id ? 'text-[#1a2b3b]' : ''}`}>{ws.name}</p><p className="text-[10px] font-black text-muted-foreground tracking-widest opacity-50 capitalize">{ws.user_role}</p></div>
                        {activeWorkspace?.id === ws.id && <Check size={16} className="text-primary" strokeWidth={3} />}
                      </button>
                    ))}
                </div>
                <div className="p-2 mt-1 border-t border-border/50">
                    {canCreateWorkspace ? (
                        <button onClick={() => { setIsWorkspaceOpen(false); setIsCreateModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 text-primary rounded-xl transition-all text-left font-black text-xs uppercase tracking-widest">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Plus size={16} strokeWidth={3} /></div>
                            Create Workspace
                        </button>
                    ) : (
                        <div className="p-4 space-y-3">
                            <div className="flex items-start gap-2 text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-100">
                                <Lock size={14} className="shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase">Limit Reached</p>
                                    <p className="text-[9px] font-medium leading-tight opacity-70">Upgrade your plan to unlock more workspaces.</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsWorkspaceOpen(false); navigate('/account', { state: { initialTab: 'billing' } }); }} className="w-full py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">Upgrade Now</button>
                        </div>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
            <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className={`p-2.5 rounded-xl transition-all relative ${isNotificationsOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-[#1a2b3b]'}`}
            >
                <Bell size={20} strokeWidth={isNotificationsOpen ? 2.5 : 2} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white ring-2 ring-primary/20 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isNotificationsOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-3 w-[400px] bg-white rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-border overflow-hidden z-[510] origin-top-right"
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div>
                                <h3 className="text-sm font-black text-[#1a2b3b] uppercase tracking-tight">Intelligence Hub</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Real-time Agency Alerts</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleMarkAllRead} className="text-[9px] font-black uppercase text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/5 transition-all">Mark all read</button>
                                <button onClick={handleClearAll} className="p-1.5 text-muted-foreground hover:text-rose-50 hover:bg-rose-50 rounded-lg transition-all" title="Clear All"><Trash2 size={14} /></button>
                            </div>
                        </div>

                        <div className="max-h-[480px] overflow-y-auto scrollbar-hide bg-slate-50/30">
                            {isNotifLoading ? (
                                <div className="py-20 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={32} /></div>
                            ) : notifications.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((n) => (
                                        <div 
                                            key={n.id} 
                                            onClick={() => { handleMarkAsRead(n.id); if(n.link) navigate(n.link); }}
                                            className={`p-5 flex gap-4 transition-all cursor-pointer relative group ${n.is_read ? 'opacity-60 grayscale-[0.5]' : 'bg-white hover:bg-slate-50'}`}
                                        >
                                            {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${n.type === 'leads' ? 'bg-blue-50 text-blue-600 border-blue-100' : n.type === 'usage' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                {getNotifIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-black text-[#1a2b3b] truncate uppercase tracking-tight">{n.title}</p>
                                                    <span className="text-[8px] font-bold text-muted-foreground whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs font-medium text-gray-500 line-clamp-2 leading-relaxed">{n.message}</p>
                                            </div>
                                            <button onClick={(e) => handleClearIndividual(e, n.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-rose-50 transition-all absolute right-2 top-1/2 -translate-y-1/2"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 px-10 text-center space-y-4">
                                    <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto text-muted-foreground/30"><BellOff size={32} /></div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-[#1a2b3b] uppercase tracking-tight">No active alerts</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed">Your agency feed is currently clear.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white text-center">
                            <button onClick={() => { setIsNotificationsOpen(false); navigate('/account', { state: { initialTab: 'notifications' } }); }} className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto"><Settings size={12} /> Notification Preferences</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:scale-[1.02] transition-all">
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center overflow-hidden bg-gray-100"><User className="text-gray-400" size={20} /></div>
          </button>
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-border py-2 z-[510] origin-top-right"
              >
                <div className="px-6 py-5 border-b border-border/60 mb-2">
                  <p className="text-sm font-black text-[#1a2b3b] truncate mb-1">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
                  <div className="flex items-center gap-2">
                      <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${userProfile?.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                          {userProfile?.subscription_status || 'Trial'}
                      </div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest capitalize">{currentPlan} {isTrial ? 'Trial' : 'Plan'}</p>
                  </div>
                </div>
                <button onClick={() => { navigate('/account'); setIsProfileOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-muted/50 transition-all flex items-center gap-3 text-sm font-bold text-gray-700"><User size={16} /> My account</button>
                <button onClick={() => { navigate('/account', { state: { initialTab: 'billing' } }); setIsProfileOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-muted/50 transition-all flex items-center gap-3 text-sm font-bold text-gray-700"><CreditCard size={16} /> Billing & plan</button>
                <div className="h-px bg-border/60 my-2 mx-4"></div>
                <button onClick={handleSignOut} className="w-full text-left px-5 py-3 hover:bg-rose-50 transition-all flex items-center gap-3 text-sm font-black text-rose-500"><LogOut size={16} /> Sign out</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#1a2b3b]/60 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm"><Building2 size={20} /></div>
                            <div>
                                <h2 className="text-xl font-black text-[#1a2b3b]">New Workspace</h2>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Create a new client bucket</p>
                            </div>
                        </div>
                        <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-muted/50 rounded-full"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleCreateWorkspace} className="p-10 space-y-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Workspace Identity</label>
                            <input autoFocus required type="text" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="e.g. Acme Agency, Solar Project..." className="w-full px-6 py-4 bg-muted/30 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-muted-foreground/40" />
                        </div>
                        <button type="submit" disabled={isCreating || !newWorkspaceName.trim()} className="w-full py-5 bg-[#1a2b3b] text-white rounded-[20px] font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3">
                            {isCreating ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} strokeWidth={3} /> Launch Workspace</>}
                        </button>
                        <p className="text-[10px] text-center text-muted-foreground font-medium leading-relaxed px-4">New workspaces inherit your current <span className="font-bold">{currentPlan}</span> plan context.</p>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default WorkspaceNavbar;