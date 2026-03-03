import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Fix: Added missing motion import from framer-motion to resolve compiler errors
import { motion } from 'framer-motion';
import { 
    X, 
    Share2, 
    Image as ImageIcon, 
    Code, 
    Cookie, 
    BarChart3, 
    Mail, 
    Users, 
    Archive, 
    Upload, 
    Bell, 
    Trash2, 
    Settings as SettingsIcon,
    Zap,
    Globe,
    HelpCircle,
    Eye,
    CheckCircle2,
    ShieldAlert,
    Loader2,
    Phone,
    ArrowRight,
    Unplug,
    Type,
    Link as LinkIcon,
    AlertCircle,
    Building2,
    Check,
    BarChart,
    Layers,
    FileJson,
    Monitor,
    Info as InfoIcon,
    Lock,
    Sparkles,
    ShieldCheck,
    Layout,
    Smartphone,
    Shield,
    ExternalLink,
    Search
} from 'lucide-react';
import { FunnelSettings, EmailNotificationSettings, EmailVerificationSettings, Funnel } from '../types';
import { supabase } from '../services/supabaseClient';
import { isEmailServiceConfigured } from '../services/emailService';

interface SettingsModalProps {
    settings: FunnelSettings;
    onUpdateSettings: (updates: Partial<FunnelSettings>) => void;
    onClose: () => void;
    onArchive?: () => void;
    funnelId?: string;
    isSaving?: boolean;
    workspacePlan?: string;
    initialTab?: SettingsTab; 
    funnel?: Funnel; // Added funnel prop to access hero image
}

export type SettingsTab = 'social' | 'branding' | 'favicon' | 'tracking' | 'cookie' | 'progress' | 'email' | 'verification' | 'archive';

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdateSettings, onClose, onArchive, funnelId, isSaving, workspacePlan, initialTab, funnel }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'social'); 
    const [emailRecipientInput, setEmailRecipientInput] = useState('');
    const [isArchiving, setIsArchiving] = useState(false);
    const [connectedBuyers, setConnectedBuyers] = useState<any[]>([]);
    const [isLoadingBuyers, setIsLoadingBuyers] = useState(false);
    const [isResendConnected, setIsResendConnected] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    
    const [draftSettings, setDraftSettings] = useState<FunnelSettings>(settings);

    // Get hero image from funnel data to use as default social image
    const funnelHeroImage = useMemo(() => {
        if (!funnel) return null;
        return funnel.pages.find(p => p.type === 'start')?.elements.find(e => e.type === 'hero')?.content?.heroImage;
    }, [funnel]);

    const isPaidPlan = useMemo(() => {
        const plan = workspacePlan?.toLowerCase() || '';
        return plan.includes('growth') || plan.includes('scale');
    }, [workspacePlan]);

    useEffect(() => {
        setIsResendConnected(isEmailServiceConfigured());
        if (activeTab === 'email') {
            if (funnelId) {
                fetchConnectedBuyers();
            }
            checkAndApplyDefaultLogo();
        }
    }, [activeTab, funnelId]);

    useEffect(() => {
        setDraftSettings(settings);
    }, [settings]);

    const checkAndApplyDefaultLogo = async () => {
        if (draftSettings.emailNotifications?.logoUrl) return;

        try {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) return;

            const { data: wsData, error: wsError } = await supabase
                .from('workspaces')
                .select('metadata')
                .eq('id', workspaceId)
                .single();

            if (!wsError && wsData?.metadata?.default_email_logo) {
                updateEmailSettings({ logoUrl: wsData.metadata.default_email_logo });
            }
        } catch (err) {
            console.error("Error fetching default workspace logo:", err);
        }
    };

    const fetchConnectedBuyers = async () => {
        setIsLoadingBuyers(true);
        try {
            const { data, error } = await supabase
                .from('lead_buyer_funnels')
                .select('lead_buyers(name, email, status)')
                .eq('funnel_id', funnelId);
            
            if (!error && data) {
                const buyers = data.map((d: any) => d.lead_buyers).filter((b: any) => b.status === 'active');
                setConnectedBuyers(buyers);

                const buyerEmails = buyers.map((b: any) => b.email.toLowerCase());
                const currentRecipients = draftSettings.emailNotifications?.recipients || [];
                const currentRecipientsLower = currentRecipients.map(r => r.toLowerCase());
                
                const missingEmails = buyerEmails.filter((email: string) => !currentRecipientsLower.includes(email));

                if (missingEmails.length > 0) {
                    const nextRecipients = [...currentRecipients, ...missingEmails];
                    updateEmailSettings({ recipients: nextRecipients });
                }
            }
        } catch (err) {
            console.error("Error fetching connected buyers:", err);
        } finally {
            setIsLoadingBuyers(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof FunnelSettings | 'emailLogo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (key === 'emailLogo') {
            setIsUploadingLogo(true);
            try {
                const fileName = `email-logo-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const { data, error } = await supabase.storage
                    .from('logo-slider')
                    .upload(fileName, file);

                if (error) throw error;

                const { data: { publicUrl } } = await supabase.storage
                    .from('logo-slider')
                    .getPublicUrl(data.path);

                updateEmailSettings({ logoUrl: publicUrl });

                const workspaceId = localStorage.getItem('active_workspace_id');
                if (workspaceId) {
                    const { data: wsData } = await supabase.from('workspaces').select('metadata').eq('id', workspaceId).single();
                    await supabase.from('workspaces').update({
                        metadata: {
                            ...(wsData?.metadata || {}),
                            default_email_logo: publicUrl
                        }
                    }).eq('id', workspaceId);
                }
            } catch (err: any) {
                console.error("Logo upload failed, falling back to base64:", err.message);
                const reader = new FileReader();
                reader.onloadend = () => {
                    updateEmailSettings({ logoUrl: reader.result as string });
                };
                reader.readAsDataURL(file);
            } finally {
                setIsUploadingLogo(false);
            }
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const next = { ...draftSettings, [key]: reader.result as string };
            setDraftSettings(next);
        };
        reader.readAsDataURL(file);
    };

    const updateEmailSettings = (updates: Partial<EmailNotificationSettings>) => {
        const currentNotifications = draftSettings.emailNotifications || {
            enabled: false,
            recipients: [],
            subject: 'New Lead Captured!',
            headline: 'A new lead has arrived!',
            primaryColor: '#f97316',
            callLeadEnabled: true,
            callLeadText: 'Call Lead Directly',
            callLeadColor: '#10b981',
            viewLeadEnabled: true,
            viewLeadText: 'View Intelligence Report',
            viewLeadColor: '#2563eb',
            customCtaEnabled: false,
            customCtaText: 'Visit Website',
            customCtaLink: '',
            customCtaColor: '#f97316'
        };

        const newEmailSettings = { ...currentNotifications, ...updates };
        const nextSettings = { ...draftSettings, emailNotifications: newEmailSettings };
        setDraftSettings(nextSettings);
        
        if (updates.enabled !== undefined) {
            onUpdateSettings(nextSettings);
        }
    };

    const updateEmailVerificationSettings = (updates: Partial<EmailVerificationSettings>) => {
        const currentVerification = draftSettings.emailVerification || {
            enabled: false,
            allowValid: true,
            allowCatchAll: true,
            allowDisposable: false,
            allowUnknown: true,
            allowInvalid: false,
            provider: 'findymail'
        };

        const newVerificationSettings = { ...currentVerification, ...updates };
        const nextSettings = { ...draftSettings, emailVerification: newVerificationSettings };
        setDraftSettings(nextSettings);
    };

    const addRecipient = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ',') && emailRecipientInput.trim()) {
            e.preventDefault();
            const email = emailRecipientInput.trim().replace(',', '');
            if (email.includes('@') && !draftSettings.emailNotifications?.recipients.includes(email)) {
                updateEmailSettings({ 
                    recipients: [...(draftSettings.emailNotifications?.recipients || []), email] 
                });
                setEmailRecipientInput('');
            }
        }
    };

    const removeRecipient = (index: number) => {
        const next = [...(draftSettings.emailNotifications?.recipients || [])];
        next.splice(index, 1);
        updateEmailSettings({ recipients: next });
    };

    const handleSave = () => {
        onUpdateSettings(draftSettings);
    };

    const renderMenuItem = (id: SettingsTab, label: string, icon: React.ReactNode) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
        >
            <div className={`${activeTab === id ? 'text-white' : 'text-muted-foreground'} transition-colors`}>{icon}</div>
            <span className="flex-1 text-left">{label}</span>
        </button>
    );

    const EmailPreview = useMemo(() => {
        const es = draftSettings.emailNotifications;
        if (!es) return null;

        const previewHeadline = (es.headline || 'New Lead Alert').replace(/{name}/g, 'John Doe');

        return (
            <div className="bg-gray-100 p-8 rounded-2xl flex-1 flex flex-col items-center overflow-y-auto max-h-full scrollbar-hide">
                <div className="w-full max-w-[480px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 font-sans">
                    <div className="p-8 text-center" style={{ backgroundColor: `${es.primaryColor}10` }}>
                        {es.logoUrl ? (
                            <img src={es.logoUrl} alt="Logo" className="h-10 mx-auto mb-6 object-contain" />
                        ) : (
                            <div className="h-10 mx-auto mb-6 flex items-center justify-center opacity-20">
                                <ImageIcon size={32} />
                            </div>
                        )}
                        <h1 className="text-xl font-black text-gray-900 leading-tight">
                            {previewHeadline}
                        </h1>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-100">Contact Details</h2>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr><td className="py-2 text-gray-500 font-medium uppercase">Name</td><td className="py-2 text-gray-900 font-bold text-right">John Doe</td></tr>
                                    <tr><td className="py-2 text-gray-500 font-medium uppercase">Email</td><td className="py-2 text-gray-900 font-bold text-right">john@agency.com</td></tr>
                                    <tr><td className="py-2 text-gray-500 font-medium uppercase">Phone</td><td className="py-2 text-gray-900 font-bold text-right">(555) 012-3456</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="pt-2 flex flex-col gap-3">
                            {es.callLeadEnabled && (
                                <div className="w-full py-4 rounded-xl text-center font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: es.callLeadColor || es.primaryColor }}>
                                    <Phone size={16} fill="currentColor" /> {es.callLeadText || 'Call Lead Directly'}
                                </div>
                            )}
                            {es.viewLeadEnabled && (
                                <div className="w-full py-4 rounded-xl text-center font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: es.viewLeadColor || '#2563eb' }}>
                                    {es.viewLeadText || 'View Intelligence Report'} <ArrowRight size={16} />
                                </div>
                            )}
                            {es.customCtaEnabled && (
                                <div className="w-full py-4 rounded-xl text-center font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: es.customCtaColor || es.primaryColor }}>
                                    {es.customCtaText || 'Custom Button'}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 text-center border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by Wisefunnel</p>
                    </div>
                </div>
            </div>
        );
    }, [draftSettings.emailNotifications]);

    const isDirty = useMemo(() => JSON.stringify(draftSettings) !== JSON.stringify(settings), [draftSettings, settings]);

    const renderVerificationToggle = (label: string, description: string, checked: boolean, onChange: (val: boolean) => void, colorClass: string = "bg-emerald-500") => (
        <div className="flex items-center justify-between p-4 bg-white border border-border rounded-2xl group hover:border-primary/20 transition-all">
            <div className="space-y-0.5">
                <p className="text-xs font-black text-[#1a2b3b] uppercase tracking-tight">{label}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
                <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${colorClass} shadow-inner`}></div>
            </label>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-[#1A2B3B]/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-[1140px] h-[820px] rounded-[40px] flex overflow-hidden shadow-[0_32px_64px_-16px_rgba(26,43,59,0.3)] animate-scale-in">
                <div className="w-[300px] bg-muted/30 border-r border-border flex flex-col p-8 space-y-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20">
                            <SettingsIcon size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-[#1A2B3B] tracking-tight">Settings</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 mb-3">General</p>
                        {renderMenuItem('social', 'Social Meta', <Share2 size={18} />)}
                        {renderMenuItem('branding', 'Branding', <Type size={18} />)}
                        {renderMenuItem('favicon', 'Favicon', <Globe size={18} />)}
                        {renderMenuItem('email', 'Email Notifications', <Mail size={18} />)}
                        
                        <div className="h-px bg-border my-6 mx-4"></div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 mb-3">Tech & Scripts</p>
                        {renderMenuItem('verification', 'Lead Verification', <ShieldCheck size={18} />)}
                        {renderMenuItem('cookie', 'Cookie Banner', <Cookie size={18} />)}
                        {renderMenuItem('progress', 'Progress Bar', <BarChart3 size={18} />)}
                        {renderMenuItem('tracking', 'Tracking Codes', <Code size={18} />)}
                        
                        <div className="h-px bg-border my-6 mx-4"></div>
                        {renderMenuItem('archive', 'Danger Zone', <Trash2 size={18} />)}
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                    <div className="h-20 border-b border-gray-50 flex items-center justify-between px-10 bg-white z-20 shrink-0">
                         <div className="space-y-0.5">
                             <h3 className="text-xl font-black text-[#1A2B3B] tracking-tight capitalize">{activeTab.replace('-', ' ')} Configuration</h3>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manage automated campaign operations and appearance.</p>
                         </div>
                         <button onClick={onClose} className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-all active:scale-90"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide bg-white">
                        {activeTab === 'social' && (
                            <div className="max-w-2xl mx-auto p-12 space-y-12 animate-fade-in-down">
                                <div className="bg-slate-50 border-2 border-border/50 rounded-[32px] overflow-hidden shadow-xl max-w-lg mx-auto">
                                    <div className="aspect-[1200/630] bg-slate-200 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        { (draftSettings.metaImage || funnelHeroImage) ? <img src={draftSettings.metaImage || funnelHeroImage!} className="w-full h-full object-cover" alt="Social Preview" /> : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-slate-100 gap-4">
                                                <ImageIcon size={48} className="opacity-20" />
                                                <span className="text-xs font-bold uppercase tracking-widest opacity-40">1200 x 630 recommended</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-white rounded-2xl p-4 shadow-2xl flex items-center gap-2 text-primary font-black text-xs uppercase"><Upload size={16} /> Replace Image</div>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'metaImage')} />
                                    <div className="p-6 bg-white space-y-2">
                                        <h4 className="font-black text-[#1A2B3B] text-lg truncate">{draftSettings.metaTitle || funnel?.name || 'Page Title'}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{draftSettings.metaDescription || 'Add a description to improve social engagement and SEO performance.'}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Meta Title</label>
                                        <input type="text" value={draftSettings.metaTitle || ''} onChange={(e) => setDraftSettings({ ...draftSettings, metaTitle: e.target.value })} className="w-full px-6 py-4 bg-muted/20 border-2 border-border rounded-2xl focus:border-primary outline-none transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Meta Description</label>
                                        <textarea rows={4} value={draftSettings.metaDescription || ''} onChange={(e) => setDraftSettings({ ...draftSettings, metaDescription: e.target.value })} className="w-full px-6 py-4 bg-muted/20 border-2 border-border rounded-2xl focus:border-primary outline-none transition-all font-medium text-sm resize-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'branding' && (
                            <div className="max-w-2xl mx-auto p-12 space-y-12 animate-fade-in-down">
                                <div className="bg-slate-50 border-2 border-border/50 rounded-[40px] p-10 space-y-8 relative overflow-hidden">
                                    {!isPaidPlan && (
                                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-12 text-center space-y-6">
                                            <div className="w-16 h-16 bg-[#1A2B3B] text-white rounded-3xl flex items-center justify-center shadow-xl"><Lock size={32} /></div>
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black text-[#1A2B3B]">Agency Exclusive</h4>
                                                <p className="text-sm font-medium text-gray-500 leading-relaxed">Upgrade to Growth or Scale to remove the Wisefunnel badge from your live pages.</p>
                                            </div>
                                            <button onClick={() => navigate('/account', { state: { initialTab: 'billing' } })} className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all">Upgrade Now</button>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between relative z-0">
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black text-[#1A2B3B]">White-Label Funnels</h4>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Hide 'Built with Wisefunnel' Badge</p>
                                        </div>
                                        <label className={`relative inline-flex items-center ${isPaidPlan ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                            <input type="checkbox" disabled={!isPaidPlan} checked={draftSettings.hideBranding || false} onChange={(e) => setDraftSettings({ ...draftSettings, hideBranding: e.target.checked })} className="sr-only peer" />
                                            <div className="w-16 h-9 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-[#1A2B3B] shadow-inner"></div>
                                        </label>
                                    </div>
                                    <div className="p-8 bg-white border border-border rounded-3xl space-y-4">
                                        <div className="flex items-center gap-3"><Sparkles size={20} className="text-orange-500" /><h5 className="font-black text-lg">Clean Interface</h5></div>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">When enabled, the floating Wisefunnel badge will be removed from all public landing pages and results within this funnel.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'verification' && (
                            <div className="flex h-full animate-fade-in-down">
                                <div className="w-1/2 p-12 space-y-12 border-r border-gray-50 overflow-y-auto scrollbar-hide pb-32">
                                    {/* SMS OTP Verification Section */}
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[32px] shadow-sm">
                                            <div className="space-y-1">
                                                <h4 className="font-black text-emerald-900 text-lg">SMS OTP Verification</h4>
                                                <p className="text-[10px] uppercase font-black text-emerald-600">Final Identity Shield</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={draftSettings.otpVerification?.enabled ?? true} 
                                                    onChange={(e) => setDraftSettings({ ...draftSettings, otpVerification: { ...draftSettings.otpVerification, enabled: e.target.checked } })} 
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Email Verification Section */}
                                    <div className="space-y-8 pt-8 border-t border-gray-50">
                                        <div className="flex items-center justify-between p-8 bg-blue-50 border-2 border-blue-100 rounded-[32px] shadow-sm">
                                            <div className="space-y-1">
                                                <h4 className="font-black text-blue-900 text-lg">Email Verification</h4>
                                                <p className="text-[10px] uppercase font-black text-blue-600">Real-time Deliverability Check</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={draftSettings.emailVerification?.enabled ?? false} 
                                                    onChange={(e) => {
                                                        const isEnabled = e.target.checked;
                                                        if (isEnabled) {
                                                            updateEmailVerificationSettings({ 
                                                                enabled: true,
                                                                allowValid: true,
                                                                allowCatchAll: true,
                                                                allowDisposable: false,
                                                                allowUnknown: true,
                                                                allowInvalid: false
                                                            });
                                                        } else {
                                                            updateEmailVerificationSettings({ enabled: false });
                                                        }
                                                    }} 
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                                            </label>
                                        </div>

                                        {draftSettings.emailVerification?.enabled && (
                                            <div className="space-y-8 animate-fade-in-down">
                                                <div className="p-8 bg-white border-2 border-border rounded-[32px] space-y-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><Shield size={20} /></div>
                                                        <h5 className="font-black text-[#1A2B3B]">Verification Policies</h5>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Findymail Enforcement</p>
                                                        {renderVerificationToggle("Allow Disposable", "Let user proceed if email is a burner", draftSettings.emailVerification?.allowDisposable ?? false, (val) => updateEmailVerificationSettings({ allowDisposable: val }))}
                                                        {renderVerificationToggle("Allow Invalid", "Let user proceed if MX or syntax check fails", draftSettings.emailVerification?.allowInvalid ?? false, (val) => updateEmailVerificationSettings({ allowInvalid: val }), "bg-rose-500")}
                                                    </div>
                                                    
                                                    <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                                                        <InfoIcon size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                                        <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                                                            Blocking risky emails will prevent users from proceeding to the SMS OTP step, ensuring only high-quality data enters your pipeline.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* DYNAMIC PREVIEW SECTION */}
                                <div className="flex-1 bg-slate-50 relative p-12 flex flex-col items-center justify-center">
                                    <div className="w-full max-w-[320px] aspect-[9/18] bg-white rounded-[48px] shadow-2xl border-[8px] border-gray-900 relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 left-0 right-0 h-8 bg-gray-900 flex justify-center items-end pb-1.5">
                                            <div className="w-16 h-3 bg-gray-800 rounded-full"></div>
                                        </div>
                                        
                                        <div className="flex-1 p-8 text-center mt-12 space-y-6 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                                                <ShieldCheck size={32} />
                                            </div>
                                            
                                            <div className="space-y-4 w-full">
                                                <h4 className="text-lg font-black text-[#1A2B3B]">Lead Security Journey</h4>
                                                
                                                <div className="space-y-2">
                                                    {draftSettings.emailVerification?.enabled && (
                                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-left space-y-2">
                                                            <div className="flex items-center gap-2 text-blue-600">
                                                                <CheckCircle2 size={14} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Email Scanned</span>
                                                            </div>
                                                            <p className="text-[9px] text-blue-800 font-medium leading-relaxed">
                                                                The visitor's email is instantly verified for deliverability before the form completes.
                                                            </p>
                                                        </motion.div>
                                                    )}

                                                    {draftSettings.otpVerification?.enabled && (
                                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-left space-y-2">
                                                            <div className="flex items-center gap-2 text-emerald-600">
                                                                <Smartphone size={14} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">SMS OTP PIN Required</span>
                                                            </div>
                                                            <p className="text-[9px] text-emerald-800 font-medium leading-relaxed">
                                                                Visitor must enter a 4-digit code sent to their mobile to authenticate their identity.
                                                            </p>
                                                        </motion.div>
                                                    )}

                                                    {!draftSettings.emailVerification?.enabled && !draftSettings.otpVerification?.enabled && (
                                                        <div className="p-10 text-center space-y-3 opacity-30">
                                                            <ShieldAlert size={32} className="mx-auto text-gray-400" />
                                                            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">No Security Active</p>
                                                            <p className="text-[8px] text-gray-400">Leads will be submitted without technical validation.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-50 border-t border-gray-100 mt-auto">
                                            <p className="text-[10px] font-bold text-[#1A2B3B] mb-2 uppercase tracking-widest text-center">Business Impact</p>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${draftSettings.emailVerification?.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                    <span className={`text-[9px] font-medium ${draftSettings.emailVerification?.enabled ? 'text-gray-900' : 'text-gray-400'}`}>Zero Bounce Rate Guarantee</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${draftSettings.otpVerification?.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                    <span className={`text-[9px] font-medium ${draftSettings.otpVerification?.enabled ? 'text-gray-900' : 'text-gray-400'}`}>100% Reachable Mobile Lines</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 text-center max-w-xs space-y-2">
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                            {draftSettings.otpVerification?.enabled || draftSettings.emailVerification?.enabled 
                                                ? "Visitors will experience a high-trust verification flow, filtering out 99% of 'junk' submissions before they reach your partner."
                                                : "Standard form mode. Leads are delivered instantly but identity quality is not technically enforced."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'favicon' && (
                            <div className="max-w-2xl mx-auto p-12 space-y-12 animate-fade-in-down">
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 bg-primary/10 text-primary rounded-[36px] flex items-center justify-center mx-auto shadow-xl">
                                        {draftSettings.favicon ? <img src={draftSettings.favicon} className="w-14 h-14 object-contain" alt="Favicon" /> : <Globe size={48} />}
                                    </div>
                                    <h3 className="text-3xl font-black text-[#1A2B3B] tracking-tight">Custom Favicon</h3>
                                    <p className="text-muted-foreground font-medium text-lg max-sm mx-auto">The signature of your campaign in the browser ecosystem.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    <div className="p-10 bg-slate-50 border-2 border-dashed border-border rounded-[40px] flex flex-col items-center justify-center text-center cursor-pointer group hover:border-primary hover:bg-primary/5 transition-all" onClick={() => faviconInputRef.current?.click()}>
                                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><Upload size={28} className="text-muted-foreground group-hover:text-primary" /></div>
                                        <h4 className="text-sm font-black text-[#1A2B3B] mb-1">Update Artifact</h4>
                                        <input type="file" ref={faviconInputRef} className="hidden" accept="image/png,image/x-icon,image/svg+xml" onChange={(e) => handleImageUpload(e, 'favicon')} />
                                    </div>
                                    <div className="bg-slate-50 border border-border rounded-[40px] p-10 space-y-8">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-[#1A2B3B] text-center">Browser Tab Simulation</h4>
                                        <div className="bg-white border border-border rounded-xl shadow-sm p-3 flex items-center gap-3 w-full">
                                            <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center">
                                                {draftSettings.favicon ? <img src={draftSettings.favicon} className="w-4 h-4 object-contain" /> : <Globe size={14} className="text-slate-400" />}
                                            </div>
                                            <p className="text-[12px] font-bold text-gray-700 truncate flex-1">{draftSettings.metaTitle || 'Conversion Funnel'}</p>
                                            <X size={12} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'email' && (
                            <div className="flex h-full animate-fade-in-down">
                                <div className="w-3/5 border-r border-gray-50 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                                    <div className="flex items-center justify-between p-8 bg-slate-50 border-2 border-border/50 rounded-[32px] shadow-sm">
                                        <div><h4 className="text-lg font-black text-[#1A2B3B]">Email Notifications</h4><p className="text-[11px] uppercase font-black tracking-widest text-muted-foreground mt-1">Lead Alerts for Partners</p></div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={draftSettings.emailNotifications?.enabled || false} onChange={(e) => updateEmailSettings({ enabled: e.target.checked })} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                        </label>
                                    </div>
                                    {draftSettings.emailNotifications?.enabled && (
                                        <div className="space-y-10 animate-fade-in-down">
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2"><Users size={14} /> Delivery Recipients</label>
                                                <div className="min-h-[120px] p-6 border-2 border-border rounded-[28px] bg-muted/20 focus-within:border-primary focus-within:bg-white transition-all flex flex-wrap gap-2.5 content-start">
                                                    {draftSettings.emailNotifications?.recipients.map((email, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-black animate-scale-in">{email}<button onClick={() => removeRecipient(idx)}><X size={14}/></button></div>
                                                    ))}
                                                    <input type="email" placeholder="agency@team.com" value={emailRecipientInput} onChange={(e) => setEmailRecipientInput(e.target.value)} onKeyDown={addRecipient} className="flex-1 bg-transparent outline-none min-w-[180px] text-sm font-bold" />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-8">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Headline (Supports {'{name}'})</label>
                                                    <input type="text" value={draftSettings.emailNotifications?.headline || ''} onChange={(e) => updateEmailSettings({ headline: e.target.value })} className="w-full px-6 py-4 bg-muted/20 border-2 border-border rounded-2xl focus:border-primary outline-none transition-all font-bold text-sm" />
                                                </div>

                                                <div className="p-6 bg-slate-50 border-2 border-border rounded-3xl space-y-6">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[#1A2B3B]">Action Buttons Configuration</h5>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Phone size={16}/></div>
                                                                <span className="text-xs font-bold">Call Lead Directly</span>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={draftSettings.emailNotifications?.callLeadEnabled ?? true} onChange={(e) => updateEmailSettings({ callLeadEnabled: e.target.checked })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                            </label>
                                                        </div>
                                                        {draftSettings.emailNotifications?.callLeadEnabled && (
                                                            <div className="grid grid-cols-2 gap-4 px-2 animate-fade-in-down">
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase text-muted-foreground">Button Text</label>
                                                                    <input type="text" value={draftSettings.emailNotifications?.callLeadText || 'Call Lead Directly'} onChange={(e) => updateEmailSettings({ callLeadText: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs font-bold outline-none focus:border-primary" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase text-muted-foreground">Button Color</label>
                                                                    <div className="flex gap-2 p-2 bg-white border border-border rounded-xl items-center relative cursor-pointer w-fit">
                                                                        <div className="w-6 h-6 rounded-lg border border-gray-100 shadow-sm" style={{ backgroundColor: draftSettings.emailNotifications?.callLeadColor || '#10b981' }}></div>
                                                                        <span className="text-[10px] font-black font-mono">{draftSettings.emailNotifications?.callLeadColor || '#10B981'}</span>
                                                                        <input type="color" value={draftSettings.emailNotifications?.callLeadColor || '#10b981'} onChange={(e) => updateEmailSettings({ callLeadColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Layout size={16}/></div>
                                                                <span className="text-xs font-bold">View Intelligence Report (CRM)</span>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={draftSettings.emailNotifications?.viewLeadEnabled ?? true} onChange={(e) => updateEmailSettings({ viewLeadEnabled: e.target.checked })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                            </label>
                                                        </div>
                                                        {draftSettings.emailNotifications?.viewLeadEnabled && (
                                                            <div className="grid grid-cols-2 gap-4 px-2 animate-fade-in-down">
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase text-muted-foreground">Button Text</label>                                                                    <input type="text" value={draftSettings.emailNotifications?.viewLeadText || 'View Intelligence Report'} onChange={(e) => updateEmailSettings({ viewLeadText: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs font-bold outline-none focus:border-primary" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase text-muted-foreground">Button Color</label>
                                                                    <div className="flex gap-2 p-2 bg-white border border-border rounded-xl items-center relative cursor-pointer w-fit">
                                                                        <div className="w-6 h-6 rounded-lg border border-gray-100 shadow-sm" style={{ backgroundColor: draftSettings.emailNotifications?.viewLeadColor || '#2563eb' }}></div>
                                                                        <span className="text-[10px] font-black font-mono">{draftSettings.emailNotifications?.viewLeadColor || '#2563EB'}</span>
                                                                        <input type="color" value={draftSettings.emailNotifications?.viewLeadColor || '#2563eb'} onChange={(e) => updateEmailSettings({ viewLeadColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><LinkIcon size={16}/></div>
                                                                <span className="text-xs font-bold">Custom CTA Link</span>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={draftSettings.emailNotifications?.customCtaEnabled || false} onChange={(e) => updateEmailSettings({ customCtaEnabled: e.target.checked })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                                            </label>
                                                        </div>
                                                        {draftSettings.emailNotifications?.customCtaEnabled && (
                                                            <div className="space-y-4 px-2 animate-fade-in-down">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black uppercase text-muted-foreground">Button Text</label>
                                                                        <input type="text" value={draftSettings.emailNotifications?.customCtaText || ''} onChange={(e) => updateEmailSettings({ customCtaText: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs font-bold outline-none focus:border-primary" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black uppercase text-muted-foreground">Button URL</label>
                                                                        <input type="text" value={draftSettings.emailNotifications?.customCtaLink || ''} onChange={(e) => updateEmailSettings({ customCtaLink: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-xs font-bold outline-none focus:border-primary" />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase text-muted-foreground">Button Color</label>
                                                                    <div className="flex gap-2 p-2 bg-white border border-border rounded-xl items-center relative cursor-pointer w-fit">
                                                                        <div className="w-6 h-6 rounded-lg border border-gray-100 shadow-sm" style={{ backgroundColor: draftSettings.emailNotifications?.customCtaColor || draftSettings.emailNotifications?.primaryColor }}></div>
                                                                        <span className="text-[10px] font-black font-mono">{draftSettings.emailNotifications?.customCtaColor || draftSettings.emailNotifications?.primaryColor}</span>
                                                                        <input type="color" value={draftSettings.emailNotifications?.customCtaColor || draftSettings.emailNotifications?.primaryColor} onChange={(e) => updateEmailSettings({ customCtaColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Background Tint</label>
                                                        <div className="flex gap-2 p-3 bg-muted/20 border-2 border-border rounded-2xl items-center relative cursor-pointer">
                                                            <div className="w-8 h-8 rounded-xl border-2 border-white shadow-md" style={{ backgroundColor: draftSettings.emailNotifications?.primaryColor }}></div>
                                                            <span className="text-xs font-black font-mono">{draftSettings.emailNotifications?.primaryColor}</span>
                                                            <input type="color" value={draftSettings.emailNotifications?.primaryColor || '#f97316'} onChange={(e) => updateEmailSettings({ primaryColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Brand Logo</label>
                                                        <button 
                                                            onClick={() => logoInputRef.current?.click()} 
                                                            disabled={isUploadingLogo}
                                                            className="w-full h-14 bg-muted/20 border-2 border-border rounded-2xl flex items-center justify-center gap-2 hover:bg-muted/30 transition-all text-xs font-black uppercase disabled:opacity-50"
                                                        >
                                                            {isUploadingLogo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                                                            {draftSettings.emailNotifications?.logoUrl ? 'Change Logo' : 'Upload Logo'}
                                                        </button>
                                                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'emailLogo')} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 bg-slate-50 relative overflow-hidden">{EmailPreview}</div>
                            </div>
                        )}

                        {activeTab === 'cookie' && (
                            <div className="flex h-full animate-fade-in-down">
                                <div className="w-1/2 p-12 space-y-8 border-r border-gray-50 overflow-y-auto scrollbar-hide pb-32">
                                    <div className="flex items-center justify-between p-8 bg-orange-50 border-2 border-orange-100 rounded-[32px] shadow-sm">
                                        <div><h4 className="font-black text-[#1A2B3B] text-lg">Compliance Shield</h4><p className="text-[10px] uppercase font-black text-orange-600 mt-1">GDPR & Cookie Transparency</p></div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={draftSettings.cookieBanner?.enabled || false} onChange={(e) => setDraftSettings({ ...draftSettings, cookieBanner: { ...draftSettings.cookieBanner, enabled: e.target.checked } })} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                        </label>
                                    </div>

                                    {draftSettings.cookieBanner?.enabled && (
                                        <div className="space-y-10 animate-fade-in-down">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Disclosure Message</label>
                                                <textarea rows={3} value={draftSettings.cookieBanner?.text || ''} onChange={(e) => setDraftSettings({ ...draftSettings, cookieBanner: { ...draftSettings.cookieBanner, text: e.target.value } })} className="w-full px-6 py-5 bg-muted/20 border-2 border-border rounded-3xl focus:border-primary outline-none transition-all font-medium text-sm resize-none" />
                                            </div>

                                            <div className="p-8 bg-white border border-border rounded-[32px] space-y-6">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#1A2B3B]">Action Controls</h5>
                                                
                                                <div className="space-y-4">
                                                    {renderVerificationToggle("Show Necessary Button", "Add 'Reject non-essential' option", draftSettings.cookieBanner?.showNecessary ?? true, (val) => setDraftSettings({ ...draftSettings, cookieBanner: { ...draftSettings.cookieBanner, showNecessary: val } }))}
                                                    {renderVerificationToggle("Show Preferences", "Allow user to select specific categories", draftSettings.cookieBanner?.showPreferences ?? true, (val) => setDraftSettings({ ...draftSettings, cookieBanner: { ...draftSettings.cookieBanner, showPreferences: val } }))}
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-border/50">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Accept All Label</label>
                                                        <input type="text" value={draftSettings.cookieBanner?.allLabel || 'Accept All'} onChange={(e) => setDraftSettings({ ...draftSettings, cookieBanner: { ...draftSettings.cookieBanner, allLabel: e.target.value } })} className="w-full px-4 py-2.5 bg-muted/10 border border-border rounded-xl text-xs font-bold outline-none focus:border-primary" />
                                                    </div>
                                                    {draftSettings.cookieBanner?.showNecessary && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Necessary Only Label</label>
                                                            <input type="text" value={draftSettings.cookieBanner?.necessaryLabel || 'Necessary Only'} onChange={(e) => setDraftSettings({ ...draftSettings, cookieBanner: { ...draftSettings.cookieBanner, necessaryLabel: e.target.value } })} className="w-full px-4 py-2.5 bg-muted/10 border border-border rounded-xl text-xs font-bold outline-none focus:border-primary" />
                                                        </div>
                                                    )}
                                                    {draftSettings.cookieBanner?.showPreferences && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Preferences Link Label</label>
                                                            <input type="text" value={draftSettings.cookieBanner?.preferencesLabel || 'Manage Preferences'} onChange={(e) => setDraftSettings({ ...draftSettings, cookieBanner: { ...draftSettings.cookieBanner, preferencesLabel: e.target.value } })} className="w-full px-4 py-2.5 bg-muted/10 border border-border rounded-xl text-xs font-bold outline-none focus:border-primary" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 bg-slate-50 relative p-12 flex items-center justify-center">
                                    <div className="w-full max-w-[320px] aspect-[9/18] bg-white rounded-[48px] shadow-2xl border-[8px] border-gray-900 relative overflow-hidden">
                                        <div className={`absolute bottom-6 left-4 right-4 bg-white/95 backdrop-blur-xl border border-white p-6 rounded-[24px] shadow-2xl transition-all duration-700 space-y-4 ${draftSettings.cookieBanner?.enabled ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                                            <p className="text-[10px] font-semibold text-[#1A2B3B]">{draftSettings.cookieBanner?.text}</p>
                                            <div className="space-y-2">
                                                <button className="w-full py-2 bg-[#1A2B3B] text-white rounded-xl text-[9px] font-black uppercase tracking-widest">{(draftSettings.cookieBanner?.allLabel || 'Accept All').replace(/\\'/g, "'")}</button>
                                                {draftSettings.cookieBanner?.showNecessary && (
                                                    <button className="w-full py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest">{(draftSettings.cookieBanner?.necessaryLabel || 'Necessary Only').replace(/\\'/g, "'")}</button>
                                                )}
                                                {draftSettings.cookieBanner?.showPreferences && (
                                                    <button className="w-full py-1.5 text-[9px] font-black uppercase tracking-widest text-primary underline underline-offset-4">{(draftSettings.cookieBanner?.preferencesLabel || 'Manage Preferences').replace(/\\'/g, "'")}</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'progress' && (
                            <div className="flex h-full animate-fade-in-down">
                                <div className="w-1/2 p-12 space-y-12 border-r border-gray-50">
                                    <div className="flex items-center justify-between p-8 bg-orange-50 border-2 border-orange-100 rounded-[32px] shadow-sm">
                                        <div><h4 className="font-black text-[#1A2B3B] text-lg">Funnel Momentum</h4><p className="text-[10px] uppercase font-black text-orange-600 mt-1">Interactive Progress Tracker</p></div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={draftSettings.progressBar || false} onChange={(e) => setDraftSettings({ ...draftSettings, progressBar: e.target.checked })} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                        </label>
                                    </div>
                                    <div className="p-8 bg-blue-50 border-2 border-blue-100 rounded-[32px] flex gap-4">
                                        <InfoIcon className="text-blue-600 shrink-0" /><p className="text-sm text-blue-800/70 leading-relaxed font-medium">Visual progress bars increase completion rates by reducing psychological load during long quizzes.</p>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-50 flex items-center justify-center p-12">
                                    <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-10 space-y-6">
                                        {draftSettings.progressBar ? (
                                            <div className="space-y-3 animate-fade-in-down">
                                                <div className="flex justify-between text-[10px] font-black text-primary uppercase"><span>Progress</span><span>75%</span></div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-primary w-3/4"></div></div>
                                            </div>
                                        ) : <div className="py-12 text-center text-muted-foreground font-black text-sm uppercase opacity-30">Bar Disabled</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tracking' && (
                            <div className="p-12 space-y-10 animate-fade-in-down">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2"><Code size={14}/> Header Scripts (HEAD)</label>
                                        <p className="text-[10px] text-muted-foreground px-1">Inject code into the &lt;head&gt; section (Meta Pixel, GTM, etc.)</p>
                                        <textarea rows={12} value={draftSettings.trackingHead || ''} onChange={(e) => setDraftSettings({ ...draftSettings, trackingHead: e.target.value })} className="w-full p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl text-emerald-400 font-mono text-xs focus:border-primary outline-none transition-all shadow-inner" placeholder="<!-- GTM-XXXXXXX -->" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2"><FileJson size={14}/> Footer Scripts (BODY)</label>
                                        <p className="text-[10px] text-muted-foreground px-1">Inject code before the closing &lt;/body&gt; tag</p>
                                        <textarea rows={12} value={draftSettings.trackingBody || ''} onChange={(e) => setDraftSettings({ ...draftSettings, trackingBody: e.target.value })} className="w-full p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl text-emerald-400 font-mono text-xs focus:border-primary outline-none transition-all shadow-inner" placeholder="<!-- Meta Pixel noscript -->" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'archive' && (
                            <div className="max-w-xl mx-auto p-12 space-y-12 animate-fade-in-down">
                                <div className="text-center space-y-5">
                                    <div className="w-28 h-28 bg-rose-50 text-rose-500 rounded-[40px] flex items-center justify-center mx-auto shadow-xl"><ShieldAlert size={56} /></div>
                                    <h3 className="text-[38px] font-black text-[#1A2B3B] tracking-tighter">Sunset Protocol</h3>
                                    <p className="text-muted-foreground font-medium text-lg leading-relaxed">Archiving will immediately deactivate all live instances of this funnel.</p>
                                </div>
                                <div className="p-10 bg-rose-50 border-2 border-rose-100 rounded-[40px]">
                                    {isArchiving ? (
                                        <div className="space-y-8 text-center animate-scale-in">
                                            <p className="text-xl font-bold text-rose-900">Confirm deep-freeze?</p>
                                            <button onClick={() => onArchive?.()} className="w-full py-5 bg-rose-50 text-white rounded-2xl font-black text-sm hover:bg-rose-600 shadow-xl active:scale-[0.98] flex items-center justify-center gap-3">Confirm Deactivation</button>
                                            <button onClick={() => setIsArchiving(false)} className="w-full py-4 text-rose-500 font-black text-xs uppercase tracking-widest">Abort Request</button>
                                        </div>
                                    ) : <button onClick={() => setIsArchiving(true)} className="w-full py-6 bg-white border-2 border-rose-200 text-rose-500 rounded-[24px] font-black text-lg hover:bg-rose-500 hover:text-white transition-all group flex items-center justify-center gap-4 shadow-sm"><Trash2 size={28} /> Archive Funnel</button>}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="h-24 border-t border-gray-100 flex items-center justify-between px-12 bg-white shrink-0 z-30">
                        <div className="flex items-center gap-3">
                            {isSaving ? (
                                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest animate-pulse"><Loader2 size={16} className="animate-spin" /> Syncing with Supabase...</div>
                            ) : isDirty ? (
                                <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-widest"><AlertCircle size={16} /> Unsaved changes detected</div>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest"><CheckCircle2 size={16} /> Settings Synchronized</div>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={onClose} className="px-8 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={!isDirty || isSaving} className={`px-10 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center gap-3 active:scale-[0.98] ${isDirty ? 'bg-primary text-white shadow-primary/20 hover:opacity-90' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}>{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;