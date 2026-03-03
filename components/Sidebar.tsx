import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, 
    CheckCircle, 
    MoreHorizontal, 
    GripVertical, 
    Copy, 
    Edit3, 
    Globe, 
    Trash2, 
    Check, 
    Layers, 
    Sparkles, 
    Split,
    Layout,
    Zap,
    BarChart3,
    UserCircle,
    MapPin,
    Type,
    ListChecks,
    Smartphone,
    ShieldCheck
} from 'lucide-react';
import { FunnelPage } from '../types';

interface SidebarProps {
  pages: FunnelPage[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: (type: 'quiz' | 'end', templateId?: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onCreateVariant: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, title: string) => void;
  onUpdatePage: (pageId: string, updates: Partial<FunnelPage>) => void;
  onReorderPages: (startIndex: number, endIndex: number) => void;
  activeTab: 'pages' | 'design';
  setActiveTab: (tab: 'pages' | 'design') => void;
  otpEnabled?: boolean;
}

const QUIZ_TEMPLATES = [
    { id: 'options', label: 'Options', icon: Zap, description: 'Single-choice selection' },
    { id: 'multiple', label: 'Multiple Choice', icon: ListChecks, description: 'Multi-select selection' },
    { id: 'slider', label: 'Slider', icon: BarChart3, description: 'Numeric range selection' },
    { id: 'contact', label: 'Contact Form', icon: UserCircle, description: 'Lead capture details' },
    { id: 'otp', label: 'OTP Verification', icon: Smartphone, description: 'SMS security validation' },
    { id: 'zip', label: 'Zip Code', icon: MapPin, description: 'Formatted area verification' },
    { id: 'open', label: 'Open Field', icon: Type, description: 'Free text response' },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  pages, 
  activePageIndex, 
  onSelectPage, 
  onAddPage,
  onDuplicatePage,
  onCreateVariant,
  onDeletePage,
  onRenamePage,
  onUpdatePage,
  onReorderPages,
  activeTab,
  setActiveTab,
  otpEnabled = true
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingSlugId, setEditingSlugId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSlugValue, setEditSlugValue] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);
  
  const [dragState, setDragState] = useState<{
    draggedIndex: number | null;
    dragOverIndex: number | null;
    position: 'top' | 'bottom' | null;
  }>({ draggedIndex: null, dragOverIndex: null, position: null });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      if (editingPageId && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
      }
  }, [editingPageId]);

  useEffect(() => {
      if (editingSlugId && slugInputRef.current) {
          slugInputRef.current.focus();
          slugInputRef.current.select();
      }
  }, [editingSlugId]);

  const handleStartRename = (page: FunnelPage) => {
      setEditingPageId(page.id);
      setEditValue(page.title);
      setOpenMenuId(null);
  };

  const handleFinishRename = () => {
      if (editingPageId && editValue.trim()) {
          onRenamePage(editingPageId, editValue.trim());
      }
      setEditingPageId(null);
  };

  const handleStartEditSlug = (page: FunnelPage) => {
      setEditingSlugId(page.id);
      setEditSlugValue(page.slug || page.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
      setOpenMenuId(null);
  };

  const handleFinishEditSlug = () => {
      if (editingSlugId && editSlugValue.trim()) {
          const cleanedSlug = editSlugValue.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
          onUpdatePage(editingSlugId, { slug: cleanedSlug });
      }
      setEditingSlugId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleFinishRename();
      if (e.key === 'Escape') setEditingPageId(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragState({ ...dragState, draggedIndex: index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragState.draggedIndex === null || dragState.draggedIndex === index) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'top' : 'bottom';
    if (dragState.dragOverIndex !== index || dragState.position !== position) {
      setDragState(prev => ({ ...prev, dragOverIndex: index, position }));
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragState.draggedIndex === null) return;
    let targetIndex = index;
    if (dragState.position === 'bottom') targetIndex = index + 1;
    onReorderPages(dragState.draggedIndex, targetIndex);
    setDragState({ draggedIndex: null, dragOverIndex: null, position: null });
  };

  const renderPageItem = (page: FunnelPage, index: number, displayIndex: string | number, isDraggable: boolean = true) => {
      const globalIndex = pages.findIndex(p => p.id === page.id);
      const isActive = activePageIndex === globalIndex;
      const isMenuOpen = openMenuId === page.id;
      const isEditing = editingPageId === page.id;
      const isEditingSlug = editingSlugId === page.id;
      const isLandingPage = globalIndex === 0;
      const isDragged = dragState.draggedIndex === globalIndex;
      const isDragOver = dragState.dragOverIndex === globalIndex;
      const isVariant = !!page.parent_id;
      const hasVariant = pages.some(p => p.parent_id === page.id);
      
      const displaySlug = page.slug || page.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const isOtpPage = page.elements.some(el => el.type === 'quiz-step' && el.content.quizType === 'otp');

      return (
          <div 
            key={page.id} 
            className={`relative mb-2 transition-all duration-200 animate-scale-in ${isDragged ? 'opacity-50' : 'opacity-100'} ${isVariant ? 'ml-6' : ''} ${isMenuOpen ? 'z-[110]' : isActive ? 'z-10' : 'z-0'}`}
            onDragOver={(e) => isDraggable && !isVariant && handleDragOver(e, globalIndex)}
            onDrop={(e) => isDraggable && !isVariant && handleDrop(e, globalIndex)}
          >
              {isDragOver && dragState.position === 'top' && !isVariant && (
                  <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-primary z-50 rounded-full animate-pulse"></div>
              )}
              
              <div 
                  draggable={isDraggable && !isEditing && !isEditingSlug && !isVariant}
                  onDragStart={(e) => handleDragStart(e, globalIndex)}
                  className={`relative flex items-center p-3.5 rounded-[22px] transition-all border group ${
                      isActive 
                      ? 'bg-white border-primary shadow-lg shadow-primary/10 z-10' 
                      : isOtpPage
                        ? 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-200'
                        : isVariant 
                          ? 'bg-purple-50/40 border-purple-200 hover:border-purple-400'
                          : 'bg-white border-transparent hover:border-border hover:shadow-sm'
                  }`}
                  onClick={() => !isEditing && !isEditingSlug && onSelectPage(globalIndex)}
              >
                  {!isEditing && !isEditingSlug && !isVariant && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 transition-opacity">
                        <GripVertical size={14} />
                    </div>
                  )}

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 ml-1 transition-colors shrink-0 ${
                      isActive 
                        ? 'bg-primary text-white font-black text-[12px]' 
                        : isOtpPage
                          ? 'bg-emerald-600 text-white font-black text-[11px]'
                          : isVariant 
                            ? 'bg-purple-600 text-white font-black text-[11px]'
                            : 'bg-muted text-muted-foreground font-bold text-[11px]'
                  }`}>
                      {isVariant ? 'B' : `${displayIndex}${hasVariant ? 'A' : ''}`}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                      {isEditing ? (
                          <div className="flex items-center gap-1 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                              <input 
                                  ref={inputRef}
                                  type="text" 
                                  value={editValue} 
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  className="w-full text-xs font-bold px-2 py-1 bg-muted border border-primary rounded-md outline-none text-foreground"
                              />
                              <button onClick={handleFinishRename} className="p-1.5 bg-primary text-white rounded-lg"><Check size={12} strokeWidth={4} /></button>
                          </div>
                      ) : isEditingSlug ? (
                          <div className="flex items-center gap-1 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                              <div className="flex-1 flex items-center bg-muted border border-primary rounded-md px-2 py-1">
                                  <span className="text-[10px] text-muted-foreground mr-1">/</span>
                                  <input 
                                      ref={slugInputRef}
                                      type="text" 
                                      value={editSlugValue} 
                                      onChange={(e) => setEditSlugValue(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                      onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleFinishEditSlug();
                                          if (e.key === 'Escape') setEditingSlugId(null);
                                      }}
                                      className="w-full text-xs font-bold bg-transparent outline-none text-foreground"
                                  />
                              </div>
                              <button onClick={handleFinishEditSlug} className="p-1.5 bg-primary text-white rounded-lg"><Check size={12} strokeWidth={4} /></button>
                          </div>
                      ) : (
                          <div className="flex flex-col">
                              <div className={`text-[13px] font-bold truncate tracking-tight ${isActive ? 'text-[#1a2b3b]' : isVariant ? 'text-purple-900' : 'text-gray-500 group-hover:text-gray-900'}`}>
                                  {page.title}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 min-w-0">
                                  {isVariant && (
                                      <span className="text-[7px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 bg-purple-600 text-white rounded-md shrink-0">A/B TEST</span>
                                  )}
                                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest truncate opacity-0 group-hover:opacity-60 transition-opacity">/{displaySlug}</span>
                              </div>
                          </div>
                      )}
                  </div>

                  {!isEditing && !isEditingSlug && (
                    <div className="flex items-center gap-2">
                        {isOtpPage && (
                            <div className="text-emerald-600 shrink-0" title="Security Verification Active">
                                <ShieldCheck size={16} strokeWidth={2.5} />
                            </div>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : page.id); }}
                            className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all ${isMenuOpen ? 'opacity-100 bg-muted/50' : 'opacity-0 group-hover:opacity-100'}`}
                        >
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                  )}
              </div>

              {isDragOver && dragState.position === 'bottom' && !isVariant && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary z-50 rounded-full animate-pulse"></div>
              )}

              {isMenuOpen && (
                  <div ref={menuRef} className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-border z-[120] p-1.5 animate-scale-in origin-top-right">
                      <div className="space-y-0.5">
                          <button onClick={() => handleStartRename(page)} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#1a2b3b] hover:bg-slate-50 rounded-xl transition-colors"><Edit3 size={18} className="text-slate-400" /> Rename Step</button>
                          {!isVariant && (
                              <button onClick={() => { onCreateVariant(page.id); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"><Split size={18} /> Create A/B Test</button>
                          )}
                          <button onClick={() => { onDuplicatePage(page.id); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#1a2b3b] hover:bg-slate-50 rounded-xl transition-colors"><Copy size={18} className="text-slate-400" /> Duplicate</button>
                          <button onClick={() => handleStartEditSlug(page)} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#1a2b3b] hover:bg-slate-50 rounded-xl transition-colors"><Globe size={18} className="text-slate-400" /> Set URL</button>
                          
                          {!isLandingPage && (
                            <div className="pt-1.5 mt-1 border-t border-slate-100">
                                <button 
                                  onClick={() => { onDeletePage(page.id); setOpenMenuId(null); }} 
                                  className="w-full text-left flex items-center gap-3 px-4 py-3.5 text-sm font-black text-white bg-[#FF3B30] hover:bg-[#E0352B] rounded-xl transition-all shadow-lg shadow-red-500/20"
                                >
                                  <Trash2 size={18} strokeWidth={3} /> Delete Step
                                </button>
                            </div>
                          )}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const isPageVisible = (page: FunnelPage) => {
      const isStartOrProcessing = page.type === 'start' || page.type === 'processing';
      const isQuiz = page.type === 'quiz';
      if (!isStartOrProcessing && !isQuiz) return false;
      
      const hasOtp = page.elements.some(el => el.type === 'quiz-step' && el.content.quizType === 'otp');
      if (hasOtp && !otpEnabled) return false;
      
      return true;
  };

  const stepPages = pages.filter(p => !p.parent_id && isPageVisible(p));
  const resultPages = pages.filter(p => p.type === 'end' && !p.parent_id);

  return (
    <div className="w-[300px] bg-[#F9FAFB] border-r border-border flex flex-col h-full overflow-hidden shrink-0 z-10">
      <div className="p-6 pb-2 shrink-0">
        <div className="flex bg-white p-1.5 rounded-[22px] border border-border shadow-sm mb-6">
            <button
                onClick={() => setActiveTab('pages')}
                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'pages' ? 'bg-[#1a2b3b] text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Steps
            </button>
            <button
                onClick={() => setActiveTab('design')}
                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'design' ? 'bg-[#1a2b3b] text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Theme
            </button>
        </div>
      </div>

      {activeTab === 'pages' && (
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
          <div className="space-y-8">
            <div>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Quiz Flow</h3>
                    <Layers size={14} className="text-gray-300" />
                </div>
                <div className="relative">
                    {stepPages.map((page, idx) => (
                        <React.Fragment key={page.id}>
                            {renderPageItem(page, idx, idx + 1, true)}
                            {pages.filter(p => p.parent_id === page.id).map((variant, vIdx) => (
                                renderPageItem(variant, vIdx, 'B', false)
                            ))}
                        </React.Fragment>
                    ))}
                    <div className="relative" ref={addMenuRef}>
                        <button 
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className={`w-full flex items-center gap-3 p-4 text-[11px] font-black uppercase tracking-widest transition-all mt-4 border-2 border-dashed ${showAddMenu ? 'bg-primary text-white border-primary shadow-xl' : 'text-primary hover:bg-primary/5 border-primary/20'} rounded-[22px]`}
                        >
                            <Plus size={16} strokeWidth={3} className={showAddMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
                            <span>Add New Step</span>
                        </button>
                        
                        {showAddMenu && (
                            <div className="absolute top-full left-0 right-0 mt-3 bg-[#1a2b3b] rounded-[28px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] z-[150] p-3 border border-white/10 animate-fade-in-down origin-top">
                                <p className="px-5 py-2 text-[8px] font-black uppercase text-white/40 tracking-[0.3em] mb-2">Select Block Template</p>
                                <div className="space-y-1">
                                    {QUIZ_TEMPLATES.map((tpl) => (
                                        <button
                                            key={tpl.id}
                                            onClick={() => {
                                                onAddPage('quiz', tpl.id);
                                                setShowAddMenu(false);
                                            }}
                                            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-all text-left group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                                <tpl.icon size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white leading-none mb-1">{tpl.label}</p>
                                                <p className="text-[10px] text-white/40 font-medium truncate">{tpl.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Results</h3>
                </div>
                <div>
                    {resultPages.map((page, idx) => (
                        <React.Fragment key={page.id}>
                            {renderPageItem(page, idx, String.fromCharCode(65 + idx), false)}
                            {pages.filter(p => p.parent_id === page.id).map((variant, vIdx) => (
                                renderPageItem(variant, vIdx, 'B', false)
                            ))}
                        </React.Fragment>
                    ))}
                    <button 
                        onClick={() => onAddPage('end')} 
                        className="w-full flex items-center gap-3 p-4 text-[11px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-[22px] transition-all mt-4 border-2 border-dashed border-primary/20"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>Add Success Page</span>
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'design' && (
          <div className="flex-1 p-8 relative flex flex-col">
              <div className="grayscale opacity-40 pointer-events-none space-y-10 filter blur-[1px]">
                  <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Color Palette</h3>
                      <div className="grid grid-cols-5 gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary ring-4 ring-primary/10"></div>
                          <div className="w-10 h-10 rounded-xl bg-[#3b82f6]"></div>
                          <div className="w-10 h-10 rounded-xl bg-[#10b981]"></div>
                          <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]"></div>
                          <div className="w-10 h-10 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-gray-300"><Plus size={16}/></div>
                      </div>
                  </div>
                  <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Typography</h3>
                      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-black text-[#1a2b3b]">Inter</span>
                            <Check size={14} className="text-primary" />
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight">Optimized for agency conversions.</p>
                      </div>
                  </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-b from-transparent via-[#F9FAFB]/80 to-[#F9FAFB] z-20">
                  <div className="bg-white border border-border rounded-3xl p-6 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)] text-center space-y-4 animate-scale-in">
                      <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                          <Sparkles size={24} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-1.5">
                          <h4 className="text-sm font-black text-[#1a2b3b] uppercase tracking-tight">Theme Presets</h4>
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Coming Soon</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                        Soon you will be able to quick change the branding style of your funnel in just a few clicks.
                      </p>
                  </div>
              </div>
          </div>
      )}
      
      <div className="p-6 border-t border-border bg-white">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-600">
              <CheckCircle size={14} />
              <span>Canvas Synchronized</span>
          </div>
      </div>
    </div>
  );
};

export default Sidebar;