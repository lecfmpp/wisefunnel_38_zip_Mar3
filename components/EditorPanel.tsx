import React, { useState, useRef, useMemo } from 'react';
import { FunnelElement, ElementStyle, FunnelPage, TextStyle, ButtonStyle, ImageStyle, Funnel } from '../types';
import * as LucideIcons from 'lucide-react';
import { 
    Type, 
    Image as ImageIcon, 
    Link as LinkIcon, 
    AlignCenter, 
    AlignLeft, 
    AlignRight, 
    X, 
    Settings, 
    Plus, 
    Trash2, 
    Info, 
    Bold, 
    Italic, 
    ChevronDown, 
    Zap, 
    Sparkles, 
    ArrowUp, 
    ArrowDown, 
    Layout, 
    Maximize,
    Smartphone,
    Monitor,
    MousePointerClick,
    Phone,
    Type as TypeIcon,
    Upload,
    Loader2,
    Eye,
    Layers,
    ListChecks,
    Search,
    HelpCircle,
    UserCircle,
    Quote,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    ExternalLink,
    ShieldAlert,
    Copyright,
    HelpCircle as QuestionIcon,
    Maximize2,
    MessageCircle,
    Check,
    Split,
    BarChart3,
    Ban,
    Target,
    Star
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const COMMON_ICONS = [
    'Zap', 'CheckCircle', 'Edit3', 'Users', 'Target', 'TrendingUp', 'ShieldCheck', 'Globe', 'Phone', 'Mail', 
    'MessageSquare', 'Star', 'Rocket', 'DollarSign', 'Home', 'Sun', 'Wrench', 'Building2', 'Monitor', 'Smartphone', 
    'Search', 'Layout', 'Layers', 'Cpu', 'Fingerprint', 'Wand2', 'MousePointer2', 'Send', 'Briefcase', 'Heart', 
    'Gavel', 'Landmark', 'Clock', 'Unplug', 'Type', 'Link', 'AlertCircle', 'Plus', 'Trash2', 'Maximize', 
    'Minimize2', 'MoreHorizontal', 'GripVertical', 'Copy', 'Check', 'X', 'Info', 'Bold', 'Italic', 'AlignLeft', 
    'AlignCenter', 'AlignRight', 'ChevronRight', 'ChevronDown', 'ChevronUp', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
    'ArrowLeft', 'ArrowLeftRight', 'RefreshCw', 'Power', 'Eye', 'Menu', 'HandCoins', 'Percent', 'Ticket', 'PiggyBank', 
    'Network', 'Webhook', 'BarChart3', 'MousePointerClick', 'Split', 'ListChecks'
];

interface EditorPanelProps {
  element: FunnelElement | null;
  page: FunnelPage;
  funnel: Funnel;
  onUpdate: (updates: Partial<FunnelElement['content'] & { style: Partial<ElementStyle> }>) => void;
  onClose: () => void;
  viewMode: 'desktop' | 'mobile';
  selectedField: string | null;
}

const DynamicIcon = ({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) => {
    // @ts-ignore
    const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle;
    return <IconComponent size={size} className={className} />;
};

const IconPickerModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSelect: (iconName: string) => void;
    currentIcon: string;
}> = ({ isOpen, onClose, onSelect, currentIcon }) => {
    const [search, setSearch] = useState('');
    const filteredIcons = useMemo(() => {
        if (!search) return COMMON_ICONS;
        return COMMON_ICONS.filter(icon => icon.toLowerCase().includes(search.toLowerCase()));
    }, [search]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1a2b3b]/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[80vh]">
                <div className="p-8 border-b border-border flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Sparkles size={20} /></div>
                        <div><h2 className="text-xl font-black text-[#1a2b3b]">Choose Icon</h2></div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors bg-muted/50 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-6 shrink-0 border-b border-border/50">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input autoFocus type="text" placeholder="Search icons..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-muted/20 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="grid grid-cols-4 gap-3">
                        {filteredIcons.map((iconName) => (
                            <button key={iconName} onClick={() => { onSelect(iconName); onClose(); }} className={`aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all group ${currentIcon === iconName ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-border hover:border-primary/40 text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
                                <DynamicIcon name={iconName} size={24} />
                                <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center px-1 opacity-60 group-hover:opacity-100">{iconName}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-border flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-[#1a2b3b] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const EditorPanel: React.FC<EditorPanelProps> = ({ element, page, funnel, onUpdate, onClose, viewMode, selectedField }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [iconPickerStepIndex, setIconPickerStepIndex] = useState<number | null>(null);
    const [isLogoIconPickerOpen, setIsLogoIconPickerOpen] = useState(false);
    const [uploadingAvatarIdx, setUploadingAvatarIdx] = useState<number | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const mainLogoInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    if (!element) return null;
    const isMobile = viewMode === 'mobile';

    const updateContentField = (fieldName: string, value: any) => onUpdate({ [fieldName]: value });
    const updateNestedStyle = (fieldName: string, updates: any) => onUpdate({ [fieldName]: { ...(element.content[fieldName] || {}), ...updates } });
    const updateSectionStyle = (updates: Partial<ElementStyle>) => onUpdate({ style: { ...element.style, ...updates } });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('logo-slider').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = await supabase.storage.from('logo-slider').getPublicUrl(data.path);
            updateContentField('logos', [...(element.content.logos || []), { id: `logo-${Date.now()}`, src: publicUrl, alt: file.name }]);
        } finally {
            setIsUploading(false);
        }
    };

    const handleMainLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const fileName = `brand-logo-${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('logo-slider').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = await supabase.storage.from('logo-slider').getPublicUrl(data.path);
            onUpdate({ logoImage: publicUrl, logoType: 'image' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || uploadingAvatarIdx === null) return;
        setIsUploading(true);
        try {
            const fileName = `avatar-${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('avatars').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = await supabase.storage.from('avatars').getPublicUrl(data.path);
            const next = [...(element.content.testimonials || [])];
            next[uploadingAvatarIdx] = { ...next[uploadingAvatarIdx], avatar: publicUrl };
            updateContentField('testimonials', next);
        } finally {
            setIsUploading(false);
            setUploadingAvatarIdx(null);
        }
    };

    const renderColorPicker = (label: string, value: string | undefined, onChange: (val: string) => void) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
            <div className="flex items-center gap-3 p-3 bg-muted/20 border-2 border-border rounded-xl relative">
                <div className="w-8 h-8 rounded-lg border border-black/10 shadow-sm shrink-0" style={{ backgroundColor: value || '#000000' }}></div>
                <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                <span className="text-xs font-black uppercase font-mono">{value || '#000000'}</span>
            </div>
        </div>
    );

    const renderTextStyleControls = (styleKey: string, options: { hideSize?: boolean } = {}) => {
        const style: TextStyle = element.content[styleKey] || {};
        const activeStyle = (isMobile && style.mobile) ? { ...style, ...style.mobile } : style;
        const setStyle = (updates: Partial<TextStyle>) => {
            if (isMobile) updateNestedStyle(styleKey, { mobile: { ...(style.mobile || {}), ...updates } });
            else updateNestedStyle(styleKey, updates);
        };
        return (
            <div className="space-y-6 pt-4 border-t border-border/50">
                <div className="grid grid-cols-2 gap-4">
                    {!options.hideSize && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Size</label>
                            <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                                {(['s', 'm', 'l', 'xl'] as const).map(size => (
                                    <button key={size} onClick={() => setStyle({ fontSize: size })} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${activeStyle.fontSize === size ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}>{size}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Align</label>
                        <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                            {(['left', 'center', 'right'] as const).map(align => (
                                <button key={align} onClick={() => setStyle({ textAlign: align })} className={`flex-1 py-1.5 flex justify-center rounded-lg transition-all ${activeStyle.textAlign === align ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}>
                                    {align === 'left' && <AlignLeft size={14} />}
                                    {align === 'center' && <AlignCenter size={14} />}
                                    {align === 'right' && <AlignRight size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const isTextField = ['headline', 'subheadline', 'logoText', 'phone', 'question', 'subtitle', 'footerDescription', 'copyrightText', 'complianceDisclaimer', 'placeholder'].includes(selectedField || '');
    const isButtonField = ['ctaText', 'heroCtaText', 'cta'].includes(selectedField || '');
    const isImageField = ['logoImage', 'heroImage'].includes(selectedField || '');
    const isOptionsField = selectedField === 'options';
    const isBrandingField = ['logoImage', 'logoText'].includes(selectedField || '') && ['header', 'footer-complex'].includes(element.type);

    const getEffectiveValue = (field: string) => {
        const val = element.content[field];
        if (val !== undefined && val !== '') return val;
        
        switch(field) {
            case 'complianceDisclaimer': 
                return 'THIS SITE IS NOT A PART OF THE META WEBSITE OR META PLATFORMS, INC. ADDITIONALLY, THIS SITE IS NOT ENDORSED BY META IN ANY WAY.';
            case 'footerDescription':
                return 'Precision lead generation solutions powered by Wisefunnel Technologies.';
            case 'copyrightText':
                return `© ${new Date().getFullYear()} ALL RIGHTS RESERVED.`;
            case 'placeholder':
                return 'Type your detailed answer here...';
            default:
                return '';
        }
    };

    const renderActionControl = (field: string) => {
        const isStandardCta = field === 'cta';
        const isBranding = field === 'logo';
        const typeKey = isStandardCta ? 'linkType' : isBranding ? 'logoLinkType' : `${field}Type`;
        const linkKey = isStandardCta ? 'link' : isBranding ? 'logoLink' : `${field}Link`;
        
        const activeType = isStandardCta 
            ? (element.content.cta?.linkType || 'url') 
            : (element.content[typeKey] || (isBranding ? 'page' : 'quiz'));
            
        const activeLink = isStandardCta 
            ? (element.content.cta?.link || '') 
            : (element.content[linkKey] || '');

        const setAction = (type: string, link: string) => {
            if (isStandardCta) {
                updateContentField('cta', { ...(element.content.cta || {}), linkType: type, link: link });
            } else {
                onUpdate({ [typeKey]: type, [linkKey]: link });
            }
        };

        if (isStandardCta && element.type === 'quiz-result') {
            const ctaData = element.content.cta || {};
            const linkType = ctaData.linkType || 'url';

            return (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Conversion Mode</label>
                        <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                            <button 
                                onClick={() => updateContentField('cta', { ...ctaData, linkType: 'url' })} 
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${linkType === 'url' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
                            >
                                <ExternalLink size={12} /> URL
                            </button>
                            <button 
                                onClick={() => updateContentField('cta', { ...ctaData, linkType: 'whatsapp', style: { ...(ctaData.style || {}), backgroundColor: '#25D366' } })} 
                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${linkType === 'whatsapp' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
                            >
                                <MessageCircle size={12} /> WhatsApp
                            </button>
                        </div>
                    </div>

                    {linkType === 'url' ? (
                        <div className="space-y-2 animate-fade-in-down">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Destination URL</label>
                            <input 
                                type="text" 
                                value={ctaData.link || ''} 
                                onChange={(e) => updateContentField('cta', { ...ctaData, link: e.target.value })}
                                className="w-full px-4 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm" 
                                placeholder="https://yourlink.com"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in-down">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp Number</label>
                                <input 
                                    type="tel" 
                                    value={ctaData.whatsappNumber || ''} 
                                    onChange={(e) => updateContentField('cta', { ...ctaData, whatsappNumber: e.target.value.replace(/\D/g, '') })}
                                    className="w-full px-4 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm" 
                                    placeholder="e.g. 16478623292"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Initial Message</label>
                                <textarea 
                                    value={ctaData.whatsappMessage || ''} 
                                    onChange={(e) => updateContentField('cta', { ...ctaData, whatsappMessage: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-medium text-xs resize-none" 
                                    placeholder="I'm interested in my report..."
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Click Action</label>
                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                        <button 
                            onClick={() => setAction('url', '')} 
                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeType === 'url' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
                        >
                            URL
                        </button>
                        <button 
                            onClick={() => setAction('section', '')} 
                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeType === 'section' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
                        >
                            Section
                        </button>
                        <button 
                            onClick={() => setAction('page', '')} 
                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeType === 'page' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
                        >
                            Step
                        </button>
                    </div>
                </div>

                {activeType === 'url' && (
                    <div className="space-y-2 animate-fade-in-down">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">External Link</label>
                        <div className="relative">
                            <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                                type="text" 
                                value={activeLink} 
                                onChange={(e) => setAction('url', e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm" 
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                )}

                {activeType === 'section' && (
                    <div className="space-y-2 animate-fade-in-down">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Navigate to Block</label>
                        <div className="relative">
                            <Layout size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <select 
                                value={activeLink} 
                                onChange={(e) => setAction('section', e.target.value)}
                                className="w-full pl-9 pr-10 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm appearance-none bg-white"
                            >
                                <option value="">Select a block...</option>
                                {page.elements.map(el => (
                                    <option value={el.id}>{el.type.replace('-', ' ').toUpperCase()}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                )}

                {activeType === 'page' && (
                    <div className="space-y-2 animate-fade-in-down">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Direct to Step</label>
                        <div className="relative">
                            <Zap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <select 
                                value={activeLink} 
                                onChange={(e) => setAction('page', e.target.value)}
                                className="w-full pl-9 pr-10 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-xs appearance-none bg-white"
                            >
                                <option value="">Select a page...</option>
                                {funnel.pages.map((p, i) => (
                                    <option value={p.id}>Step {i + 1}: {p.title}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const updateSliderValidation = (updates: any) => {
        const currentVal = element.content.validation || {};
        updateContentField('validation', { ...currentVal, ...updates });
    };

    const getCategorizedLabel = () => {
        if (element.type !== 'quiz-step') return element.type.replace('-', ' ');
        const qt = element.content.quizType;
        const field = element.content.field;
        if (qt === 'slider') return 'Slider Configuration';
        if (qt === 'zip') return 'Zip Code Setup';
        if (qt === 'input') {
            if (field === 'contactInfo') return 'Contact Form Setup';
            return 'Open Field Setup';
        }
        return 'Options Selection';
    };

    return (
        <div className="w-[400px] bg-white border-l border-border flex flex-col h-full overflow-hidden shadow-2xl z-[120] animate-slide-in-right relative">
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><Settings size={18} /></div>
                    <div><h3 className="text-sm font-black text-[#1a2b3b] uppercase tracking-tight">{selectedField ? selectedField.replace(/([A-Z])/g, ' $1') : getCategorizedLabel()}</h3></div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide space-y-10 text-[#1a2b3b]">
                {/* BRANDING EDITOR */}
                {isBrandingField && (
                    <div className="space-y-8 animate-fade-in-down">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity Mode</label>
                                <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                                    <button onClick={() => onUpdate({ logoType: 'image' })} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${ (element.content.logoType || 'image') === 'image' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Image</button>
                                    <button onClick={() => onUpdate({ logoType: 'icon' })} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${ (element.content.logoType || 'image') === 'icon' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Icon</button>
                                </div>
                            </div>

                            {element.content.logoType === 'icon' ? (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Brand Icon</label>
                                    <button onClick={() => setIsLogoIconPickerOpen(true)} className="w-full h-16 bg-muted/20 border-2 border-border rounded-2xl flex items-center justify-center gap-3 hover:bg-muted/30 transition-all">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                            <DynamicIcon name={element.content.logoIcon || 'Globe'} size={24} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Select Icon</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Logo Asset</label>
                                    <div className="space-y-3">
                                        <input type="text" value={element.content.logoImage || ''} onChange={(e) => updateContentField('logoImage', e.target.value)} className="w-full px-4 py-3 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-xs" placeholder="https://..." />
                                        <button onClick={() => mainLogoInputRef.current?.click()} className="w-full py-4 bg-[#1a2b3b] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                                            {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Upload Logo File
                                        </button>
                                        <input type="file" ref={mainLogoInputRef} className="hidden" accept="image/*" onChange={handleMainLogoUpload} />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Brand Text</label>
                                <input type="text" value={element.content.logoText || ''} onChange={(e) => updateContentField('logoText', e.target.value)} className="w-full px-4 py-3 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm" />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Logo Size</label>
                                <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                                    {(['SM', 'MD', 'LG'] as const).map(size => (
                                        <button key={size} onClick={() => updateContentField('logoSize', size)} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${ (element.content.logoSize || 'MD') === size ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>{size}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Behavior</h4>
                            {renderActionControl('logo')}
                        </div>
                    </div>
                )}

                {/* SECTION STYLE (Visible when no specific small field selected, except branding/logic fields) */}
                {!selectedField && (
                    <div className="space-y-8 animate-fade-in-down">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Content</h4>
                            
                            {(element.content.headline !== undefined || element.content.question !== undefined) && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Headline / Question</label>
                                    <textarea 
                                        value={element.content.headline || element.content.question || ''} 
                                        onChange={(e) => updateContentField(element.content.headline !== undefined ? 'headline' : 'question', e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-xs resize-none"
                                    />
                                </div>
                            )}

                            {(element.content.subheadline !== undefined || element.content.subtitle !== undefined) && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description / Subtitle</label>
                                    <textarea 
                                        value={element.content.subheadline || element.content.subtitle || ''} 
                                        onChange={(e) => updateContentField(element.content.subheadline !== undefined ? 'subheadline' : 'subtitle', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-medium text-sm resize-none"
                                    />
                                </div>
                            )}

                            {/* Open Field Specific: Placeholder */}
                            {element.content.quizType === 'input' && element.content.field !== 'contactInfo' && (
                                <div className="space-y-2 pt-2 border-t border-border/40">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Placeholder Text</label>
                                    <input 
                                        type="text" 
                                        value={element.content.placeholder || 'Type your detailed answer here...'} 
                                        onChange={(e) => updateContentField('placeholder', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-xs" 
                                    />
                                </div>
                            )}

                            {/* Contact Form Specific: Other Field */}
                            {element.content.quizType === 'input' && element.content.field === 'contactInfo' && (
                                <div className="space-y-6 pt-4 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#1a2b3b]">Additional Information</h4>
                                            <p className="text-[9px] font-medium text-muted-foreground uppercase">Allow free response in form</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={element.content.showOtherField || false} onChange={(e) => updateContentField('showOtherField', e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                        </label>
                                    </div>
                                    
                                    {element.content.showOtherField && (
                                        <div className="space-y-2 animate-fade-in-down">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Field Label</label>
                                            <input 
                                                type="text" 
                                                value={element.content.otherFieldLabel || 'Additional Notes'} 
                                                onChange={(e) => updateContentField('otherFieldLabel', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-xs" 
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer Specific Content Editors */}
                            {element.type === 'footer-complex' && (
                                <>
                                    <div className="space-y-6 pt-4 border-t border-border/50">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2"><Layout size={12}/> Navigation Links</h4>
                                            <button onClick={() => updateContentField('mainLinks', [...(element.content.mainLinks || []), { text: 'New Link', href: '#' }])} className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"><Plus size={14} /></button>
                                        </div>
                                        <div className="space-y-3">
                                            {(element.content.mainLinks || []).map((link: any, idx: number) => (
                                                <div key={idx} className="p-4 bg-muted/10 border-2 border-border rounded-xl space-y-3 relative group">
                                                    <button onClick={() => updateContentField('mainLinks', element.content.mainLinks.filter((_: any, i: number) => i !== idx))} className="absolute top-2 right-2 p-1 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-md transition-all"><Trash2 size={12} /></button>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Label</label>
                                                            <input value={link.text} onChange={(e) => { const l = [...element.content.mainLinks]; l[idx].text = e.target.value; updateContentField('mainLinks', l); }} className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="Link Text" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Destination URL</label>
                                                            <input value={link.href} onChange={(e) => { const l = [...element.content.mainLinks]; l[idx].href = e.target.value; updateContentField('mainLinks', l); }} className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-medium focus:border-primary outline-none" placeholder="https://..." />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-4 border-t border-border/50">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2"><Sparkles size={12}/> Social Presence</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1.5"><Twitter size={10}/> Twitter URL</label>
                                                <input value={element.content.socialLinks?.twitter || ''} onChange={(e) => updateContentField('socialLinks', {...(element.content.socialLinks || {}), twitter: e.target.value})} className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="https://twitter.com/..." />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1.5"><Facebook size={10}/> Facebook URL</label>
                                                <input value={element.content.socialLinks?.facebook || ''} onChange={(e) => updateContentField('socialLinks', {...(element.content.socialLinks || {}), facebook: e.target.value})} className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="https://facebook.com/..." />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1.5"><Instagram size={10}/> Instagram URL</label>
                                                <input value={element.content.socialLinks?.instagram || ''} onChange={(e) => updateContentField('socialLinks', {...(element.content.socialLinks || {}), instagram: e.target.value})} className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="https://instagram.com/..." />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1.5"><Linkedin size={10}/> LinkedIn URL</label>
                                                <input value={element.content.socialLinks?.linkedin || ''} onChange={(e) => updateContentField('socialLinks', {...(element.content.socialLinks || {}), linkedin: e.target.value})} className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-xs font-bold focus:border-primary outline-none" placeholder="https://linkedin.com/in/..." />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Layout & Spacing</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Padding Top ({parseInt(element.style?.paddingTop || '10') * 5}px)</label>
                                    <input type="range" min="0" max="40" value={element.style?.paddingTop || '10'} onChange={(e) => updateSectionStyle({ paddingTop: e.target.value })} className="w-full accent-primary h-1.5 bg-muted rounded-full appearance-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Padding Bottom ({parseInt(element.style?.paddingBottom || '10') * 5}px)</label>
                                    <input type="range" min="0" max="40" value={element.style?.paddingBottom || '10'} onChange={(e) => updateSectionStyle({ paddingBottom: e.target.value })} className="w-full accent-primary h-1.5 bg-muted rounded-full appearance-none" />
                                </div>
                            </div>
                        </div>
                        {renderColorPicker("Background Color", element.style?.backgroundColor, (val) => updateSectionStyle({ backgroundColor: val }))}
                        
                        {element.type === 'logos' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between"><h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Logos</h4><button onClick={() => logoInputRef.current?.click()} className="p-1.5 bg-primary/10 text-primary rounded-lg"><Plus size={16} /></button></div>
                                <div className="grid grid-cols-2 gap-3">
                                    {(element.content.logos || []).map((l: any) => (
                                        <div key={l.id} className="relative aspect-video bg-muted/20 border border-border rounded-xl flex items-center justify-center p-2 group">
                                            <img src={l.src} className="max-h-full object-contain opacity-60" />
                                            <button onClick={() => updateContentField('logos', element.content.logos.filter((i: any) => i.id !== l.id))} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </div>
                        )}

                        {element.type === 'how-it-works' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between"><h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Steps</h4><button onClick={() => updateContentField('steps', [...(element.content.steps || []), { title: 'New Step', description: 'Description', icon: 'Zap' }])} className="p-1.5 bg-primary/10 text-primary rounded-lg"><Plus size={16} /></button></div>
                                <div className="space-y-3">
                                    {element.content.steps?.map((step: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-muted/10 border-2 border-border rounded-2xl space-y-3 relative group">
                                            <button onClick={() => updateContentField('steps', element.content.steps.filter((_: any, i: number) => i !== idx))} className="absolute top-2 right-2 p-1 text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                            <div className="flex gap-3">
                                                <button onClick={() => setIconPickerStepIndex(idx)} className="w-10 h-10 bg-white border border-border rounded-lg flex items-center justify-center text-primary shrink-0"><DynamicIcon name={step.icon || 'Zap'} /></button>
                                                <input value={step.title} onChange={(e) => { const s = [...element.content.steps]; s[idx].title = e.target.value; updateContentField('steps', s); }} className="bg-transparent font-black text-sm outline-none flex-1" placeholder="Step Title" />
                                            </div>
                                            <textarea value={step.description} onChange={(e) => { const s = [...element.content.steps]; s[idx].description = e.target.value; updateContentField('steps', s); }} className="w-full bg-white border border-border rounded-xl p-2 text-xs font-medium resize-none" placeholder="Step Description" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {element.type === 'testimonials-slider' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between"><h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Testimonials</h4><button onClick={() => updateContentField('testimonials', [...(element.content.testimonials || []), { quote: 'Great service!', author: 'Customer Name', role: 'Role', avatar: 'https://via.placeholder.com/100' }])} className="p-1.5 bg-primary/10 text-primary rounded-lg"><Plus size={16} /></button></div>
                                <div className="space-y-3">
                                    {element.content.testimonials?.map((t: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-muted/10 border-2 border-border rounded-2xl space-y-3 relative group">
                                            <button onClick={() => updateContentField('testimonials', element.content.testimonials.filter((_: any, i: number) => i !== idx))} className="absolute top-2 right-2 p-1 text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                            <div className="flex gap-3 items-center">
                                                <div onClick={() => { setUploadingAvatarIdx(idx); avatarInputRef.current?.click(); }} className="w-10 h-10 bg-white border border-border rounded-full flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary transition-all">
                                                    <img src={t.avatar} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <input value={t.author} onChange={(e) => { const s = [...element.content.testimonials]; s[idx].author = e.target.value; updateContentField('testimonials', s); }} className="w-full bg-transparent font-black text-sm outline-none" placeholder="Name" />
                                                    <input value={t.role} onChange={(e) => { const s = [...element.content.testimonials]; s[idx].role = e.target.value; updateContentField('testimonials', s); }} className="w-full bg-transparent text-[10px] font-black uppercase tracking-widest text-primary outline-none" placeholder="Role" />
                                                </div>
                                            </div>
                                            <textarea value={t.quote} onChange={(e) => { const s = [...element.content.testimonials]; s[idx].quote = e.target.value; updateContentField('testimonials', s); }} className="w-full bg-white border border-border rounded-xl p-2 text-xs font-medium resize-none" placeholder="Quote" />
                                        </div>
                                    ))}
                                </div>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </div>
                        )}

                        {element.type === 'faq' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between"><h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">FAQ Items</h4><button onClick={() => updateContentField('faqItems', [...(element.content.faqItems || []), { question: 'Question?', answer: 'Answer' }])} className="p-1.5 bg-primary/10 text-primary rounded-lg"><Plus size={16} /></button></div>
                                <div className="space-y-3">
                                    {element.content.faqItems?.map((item: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-muted/10 border-2 border-border rounded-2xl space-y-3 relative group">
                                            <button onClick={() => updateContentField('faqItems', element.content.faqItems.filter((_: any, i: number) => i !== idx))} className="absolute top-2 right-2 p-1 text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                            <input value={item.question} onChange={(e) => { const f = [...element.content.faqItems]; f[idx].question = e.target.value; updateContentField('faqItems', f); }} className="w-full bg-transparent font-black text-sm outline-none" placeholder="Question" />
                                            <textarea value={item.answer} onChange={(e) => { const f = [...element.content.faqItems]; f[idx].answer = e.target.value; updateContentField('faqItems', f); }} className="w-full bg-white border border-border rounded-xl p-2 text-xs font-medium resize-none" placeholder="Answer" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {element.type === 'quiz-result' && (
                            <div className="space-y-8">
                                <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[32px] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-emerald-900 uppercase">Qualification Threshold</h4>
                                            <p className="text-[10px] text-emerald-800/70 font-medium">Minimum/Maximum points for this page</p>
                                        </div>
                                        <Target size={20} className="text-emerald-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900 ml-1">Min Threshold</label>
                                            <input 
                                                type="number" 
                                                value={element.content.minScoreThreshold ?? 0}
                                                onChange={(e) => updateContentField('minScoreThreshold', parseInt(e.target.value) || 0)}
                                                className="w-full px-4 py-2.5 bg-white border-2 border-emerald-200 rounded-xl font-black text-sm text-emerald-900 outline-none focus:border-emerald-500"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900 ml-1">Max Threshold</label>
                                            <input 
                                                type="number" 
                                                value={element.content.maxScoreThreshold ?? 1000}
                                                onChange={(e) => updateContentField('maxScoreThreshold', parseInt(e.target.value) || 0)}
                                                className="w-full px-4 py-2.5 bg-white border-2 border-emerald-200 rounded-xl font-black text-sm text-emerald-900 outline-none focus:border-emerald-500"
                                                placeholder="1000"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-emerald-700/60 font-medium px-1">Leads with scores outside this range will be disqualified or routed to alternate result pages.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Result Metrics</h4>
                                        <button onClick={() => updateContentField('metrics', [...(element.content.metrics || []), { label: 'New Metric', icon: 'Zap', valueRule: '100', description: 'Description' }])} className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {element.content.metrics?.map((m: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-muted/10 border-2 border-border rounded-[24px] space-y-3 relative group">
                                                <button onClick={() => updateContentField('metrics', element.content.metrics.filter((_: any, i: number) => i !== idx))} className="absolute top-3 right-3 p-1.5 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                                <div className="flex gap-4">
                                                    <button onClick={() => setIconPickerStepIndex(idx)} className="w-12 h-12 bg-white border border-border rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm hover:border-primary transition-all">
                                                        <DynamicIcon name={m.icon || 'Zap'} size={20} />
                                                    </button>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Label</label>
                                                            <input value={m.label} onChange={(e) => { const next = [...element.content.metrics]; next[idx].label = e.target.value; updateContentField('metrics', next); }} className="w-full bg-white border border-border rounded-xl px-3 py-1.5 font-bold text-xs outline-none focus:border-primary transition-all" placeholder="Metric Label" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Description</label>
                                                    <textarea value={m.description} onChange={(e) => { const next = [...element.content.metrics]; next[idx].description = e.target.value; updateContentField('metrics', next); }} className="w-full bg-white border border-border rounded-xl p-2 text-xs font-medium resize-none focus:border-primary outline-none transition-all" placeholder="Describe the result..." rows={2} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* OPTIONS / ANSWERS SETTINGS */}
                {isOptionsField && (
                    <div className="space-y-6 animate-fade-in-down">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Answer Options & Scoring</h4>
                            {element.content.quizType !== 'slider' && element.content.quizType !== 'input' && (
                                <button onClick={() => updateContentField('options', [...(element.content.options || []), { label: 'New Option', value: 'new', icon: 'Zap', scoreModifier: 0, disqualify: false }])} className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"><Plus size={16} /></button>
                            )}
                        </div>

                        {element.content.quizType === 'slider' ? (
                            <div className="space-y-8 py-4">
                                <div className="bg-muted/10 border-2 border-border rounded-[24px] p-6 space-y-6 shadow-sm">
                                    <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <BarChart3 size={14}/> Range Configuration
                                    </h5>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Min Value</label>
                                            <input 
                                                type="number" 
                                                value={element.content.validation?.min ?? 0}
                                                onChange={(e) => updateSliderValidation({ min: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 bg-white border-2 border-border rounded-xl font-bold text-xs focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Max Value</label>
                                            <input 
                                                type="number" 
                                                value={element.content.validation?.max ?? 100}
                                                onChange={(e) => updateSliderValidation({ max: parseInt(e.target.value) || 100 })}
                                                className="w-full px-4 py-2.5 bg-white border-2 border-border rounded-xl font-bold text-xs focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Step (Interval)</label>
                                            <input 
                                                type="number" 
                                                value={element.content.validation?.step ?? 1}
                                                onChange={(e) => updateSliderValidation({ step: parseInt(e.target.value) || 1 })}
                                                className="w-full px-4 py-2.5 bg-white border-2 border-border rounded-xl font-bold text-xs focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Value Format</label>
                                            <div className="relative">
                                                <select 
                                                    value={element.content.validation?.format || 'number'}
                                                    onChange={(e) => updateSliderValidation({ format: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white border-2 border-border rounded-xl font-bold text-xs appearance-none focus:border-primary outline-none transition-all"
                                                >
                                                    <option value="number">Pure Number (#)</option>
                                                    <option value="currency">Currency ($)</option>
                                                    <option value="percent">Percent (%)</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-border/40">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Initial Starting Point</label>
                                        <input 
                                            type="number" 
                                            value={element.content.validation?.default ?? element.content.validation?.min ?? 50}
                                            onChange={(e) => updateSliderValidation({ default: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 bg-white border-2 border-border rounded-xl font-black text-sm text-primary focus:border-primary outline-none transition-all"
                                            placeholder="50"
                                        />
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-slate-50 border-2 border-dashed border-border rounded-[24px] flex gap-4">
                                    <Info className="text-muted-foreground shrink-0" size={18} />
                                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                        The slider automatically synchronizes based on the range values provided. Ensure 'Min' is lower than 'Max' for proper rendering.
                                    </p>
                                </div>
                            </div>
                        ) : element.content.quizType === 'input' ? (
                            <div className="p-8 bg-slate-50 border-2 border-dashed border-border rounded-[32px] text-center space-y-4">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-primary">
                                    <Layout size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-[#1a2b3b]">Dynamic Input Mode</p>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        This step type doesn't use fixed options. Answers are captured via free-form user input.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-10">
                                {element.content.options?.map((opt: any, idx: number) => (
                                    <div key={idx} className="p-5 bg-muted/10 border-2 border-border rounded-[24px] space-y-5 relative group">
                                        <button onClick={() => updateContentField('options', element.content.options.filter((_: any, i: number) => i !== idx))} className="absolute top-4 right-4 p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                        <div className="flex gap-4">
                                            <button onClick={() => setIconPickerStepIndex(idx)} className="w-12 h-12 bg-white border-2 border-border rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm hover:border-primary transition-all"><DynamicIcon name={opt.icon || 'Zap'} size={20} /></button>
                                            <div className="flex-1 space-y-3">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Answer Label</label>
                                                    <input value={opt.label} onChange={(e) => { const o = [...element.content.options]; o[idx].label = e.target.value; updateContentField('options', o); }} className="w-full bg-white border border-border rounded-xl px-3 py-2 font-bold text-sm outline-none focus:border-primary transition-all" placeholder="Display Text" />
                                                </div>
                                                
                                                {/* Scoring & Disqualify logic for each option */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Score Points</label>
                                                        <div className="relative">
                                                            <Star size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                                                            <input 
                                                                type="number"
                                                                value={opt.scoreModifier || 0}
                                                                onChange={(e) => { const o = [...element.content.options]; o[idx].scoreModifier = parseInt(e.target.value) || 0; updateContentField('options', o); }}
                                                                className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-sm font-black text-primary outline-none focus:border-primary"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Disqualify Lead</label>
                                                        <div className="flex items-center justify-between h-10 px-4 bg-white border border-border rounded-xl">
                                                            <span className="text-[10px] font-bold">Auto-Fail</span>
                                                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={opt.disqualify || false}
                                                                    onChange={(e) => { const o = [...element.content.options]; o[idx].disqualify = e.target.checked; updateContentField('options', o); }}
                                                                    className="sr-only peer" 
                                                                />
                                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-border/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Split size={12} className="text-primary" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Jump Logic</span>
                                            </div>
                                            <div className="relative">
                                                <select 
                                                    value={opt.linkUrl || ''} 
                                                    onChange={(e) => {
                                                        const o = [...element.content.options];
                                                        const targetId = e.target.value;
                                                        o[idx].linkType = targetId ? 'page' : undefined;
                                                        o[idx].linkUrl = targetId;
                                                        updateContentField('options', o);
                                                    }}
                                                    className="w-full pl-3 pr-8 py-2 bg-white border border-border rounded-xl text-[11px] font-bold appearance-none outline-none focus:border-primary shadow-sm"
                                                >
                                                    <option value="">Next Step (Default)</option>
                                                    {funnel.pages.map((p, i) => (
                                                        <option key={p.id} value={p.id}>Step {i + 1}: {p.title}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TEXT SETTINGS */}
                {isTextField && !isBrandingField && (
                    <div className="space-y-6 animate-fade-in-down">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Content</label>
                        <textarea 
                            value={getEffectiveValue(selectedField!)} 
                            onChange={(e) => updateContentField(selectedField!, e.target.value)} 
                            rows={5} 
                            className="w-full px-5 py-4 bg-muted/20 border-2 border-border rounded-2xl outline-none focus:border-primary font-bold text-sm resize-none" 
                        />
                        {renderTextStyleControls(`${selectedField}Style`, { hideSize: selectedField === 'logoText' || selectedField === 'placeholder' })}
                    </div>
                )}

                {/* BUTTON SETTINGS */}
                {isButtonField && (
                    <div className="space-y-10 animate-fade-in-down">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Label</label>
                            <input 
                                type="text" 
                                value={selectedField === 'cta' ? (element.content.cta?.text || '') : element.content[selectedField!] || ''} 
                                onChange={(e) => selectedField === 'cta' ? updateContentField('cta', { ...(element.content.cta || {}), text: e.target.value }) : updateContentField(selectedField!, e.target.value)} 
                                className="w-full px-4 py-3 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm" 
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Appearance</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {renderColorPicker("Text Color", 
                                    (selectedField === 'cta' ? element.content.cta?.style?.textColor : element.content[`${selectedField}Style`]?.textColor) || '#ffffff',
                                    (val) => {
                                        if (selectedField === 'cta') {
                                            updateContentField('cta', { ...(element.content.cta || {}), style: { ...(element.content.cta?.style || {}), textColor: val } });
                                        } else {
                                            updateNestedStyle(`${selectedField}Style`, { textColor: val });
                                        }
                                    }
                                )}
                                {renderColorPicker("Background Color", 
                                    (selectedField === 'cta' ? element.content.cta?.style?.backgroundColor : element.content[`${selectedField}Style`]?.backgroundColor) || funnel.theme.primaryColor,
                                    (val) => {
                                        if (selectedField === 'cta') {
                                            updateContentField('cta', { ...(element.content.cta || {}), style: { ...(element.content.cta?.style || {}), backgroundColor: val } });
                                        } else {
                                            updateNestedStyle(`${selectedField}Style`, { backgroundColor: val });
                                        }
                                    }
                                )}
                            </div>
                            
                            <div className="space-y-3 pt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Button Size</label>
                                <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                                    {[
                                        { id: 'sm', label: 'SM' },
                                        { id: 'md', label: 'MD' },
                                        { id: 'lg', label: 'LG' }
                                    ].map((size) => {
                                        const activeSize = selectedField === 'cta' ? (element.content.cta?.style?.size || 'md') : (element.content[`${selectedField}Style`]?.size || 'md');
                                        return (
                                            <button 
                                                key={size.id} 
                                                onClick={() => {
                                                    if (selectedField === 'cta') {
                                                        updateContentField('cta', { ...(element.content.cta || {}), style: { ...(element.content.cta?.style || {}), size: size.id } });
                                                    } else {
                                                        updateNestedStyle(`${selectedField}Style`, { size: size.id });
                                                    }
                                                }}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeSize === size.id ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {size.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile Full Width</label>
                                    <p className="text-[9px] text-muted-foreground">Stretch button to container edges on mobile.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedField === 'cta' 
                                            ? (element.content.cta?.style?.mobile?.fullWidth ?? true) 
                                            : (element.content[`${selectedField}Style`]?.mobile?.fullWidth ?? true)
                                        } 
                                        onChange={(e) => {
                                            const val = e.target.checked;
                                            if (selectedField === 'cta') {
                                                const currentStyle = element.content.cta?.style || {};
                                                const currentMobile = currentStyle.mobile || {};
                                                updateContentField('cta', { 
                                                    ...(element.content.cta || {}), 
                                                    style: { ...currentStyle, mobile: { ...currentMobile, fullWidth: val } } 
                                                });
                                            } else {
                                                const currentStyle = element.content[`${selectedField}Style`] || {};
                                                const currentMobile = currentStyle.mobile || {};
                                                updateNestedStyle(`${selectedField}Style`, { mobile: { ...currentMobile, fullWidth: val } });
                                            }
                                        }} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Behavior</h4>
                            {renderActionControl(selectedField!)}
                        </div>
                    </div>
                )}

                {/* IMAGE SETTINGS */}
                {isImageField && !isBrandingField && (
                    <div className="space-y-6 animate-fade-in-down">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Source URL</label>
                        <input type="text" value={element.content[selectedField!] || ''} onChange={(e) => updateContentField(selectedField!, e.target.value)} className="w-full px-4 py-3 bg-muted/20 border-2 border-border rounded-xl focus:border-primary outline-none font-bold text-sm" />
                        <div className="p-10 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center opacity-40"><ImageIcon size={32} /></div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-muted/20 border-t border-border flex justify-end shrink-0">
                <button onClick={onClose} className="px-6 py-2 bg-[#1a2b3b] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Done Editing</button>
            </div>

            <IconPickerModal 
                isOpen={iconPickerStepIndex !== null}
                currentIcon={
                    iconPickerStepIndex !== null 
                        ? (element.type === 'quiz-step' 
                            ? (element.content.options?.[iconPickerStepIndex!]?.icon || 'Zap')
                            : element.type === 'how-it-works'
                                ? (element.content.steps?.[iconPickerStepIndex!]?.icon || 'Zap')
                                : (element.content.metrics?.[iconPickerStepIndex!]?.icon || 'Zap'))
                        : 'Zap'
                }
                onClose={() => setIconPickerStepIndex(null)}
                onSelect={(iconName) => {
                    if (iconPickerStepIndex !== null) {
                        if (element.type === 'quiz-step') {
                            const o = [...element.content.options];
                            o[iconPickerStepIndex].icon = iconName;
                            updateContentField('options', o);
                        } else if (element.type === 'how-it-works') {
                            const s = [...element.content.steps];
                            s[iconPickerStepIndex].icon = iconName;
                            updateContentField('steps', s);
                        } else if (element.type === 'quiz-result') {
                            const m = [...(element.content.metrics || [])];
                            m[iconPickerStepIndex].icon = iconName;
                            updateContentField('metrics', m);
                        }
                    }
                }}
            />

            <IconPickerModal 
                isOpen={isLogoIconPickerOpen}
                currentIcon={element.content.logoIcon || 'Globe'}
                onClose={() => setIsLogoIconPickerOpen(false)}
                onSelect={(iconName) => onUpdate({ logoIcon: iconName, logoType: 'icon' })}
            />
        </div>
    );
};

export default EditorPanel;