import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlobalSidebar from '../components/GlobalSidebar';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
// Added missing RefreshCw import from lucide-react
import { 
    User, 
    CreditCard, 
    Shield, 
    Bell, 
    ChevronRight, 
    Lock, 
    Eye, 
    EyeOff, 
    Upload, 
    Plus, 
    Trash2, 
    Check,
    Key,
    Copy,
    X,
    MessageSquare,
    Download,
    Loader2,
    Zap,
    ExternalLink,
    Target,
    Globe,
    PiggyBank,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    Building2,
    Layout,
    Users,
    MessageCircle,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Rocket,
    ReceiptText,
    FileDown,
    History,
    Percent,
    Minus,
    Info,
    LayoutGrid,
    Split,
    Mail,
    Smartphone,
    Radar,
    Send,
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import { FunnelSettings, EmailNotificationSettings, EmailVerificationSettings } from '../types';
import { supabase } from '../services/supabaseClient';
import { openCustomerPortal, createCheckoutSession, getPriceId, fetchInvoices } from '../services/stripeService';
import { motion } from 'framer-motion';

type AccountTab = 'settings' | 'billing' | 'invoices' | 'notifications';

const PlanFinderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelectPlan: (plan: 'growth' | 'scale') => void;
    actionLoadingPlan: string | null;
    isDiscountActive: boolean;
    billingCycle: 'monthly' | 'yearly';
}> = ({ isOpen, onClose, onSelectPlan, actionLoadingPlan, isDiscountActive, billingCycle }) => {
    const [step, setStep] = useState(1);
    const [suggestion, setSuggestion] = useState<'growth' | 'scale' | null>(null);
    const [answers, setAnswers] = useState({
        leadGoal: '',
        clientLoad: '',
        brandFootprint: '',
        acquisitionHelp: '',
        qualityControl: ''
    });

    const isYearly = billingCycle === 'yearly';

    if (!isOpen) return null;

    const handleAnswer = (key: string, value: string) => {
        const nextAnswers = { ...answers, [key]: value };
        setAnswers(nextAnswers);
        
        if (step < 5) {
            setStep(step + 1);
        } else {
            const leadsTarget = parseInt(nextAnswers.leadGoal) || 0;
            const clientCount = parseInt(nextAnswers.clientLoad) || 0;
            const domainNeeds = parseInt(nextAnswers.brandFootprint) || 0;
            
            const isScaleSuggested = 
                leadsTarget > 5000 || 
                clientCount > 3 || 
                domainNeeds > 10 || 
                nextAnswers.acquisitionHelp === 'yes' || 
                nextAnswers.qualityControl === 'high';

            setSuggestion(isScaleSuggested ? 'scale' : 'growth');
            setStep(6);
        }
    };

    const reset = () => {
        setStep(1);
        setSuggestion(null);
        setAnswers({ leadGoal: '', clientLoad: '', brandFootprint: '', acquisitionHelp: '', qualityControl: '' });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-[#1a2b3b]/90 backdrop-blur-xl">
            <div className={`bg-white w-full ${step === 6 ? 'max-w-5xl' : 'max-w-lg'} rounded-[48px] shadow-2xl overflow-hidden animate-scale-in transition-all duration-500`}>
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1a2b3b]">Growth Strategy Map</h2>
                            {step < 6 && <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Outcome {step} of 5</p>}
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-muted/50 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-10">
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in-down">
                            <div className="text-center space-y-2">
                                <h3 className="text-3xl font-black text-[#1a2b3b] tracking-tight leading-tight">Scale Ambition</h3>
                                <p className="text-muted-foreground font-medium text-lg">How many leads do you aim to capture every month?</p>
                            </div>
                            <div className="grid gap-3">
                                {[
                                    { label: 'Under 5,000 monthly leads', value: '4000', desc: 'Standard business growth' },
                                    { label: '5,000 - 15,000 monthly leads', value: '10000', desc: 'High-volume agency operations' },
                                    { label: 'Above 15,000 leads', value: '25000', desc: 'Elite lead generation infrastructure' }
                                ].map((opt) => (
                                    <button key={opt.label} onClick={() => handleAnswer('leadGoal', opt.value)} className="w-full py-5 px-6 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-[#1a2b3b] hover:border-orange-500 hover:bg-orange-50 transition-all text-left flex justify-between items-center group">
                                        <div>
                                            <p className="text-base">{opt.label}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold group-hover:text-orange-600">{opt.desc}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in-down">
                            <div className="text-center space-y-2">
                                <h3 className="text-3xl font-black text-[#1a2b3b] tracking-tight leading-tight">Your Portfolio</h3>
                                <p className="text-muted-foreground font-medium text-lg">How many different clients or partners do you fulfill for?</p>
                            </div>
                            <div className="grid gap-3">
                                {[
                                    { label: '1 - 3 Key Partners', value: '3', desc: 'Focused agency delivery' },
                                    { label: '4 - 10 Active Clients', value: '10', desc: 'Growing agency infrastructure' },
                                    { label: 'Unlimited / Multi-Buyer Network', value: '99', desc: 'Large scale distribution needs' }
                                ].map((opt) => (
                                    <button key={opt.label} onClick={() => handleAnswer('clientLoad', opt.value)} className="w-full py-5 px-6 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-[#1a2b3b] hover:border-orange-500 hover:bg-orange-50 transition-all text-left flex justify-between items-center group">
                                        <div>
                                            <p className="text-base">{opt.label}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold group-hover:text-orange-600">{opt.desc}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in-down">
                            <div className="text-center space-y-2">
                                <h3 className="text-3xl font-black text-[#1a2b3b] tracking-tight leading-tight">Brand Presence</h3>
                                <p className="text-muted-foreground font-medium text-lg">How many unique brands or domains will you be running?</p>
                            </div>
                            <div className="grid gap-3">
                                {[
                                    { label: 'Fewer than 10 domains', value: '5', desc: 'Perfect for niche focus' },
                                    { label: '10 - 20 domains', value: '15', desc: 'Supporting multiple sub-niches' },
                                    { label: 'Above 20 domains', value: '25', desc: 'Enterprise white-label needs' }
                                ].map((opt) => (
                                    <button key={opt.label} onClick={() => handleAnswer('brandFootprint', opt.value)} className="w-full py-5 px-6 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-[#1a2b3b] hover:border-orange-500 hover:bg-orange-50 transition-all text-left flex justify-between items-center group">
                                        <div>
                                            <p className="text-base">{opt.label}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold group-hover:text-orange-600">{opt.desc}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {step === 4 && (
                        <div className="space-y-8 animate-fade-in-down">
                            <div className="text-center space-y-2">
                                <h3 className="text-3xl font-black text-[#1a2b3b] tracking-tight leading-tight">Revenue Growth</h3>
                                <p className="text-muted-foreground font-medium text-lg">Do you want automated tools to find new paying buyers for your leads?</p>
                            </div>
                            <div className="grid gap-3">
                                {[
                                    { label: 'Yes, help me find & pitch new clients', value: 'yes', desc: 'I want to scale my buyer network' },
                                    { label: 'No, my current buyers are enough', value: 'no', desc: 'Focusing on fulfillment quality' }
                                ].map((opt) => (
                                    <button key={opt.label} onClick={() => handleAnswer('acquisitionHelp', opt.value)} className="w-full py-5 px-6 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-[#1a2b3b] hover:border-orange-500 hover:bg-orange-50 transition-all text-left flex justify-between items-center group">
                                        <div>
                                            <p className="text-base">{opt.label}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold group-hover:text-orange-600">{opt.desc}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-8 animate-fade-in-down">
                            <div className="text-center space-y-2">
                                <h3 className="text-3xl font-black text-[#1a2b3b] tracking-tight leading-tight">Lead Integrity</h3>
                                <p className="text-muted-foreground font-medium text-lg">How strict do you need to be with identity validation (SMS & Email)?</p>
                            </div>
                            <div className="grid gap-3">
                                {[
                                    { label: 'Standard quality is fine', value: 'standard', desc: 'Standard data capture' },
                                    { label: 'Zero tolerance for fake leads', value: 'high', desc: 'I need to verify every single identity' }
                                ].map((opt) => (
                                    <button key={opt.label} onClick={() => handleAnswer('qualityControl', opt.value)} className="w-full py-5 px-6 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-[#1a2b3b] hover:border-orange-500 hover:bg-orange-50 transition-all text-left flex justify-between items-center group">
                                        <div>
                                            <p className="text-base">{opt.label}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold group-hover:text-orange-600">{opt.desc}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-10 animate-fade-in-down">
                            <div className="text-center space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 mx-auto">
                                    <CheckCircle2 size={12} /> Optimization Profile Synchronized
                                </div>
                                <h3 className="text-4xl font-black text-[#1a2b3b] tracking-tight">Your Recommended Fit.</h3>
                                <p className="text-muted-foreground font-medium text-lg">Based on your goals, this plan provides the best ROI for your agency.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className={`p-8 rounded-[36px] border-4 transition-all flex flex-col h-full relative ${suggestion === 'growth' ? 'border-orange-500 bg-orange-50/10 shadow-2xl scale-[1.02]' : 'border-gray-100 bg-white opacity-60'}`}>
                                    {suggestion === 'growth' && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Matches Your Profile</div>
                                    )}
                                    <div className="space-y-6 flex-1">
                                        <div className="space-y-1">
                                            <h4 className="text-2xl font-black text-[#1a2b3b]">Growth</h4>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Scaling Agency Hub</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-[#1a2b3b]">
                                                    ${isYearly ? (isDiscountActive ? '118' : '158') : (isDiscountActive ? '147' : '197')}
                                                </span>
                                                <span className="text-sm font-bold text-muted-foreground">/month</span>
                                            </div>
                                        </div>
                                        <ul className="space-y-3 pt-6 border-t border-gray-100">
                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 5,000 Total Monthly Leads</li>
                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 3 Client Workspaces</li>
                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 3 Free Team Seats ($29/extra)</li>
                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 10 Included Custom Domains</li>
                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Quiz & Landing Page Builder</li>
                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Live Client Reports</li>
                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 1,000 Email Verifications</li>
                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 500 Phone Verifications</li>
                                        </ul>
                                    </div>
                                    <button 
                                        onClick={() => onSelectPlan('growth')} 
                                        disabled={!!actionLoadingPlan}
                                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 mt-8 ${suggestion === 'growth' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'bg-[#1a2b3b] text-white hover:opacity-90'}`}
                                    >
                                        {actionLoadingPlan === 'growth' ? <Loader2 size={16} className="animate-spin" /> : (isDiscountActive ? 'Get Growth with 25% Off' : 'Select Growth')}
                                    </button>
                                </div>

                                <div className={`p-8 rounded-[36px] border-4 transition-all flex flex-col h-full relative ${suggestion === 'scale' ? 'border-orange-500 bg-orange-50/10 shadow-2xl scale-[1.02]' : 'border-gray-100 bg-white opacity-60'}`}>
                                    {suggestion === 'scale' && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Matches Your Profile</div>
                                    )}
                                    <div className="space-y-6 flex-1">
                                        <div className="space-y-1">
                                            <h4 className="text-2xl font-black text-[#1a2b3b]">Scale</h4>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Revenue Engine</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-[#1a2b3b]">
                                                    ${isYearly ? (isDiscountActive ? '238' : '318') : (isDiscountActive ? '297' : '397')}
                                                </span>
                                                <span className="text-sm font-bold text-muted-foreground">/month</span>
                                            </div>
                                        </div>
                                        <ul className="space-y-3 pt-6 border-t border-gray-100">
                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 15,000 Total Monthly Leads</li>
                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> Unlimited Workspaces</li>
                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 10 Free Team Seats ($19/extra)</li>
                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 20 Custom Domains</li>
                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> A/B Testing Engine</li>
                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> Find Buyer AI Engine</li>
                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> Email & Pitch Outreach machine</li>
                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 2,000 Email Verifications</li>
                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 1,000 Phone Verifications</li>
                                        </ul>
                                    </div>
                                    <button 
                                        onClick={() => onSelectPlan('scale')} 
                                        disabled={!!actionLoadingPlan}
                                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 mt-8 ${suggestion === 'scale' ? 'bg-orange-50 text-white shadow-xl shadow-orange-500/20' : 'bg-[#1a2b3b] text-white hover:opacity-90'}`}
                                    >
                                        {actionLoadingPlan === 'scale' ? <Loader2 size={16} className="animate-spin" /> : (isDiscountActive ? 'Get Scale with 25% Off' : 'Select Scale')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MyAccount: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AccountTab>('settings');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [workspace, setWorkspace] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionLoadingPlan, setActionLoadingPlan] = useState<string | null>(null);
    const [isPlanFinderOpen, setIsPlanFinderOpen] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
    const [invoiceError, setInvoiceError] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Notification states
    const [notifSettings, setNotifSettings] = useState({
        leads: true,
        usage: true,
        billing: true
    });

    const isYearly = billingCycle === 'yearly';
    
    useEffect(() => {
        if (location.state?.initialTab) setActiveTab(location.state.initialTab as AccountTab);
        fetchAccountData();
        
        const handleWsChange = () => fetchAccountData();
        window.addEventListener('workspaceChanged', handleWsChange);
        return () => window.removeEventListener('workspaceChanged', handleWsChange);
    }, [location.state]);

    useEffect(() => {
        if (activeTab === 'invoices' && workspace?.id) {
            loadInvoices();
        }
    }, [activeTab, workspace?.id]);

    const loadInvoices = async () => {
        setIsLoadingInvoices(true);
        setInvoiceError(null);
        try {
            const data = await fetchInvoices(workspace.id);
            setInvoices(data);
        } catch (err: any) {
            setInvoiceError(err.message || "Failed to establish connection with Stripe.");
        } finally {
            setIsLoadingInvoices(false);
        }
    };

    const fetchAccountData = async () => {
        setIsLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setUser(authUser);
                setFullName(authUser.user_metadata?.full_name || '');
                setEmail(authUser.email || '');
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
                setUserProfile(profile);
                if (profile?.notification_settings) {
                    setNotifSettings(profile.notification_settings);
                }
            }

            const workspaceId = localStorage.getItem('active_workspace_id');
            if (workspaceId) {
                const { data: ws } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
                setWorkspace(ws);
            }
        } catch (err) {
            console.error("Account load error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setIsActionLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });
            if (error) throw error;
            alert("Profile name updated successfully!");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!email || email === user?.email) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ email });
            if (error) throw error;
            alert("Email update initiated. Please check your new inbox for verification.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        setIsActionLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            alert("Password updated successfully!");
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const toggleNotification = async (key: keyof typeof notifSettings) => {
        const next = { ...notifSettings, [key]: !notifSettings[key] };
        setNotifSettings(next);
        try {
            await supabase.from('profiles').update({ notification_settings: next }).eq('id', user.id);
        } catch (err) {
            console.error("Failed to save notification settings", err);
        }
    };

    const isDiscountActive = useMemo(() => {
        return workspace?.metadata?.applied_discount === 'trial25';
    }, [workspace]);

    const handleUpgradePlan = async (plan: 'growth' | 'scale') => {
        if (!workspace?.id || !user?.id) return;
        setActionLoadingPlan(plan);
        try {
            const priceId = getPriceId(plan, billingCycle);
            await createCheckoutSession({
                priceId,
                workspaceId: workspace.id,
                user_id: user.id,
                successUrl: `${window.location.origin}/#/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/#/account`,
                applyDiscount: isDiscountActive,
                loadingMessage: 'Securing Session'
            });
        } catch (err: any) {
            alert(`Payment error: ${err.message}`);
        } finally {
            setActionLoadingPlan(null);
        }
    };

    const handleManageBilling = async () => {
        if (!workspace?.id) return;
        setIsActionLoading(true);
        try {
            await openCustomerPortal(workspace.id, window.location.href);
        } catch (err: any) {
            alert(err.message || "Failed to open billing portal.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const renderSidebarItem = (id: AccountTab, label: string, icon: React.ElementType) => {
        const Icon = icon;
        return (
            <button onClick={() => setActiveTab(id)} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${activeTab === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}>
                <div className="flex items-center gap-3"><Icon size={18} /><span className="text-sm font-bold">{label}</span></div>
            </button>
        );
    };

    const currentPlanName = (workspace?.plan_type || 'Free').toLowerCase();
    const isSubscribed = workspace?.subscription_status === 'active' || workspace?.subscription_status === 'trialing';

    return (
        <div className="flex min-h-screen bg-background font-sans">
            <GlobalSidebar activeTab="account" onTabChange={(id) => navigate(`/${id}`)} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <WorkspaceNavbar />
                <main className="flex-1 w-full mx-auto py-12 px-12 overflow-y-auto scrollbar-hide">
                    <div className="max-w-[1200px] mx-auto animate-fade-in-down">
                        <h1 className="text-[34px] font-black text-[#1a2b3b] mb-10 tracking-tight">Account Settings</h1>
                        <div className="flex flex-col lg:flex-row gap-12 items-start">
                            <div className="w-full lg:w-72 shrink-0 space-y-1.5">
                                {renderSidebarItem('settings', 'Profile Info', User)}
                                {renderSidebarItem('billing', 'Billing & Plans', CreditCard)}
                                {renderSidebarItem('invoices', 'Payments & Invoices', ReceiptText)}
                                {renderSidebarItem('notifications', 'Notifications', Bell)}
                            </div>
                            <div className="flex-1 w-full pb-20">
                                {activeTab === 'settings' && (
                                    <div className="space-y-10">
                                        <div className="bg-white border border-border rounded-[24px] p-10 shadow-sm space-y-12">
                                            <div className="space-y-6">
                                                <h3 className="text-2xl font-black text-[#1a2b3b]">Identity Details</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                                                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-5 py-4 bg-muted/20 border-2 border-border rounded-2xl outline-none focus:border-primary font-bold transition-all" />
                                                    </div>
                                                    <button onClick={handleUpdateProfile} disabled={isActionLoading || fullName === user?.user_metadata?.full_name} className="h-14 px-8 bg-[#1a2b3b] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-3">
                                                        {isActionLoading && <Loader2 size={16} className="animate-spin" />} Save Name
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-muted/20 border-2 border-border rounded-2xl outline-none focus:border-primary font-bold transition-all" />
                                                    </div>
                                                    <button onClick={handleUpdateEmail} disabled={isActionLoading || email === user?.email} className="h-14 px-8 bg-primary text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-3">
                                                        {isActionLoading && <Loader2 size={16} className="animate-spin" />} Update Email
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="h-px bg-border/50"></div>

                                            <div className="space-y-6">
                                                <h3 className="text-2xl font-black text-[#1a2b3b] flex items-center gap-3"><Shield className="text-orange-500" size={24} /> Account Security</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" className="w-full px-5 py-4 bg-muted/20 border-2 border-border rounded-2xl outline-none focus:border-primary font-bold" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</label>
                                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className="w-full px-5 py-4 bg-muted/20 border-2 border-border rounded-2xl outline-none focus:border-primary font-bold" />
                                                    </div>
                                                </div>
                                                <button onClick={handleUpdatePassword} disabled={isActionLoading || !newPassword} className="px-10 py-4 bg-[#1a2b3b] text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-3">
                                                    {isActionLoading && <Loader2 size={16} className="animate-spin" />} Change Password
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'billing' && (
                                    <div className="space-y-10">
                                        <div className="bg-white border border-border rounded-[32px] p-10 shadow-sm space-y-12">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                <div className="space-y-2">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isSubscribed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                        <Zap size={12} fill="currentColor" /> {isSubscribed ? 'Active Subscription' : 'Upgrade Required'}
                                                    </div>
                                                    <h2 className="text-5xl font-black text-[#1a2b3b] tracking-tighter capitalize">
                                                        {currentPlanName.includes('scale') ? 'Scale' : currentPlanName.includes('growth') ? 'Growth' : 'Free Plan'}
                                                    </h2>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {isSubscribed && (
                                                        <button 
                                                            onClick={handleManageBilling}
                                                            disabled={isActionLoading}
                                                            className="px-10 py-5 bg-[#1a2b3b] text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-black/10 active:scale-[0.98] disabled:opacity-50"
                                                        >
                                                            {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                                                            Manage Billing <ArrowUpRight size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-center space-y-6">
                                                <div className="flex items-center justify-center gap-6 py-2">
                                                    <span className={`text-lg font-black transition-colors ${!isYearly ? 'text-orange-500' : 'text-gray-400'}`}>Monthly</span>
                                                    <button 
                                                        onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}
                                                        className={`w-20 h-10 rounded-full relative transition-all duration-300 p-1 ${isYearly ? 'bg-orange-500' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`w-8 h-8 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isYearly ? 'translate-x-10' : 'translate-x-0'}`} />
                                                    </button>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-lg font-black transition-colors ${isYearly ? 'text-orange-500' : 'text-gray-400'}`}>Yearly</span>
                                                        <div className={`px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase rounded-lg transition-all duration-500 transform ${isYearly ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}>
                                                            Save 20%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-down">
                                                <div className={`bg-white border-2 rounded-[32px] p-8 flex flex-col hover:shadow-2xl transition-all duration-500 group relative ${currentPlanName.includes('growth') ? 'border-orange-500 ring-2 ring-orange-100' : 'border-border hover:border-primary/50'}`}>
                                                    <div className="space-y-4 flex-1">
                                                        <h4 className="text-2xl font-black text-[#1a2b3b]">Growth</h4>
                                                        <div className="pt-4 space-y-1">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-4xl font-black text-[#1a2b3b]">
                                                                    ${isYearly ? (isDiscountActive ? '118' : '158') : (isDiscountActive ? '147' : '197')}
                                                                </span>
                                                                <span className="text-sm font-bold text-muted-foreground uppercase">/mo</span>
                                                            </div>
                                                        </div>
                                                        <ul className="space-y-3 pt-6 border-t border-border/60">
                                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 5,000 Total Monthly Leads</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 3 Client Workspaces</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 3 Free Team Seats ($29/extra)</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 10 Included Custom Domains</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Quiz & Landing Page Builder</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Live Client Reports</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 1,000 Email Verifications</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> 500 Phone Verifications</li>
                                                        </ul>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleUpgradePlan('growth')}
                                                        disabled={currentPlanName.includes('growth') || (!!actionLoadingPlan && actionLoadingPlan !== 'growth')}
                                                        className={`w-full mt-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                                                            currentPlanName.includes('growth') ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed border border-emerald-100' : 'bg-[#1a2b3b] text-white hover:opacity-90'
                                                        }`}
                                                    >
                                                        {actionLoadingPlan === 'growth' ? <Loader2 size={14} className="animate-spin" /> : null}
                                                        {currentPlanName.includes('growth') ? 'Current Plan' : 'Get Growth'}
                                                    </button>
                                                </div>

                                                <div className={`bg-white border-4 rounded-[32px] p-8 flex flex-col shadow-xl transition-all duration-500 group relative transform hover:-translate-y-1 ${currentPlanName.includes('scale') ? 'border-orange-500 ring-4 ring-orange-50' : 'border-primary shadow-primary/10 hover:shadow-2xl'}`}>
                                                    <div className="space-y-4 flex-1">
                                                        <h4 className="text-2xl font-black text-[#1a2b3b]">Scale</h4>
                                                        <div className="pt-4 space-y-1">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-4xl font-black text-[#1a2b3b]">
                                                                    ${isYearly ? (isDiscountActive ? '238' : '318') : (isDiscountActive ? '297' : '397')}
                                                                </span>
                                                                <span className="text-sm font-bold text-muted-foreground uppercase">/mo</span>
                                                            </div>
                                                        </div>
                                                        <ul className="space-y-3 pt-6 border-t border-border/60">
                                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 15,000 Total Monthly Leads</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> Unlimited Workspaces</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 10 Free Team Seats ($19/extra)</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 20 Custom Domains</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> A/B Testing Engine</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> Find Buyer AI Engine</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> Email & Pitch Outreach machine</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 2,000 Email Verifications</li>
                                                            <li className="flex items-center gap-3 text-[11px] font-black text-orange-600"><Zap size={14} fill="currentColor" className="shrink-0" /> 1,000 Phone Verifications</li>
                                                        </ul>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleUpgradePlan('scale')}
                                                        disabled={currentPlanName.includes('scale') || (!!actionLoadingPlan && actionLoadingPlan !== 'scale')}
                                                        className={`w-full mt-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                                                            currentPlanName.includes('scale') ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed border border-emerald-100' : 'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20'
                                                        }`}
                                                    >
                                                        {actionLoadingPlan === 'scale' ? <Loader2 size={14} className="animate-spin" /> : null}
                                                        {currentPlanName.includes('scale') ? 'Current Plan' : 'Upgrade to Scale'}
                                                    </button>
                                                </div>

                                                <div className="bg-muted/30 border-2 border-dashed border-border rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-6 group hover:bg-white hover:border-primary/40 transition-all cursor-pointer" onClick={() => setIsPlanFinderOpen(true)}>
                                                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-orange-500 shadow-sm group-hover:scale-110 transition-transform">
                                                        <Sparkles size={32} />
                                                    </div>
                                                    <h4 className="text-xl font-black text-[#1a2b3b]">Not sure?</h4>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary border-b-2 border-primary/20 group-hover:border-primary transition-colors pb-1">Run Analyzer</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'invoices' && (
                                    <div className="bg-white border border-border rounded-[24px] p-10 shadow-sm space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black text-[#1a2b3b]">Invoice History</h3>
                                            <button onClick={loadInvoices} disabled={isLoadingInvoices} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                <RefreshCw size={20} className={isLoadingInvoices ? 'animate-spin' : ''} />
                                            </button>
                                        </div>

                                        {isLoadingInvoices ? (
                                            <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={32} /></div>
                                        ) : invoiceError ? (
                                            <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 space-y-2">
                                                <AlertCircle size={32} className="mx-auto" />
                                                <p className="font-bold">{invoiceError}</p>
                                            </div>
                                        ) : invoices.length === 0 ? (
                                            <div className="py-20 text-center opacity-30 font-black uppercase tracking-widest border-2 border-dashed border-border rounded-[32px]">No invoices found</div>
                                        ) : (
                                            <div className="overflow-hidden border border-border rounded-2xl">
                                                <table className="w-full text-left">
                                                    <thead className="bg-muted/30 border-b border-border">
                                                        <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                            <th className="px-6 py-4">Date</th>
                                                            <th className="px-6 py-4">Amount</th>
                                                            <th className="px-6 py-4">Status</th>
                                                            <th className="px-6 py-4 text-right">Receipt</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/50">
                                                        {invoices.map((inv) => (
                                                            <tr key={inv.id} className="text-sm">
                                                                <td className="px-6 py-4 font-medium">{new Date(inv.created * 1000).toLocaleDateString()}</td>
                                                                <td className="px-6 py-4 font-bold">${(inv.amount_paid / 100).toFixed(2)}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                        {inv.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <a href={inv.invoice_pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline font-bold text-xs">
                                                                        <FileDown size={14} /> PDF
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="bg-white border border-border rounded-[24px] p-10 shadow-sm space-y-10">
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-[#1a2b3b]">Notification Hub</h3>
                                            <p className="text-muted-foreground font-medium">Toggle alerts for lead capture, usage thresholds, and billing events.</p>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Leads Alert */}
                                            <div className="flex items-center justify-between p-6 bg-slate-50 border border-border rounded-[24px] group transition-all hover:border-primary/20">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                                                        <Users size={24} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-base font-black text-[#1a2b3b] uppercase tracking-tight">Lead Capture Alerts</h4>
                                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-sm">Receive instant notifications whenever a new qualified lead enters your pipeline through any funnel.</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                                                    <input type="checkbox" checked={notifSettings.leads} onChange={() => toggleNotification('leads')} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                                </label>
                                            </div>

                                            {/* Usage Alert */}
                                            <div className="flex items-center justify-between p-6 bg-slate-50 border border-border rounded-[24px] group transition-all hover:border-primary/20">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                                                        <Zap size={24} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-base font-black text-[#1a2b3b] uppercase tracking-tight">Usage & Credit Alerts</h4>
                                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-sm">Get notified when you reach 80% and 100% of your email or phone verification credits to prevent stream interruption.</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                                                    <input type="checkbox" checked={notifSettings.usage} onChange={() => toggleNotification('usage')} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                                </label>
                                            </div>

                                            {/* Billing Alert */}
                                            <div className="flex items-center justify-between p-6 bg-slate-50 border border-border rounded-[24px] group transition-all hover:border-primary/20">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                                                        <ReceiptText size={24} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-base font-black text-[#1a2b3b] uppercase tracking-tight">Billing & Plan Events</h4>
                                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-sm">Receive confirmation for successful payments, failed transaction alerts, and reminders about plan renewals or expirations.</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                                                    <input type="checkbox" checked={notifSettings.billing} onChange={() => toggleNotification('billing')} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <PlanFinderModal isOpen={isPlanFinderOpen} onClose={() => setIsPlanFinderOpen(false)} actionLoadingPlan={actionLoadingPlan} isDiscountActive={isDiscountActive} billingCycle={billingCycle} onSelectPlan={handleUpgradePlan} />
        </div>
    );
};

export default MyAccount;
