import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalSidebar from '../components/GlobalSidebar';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import PlanGuard from '../components/PlanGuard';
import UpgradeModal from '../components/UpgradeModal';
import { 
    Send, 
    Search, 
    X, 
    CheckCircle2, 
    Loader2, 
    Sparkles, 
    ChevronRight,
    ChevronDown, 
    ArrowRight,
    Smile, 
    Trash2,
    Image as ImageIcon,
    Settings,
    Users,
    Bold,
    Italic,
    Link as LinkIcon,
    AlertCircle,
    Check,
    UserCircle,
    Minimize2,
    Mail,
    Rocket,
    Radar,
    Zap,
    Globe,
    Edit3,
    Tag,
    Lock
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { sendOutboundEmail } from '../services/emailService';
import { Funnel } from '../types';

interface LeadBuyer {
    id: string;
    name: string;
    email: string;
    notes: string;
    location?: string;
    niche?: string;
}

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

const EMOJIS = ['👋', '🚀', '📈', '💰', '🎯', '🤝', '✨', '🔥', '📊', '✅'];

const EMAIL_TEMPLATES = [
    {
        id: 'approach',
        name: 'The Data Approach',
        subject: 'Real-time {{niche}} leads for {{business_name}}?',
        body: `Hi {{client_name}},\n\nI was looking into the {{niche}} market in {{location}} and noticed {{business_name}} is some great work.\n\nMy agency is currently generating a high volume of qualified leads in your area, and we're looking for a local partner who has the capacity to handle 10-15 new inquiries per week.\n\nHere is a preview of the funnel we use: {{funnel_link}}\n\nWould you be open to seeing a sample of the data we're capturing?\n\nBest,\n{{sender_name}}`
    },
    {
        id: 'partnership',
        name: 'Partnership Inquiry',
        subject: 'Partnership: Scaling {{business_name}}',
        body: `Hello {{client_name}},\n\nI'm reaching out from {{agency_name}}. We've recently launched a high-performance funnel for the {{niche}} industry.\n\nBased on your profile, I believe our lead quality matches the standard of service {{business_name}} provides. I'd love to chat about how we can automate your lead flow.\n\nYou can see our process here: {{funnel_link}}\n\nAre you available for a brief call next Tuesday?\n\nCheers,\n{{sender_name}}`
    }
];

const AVAILABLE_VARIABLES = [
    { key: 'client_name', label: 'Client first name' },
    { key: 'business_name', label: 'Company name' },
    { key: 'niche', label: 'Industry/niche' },
    { key: 'location', label: 'City/area' },
    { key: 'agency_name', label: 'Your agency' },
    { key: 'sender_name', label: 'Your name' },
    { key: 'funnel_link', label: 'Funnel preview', isSpecial: true },
];

const Outbound: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeStep, setActiveStep] = useState<number>(1);
    
    // Data States
    const [buyers, setBuyers] = useState<LeadBuyer[]>([]);
    const [workspace, setWorkspace] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
    const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sendingMode, setSendingMode] = useState<'shared' | 'custom'>('shared');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    
    // Toasts
    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => typeof id === 'string' && removeToast(id), 5000);
    };
    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    // Composer States
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showBlueprintDropdown, setShowBlueprintDropdown] = useState(false);
    const [isEditingSender, setIsEditingSender] = useState(false);
    const [overrideSenderName, setOverrideSenderName] = useState('');
    const [overrideSenderEmail, setOverrideSenderEmail] = useState('');
    
    // Feature Modals & Popovers
    const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
    const [linkPopover, setLinkPopover] = useState<{ x: number, y: number, text: string } | null>(null);
    const [selectionRects, setSelectionRects] = useState<DOMRect[]>([]);
    const [imageSettings, setImageSettings] = useState<{ x: number, y: number, target: HTMLImageElement } | null>(null);
    
    const composerRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const blueprintDropdownRef = useRef<HTMLDivElement>(null);
    const savedSelectionRange = useRef<Range | null>(null);

    const isScalePlan = useMemo(() => {
        return workspace?.plan_type?.toLowerCase().includes('scale');
    }, [workspace]);

    const isPaidPlan = useMemo(() => {
        const plan = workspace?.plan_type?.toLowerCase() || '';
        return plan.includes('growth') || plan.includes('scale');
    }, [workspace]);

    // Persistence Logic: Load Draft
    useEffect(() => {
        const workspaceId = localStorage.getItem('active_workspace_id');
        if (workspaceId) {
            const savedDraft = localStorage.getItem(`outbound_draft_${workspaceId}`);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setSubject(parsed.subject || '');
                    setBodyHtml(parsed.bodyHtml || '');
                    setSelectedBuyerId(parsed.selectedBuyerId || '');
                    setSelectedFunnelId(parsed.selectedFunnelId || '');
                    setSelectedTemplateId(parsed.selectedTemplateId || '');
                    setActiveStep(parsed.activeStep || 1);
                    
                    setTimeout(() => {
                        if (composerRef.current) {
                            composerRef.current.innerHTML = parsed.bodyHtml || '';
                        }
                    }, 0);
                } catch (e) {
                    console.error("Draft recovery failed", e);
                }
            }
        }
    }, []);

    // Persistence Logic: Save Draft
    useEffect(() => {
        const workspaceId = localStorage.getItem('active_workspace_id');
        if (workspaceId && !isSuccess) {
            const draft = {
                subject,
                bodyHtml,
                selectedBuyerId,
                selectedFunnelId,
                selectedTemplateId,
                activeStep,
                updatedAt: Date.now()
            };
            localStorage.setItem(`outbound_draft_${workspaceId}`, JSON.stringify(draft));
        }
    }, [subject, bodyHtml, selectedBuyerId, selectedFunnelId, selectedTemplateId, activeStep, isSuccess]);

    useEffect(() => {
        fetchInitialData();
        const handleGlobalClick = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.link-popover') && !(e.target as HTMLElement).closest('.composer-area')) {
                setLinkPopover(null);
                setSelectionRects([]);
            }
            if (!(e.target as HTMLElement).closest('.image-settings') && (e.target as HTMLElement).tagName !== 'IMG') {
                setImageSettings(null);
            }
            if (blueprintDropdownRef.current && !blueprintDropdownRef.current.contains(e.target as Node)) {
                setShowBlueprintDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleGlobalClick);
        return () => document.removeEventListener('mousedown', handleGlobalClick);
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);

            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) return;

            const { data: ws } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
            setWorkspace(ws);
            setOverrideSenderName(ws.metadata?.sender_name || authUser?.user_metadata?.full_name || 'Agency Partner');
            setOverrideSenderEmail(ws.metadata?.sender_email || 'outreach@wisefunnel.io');
            setSendingMode(ws.metadata?.sending_mode || 'shared');

            const { data: buyersData } = await supabase.from('lead_buyers').select('*').eq('workspace_id', workspaceId);
            setBuyers(buyersData || []);

            const { data: funnelsData } = await supabase.from('funnels').select('*').eq('workspace_id', workspaceId).eq('status', 'live');
            setFunnels(funnelsData || []);

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 0);
        }
    };

    const getVarValue = (key: string) => {
        const buyer = buyers.find(b => b.id === selectedBuyerId);
        const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);
        
        const rawLocation = buyer?.location || workspace?.metadata?.location || '';
        const locationParts = rawLocation ? rawLocation.split(',').map((p: any) => p.trim()) : [];
        const cityOnly = locationParts.length >= 2 ? locationParts[locationParts.length - 2] : (locationParts[0] || 'your local area');

        const map: Record<string, string> = {
            niche: buyer?.niche || workspace?.metadata?.primary_niche || 'Digital Marketing',
            business_name: buyer?.name || 'Your Company',
            client_name: buyer?.name?.split(' ')[0] || 'Partner',
            location: cityOnly,
            sender_name: overrideSenderName || workspace?.metadata?.sender_name || user?.user_metadata?.full_name || 'Agency Partner',
            agency_name: workspace?.name || 'Our Agency',
            funnel_link: selectedFunnel ? selectedFunnel.name : '{{Select funnel}}',
        };
        return map[key] || `{{${key}}}`;
    };

    // SYNC EFFECT: Updates placeholders in the composer HTML without overwriting manual edits
    useEffect(() => {
        if (!composerRef.current) return;
        const vars = composerRef.current.querySelectorAll('span[data-var]');
        vars.forEach(span => {
            const key = span.getAttribute('data-var');
            if (key) {
                const newVal = getVarValue(key);
                if (span.textContent !== newVal) {
                    span.textContent = newVal;
                    
                    // Special handling for funnel link visual state
                    if (key === 'funnel_link') {
                        const isPlaceholder = newVal === '{{Select funnel}}';
                        span.className = isPlaceholder 
                            ? 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse px-2 py-0.5 rounded-lg font-black border inline-block mx-0.5 transition-all var-highlight-target'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-sm px-2 py-0.5 rounded-lg font-black border inline-block mx-0.5 transition-all var-highlight-target';
                        
                        const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);
                        const funnelLinkUrl = selectedFunnel 
                            ? `https://wisefunnel.io/#/funnel/${selectedFunnel.id}/${selectedFunnel.slug || 'live'}` 
                            : '';
                        span.setAttribute('data-url', funnelLinkUrl);
                    }
                }
            }
        });

        // Update subject line dynamically too
        if (selectedTemplateId) {
            const template = EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId);
            if (template) {
                let newSubject = template.subject;
                AVAILABLE_VARIABLES.forEach(v => {
                    const regex = new RegExp(`{{${v.key}}}`, 'g');
                    newSubject = newSubject.replace(regex, getVarValue(v.key));
                });
                setSubject(newSubject);
            }
        }
        
        setBodyHtml(composerRef.current.innerHTML);
    }, [selectedBuyerId, selectedFunnelId, overrideSenderName, workspace, funnels]);

    const applyTemplate = (templateId: string) => {
        const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
        const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);
        
        if (!template || !workspace) return;

        let newSubject = template.subject;
        let newBody = template.body;

        const funnelLinkUrl = selectedFunnel 
            ? `https://wisefunnel.io/#/funnel/${selectedFunnel.id}/${selectedFunnel.slug || 'live'}` 
            : '';

        const highlight = (key: string) => {
            const val = getVarValue(key);
            const isLinkVar = key === 'funnel_link';
            const isPlaceholder = val === '{{Select funnel}}';
            const colorClass = isLinkVar 
                ? (isPlaceholder ? 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse' : 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-sm')
                : 'text-orange-600 bg-orange-50 border-orange-100';
            
            const interactiveClass = isLinkVar ? 'cursor-pointer hover:shadow-md' : 'cursor-text';
            
            return `<span data-var="${key}" ${isLinkVar ? `data-url="${funnelLinkUrl}"` : ''} class="${colorClass} ${interactiveClass} px-2 py-0.5 rounded-lg font-black border inline-block mx-0.5 transition-all var-highlight-target" contenteditable="false">${val}</span>`;
        };

        AVAILABLE_VARIABLES.forEach(v => {
            const regex = new RegExp(`{{${v.key}}}`, 'g');
            newSubject = newSubject.replace(regex, getVarValue(v.key));
            newBody = newBody.replace(regex, highlight(v.key));
        });

        setSubject(newSubject);
        const finalHtml = newBody.replace(/\n/g, '<br>');
        setBodyHtml(finalHtml);

        if (composerRef.current) {
            composerRef.current.innerHTML = finalHtml;
        }
    };

    const handleComposerClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const varSpan = target.closest('span[data-var="funnel_link"]');
        if (varSpan) {
            setIsFunnelModalOpen(true);
            return;
        }

        if (target.tagName === 'IMG') {
            const rect = target.getBoundingClientRect();
            setImageSettings({ x: rect.left, y: rect.bottom + 8, target: target as HTMLImageElement });
        }
    };

    const saveRange = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedSelectionRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const handleTextSelection = () => {
        const selection = window.getSelection();
        saveRange();
        if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const boundingBox = range.getBoundingClientRect();
            const rects = Array.from(range.getClientRects());
            setSelectionRects(rects);
            setLinkPopover({ 
                x: boundingBox.left, 
                y: boundingBox.bottom + 8, 
                text: selection.toString() 
            });
        } else {
            setLinkPopover(null);
            setSelectionRects([]);
        }
    };

    const insertVariable = (key: string) => {
        if (!composerRef.current) return;
        
        composerRef.current.focus();
        
        const val = getVarValue(key);
        const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);
        const funnelLinkUrl = selectedFunnel 
            ? `https://wisefunnel.io/#/funnel/${selectedFunnel.id}/${selectedFunnel.slug || 'live'}` 
            : '';

        const isLinkVar = key === 'funnel_link';
        const isPlaceholder = val === '{{Select funnel}}';
        const colorClass = isLinkVar 
            ? (isPlaceholder ? 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse' : 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-sm')
            : 'text-orange-600 bg-orange-50 border-orange-100';
        
        const interactiveClass = isLinkVar ? 'cursor-pointer hover:shadow-md' : 'cursor-text';
        const html = `<span data-var="${key}" ${isLinkVar ? `data-url="${funnelLinkUrl}"` : ''} class="${colorClass} ${interactiveClass} px-2 py-0.5 rounded-lg font-black border inline-block mx-0.5 transition-all var-highlight-target" contenteditable="false">${val}</span>`;

        const sel = window.getSelection();
        if (sel && savedSelectionRange.current) {
            sel.removeAllRanges();
            sel.addRange(savedSelectionRange.current);
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const el = document.createElement("div");
            el.innerHTML = html;
            const node = el.firstChild;
            if (node) {
                range.insertNode(node);
                range.setStartAfter(node);
                range.setEndAfter(node);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else {
            composerRef.current.innerHTML += html;
        }
        
        setBodyHtml(composerRef.current.innerHTML);
        saveRange();
    };

    const exec = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (composerRef.current) setBodyHtml(composerRef.current.innerHTML);
    };

    const handleCreateLink = (url: string) => {
        if (!savedSelectionRange.current || !url) {
            setLinkPopover(null);
            setSelectionRects([]);
            return;
        }
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedSelectionRange.current);
        const href = url.startsWith('http') ? url : `https://${url}`;
        const linkHtml = `<a href="${href}" title="Go to: ${href}" style="color: #2563eb; text-decoration: underline; font-weight: 600; cursor: pointer;">${savedSelectionRange.current.toString()}</a>`;
        document.execCommand('insertHTML', false, linkHtml);
        setLinkPopover(null);
        setSelectionRects([]);
        if (composerRef.current) setBodyHtml(composerRef.current.innerHTML);
    };

    const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                addToast("Image is too large (max 1MB).", "error");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = `<img src="${event.target?.result}" style="max-width: 100%; width: 300px; border-radius: 12px; margin: 12px 0; display: block;" />`;
                exec('insertHTML', img);
            };
            reader.readAsDataURL(file);
        }
    };

    const updateImageSize = (size: 'S' | 'M' | 'L') => {
        if (!imageSettings) return;
        const widths = { S: '150px', M: '300px', L: '100%' };
        imageSettings.target.style.width = widths[size];
        setImageSettings(null);
        if (composerRef.current) setBodyHtml(composerRef.current.innerHTML);
    };

    const handleFunnelSelect = (funnelId: string) => {
        setSelectedFunnelId(funnelId);
        setIsFunnelModalOpen(false);
        addToast("Tracking funnel synchronized.", "success");
    };

    const isFunnelMissing = useMemo(() => {
        if (!composerRef.current) return false;
        return composerRef.current.innerHTML.includes('{{Select funnel}}');
    }, [bodyHtml, selectedFunnelId]);

    const validateSend = () => {
        if (!isScalePlan) {
            setShowUpgradeModal(true);
            return false;
        }
        if (!selectedBuyerId) {
            addToast("Please select a partner from the left to receive this email.", "error");
            setActiveStep(1);
            return false;
        }
        if (isFunnelMissing) {
            addToast("A tracking funnel is required in your email content. Please select one in Step 3.", "error");
            setActiveStep(3);
            return false;
        }
        if (!subject.trim()) {
            addToast("Your email needs a subject line before dispatching.", "error");
            return false;
        }
        if (!composerRef.current || !composerRef.current.textContent?.trim()) {
            addToast("You cannot send an empty email. Select a blueprint or start typing.", "error");
            return false;
        }
        return true;
    };

    const handleSend = async () => {
        if (!validateSend()) return;

        const buyer = buyers.find(b => b.id === selectedBuyerId);
        if (!buyer || !workspace || !composerRef.current) return;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = composerRef.current.innerHTML;

        tempDiv.querySelectorAll('span[data-var="funnel_link"]').forEach(span => {
            const url = span.getAttribute('data-url');
            if (url) {
                const a = document.createElement('a');
                a.href = url;
                a.textContent = span.textContent;
                a.style.color = '#047857';
                a.style.fontWeight = 'bold';
                a.style.textDecoration = 'underline';
                span.replaceWith(a);
            } else {
                span.replaceWith(span.textContent || '');
            }
        });

        tempDiv.querySelectorAll('span[data-var]').forEach(span => {
            const txt = span.textContent;
            span.replaceWith(txt || '');
        });

        const finalHtml = tempDiv.innerHTML;

        setIsSending(true);
        try {
            await sendOutboundEmail({
                workspaceId: workspace.id,
                to: buyer.email,
                fromName: overrideSenderName || workspace.metadata?.sender_name || user?.user_metadata?.full_name || 'Agency Partner',
                fromEmail: overrideSenderEmail || workspace.metadata?.sender_email || 'outreach@wisefunnel.io',
                subject,
                html: `<div style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #1a2b3b; max-width: 600px;">${finalHtml}</div>`
            });
            setIsSuccess(true);
            
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (workspaceId) localStorage.removeItem(`outbound_draft_${workspaceId}`);

            setTimeout(() => {
                setIsSuccess(false);
                setSubject('');
                setBodyHtml('');
                if (composerRef.current) composerRef.current.innerHTML = '';
                setSelectedBuyerId('');
                setSelectedTemplateId('');
                setSelectedFunnelId('');
                setActiveStep(1);
            }, 3000);
        } catch (err) {
            addToast("Email dispatch failed. Please check your connectivity.", "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleToggleSendingMode = async (mode: 'shared' | 'custom') => {
        if (mode === 'custom' && !isPaidPlan) {
            setShowUpgradeModal(true);
            return;
        }

        setSendingMode(mode);
        const workspaceId = localStorage.getItem('active_workspace_id');
        if (workspaceId && workspace) {
            try {
                await supabase.from('workspaces').update({
                    metadata: {
                        ...(workspace.metadata || {}),
                        sending_mode: mode
                    }
                }).eq('id', workspaceId);
                
                addToast(`Sending mode updated to ${mode === 'custom' ? 'Custom Domain' : 'Shared Domain'}.`, 'success');
            } catch (err) {
                console.error("Failed to sync mode:", err);
            }
        }
    };

    const filteredBuyers = useMemo(() => {
        return buyers.filter(b => 
            b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            b.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [buyers, searchTerm]);

    const stepsProgress = useMemo(() => {
        return [
            { id: 1, label: 'Lead Buyer', isDone: !!selectedBuyerId, isError: false },
            { id: 2, label: 'Template', isDone: !!selectedTemplateId, isError: false },
            { id: 3, label: 'Variables', isDone: !!bodyHtml && !isFunnelMissing, isError: isFunnelMissing },
            { id: 4, label: 'Sender', isDone: !!workspace?.metadata?.sender_name && !!workspace?.metadata?.sender_email, isError: false },
            { id: 5, label: 'Deploy', isDone: false, isError: false }
        ];
    }, [selectedBuyerId, selectedTemplateId, bodyHtml, isFunnelMissing, workspace]);

    return (
        <div className="flex min-h-screen bg-background font-sans selection:bg-orange-100 overflow-hidden relative">
            <GlobalSidebar 
                activeTab="outbound" 
                onTabChange={(id) => navigate(`/${id}`)} 
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <WorkspaceNavbar />
                
                <PlanGuard>
                    <main className="flex-1 w-full mx-auto px-12 pt-10 pb-32 overflow-y-auto scrollbar-hide">
                        <div className="max-w-[1400px] mx-auto space-y-8 relative">
                            
                            <div className="animate-fade-in-down">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="space-y-1">
                                        <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight">Send The Winning Pitch</h1>
                                        <p className="text-muted-foreground font-medium">Land the deal in one click. Reach out to your selected prospects with high-impact outreach that gets you the "Yes."</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 py-2 border-y border-border/50 overflow-x-auto scrollbar-hide">
                                    {stepsProgress.map((step) => {
                                        const isActive = activeStep === step.id;
                                        const isDone = step.isDone && !isActive;
                                        const isError = step.isError;

                                        return (
                                            <button 
                                                key={step.id}
                                                onClick={() => setActiveStep(step.id)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2 shrink-0 ${
                                                    isError 
                                                        ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-lg' 
                                                        : isActive 
                                                            ? 'bg-primary border-primary text-white shadow-lg' 
                                                            : isDone
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                : 'bg-white border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${
                                                    isError 
                                                        ? 'bg-rose-500 text-white border-rose-500' 
                                                        : isActive 
                                                            ? 'bg-white text-primary border-white' 
                                                            : isDone 
                                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                                : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {isError ? <AlertCircle size={10} strokeWidth={4} /> : isDone ? <Check size={10} strokeWidth={4} /> : step.id}
                                                </div>
                                                {step.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[650px] animate-fade-in-down delay-75 mb-10">
                                
                                <div className={`lg:col-span-4 flex flex-col bg-white border rounded-[32px] overflow-hidden shadow-sm transition-all duration-500 ${activeStep === 1 ? 'border-primary ring-4 ring-primary/10 scale-[1.01] shadow-2xl z-20' : 'border-border'}`}>
                                    <div className="p-6 border-b border-border bg-muted/20">
                                        <div className="relative">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input 
                                                type="text" 
                                                placeholder="Search partners..." 
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-border/50 min-h-[400px]">
                                        {buyers.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6">
                                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                                                    <Users size={32} />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-black text-[#1a2b3b]">Network is Empty</p>
                                                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">You haven't added any lead buyers to your agency network yet.</p>
                                                </div>
                                                <button 
                                                    onClick={() => navigate('/client-finder')}
                                                    className="w-full py-4 bg-[#1a2b3b] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <Radar size={16} /> Find a Client
                                                </button>
                                            </div>
                                        ) : filteredBuyers.length > 0 ? filteredBuyers.map((buyer) => (
                                            <button 
                                                key={buyer.id}
                                                onClick={() => { setSelectedBuyerId(buyer.id); if(activeStep === 1) setActiveStep(2); }}
                                                className={`w-full text-left p-5 flex items-center gap-4 transition-all relative group ${selectedBuyerId === buyer.id ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                                            >
                                                {selectedBuyerId === buyer.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${selectedBuyerId === buyer.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground border-border group-hover:border-primary/30'}`}>
                                                    {buyer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-black truncate ${selectedBuyerId === buyer.id ? 'text-[#1a2b3b]' : 'text-gray-700'}`}>{buyer.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                                                        {buyer.niche && <span className="text-primary mr-1">[{buyer.niche}]</span>}
                                                        {buyer.email}
                                                    </p>
                                                </div>
                                            </button>
                                        )) : (
                                            <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                                                <Search size={32} className="mb-2" />
                                                <p className="text-xs font-black uppercase tracking-widest leading-relaxed">No search matches.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="lg:col-span-8 bg-white border border-border rounded-[32px] flex flex-col shadow-xl relative overflow-hidden">
                                    
                                    {isSuccess && (
                                        <div className="absolute inset-0 z-[100] bg-white/95 flex flex-col items-center justify-center text-center p-12 animate-scale-in">
                                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-xl border border-emerald-100">
                                                <CheckCircle2 size={48} className="animate-bounce" />
                                            </div>
                                            <h3 className="text-3xl font-black text-[#1a2b3b] tracking-tight">Email Dispatched!</h3>
                                            <p className="text-gray-500 font-medium max-w-sm mx-auto mt-4 leading-relaxed text-lg">Delivered successfully.</p>
                                        </div>
                                    )}

                                    <div className="p-4 border-b border-border bg-muted/5 flex items-center justify-between overflow-x-auto scrollbar-hide gap-4 shrink-0">
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => exec('bold')} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"><Bold size={16}/></button>
                                            <button onClick={() => exec('italic')} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"><Italic size={16}/></button>
                                            <div className="w-px h-4 bg-border mx-1" />
                                            <button onClick={() => imageInputRef.current?.click()} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all" title="Insert Image (Max 1MB)"><ImageIcon size={18}/></button>
                                            <div className="relative">
                                                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 hover:bg-muted rounded-lg transition-all ${showEmojiPicker ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`} title="Add Emoji"><Smile size={18}/></button>
                                                {showEmojiPicker && (
                                                    <div className="absolute top-full left-0 mt-2 p-2 bg-white border border-border shadow-xl rounded-xl z-[150] flex gap-2 animate-scale-in">
                                                        {EMOJIS.map(e => <button key={e} onClick={() => { exec('insertText', e); setShowEmojiPicker(false); }} className="text-lg hover:scale-125 transition-transform">{e}</button>)}
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleAddImage} />
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${sendingMode === 'shared' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                {sendingMode === 'shared' ? <Zap size={12} fill="currentColor" /> : <Globe size={12} />}
                                                {sendingMode === 'shared' ? 'Shared Domain (Limit: 50/mo)' : 'Custom Domain Active'}
                                            </div>
                                            <button 
                                                onClick={() => navigate('/settings?tab=outbound&from=outbound')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeStep === 4 ? 'bg-[#1a2b3b] text-white ring-4 ring-[#1a2b3b]/20 shadow-lg' : 'bg-white border border-border text-[#1a2b3b] hover:bg-muted shadow-sm'}`}
                                            >
                                                <Settings size={14} /> Configure Sender
                                            </button>
                                            <div className="w-px h-6 bg-border mx-1" />
                                            <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><Minimize2 size={16}/></button>
                                            <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground" onClick={() => { if(composerRef.current) composerRef.current.innerHTML = ''; setSubject(''); setBodyHtml(''); }}><X size={16}/></button>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                        <div className="px-8 py-5 border-b border-border/50 flex items-center gap-4 shrink-0">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-12">To:</span>
                                            <div className="flex-1 flex items-center gap-2">
                                                {selectedBuyerId ? (
                                                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black border border-primary/20 flex items-center gap-2 animate-scale-in">
                                                        {buyers.find(b => b.id === selectedBuyerId)?.email}
                                                        <button onClick={() => setSelectedBuyerId('')}><X size={12}/></button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-muted-foreground italic">Select a partner from the left...</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`px-8 py-4 border-b border-border/50 flex items-center gap-4 transition-colors shrink-0 ${activeStep === 4 ? 'bg-orange-50' : 'bg-muted/5'}`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-12">From:</span>
                                            <div className="flex-1 flex items-center justify-between min-w-0">
                                                {isEditingSender ? (
                                                    <div className="flex-1 flex items-center gap-3 animate-fade-in-down min-w-0">
                                                        <input 
                                                            type="text" 
                                                            value={overrideSenderName} 
                                                            onChange={(e) => setOverrideSenderName(e.target.value)} 
                                                            placeholder="Name" 
                                                            className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-bold focus:border-primary outline-none"
                                                        />
                                                        <input 
                                                            type="email" 
                                                            value={overrideSenderEmail} 
                                                            onChange={(e) => setOverrideSenderEmail(e.target.value)} 
                                                            placeholder="Email" 
                                                            className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-bold focus:border-primary outline-none flex-1 min-w-0"
                                                        />
                                                        <button onClick={() => setIsEditingSender(false)} className="p-1.5 bg-primary text-white rounded-lg shadow-sm">
                                                            <Check size={14} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-1 items-center justify-between min-w-0">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors shrink-0 ${activeStep === 4 ? 'bg-orange-500 text-white' : 'bg-[#1a2b3b] text-white'}`}>
                                                                {(overrideSenderName || 'A').charAt(0)}
                                                            </div>
                                                            <span className={`text-xs font-bold transition-colors truncate ${activeStep === 4 ? 'text-orange-900' : 'text-[#1a2b3b]'}`}>
                                                                {overrideSenderName} &lt;{overrideSenderEmail}&gt;
                                                            </span>
                                                            <button onClick={() => setIsEditingSender(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors shrink-0">
                                                                <Edit3 size={14} />
                                                            </button>
                                                        </div>
                                                        {sendingMode === 'custom' && (
                                                            <button 
                                                                onClick={() => navigate('/settings?tab=outbound&from=outbound')}
                                                                className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1 shrink-0 ml-4"
                                                            >
                                                                <Globe size={12} /> Change Domain
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="px-8 py-5 border-b border-border flex items-center gap-4 shrink-0">
                                            <input 
                                                type="text" 
                                                placeholder="Email Subject" 
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className="flex-1 bg-transparent border-none text-[15px] font-black text-[#1a2b3b] outline-none placeholder:text-muted-foreground/30 min-w-0"
                                            />
                                            
                                            <div className="relative shrink-0" ref={blueprintDropdownRef}>
                                                <button 
                                                    onClick={() => setShowBlueprintDropdown(!showBlueprintDropdown)}
                                                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border-2 ${
                                                        activeStep === 2 
                                                            ? 'bg-orange-50 border-primary text-primary shadow-xl ring-4 ring-primary/10' 
                                                            : 'bg-white border-border text-[#1a2b3b] hover:border-primary/30'
                                                    }`}
                                                >
                                                    <Sparkles size={16} className={activeStep === 2 ? 'text-primary' : 'text-orange-500'} />
                                                    <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">
                                                        {selectedTemplateId ? EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId)?.name : 'Choose Blueprint'}
                                                    </span>
                                                    <ChevronDown size={16} className={`transition-transform duration-300 ${showBlueprintDropdown ? 'rotate-180' : ''}`} />
                                                </button>

                                                {showBlueprintDropdown && (
                                                    <div className="absolute top-full right-0 mt-3 w-[300px] bg-white border border-border rounded-3xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.15)] z-[150] overflow-hidden animate-scale-in origin-top-right">
                                                        <div className="p-4 border-b border-border bg-muted/20">
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Outbound Blueprints</p>
                                                        </div>
                                                        <div className="p-2 space-y-1">
                                                            {EMAIL_TEMPLATES.map((t) => (
                                                                <button 
                                                                    key={t.id}
                                                                    onClick={() => { applyTemplate(t.id); setSelectedTemplateId(t.id); setShowBlueprintDropdown(false); if(activeStep === 2) setActiveStep(3); }}
                                                                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${selectedTemplateId === t.id ? 'bg-orange-50 text-primary' : 'hover:bg-muted/50 text-[#1a2b3b]'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${selectedTemplateId === t.id ? 'bg-white border-primary/20' : 'bg-white border-border'}`}>
                                                                            <Mail size={14} className={selectedTemplateId === t.id ? 'text-primary' : 'text-muted-foreground'} />
                                                                        </div>
                                                                        <span className="text-sm font-bold">{t.name}</span>
                                                                    </div>
                                                                    {selectedTemplateId === t.id && <Check size={16} strokeWidth={3} />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="px-8 py-4 bg-slate-50 border-b border-border flex flex-col gap-3 shrink-0">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                                <Tag size={12} /> Placeholders:
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {AVAILABLE_VARIABLES.map(v => (
                                                    <button 
                                                        key={v.key}
                                                        onClick={() => insertVariable(v.key)}
                                                        className={`px-3 py-1.5 rounded-lg border text-[13px] font-bold transition-all whitespace-nowrap active:scale-95 shadow-sm ${v.isSpecial ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-white border-border text-[#1a2b3b] hover:border-primary/50'}`}
                                                    >
                                                        {v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={`flex-1 relative flex flex-col composer-area transition-all duration-500 overflow-y-auto ${activeStep === 3 ? 'bg-orange-50/10' : ''}`}>
                                            <div 
                                                ref={composerRef}
                                                contentEditable
                                                onMouseUp={handleTextSelection}
                                                onKeyUp={handleTextSelection}
                                                onClick={handleComposerClick}
                                                onInput={(e) => setBodyHtml(e.currentTarget.innerHTML)}
                                                className={`flex-1 p-10 text-base font-medium text-[#1a2b3b] leading-relaxed outline-none prose prose-orange max-w-none ${activeStep === 3 ? 'highlight-vars-mode' : ''} ${isFunnelMissing ? 'funnel-validation-error' : ''}`}
                                                style={{ minHeight: '400px' }}
                                            >
                                            </div>
                                            {!bodyHtml && (
                                                <div className="absolute top-[40px] left-10 pointer-events-none text-muted-foreground/30 text-lg italic">
                                                    Land the deal in one click. Reach out to your selected prospects with high-impact outreach...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-8 border-t border-border bg-muted/5 flex items-center justify-between shrink-0">
                                        <button 
                                            onClick={handleSend}
                                            disabled={isSending}
                                            className={`px-12 py-4 rounded-[20px] font-black text-sm flex items-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
                                                activeStep === 5 
                                                    ? 'bg-[#F97316] text-white ring-8 ring-orange-500/10 scale-105' 
                                                    : 'bg-[#F97316] text-white hover:opacity-90'
                                            }`}
                                        >
                                            {isSending ? <Loader2 size={20} className="animate-spin" /> : (
                                                <>
                                                    {!isScalePlan && <Lock size={16} className="text-orange-400" />}
                                                    <Send size={20} strokeWidth={3} /> Send Email Now
                                                </>
                                            )}
                                        </button>
                                        
                                        <button 
                                            onClick={() => { 
                                                const workspaceId = localStorage.getItem('active_workspace_id');
                                                if (workspaceId) localStorage.removeItem(`outbound_draft_${workspaceId}`);
                                                setSubject(''); 
                                                setBodyHtml(''); 
                                                if (composerRef.current) composerRef.current.innerHTML = ''; 
                                                setSelectedBuyerId(''); 
                                                setSelectedFunnelId('');
                                                setSelectedTemplateId('');
                                                setActiveStep(1); 
                                            }}
                                            className="p-4 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="fixed inset-0 pointer-events-none z-[250]">
                                {linkPopover && selectionRects.map((rect, i) => (
                                    <div 
                                        key={i}
                                        className="fixed bg-orange-500/30 rounded-sm animate-pulse"
                                        style={{
                                            top: rect.top,
                                            left: rect.left,
                                            width: rect.width,
                                            height: rect.height
                                        }}
                                    />
                                ))}

                                {linkPopover && (
                                    <div 
                                        className="fixed bg-white border border-border rounded-2xl shadow-2xl p-4 flex gap-2 animate-scale-in link-popover pointer-events-auto"
                                        style={{ top: linkPopover.y, left: linkPopover.x }}
                                    >
                                        <div className="relative flex-1">
                                            <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input 
                                                autoFocus
                                                type="url" 
                                                placeholder="https://..." 
                                                className="pl-9 pr-4 py-2 bg-muted/20 border border-border rounded-xl text-xs font-bold outline-none focus:border-primary w-48"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleCreateLink((e.target as HTMLInputElement).value);
                                                    if (e.key === 'Escape') {
                                                        setLinkPopover(null);
                                                        setSelectionRects([]);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleCreateLink((document.querySelector('.link-popover input') as HTMLInputElement).value)}
                                            className="p-2 bg-primary text-white rounded-lg hover:opacity-90"
                                        >
                                            <Check size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                )}

                                {imageSettings && (
                                    <div 
                                        className="fixed bg-white border border-border rounded-2xl shadow-2xl p-2 flex gap-1 animate-scale-in image-settings pointer-events-auto"
                                        style={{ top: imageSettings.y, left: imageSettings.x }}
                                    >
                                        {(['S', 'M', 'L'] as const).map(size => (
                                            <button 
                                                key={size} 
                                                onClick={() => updateImageSize(size)}
                                                className="px-3 py-1.5 hover:bg-muted rounded-lg text-[10px] font-black uppercase text-[#1a2b3b]"
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </PlanGuard>
            </div>

            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                workspace={workspace} 
                featureName="Direct Outreach" 
            />

            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto flex items-center gap-3 px-5 py-4 bg-[#1a2b3b] text-white rounded-[16px] shadow-2xl min-w-[320px] animate-slide-in-right border border-white/10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Zap size={20} />}
                        </div>
                        <div className="flex-1"><p className="text-xs font-black uppercase opacity-50 mb-0.5">{toast.type === 'success' ? 'Success' : 'Notification'}</p><p className="text-sm font-bold">{toast.message}</p></div>
                        <button onClick={() => removeToast(toast.id)} className="p-1 opacity-50 hover:opacity-100 transition-opacity"><X size={16} /></button>
                    </div>
                ))}
            </div>

            {isFunnelModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-scale-in">
                        <div className="p-8 border-b border-border bg-white flex justify-between items-center">
                            <h2 className="text-xl font-black text-[#1a2b3b]">Select Tracking Funnel</h2>
                            <button onClick={() => setIsFunnelModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                            {funnels.length > 0 ? funnels.map(f => (
                                <button key={f.id} onClick={() => handleFunnelSelect(f.id)} className="w-full text-left p-4 hover:bg-muted/50 rounded-xl transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                            <Zap size={14} />
                                        </div>
                                        <span className="font-bold text-sm text-[#1a2b3b]">{f.name}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                </button>
                            )) : (
                                <div className="p-10 text-center text-muted-foreground italic text-sm">No live funnels found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Outbound;