import React, { useState, useEffect, useMemo } from 'react';
    import { useNavigate, useLocation } from 'react-router-dom';
    import { Zap, ArrowRight, Percent, Loader2, Check } from 'lucide-react';
    import { supabase } from '../services/supabaseClient';
    
    type BannerState = 'active' | 'expired' | 'warning';
    
    const TrialBanner: React.FC = () => {
        const navigate = useNavigate();
        const location = useLocation();
        const [daysLeft, setDaysLeft] = useState<number | null>(null);
        const [isVisible, setIsVisible] = useState(false);
        const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
        const [isApplying, setIsApplying] = useState(false);
        const [isApplied, setIsApplied] = useState(false);
        const [workspace, setWorkspace] = useState<any>(null);
    
        const calculateTrial = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) return;
    
            const { data: ws } = await supabase
                .from('workspaces')
                .select('*')
                .eq('id', workspaceId)
                .single();
    
            if (ws) {
                if (user?.email === 'lecfmpp@gmail.com') {
                    setWorkspace({ ...ws, plan_type: 'Scale', subscription_status: 'active' });
                    setSubscriptionStatus('active');
                    setIsVisible(false);
                    return;
                }
    
                setWorkspace(ws);
                setSubscriptionStatus(ws.subscription_status);
                setIsApplied(ws.metadata?.applied_discount === 'trial25');
                
                const now = new Date().getTime();
                let expiryDate: number;
                if (ws.current_period_end) {
                    expiryDate = new Date(ws.current_period_end).getTime();
                } else {
                    const createdAt = new Date(ws.created_at).getTime();
                    expiryDate = createdAt + (7 * 24 * 60 * 60 * 1000);
                }
    
                const remainingMs = expiryDate - now;
                const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
                setDaysLeft(remainingDays);
    
                const isRelevantPlan = ws.plan_type === 'Free' || ws.plan_type === 'Growth' || ws.plan_type === 'Scale' || ws.subscription_status === 'trialing' || !ws.subscription_status;
                setIsVisible(isRelevantPlan && ws.subscription_status !== 'active');
    
                const isExpired = remainingDays <= 0 && (ws.subscription_status === 'canceled' || !ws.subscription_status);
                if (isExpired && !location.pathname.includes('/account')) {
                    navigate('/account', { state: { initialTab: 'billing' }, replace: true });
                }
            } else {
                setIsVisible(false);
            }
        };
    
        useEffect(() => {
            calculateTrial();
            window.addEventListener('workspaceChanged', calculateTrial);
            return () => window.removeEventListener('workspaceChanged', calculateTrial);
        }, [location.pathname, navigate]);
    
        const handleApplyDiscount = async () => {
            if (!workspace || isApplied) return;
            setIsApplying(true);
            try {
                await supabase.from('workspaces').update({ metadata: { ...(workspace.metadata || {}), applied_discount: 'trial25' } }).eq('id', workspace.id);
                setIsApplied(true);
                window.dispatchEvent(new Event('workspaceChanged'));
            } catch (err) { console.error(err); } finally { setIsApplying(false); }
        };
    
        const bannerState = useMemo<BannerState>(() => {
            if (daysLeft !== null && daysLeft <= 0) return 'expired';
            if (subscriptionStatus === 'incomplete' || subscriptionStatus === 'past_due') return 'warning';
            return 'active';
        }, [daysLeft, subscriptionStatus]);
    
        const progressPercentage = useMemo(() => {
            if (daysLeft === null) return 0;
            return Math.max(0, Math.min(100, (daysLeft / 7) * 100));
        }, [daysLeft]);
    
        const activePlanName = useMemo(() => {
            const plan = (workspace?.plan_type || 'Growth').toLowerCase();
            return plan.includes('scale') ? 'Scale' : 'Growth';
        }, [workspace]);
    
        if (!isVisible || daysLeft === null) return null;
    
        const config = {
            active: {
                textColor: 'text-white',
                barBg: 'bg-white/20',
                barColor: 'bg-white',
                message: `${activePlanName} Trial`,
                subMessage: `${daysLeft} days remaining`,
                buttonBg: 'bg-white', 
                buttonTextColor: 'text-[#059669]',
                buttonText: 'LOCK IN PLAN',
                accentBorder: 'border-b border-white/10'
            },
            expired: {
                textColor: 'text-white',
                barBg: 'bg-white/10',
                barColor: 'bg-rose-500',
                message: 'Trial Over',
                subMessage: 'Upgrade required',
                buttonBg: 'bg-[#F97316]', 
                buttonTextColor: 'text-white',
                buttonText: 'UPGRADE NOW',
                accentBorder: 'border-b border-white/5'
            },
            warning: {
                textColor: 'text-white',
                barBg: 'bg-white/20',
                barColor: 'bg-white',
                message: 'Payment due',
                subMessage: 'Action required',
                buttonBg: 'bg-white',
                buttonTextColor: 'text-[#e11d48]',
                buttonText: 'RESOLVE NOW',
                accentBorder: 'border-b border-white/10'
            }
        }[bannerState];
    
        return (
            <div 
                style={{ background: bannerState === 'active' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : bannerState === 'expired' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}
                className={`w-full shrink-0 h-24 ${config.textColor} shadow-lg ${config.accentBorder} flex items-center justify-center z-[999] relative px-8 transition-all duration-700`}
            >
                <div className="flex items-center justify-between w-full max-w-7xl">
                    <div className="flex flex-col gap-2.5 min-w-[240px]">
                        <div className="flex items-end gap-3">
                            <span className="text-2xl font-black tracking-tighter leading-none">{config.message}</span>
                            <span className="text-xs font-black uppercase tracking-widest opacity-80 mb-0.5">{config.subMessage}</span>
                        </div>
                        <div className={`w-full max-w-xs h-1.5 ${config.barBg} rounded-full overflow-hidden`}><div className={`h-full ${config.barColor} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${progressPercentage}%` }} /></div>
                    </div>
                    <div className="flex items-center gap-4">
                        {bannerState === 'active' && (
                            <div className={`neon-border-animation h-12 rounded-2xl flex items-center justify-center shadow-2xl ${isApplied ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                <button onClick={handleApplyDiscount} disabled={isApplying || isApplied} className="neon-border-content bg-[#F97316] text-white px-8 rounded-[14px] text-[12px] font-black uppercase tracking-[0.15em] flex items-center gap-3">
                                    {isApplying ? <Loader2 size={14} className="animate-spin" /> : isApplied ? <Check size={14} strokeWidth={4} /> : <Percent size={14} strokeWidth={4} />}
                                    <span>{isApplied ? '25% DISCOUNT APPLIED' : 'APPLY 25% DISCOUNT'}</span>
                                </button>
                            </div>
                        )}
                        <button onClick={() => navigate('/account', { state: { initialTab: 'billing' } })} className={`${config.buttonBg} ${config.buttonTextColor} h-12 px-10 rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-[0.97] transition-all shadow-xl flex items-center gap-4`}>
                            <Zap size={16} fill="currentColor" className={bannerState === 'expired' ? 'text-white' : ''} />
                            <span className="leading-none">{config.buttonText}</span>
                            <div className={`w-px h-4 opacity-20 mx-0.5 ${bannerState === 'expired' ? 'bg-white' : 'bg-current'}`} />
                            <ArrowRight size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    export default TrialBanner;