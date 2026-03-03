import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import PreviewArea from '../components/PreviewArea';
import EditorPanel from '../components/EditorPanel';
import SettingsModal, { SettingsTab } from '../components/SettingsModal';
import DeployConfirmModal from '../components/DeployConfirmModal';
import DeploymentStatus from '../components/DeploymentStatus';
import GlobalSidebar from '../components/GlobalSidebar';
import { Funnel, FunnelElement, FunnelPage, FunnelSettings } from '../types';
import { supabase } from '../services/supabaseClient';
import { isFunnelNameTaken, isSlugTaken, slugify } from '../services/funnelService';
import { 
    Loader2, 
    X, 
    Plus, 
    Globe, 
    CheckCircle2, 
    AlertCircle, 
    Copy, 
    Check, 
    Zap, 
    Layout, 
    Link as LinkIcon, 
    Server, 
    ArrowUp, 
    ArrowDown, 
    Trash2, 
    ArrowLeftRight, 
    GripVertical,
    MessageCircle,
    Clock,
    ShieldCheck,
    ChevronRight,
    ExternalLink
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import LogoIcon from '../components/LogoIcon';

const FloatingToolbar: React.FC<{
    onMove: (dir: 'up' | 'down') => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onSwap?: () => void;
    showSwap?: boolean;
    isMobile?: boolean;
    positionY: number;
    positionX: number;
    isVisible: boolean;
}> = ({ onMove, onDuplicate, onDelete, onSwap, showSwap, isMobile, positionY, positionX, isVisible }) => {
    if (!isVisible) return null;
    
    return (
        <div 
            className={`fixed flex flex-col items-center bg-white/95 backdrop-blur-md border border-gray-200 rounded-full shadow-[0_30px_90px_-15px_rgba(0,0,0,0.5)] py-4 px-2.5 gap-2.5 z-[9999] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
                isMobile ? 'scale-[0.8] origin-right' : ''
            }`}
            style={{ 
                top: `${positionY}px`, 
                left: `${positionX}px`,
                transform: `translate(-50%, -50%)` 
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <button 
                onClick={(e) => { e.stopPropagation(); onMove('up'); }} 
                className="p-2 text-[#475569] hover:text-primary hover:bg-gray-100/50 rounded-full transition-all active:scale-90" 
                title="Move Up"
            >
                <ArrowUp size={20} strokeWidth={2.5} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onMove('down'); }} 
                className="p-2 text-[#475569] hover:text-primary hover:bg-gray-100/50 rounded-full transition-all active:scale-90" 
                title="Move Down"
            >
                <ArrowDown size={20} strokeWidth={2.5} />
            </button>
            
            <div className="w-8 h-[1px] bg-gray-100 my-1 mx-2" />
            
            <div className="p-2 text-gray-300 cursor-default">
                <GripVertical size={20} strokeWidth={2.5} />
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); onDuplicate(); }} 
                className="p-3 bg-orange-50 border border-orange-100 text-[#F97316] rounded-full transition-all hover:bg-orange-100 hover:shadow-md active:scale-90" 
                title="Duplicate"
            >
                <Copy size={20} strokeWidth={2.5} />
            </button>

            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                className="p-2 text-[#475569] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all active:scale-90" 
                title="Delete"
            >
                <Trash2 size={20} strokeWidth={2.5} />
            </button>

            {showSwap && (
                <>
                    <div className="w-8 h-[1px] bg-gray-100 my-1 mx-2" />
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSwap?.(); }} 
                        className="p-2 text-[#475569] hover:text-primary hover:bg-gray-100/50 rounded-full transition-all active:scale-90" 
                        title="Swap Content Sides"
                    >
                        <ArrowLeftRight size={20} strokeWidth={2.5} />
                    </button>
                </>
            )}
        </div>
    );
}

const PublishModal: React.FC<{ 
    isOpen: boolean;
    funnel: Funnel; 
    onClose: () => void; 
    onPublish: (slug: string, customDomain?: string) => Promise<void>; 
}> = ({ isOpen, funnel, onClose, onPublish }) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');
  const [slug, setSlug] = useState(slugify(funnel.slug || funnel.name));
  const [customDomain, setCustomDomain] = useState(funnel.settings?.customDomain || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const funnelSlug = slug.trim() || 'untitled';
  const displayUrl = activeTab === 'custom' ? customDomain : `${funnelSlug}.wiseform.io`;
  const liveUrl = activeTab === 'custom' ? `https://${customDomain}` : `https://${funnelSlug}.wiseform.io`;

  const handlePublishClick = async () => {
    if (activeTab === 'standard' && !slug.trim()) {
        setError("Please enter a valid subdomain.");
        return;
    }
    if (activeTab === 'custom' && !customDomain.trim()) {
        setError("Please enter your custom domain.");
        return;
    }

    setIsPublishing(true);
    setError(null);
    try {
        await new Promise(resolve => setTimeout(resolve, 4000)); // Simulate deployment time
        await onPublish(slug.trim(), activeTab === 'custom' ? customDomain.trim() : undefined);
        setIsSuccess(true);
    } catch (err: any) {
        setError(err.message || "Failed to publish.");
        setIsPublishing(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state for next time
    setTimeout(() => {
        setIsPublishing(false);
        setIsSuccess(false);
        setError(null);
    }, 300); 
  }

  const handleTalkToFounder = () => {
    const msg = encodeURIComponent(`Hi! I'm connecting my custom domain (${customDomain}) to my funnel "${funnel.name}" and I want to ensure my DNS settings are correct.`);
    window.open(`https://wa.me/16478623292?text=${msg}`, '_blank');
  };

  if (!isOpen) return null;

  if (isPublishing || isSuccess) {
      return (
          <DeploymentStatus 
              status={isSuccess ? 'success' : 'publishing'}
              displayUrl={displayUrl}
              liveUrl={liveUrl}
              onClose={handleClose}
              activeTab={activeTab}
          />
      )
  }

  return (
    <AnimatePresence>
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4"
        >
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-[40px] shadow-2xl w-full max-w-[720px] overflow-hidden"
        >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
                <div>
                    <h2 className="text-2xl font-black text-[#1a2b3b]">Deploy to Web</h2>
                    <p className="text-sm font-medium text-gray-500 mt-1">Make your funnel accessible to the world.</p>
                </div>
                <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100/80 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-10">
                <div className="space-y-8 animate-fade-in-down">
                    <div className="flex bg-gray-100 p-1.5 rounded-[20px] border border-gray-200/80">
                        <button 
                            onClick={() => setActiveTab('standard')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'standard' ? 'bg-white shadow text-primary' : 'text-muted-foreground'}`}
                        >
                            <LinkIcon size={16} /> Wiseform Domain
                        </button>
                        <button 
                            onClick={() => setActiveTab('custom')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'custom' ? 'bg-white shadow text-primary' : 'text-muted-foreground'}`}
                        >
                            <Globe size={16} /> Custom Domain
                        </button>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm font-bold">
                            <AlertCircle size={18} /> {error}
                        </motion.div>
                    )}

                    <div className="space-y-6">
                        {activeTab === 'standard' ? (
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 ml-1">Funnel Subdomain</label>
                                <div className="flex flex-col gap-2 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus-within:border-primary transition-colors">
                                    <input 
                                        type="text" 
                                        value={slug} 
                                        onChange={(e) => setSlug(slugify(e.target.value))} 
                                        className="w-full bg-transparent border-none p-0 outline-none font-bold text-xl text-gray-800 text-right" 
                                        placeholder="my-awesome-funnel"
                                    />
                                    <div className="flex items-center justify-end text-gray-500 font-semibold text-sm mt-1">
                                        .wiseform.io <Globe size={14} className="ml-2" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-gray-500 ml-2">This will be the primary public link to your campaign.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 mb-2 block ml-1">Domain Name</label>
                                    <div className="relative">
                                        <Server size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            value={customDomain} 
                                            onChange={(e) => setCustomDomain(e.target.value)} 
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-base font-bold text-gray-800 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-gray-400" 
                                            placeholder="funnel.myagency.com"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 border border-gray-200/80 rounded-3xl space-y-4">
                                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Zap size={16} className="text-primary" />
                                        <span>Connection Instructions</span>
                                    </h4>
                                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                        Log in to your domain registrar (e.g., GoDaddy, Namecheap) and create a <strong className="text-gray-900">CNAME record</strong> pointing to:
                                    </p>
                                    <div className="p-3 bg-white rounded-xl border-2 border-dashed border-gray-300 text-center">
                                        <code className="text-sm font-bold text-primary">landing.wiseform.io</code>
                                    </div>
                                    <div className="h-px bg-gray-200" />
                                    <div className="flex items-start gap-3 text-xs text-gray-500">
                                        <Clock size={16} className="shrink-0 mt-0.5" />
                                        <span>DNS changes can take anywhere from a few minutes to 24 hours to propagate worldwide.</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
                                     <div className="flex items-center gap-3">
                                         <div className="shrink-0">
                                            <MessageCircle size={20} className="text-amber-600"/>
                                         </div>
                                         <div className="flex-grow">
                                             <h5 className="text-xs font-bold text-amber-900">Need Help?</h5>
                                             <p className="text-[11px] text-amber-800/90 font-medium leading-snug mt-1">
                                                 Want to verify your setup? Click below to chat with our founder for assistance.
                                             </p>
                                         </div>
                                         <button onClick={handleTalkToFounder} className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-amber-50/50 transition-all shadow-sm whitespace-nowrap">
                                             Verify Setup
                                         </button>
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handlePublishClick} 
                        className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-95"
                    >
                        <Zap size={20} /> Deploy & Go Live
                    </button>
                </div>
            </div>
        </motion.div>
        </motion.div>
    </AnimatePresence>
  );
};

const FunnelBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const funnelId = searchParams.get('id');
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [workspacePlan, setWorkspacePlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('social');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDeployConfirmModal, setShowDeployConfirmModal] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'pages' | 'design'>('pages');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [toolbarPos, setToolbarPos] = useState({ y: 0, x: 0 });
  const [history, setHistory] = useState<Funnel[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => { if (funnelId) fetchFunnel(); else navigate('/funnels'); }, [funnelId]);

  useEffect(() => {
    setSelectedElementId(null);
    setSelectedField(null);
  }, [activePageIndex]);

  const fetchFunnel = async () => {
    try {
        const { data: funnelData, error: funnelError } = await supabase.from('funnels').select('*').eq('id', funnelId).single();
        if (funnelError) throw funnelError;
        
        const { data: workspaceData } = await supabase.from('workspaces').select('plan_type').eq('id', funnelData.workspace_id).single();
        if (workspaceData) setWorkspacePlan(workspaceData.plan_type);

        const { data: pagesData } = await supabase.from('funnel_pages').select('*').eq('funnel_id', funnelId).order('order_index', { ascending: true });
        
        const initialFunnel: Funnel = {
            id: funnelData.id,
            workspaceId: funnelData.workspace_id,
            name: funnelData.name,
            slug: funnelData.slug,
            status: funnelData.status,
            theme: funnelData.theme,
            settings: funnelData.settings,
            pages: pagesData?.map(p => ({ 
                id: p.id, 
                title: p.title, 
                slug: p.slug,
                type: p.type, 
                elements: p.elements || [], 
                confetti: p.confetti,
                trackingCode: p.tracking_code,
                redirectUrl: p.redirect_url,
                parent_id: p.parent_id,
                order_index: p.order_index,
                visits_count: p.visits_count
            })) || []
        };
        
        setFunnel(initialFunnel);
        setHistory([JSON.parse(JSON.stringify(initialFunnel))]);
        setHistoryIndex(0);
    } catch (err: any) { 
        console.error("Fetch error:", err);
        navigate('/funnels'); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const updateFunnelAndHistory = useCallback((newFunnel: Funnel, skipHistory = false) => {
      setFunnel(newFunnel);
      if (!skipHistory) {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newFunnel)));
          if (newHistory.length > 50) newHistory.shift(); 
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
      }
  }, [history, historyIndex]);

  const syncToSupabase = useCallback(async (updates: Partial<Funnel>) => {
    if (!funnelId) return;
    setIsSaving(true);
    try {
        const dbUpdates: any = {};
        if (updates.name !== undefined) {
            dbUpdates.name = updates.name;
            dbUpdates.slug = slugify(updates.name);
        }
        if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
        if (updates.status === 'live') {
            dbUpdates.status = 'live';
        }
        if (updates.settings !== undefined) dbUpdates.settings = updates.settings;
        
        dbUpdates.last_edited = new Date().toISOString();

        const { error } = await supabase.from('funnels').update(dbUpdates).eq('id', funnelId);
        if (error) throw error;
    } catch (err: any) {
        console.error("Save error:", err);
        throw err;
    } finally {
        setIsSaving(false);
    }
  }, [funnelId]);

  const syncPageToSupabase = useCallback(async (pageId: string, updates: any) => {
    setIsSaving(true);
    try {
        const dbUpdates: any = {};
        if (updates.elements !== undefined) dbUpdates.elements = updates.elements;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
        if (updates.confetti !== undefined) dbUpdates.confetti = updates.confetti;
        if (updates.trackingCode !== undefined) dbUpdates.tracking_code = updates.trackingCode;
        if (updates.redirectUrl !== undefined) dbUpdates.redirect_url = updates.redirectUrl;

        const { error } = await supabase.from('funnel_pages').update(dbUpdates).eq('id', pageId);
        if (error) throw error;
    } catch (err: any) {
        console.error("Page save error:", err);
    } finally {
        setIsSaving(false);
    }
  }, []);

  const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          const prevState = history[prevIndex];
          setHistoryIndex(prevIndex);
          setFunnel(prevState);
          syncToSupabase({ theme: prevState.theme, settings: prevState.settings, name: prevState.name });
          prevState.pages.forEach(p => syncPageToSupabase(p.id, { 
              elements: p.elements, 
              title: p.title, 
              slug: p.slug,
              confetti: p.confetti,
              trackingCode: p.trackingCode,
              redirectUrl: p.redirectUrl,
              parent_id: p.parent_id,
              order_index: p.order_index
          }));
      }
  }, [history, historyIndex, syncToSupabase, syncPageToSupabase]);

  const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          const nextState = history[nextIndex];
          setHistoryIndex(nextIndex);
          setFunnel(nextState);
          syncToSupabase({ theme: nextState.theme, settings: nextState.settings, name: nextState.name });
          nextState.pages.forEach(p => syncPageToSupabase(p.id, { 
              elements: p.elements, 
              title: p.title, 
              slug: p.slug,
              confetti: p.confetti,
              trackingCode: p.trackingCode,
              redirectUrl: p.redirectUrl,
              parent_id: p.parent_id,
              order_index: p.order_index
          }));
      }
  }, [history, historyIndex, syncToSupabase, syncPageToSupabase]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              if (e.shiftKey) handleRedo();
              else handleUndo();
          } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              handleRedo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleRenameFunnel = async (newName: string) => {
    if (!funnel) return;
    
    const isTaken = await isFunnelNameTaken(newName, funnel.id);
    if (isTaken) {
        alert("This funnel name is already globally claimed. Please choose a unique name.");
        return;
    }

    const next = { ...funnel, name: newName };
    updateFunnelAndHistory(next);
    syncToSupabase({ name: newName });
  };

  const handlePublish = async (slug: string, customDomain?: string) => {
    if (!funnel) return;

    if (!customDomain) { // Only validate slug for wiseform.io subdomains
      const isTaken = await isSlugTaken(slug, funnel.id);
      if (isTaken) {
        throw new Error("This funnel URL is already globally claimed. Please choose a unique URL.");
      }
    }

    try {
        for (const p of funnel.pages) {
            await syncPageToSupabase(p.id, { 
                elements: p.elements, 
                title: p.title, 
                slug: p.slug,
                confetti: p.confetti
            });
        }
        
        const syncUpdates: { status: 'live' | 'draft'; slug: string; settings?: FunnelSettings } = { status: 'live', slug };
        let localSettings = funnel.settings;

        if (customDomain) {
            localSettings = { ...localSettings, customDomain };
            syncUpdates.settings = localSettings;
        }
        
        await syncToSupabase(syncUpdates);
        
        const next: Funnel = { ...funnel, status: 'live', slug, settings: localSettings };
        updateFunnelAndHistory(next, true);
        
        setHistory(prev => {
            const nextHistory = [...prev];
            if (nextHistory[historyIndex]) {
                nextHistory[historyIndex] = JSON.parse(JSON.stringify(next));
            }
            return nextHistory;
        });
    } catch (err: any) { 
        throw err; 
    }
  };

  const handleUnpublish = async () => {
    if (!funnel) return;
    try {
        await syncToSupabase({ status: 'draft' });
        const next: Funnel = { ...funnel, status: 'draft' };
        updateFunnelAndHistory(next, true);
        setHistory(prev => {
            const nextHistory = [...prev];
            if (nextHistory[historyIndex]) nextHistory[historyIndex] = JSON.parse(JSON.stringify(next));
            return nextHistory;
        });
    } catch (err: any) { console.error("Unpublish error:", err); }
  };

  const handleAddPage = async (type: 'quiz' | 'end' | 'start' = 'quiz', templateId?: string) => {
    if (!funnel) return;
    try {
        const order_index = funnel.pages.length;
        const quizStepCount = funnel.pages.filter(p => p.type === 'quiz').length;
        
        let title = type === 'quiz' ? `Step ${quizStepCount + 1}` : type === 'start' ? 'Landing Page' : 'Result Page';
        let quizType: any = 'single';
        let fieldName = `field_${Date.now()}`;
        let defaultElements: FunnelElement[] = [];

        if (type === 'quiz') {
            let defaultCtaText = 'Next Phase';
            if (templateId === 'slider') {
                quizType = 'slider';
                title = `Range ${quizStepCount + 1}`;
            } else if (templateId === 'contact') {
                quizType = 'input';
                fieldName = 'contactInfo';
                title = 'Contact Information';
                defaultCtaText = 'Generate Report';
            } else if (templateId === 'zip') {
                quizType = 'zip';
                fieldName = 'zipCode';
                title = 'Verify Territory';
                defaultCtaText = 'Confirm Territory';
            } else if (templateId === 'otp') {
                quizType = 'otp';
                fieldName = 'otp_code';
                title = 'Identity Verification';
                defaultCtaText = 'Verify Identity';
            } else if (templateId === 'open') {
                quizType = 'input';
                title = `Free Response ${quizStepCount + 1}`;
                defaultCtaText = 'Proceed';
            } else if (templateId === 'multiple') {
                quizType = 'multiple';
                title = `Select Many ${quizStepCount + 1}`;
            }

            defaultElements = [{
                id: uuidv4(),
                type: 'quiz-step',
                content: {
                    question: title,
                    subtitle: 'Please provide the requested information.',
                    quizType: quizType,
                    field: fieldName,
                    options: (quizType === 'single' || quizType === 'multiple') ? [
                        { label: 'Option A', value: 'a', icon: 'Zap' },
                        { label: 'Option B', value: 'b', icon: 'ShieldCheck' }
                    ] : [],
                    validation: quizType === 'slider' ? { min: 0, max: 100, step: 1, default: 50, format: 'number' } : {},
                    cta: { text: defaultCtaText, enabled: true, style: { size: 'lg', cornerRadius: 'xl' } }
                },
                style: { backgroundColor: '#ffffff', paddingTop: '10', paddingBottom: '10' }
            }];
        } else if (type === 'end') {
            defaultElements = [{
                id: uuidv4(),
                type: 'quiz-result',
                content: {
                    headline: "Assessment Synchronized!",
                    subheadline: "We've analyzed your responses and prepared your custom report.",
                    metrics: [
                        { label: "Profile Score", icon: "Zap", valueRule: "score", description: "Your calculated baseline based on quiz inputs." }
                    ],
                    cta: { text: "Access Full Results", enabled: true, style: { size: 'lg', cornerRadius: 'xl' } }
                },
                style: { backgroundColor: '#ffffff', paddingTop: '15', paddingBottom: '15' }
            }];
        }

        const tempId = uuidv4();
        const newPage: FunnelPage = { id: tempId, title, type: type as any, elements: defaultElements, confetti: false, order_index, visits_count: 0 };
        
        const next = { ...funnel, pages: [...funnel.pages, newPage] };
        updateFunnelAndHistory(next);
        setActivePageIndex(funnel.pages.length);

        const { data, error } = await supabase.from('funnel_pages').insert([{ funnel_id: funnel.id, title, type, elements: defaultElements, order_index, visits_count: 0 }]).select().single();
        if (!error && data) {
            setFunnel(prev => prev ? { ...prev, pages: prev.pages.map(p => p.id === tempId ? { ...p, id: (data as any).id } : p) } : null);
        }
    } catch (err: any) { console.error("Add page error:", err); }
  };

  const handleDuplicatePage = async (pageId: string) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const pageIndex = currentFunnel.pages.findIndex(p => p.id === pageId);
    const pageToCopy = currentFunnel.pages[pageIndex];
    if (!pageToCopy) return;

    const tempId = uuidv4();
    const targetOrderIndex = (pageToCopy.order_index ?? pageIndex) + 1;

    const updatedPages = currentFunnel.pages.map(p => {
        if ((p.order_index ?? 0) >= targetOrderIndex) return { ...p, order_index: (p.order_index ?? 0) + 1 };
        return p;
    });

    const hashSuffix = Math.random().toString(36).substring(2, 6);
    const newPage: FunnelPage = {
        ...JSON.parse(JSON.stringify(pageToCopy)),
        id: tempId,
        title: `${pageToCopy.title} (Copy)`,
        slug: `${pageToCopy.slug || pageToCopy.title.toLowerCase().replace(/\\s+/g, '-')}-copy-${hashSuffix}`,
        order_index: targetOrderIndex,
        parent_id: null,
        visits_count: 0
    };

    const finalPages = [...updatedPages];
    finalPages.splice(pageIndex + 1, 0, newPage);
    finalPages.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    updateFunnelAndHistory({ ...currentFunnel, pages: finalPages });
    setActivePageIndex(pageIndex + 1);

    try {
        await supabase.rpc('duplicate_page_reorder', { target_funnel_id: currentFunnel.id, start_index: pageToCopy.order_index ?? pageIndex });
        const { data, error } = await supabase.from('funnel_pages').insert([{
            funnel_id: currentFunnel.id,
            title: newPage.title,
            type: newPage.type,
            elements: newPage.elements,
            order_index: targetOrderIndex,
            confetti: newPage.confetti,
            tracking_code: newPage.trackingCode,
            redirect_url: newPage.redirectUrl,
            slug: newPage.slug,
            parent_id: null,
            visits_count: 0
        }]).select().single();
        
        if (!error && data) {
            setFunnel(prev => prev ? { ...prev, pages: prev.pages.map(p => p.id === tempId ? { ...p, id: (data as any).id } : p) } : null);
        }
    } catch (err: any) { console.error("Duplicate sync error:", err); }
  };

  const handleCreateVariant = async (pageId: string) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const parentPage = currentFunnel.pages.find(p => p.id === pageId);
    if (!parentPage) return;

    let parentSlug = parentPage.slug || slugify(parentPage.title);
    if (!parentSlug.endsWith('-a') && !parentSlug.endsWith('-b')) {
        parentSlug = `${parentSlug}-a`;
        handleUpdatePage(parentPage.id, { slug: parentSlug });
    }

    const tempId = uuidv4();
    const newVariant: FunnelPage = {
        ...JSON.parse(JSON.stringify(parentPage)),
        id: tempId,
        title: `${parentPage.title} (Variant B)`,
        slug: parentSlug.endsWith('-a') ? parentSlug.replace(/-a$/, '-b') : `${parentSlug}-b`,
        parent_id: pageId,
        order_index: parentPage.order_index,
        visits_count: 0
    };

    const parentIndex = currentFunnel.pages.findIndex(p => p.id === pageId);
    const nextPages = [...currentFunnel.pages];
    nextPages.splice(parentIndex + 1, 0, newVariant);

    updateFunnelAndHistory({ ...currentFunnel, pages: nextPages });
    setActivePageIndex(parentIndex + 1);

    try {
        const { data, error } = await supabase.from('funnel_pages').insert([{
            funnel_id: currentFunnel.id,
            title: newVariant.title,
            type: newVariant.type,
            elements: newVariant.elements,
            order_index: parentPage.order_index,
            confetti: newVariant.confetti,
            tracking_code: newVariant.trackingCode,
            redirect_url: newVariant.redirectUrl,
            slug: newVariant.slug,
            parent_id: pageId,
            visits_count: 0
        }]).select().single();

        if (!error && data) {
            setFunnel(prev => prev ? { ...prev, pages: prev.pages.map(p => p.id === tempId ? { ...p, id: (data as any).id } : p) } : null);
        }
    } catch (err: any) { console.error("Variant sync error:", err); }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!funnel || funnel.pages.length <= 1) return;
    const currentFunnel = funnel as Funnel;
    const deletedPage = currentFunnel.pages.find(p => p.id === pageId);
    if (!deletedPage) return;

    const nextPages = currentFunnel.pages.filter(p => p.id !== pageId);
    updateFunnelAndHistory({ ...currentFunnel, pages: nextPages });
    setActivePageIndex(Math.max(0, activePageIndex - 1));

    try {
        await supabase.from('funnel_pages').delete().eq('id', pageId);
    } catch (err: any) { console.error("Delete sync error:", err); }
  };

  const handleRenamePage = (pageId: string, title: string) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const next = { ...currentFunnel, pages: currentFunnel.pages.map(p => p.id === pageId ? { ...p, title } : p) };
    updateFunnelAndHistory(next);
    syncPageToSupabase(pageId, { title });
  };

  const handleUpdatePage = (pageId: string, updates: Partial<FunnelPage>) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const next = { ...currentFunnel, pages: currentFunnel.pages.map(p => p.id === pageId ? { ...p, ...updates } : p) };
    updateFunnelAndHistory(next);
    syncPageToSupabase(pageId, updates);
  };

  const handleReorderPages = async (startIndex: number, endIndex: number) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const result = Array.from(currentFunnel.pages) as FunnelPage[];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    const next = { ...currentFunnel, pages: result.map((p, i) => ({ ...p, order_index: i })) };
    updateFunnelAndHistory(next);
    for (let i = 0; i < result.length; i++) { 
        await supabase.from('funnel_pages').update({ order_index: i }).eq('id', result[i].id); 
    }
  };

  const handleUpdateElement = (updates: any) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const activePage = currentFunnel.pages[activePageIndex] as FunnelPage;
    if (!activePage || !selectedElementId) return;
    const nextPages = currentFunnel.pages.map((p, idx) => {
        if (idx !== activePageIndex) return p;
        return {
            ...p,
            elements: p.elements.map(el => {
                if (el.id !== selectedElementId) return el;
                const { style: styleUpdates, ...contentUpdates } = updates;
                const newContent = { ...el.content, ...contentUpdates };
                const newStyle = styleUpdates ? { ...el.style, ...styleUpdates } : el.style;
                return { ...el, content: newContent, style: newStyle };
            })
        } as FunnelPage;
    });
    const next = { ...currentFunnel, pages: nextPages };
    updateFunnelAndHistory(next);
    syncPageToSupabase(activePage.id, { elements: nextPages[activePageIndex].elements });
  };

  const handleDuplicateElement = (elementId: string) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const pageToUpdate = currentFunnel.pages[activePageIndex] as FunnelPage;
    if (!pageToUpdate) return;
    const element = pageToUpdate.elements.find(el => el.id === elementId);
    if (!element) return;
    
    const newId = uuidv4();
    const newElement = JSON.parse(JSON.stringify(element));
    newElement.id = newId;
    
    const elementIndex = pageToUpdate.elements.findIndex(el => el.id === elementId);
    const newElements = [...pageToUpdate.elements];
    newElements.splice(elementIndex + 1, 0, newElement);

    const nextPages = [...currentFunnel.pages];
    nextPages[activePageIndex] = { ...pageToUpdate, elements: newElements };
    const next = { ...currentFunnel, pages: nextPages };
    
    updateFunnelAndHistory(next);
    setSelectedElementId(newId);
    setSelectedField(null);
    syncPageToSupabase(pageToUpdate.id, { elements: newElements });
  };

  const handleDeleteElement = (elementId: string) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const pageToUpdate = currentFunnel.pages[activePageIndex] as FunnelPage;
    if (!pageToUpdate) return;
    const newElements = pageToUpdate.elements.filter(el => el.id !== elementId);
    
    const nextPages = [...currentFunnel.pages];
    nextPages[activePageIndex] = { ...pageToUpdate, elements: newElements };
    const next = { ...currentFunnel, pages: nextPages };

    updateFunnelAndHistory(next);
    setSelectedElementId(null);
    setSelectedField(null);
    syncPageToSupabase(pageToUpdate.id, { elements: newElements });
  };

  const handleMoveElement = (elementId: string, direction: 'up' | 'down') => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const pageToUpdate = currentFunnel.pages[activePageIndex] as FunnelPage;
    if (!pageToUpdate) return;
    
    const index = pageToUpdate.elements.findIndex(el => el.id === elementId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= pageToUpdate.elements.length) return;
    
    const newElements = [...pageToUpdate.elements];
    const currentItem = newElements[index];
    newElements[index] = newElements[newIndex];
    newElements[newIndex] = currentItem;
    
    const nextPages = [...currentFunnel.pages];
    nextPages[activePageIndex] = { ...pageToUpdate, elements: newElements };
    const next = { ...currentFunnel, pages: nextPages };
    
    updateFunnelAndHistory(next);
    syncPageToSupabase(pageToUpdate.id, { elements: newElements });
  };

  const handleSwapElement = (elementId: string) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const pageToUpdate = currentFunnel.pages[activePageIndex] as FunnelPage;
    if (!pageToUpdate) return;
    
    const newElements = pageToUpdate.elements.map(el => {
        if (el.id !== elementId) return el;
        return { ...el, style: { ...el.style, reverse: !el.style.reverse } };
    });
    
    const nextPages = [...currentFunnel.pages];
    nextPages[activePageIndex] = { ...pageToUpdate, elements: newElements };
    const next = { ...currentFunnel, pages: nextPages };
    
    updateFunnelAndHistory(next);
    syncPageToSupabase(pageToUpdate.id, { elements: newElements });
  };

  const handleUpdateSettings = (updates: Partial<FunnelSettings>) => {
    if (!funnel) return;
    const currentFunnel = funnel as Funnel;
    const next = { ...currentFunnel, settings: { ...currentFunnel.settings, ...updates } };
    updateFunnelAndHistory(next);
    syncToSupabase({ settings: next.settings });
  };

  const handleAddFirstPage = async () => {
      if (!funnel) return;
      setIsLoading(true);
      try {
          const { error } = await supabase.from('funnel_pages').insert([{ 
              funnel_id: funnel.id, 
              title: 'Landing Page', 
              type: 'start', 
              elements: [], 
              order_index: 0,
              visits_count: 0
          }]).select().single();
          if (error) throw error;
          fetchFunnel();
      } catch (err: any) { console.error("Add page error:", err); setIsLoading(false); }
  };

  const handleToolbarPositionUpdate = useCallback((y: number, x: number) => {
      setToolbarPos({ y, x });
  }, []);

  if (isLoading) return (
    <AnimatePresence>
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-8"
        >
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
                    Accessing Funnels...
                </motion.p>
            </div>
        </motion.div>
    </AnimatePresence>
  );

  if (!funnel) return null;

  const activePage = funnel.pages[activePageIndex];
  if (!activePage && !isLoading) {
      return (
          <div className="flex h-screen overflow-hidden bg-white font-sans">
              <GlobalSidebar activeTab="build" onTabChange={(id) => navigate(`/${id}`)} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/10">
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
                      <AlertCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-foreground mb-2">Empty Canvas</h2>
                  <p className="text-muted-foreground mb-8 max-sm">This funnel doesn't have any pages yet. Let's create your first landing page to get started.</p>
                  <button onClick={handleAddFirstPage} className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-3">
                      <Plus size={20} strokeWidth={3} /> Create Landing Page
                  </button>
              </div>
          </div>
      );
  }

  const globalHeader = funnel.pages.find(p => p.type === 'start')?.elements.find(e => e.type === 'header');
  const globalFooter = funnel.pages.find(p => p.type === 'start')?.elements.find(e => e.type === 'footer-complex');
  const activePageSlug = activePage?.slug || (activePage?.title ? slugify(activePage.title) : 'landing-page');
  const selectedElement = activePage.elements.find(e => e.id === selectedElementId) || (globalHeader?.id === selectedElementId ? globalHeader : globalFooter?.id === selectedElementId ? globalFooter : null);

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans relative">
      <GlobalSidebar activeTab="build" onTabChange={() => {}} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar 
            funnelName={funnel.name} funnelId={funnel.id} workspaceId={funnel.workspaceId} status={funnel.status} slug={funnel.slug} activePageSlug={activePageSlug}
            onRename={handleRenameFunnel} onPublish={() => setShowDeployConfirmModal(true)} onUnpublish={handleUnpublish} viewMode={viewMode} setViewMode={setViewMode} 
            onUndo={handleUndo} onRedo={handleRedo} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} isSaving={isSaving} 
            onOpenSettings={() => { setSettingsInitialTab('social'); setShowSettingsModal(true); }} 
        />
        <div className="flex flex-1 overflow-hidden relative">
            <Sidebar 
                pages={funnel.pages} activePageIndex={activePageIndex} onSelectPage={setActivePageIndex} onAddPage={handleAddPage} 
                onDuplicatePage={handleDuplicatePage} onCreateVariant={handleCreateVariant} onDeletePage={handleDeletePage} onRenamePage={handleRenamePage} onUpdatePage={handleUpdatePage} onReorderPages={handleReorderPages} 
                activeTab={activeSidebarTab} setActiveTab={setActiveSidebarTab} 
                otpEnabled={funnel.settings.otpVerification?.enabled ?? true}
            />
            <PreviewArea 
                funnel={funnel} page={activePage} viewMode={viewMode} 
                onSelectElement={(e, f) => { setSelectedElementId(e); setSelectedField(f); }} 
                selectedElementId={selectedElementId} selectedField={selectedField} onUpdateElement={handleUpdateElement} 
                globalHeader={globalHeader} globalFooter={globalFooter}
                onDuplicateElement={handleDuplicateElement} onDeleteElement={handleDeleteElement} onSwapElement={handleSwapElement} onMoveElement={handleMoveElement} 
                isLive={false}
                onToolbarPositionUpdate={handleToolbarPositionUpdate}
            />
            {selectedElementId && ( 
                <EditorPanel 
                    element={selectedElement} 
                    page={activePage} funnel={funnel} onUpdate={handleUpdateElement} 
                    onClose={() => { setSelectedElementId(null); setSelectedField(null); }} 
                    viewMode={viewMode} selectedField={selectedField} 
                /> 
            )}
        </div>
      </div>
      
      {selectedElementId && !selectedField && (
          <FloatingToolbar 
            onMove={(dir) => handleMoveElement(selectedElementId, dir)}
            onDuplicate={() => handleDuplicateElement(selectedElementId)}
            onDelete={() => handleDeleteElement(selectedElementId)}
            onSwap={() => handleSwapElement(selectedElementId)}
            showSwap={selectedElement?.type === 'hero' && selectedElement?.style?.layout === '2-column'}
            isMobile={viewMode === 'mobile'}
            positionY={toolbarPos.y}
            positionX={toolbarPos.x}
            isVisible={true}
          />
      )}

      {showSettingsModal && (
        <SettingsModal 
          settings={funnel.settings} 
          workspacePlan={workspacePlan} 
          onUpdateSettings={handleUpdateSettings} 
          onClose={() => setShowSettingsModal(false)} 
          funnelId={funnel.id} 
          workspaceId={funnel.workspaceId}
          isSaving={isSaving} 
          initialTab={settingsInitialTab}
        />
      )}
      
      {showDeployConfirmModal && (
          <DeployConfirmModal
              isOpen={showDeployConfirmModal}
              onClose={() => setShowDeployConfirmModal(false)}
              funnel={funnel}
              onConfirm={() => {
                  setShowDeployConfirmModal(false);
                  setShowPublishModal(true);
              }}
              onEditSettings={(tab) => {
                  setShowDeployConfirmModal(false);
                  setSettingsInitialTab(tab);
                  setShowSettingsModal(true);
              }}
              onUpdateSettings={handleUpdateSettings}
          />
      )}

      <PublishModal 
        isOpen={showPublishModal} 
        funnel={funnel} 
        onClose={() => setShowPublishModal(false)} 
        onPublish={handlePublish} 
      />
    </div>
  );
};

export default FunnelBuilder;
