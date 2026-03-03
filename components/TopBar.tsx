import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Monitor, Eye, Settings, Zap, Undo2, Redo2, Check, Pencil, Globe, Power, ChevronDown, ExternalLink, Loader2, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface TopBarProps {
  funnelName: string;
  status?: 'draft' | 'live';
  workspaceId?: string;
  onRename: (newName: string) => void;
  onPublish: () => void;
  onUnpublish: () => Promise<void>;
  onShareClick?: () => void;
  viewMode: 'desktop' | 'mobile';
  setViewMode: (mode: 'desktop' | 'mobile') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  onOpenSettings: () => void;
  funnelId: string;
  slug?: string;
  activePageSlug?: string;
}

const UnpublishModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isProcessing: boolean;
    funnelName: string;
}> = ({ isOpen, onClose, onConfirm, isProcessing, funnelName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-[#1a2b3b]/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="p-10 pb-0 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-rose-500/10"><Power size={40} /></div>
                    <h2 className="text-3xl font-black text-[#1a2b3b] mb-4 tracking-tighter uppercase">Take Offline?</h2>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">You are about to return <span className="font-bold text-[#1a2b3b]">"{funnelName}"</span> to draft status. All live links will stop working immediately.</p>
                </div>
                <div className="p-10 pt-4 flex flex-col gap-3">
                    <button onClick={onConfirm} disabled={isProcessing} className="w-full py-5 bg-[#1a2b3b] text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50">{isProcessing ? <><Loader2 size={18} className="animate-spin" /> Deactivating...</> : <>Confirm deactivation</>}</button>
                    <button onClick={onClose} disabled={isProcessing} className="w-full py-5 bg-gray-50 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all disabled:opacity-30">Keep campaign live</button>
                </div>
            </div>
        </div>
    );
};

const TopBar: React.FC<TopBarProps> = ({ 
    funnelName, status = 'draft', workspaceId, onRename, onPublish, onUnpublish, onShareClick, viewMode, setViewMode, onUndo, onRedo, canUndo, canRedo, isSaving, onOpenSettings, funnelId, slug, activePageSlug
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(funnelName);
  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [isTakingOffline, setIsTakingOffline] = useState(false);
  const [isSyncingChanges, setIsSyncingChanges] = useState(false);
  const publishMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTempName(funnelName); }, [funnelName]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (publishMenuRef.current && !publishMenuRef.current.contains(event.target as Node)) setIsPublishMenuOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveName = () => { if (tempName.trim()) onRename(tempName.trim()); else setTempName(funnelName); setIsEditingName(false); };
  const getPublicLink = (isPreview: boolean) => {
    const activeSlug = (slug || funnelName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')) || 'campaign';
    const pagePath = isPreview && activePageSlug ? `/${activePageSlug}` : '';
    const query = isPreview ? '?preview=true' : '';
    return `https://wisefunnel.io/#/funnel/${funnelId}/${activeSlug}${pagePath}${query}`;
  };
  const handlePreview = () => window.open(getPublicLink(true), '_blank');
  const handleViewPublicLink = () => window.open(getPublicLink(false), '_blank');
  const handleToggleMenu = (e: React.MouseEvent) => { e.stopPropagation(); if (!isTakingOffline) { const nextState = !isPublishMenuOpen; setIsPublishMenuOpen(nextState); if (nextState && onShareClick) onShareClick(); } };
  const handleTakeOfflineInitiate = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); setIsPublishMenuOpen(false); setIsUnpublishModalOpen(true); };
  const handleConfirmUnpublish = async () => { setIsTakingOffline(true); try { await onUnpublish(); setIsUnpublishModalOpen(false); } catch (err) { console.error(err); } finally { setIsTakingOffline(false); } };
  const handlePublishAction = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); setIsPublishMenuOpen(false); onPublish(); };
  const handleSyncLatestChanges = async (e: React.MouseEvent) => { e.stopPropagation(); setIsSyncingChanges(true); setIsPublishMenuOpen(false); try { await onPublish(); } catch (err) { console.error(err); } finally { setIsSyncingChanges(false); } };

  return (
    <div className="h-16 bg-white border-b border-border flex items-center justify-between px-6 z-[100] shrink-0 shadow-sm relative">
      <div className="flex items-center gap-4 min-w-[300px]">
        {isEditingName ? (
          <div className="flex items-center gap-1 animate-scale-in">
            <input autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="bg-muted px-2 py-1 rounded border border-primary outline-none text-sm font-bold text-foreground w-48" />
            <button onClick={handleSaveName} className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"><Check size={14} strokeWidth={3} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 group cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-lg transition-colors" onClick={() => setIsEditingName(true)}>
                <h1 className="font-bold text-foreground truncate max-w-[200px] text-sm md:text-base tracking-tight">{funnelName}</h1>
                <Pencil size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-widest ${status === 'live' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {status === 'live' ? 'Live' : 'Draft'}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="mr-2 text-[10px] font-bold tracking-widest text-muted-foreground w-16 text-right">{isSaving || isTakingOffline || isSyncingChanges ? 'Saving...' : 'Saved'}</div>
        <div className="flex items-center bg-muted/50 rounded-lg border border-border p-1 mr-2">
             <button onClick={onUndo} disabled={!canUndo} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background hover:shadow-sm rounded transition-all disabled:opacity-30" title="Undo (Ctrl+Z)"><Undo2 size={18} strokeWidth={1.5} /></button>
             <button onClick={onRedo} disabled={!canRedo} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background hover:shadow-sm rounded transition-all disabled:opacity-30" title="Redo (Ctrl+Shift+Z)"><Redo2 size={18} strokeWidth={1.5} /></button>
        </div>
        <div className="hidden lg:flex items-center bg-muted/50 rounded-lg border border-border p-1 mr-2">
            <button onClick={() => setViewMode('desktop')} className={`p-1.5 rounded transition-all ${viewMode === 'desktop' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} title="Desktop view"><Monitor size={18} strokeWidth={2} /></button>
            <button onClick={() => setViewMode('mobile')} className={`p-1.5 rounded transition-all ${viewMode === 'mobile' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} title="Mobile view"><Smartphone size={18} strokeWidth={2} /></button>
        </div>
        <button onClick={onOpenSettings} className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors" title="Funnel settings"><Settings size={20} strokeWidth={1.5} /></button>
        <button onClick={handlePreview} className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2" title="Open draft preview"><Eye size={20} strokeWidth={1.5} /><span className="text-[10px] font-bold hidden xl:inline">Preview</span></button>
        <div className="relative" ref={publishMenuRef}>
            <button onClick={handleToggleMenu} disabled={isTakingOffline || isSyncingChanges} className={`h-11 px-5 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-xl font-black text-sm border-2 disabled:opacity-70 ${status === 'live' ? 'bg-[#1a2b3b] border-[#1a2b3b] text-white shadow-[#1a2b3b]/20' : 'bg-primary border-primary text-white shadow-primary/20'}`}>
                {isTakingOffline || isSyncingChanges ? <Loader2 size={16} className="animate-spin" /> : <><span>Share</span><div className="w-px h-4 bg-white/20" /><ChevronDown size={16} className={`transition-transform duration-300 ${isPublishMenuOpen ? 'rotate-180' : ''}`} /></>}
            </button>
            {isPublishMenuOpen && !isTakingOffline && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-border rounded-[24px] shadow-[0_15px_40px_-5px_rgba(0,0,0,0.15)] z-[110] py-2 overflow-hidden animate-scale-in origin-top-right">
                    {status === 'draft' ? (
                        <button onClick={handlePublishAction} className="w-full text-left px-5 py-4 text-sm font-black text-[#1a2b3b] hover:bg-orange-50 hover:text-primary flex items-center gap-3 transition-all"><div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-primary shrink-0"><Zap size={16} fill="currentColor" /></div><span>Publish Now</span></button>
                    ) : (
                        <><button onClick={handleSyncLatestChanges} className="w-full text-left px-5 py-4 text-sm font-black text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-all"><div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><RefreshCw size={16} /></div><span>Deploy Changes</span></button><button onClick={handleTakeOfflineInitiate} className="w-full text-left px-5 py-4 text-sm font-black text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-all"><div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0"><Power size={16} /></div><span>Take Offline</span></button></>
                    )}
                    <div className="h-px bg-border/50 my-1 mx-4" /><button onClick={(e) => { e.stopPropagation(); setIsPublishMenuOpen(false); onPublish(); }} className="w-full text-left px-5 py-4 text-sm font-black text-[#1a2b3b]/70 hover:bg-muted/50 flex items-center gap-3 transition-all"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-gray-500 shrink-0"><Globe size={16} /></div><span>Domain Setup</span></button><button onClick={(e) => { e.stopPropagation(); setIsPublishMenuOpen(false); handleViewPublicLink(); }} className="w-full text-left px-5 py-4 text-sm font-black text-[#1a2b3b]/70 hover:bg-muted/50 flex items-center gap-3 transition-all"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-gray-500 shrink-0"><ExternalLink size={16} /></div><span>View Public Link</span></button>
                </div>
            )}
        </div>
      </div>
      <UnpublishModal isOpen={isUnpublishModalOpen} onClose={() => setIsUnpublishModalOpen(false)} onConfirm={handleConfirmUnpublish} isProcessing={isTakingOffline} funnelName={funnelName} />
    </div>
  );
};

export default TopBar;