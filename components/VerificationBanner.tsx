import React, { useState } from 'react';
import { Mail, RefreshCw, Search, Zap, ArrowRight, Loader2, Check, X, Info, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Toast {
    id: string;
    message: string;
    type: 'info' | 'error' | 'success';
}

const VerificationBanner: React.FC = () => {
    const [isResending, setIsResending] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 6000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const pendingEmail = sessionStorage.getItem('wf_pending_email');
            const targetEmail = user?.email || pendingEmail;

            if (targetEmail) {
                const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: targetEmail,
                });
                if (error) throw error;
                setIsSent(true);
                addToast("A new verification link has been dispatched to your inbox.", "success");
                setTimeout(() => setIsSent(false), 5000);
            }
        } catch (err: any) {
            console.error("Resend failed:", err);
            addToast(err.message || "Failed to resend link. Please wait a moment.", "error");
        } finally {
            setIsResending(false);
        }
    };

    const handleCheckStatus = async () => {
        setIsChecking(true);
        try {
            // 1. Force a session refresh to fetch updated user metadata from the database
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) throw error;

            // 2. If verification is detected, clear the pending flags
            if (data.user?.email_confirmed_at) {
                sessionStorage.removeItem('wf_verification_pending');
                sessionStorage.removeItem('wf_pending_email');
            }

            // 3. Perform a full page reload to let AuthListener re-evaluate the state
            window.location.reload();
        } catch (err: any) {
            console.error("Status check failed:", err);
            // Fallback: reload the page anyway to try and capture a fresh state
            window.location.reload();
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <>
            <div 
                className="w-full shrink-0 h-24 bg-[#1A2B3B] text-white shadow-lg border-b border-white/5 flex items-center justify-center overflow-hidden z-[999] relative px-8 transition-all duration-700"
                style={{ background: 'linear-gradient(135deg, #1A2B3B 0%, #0F172A 100%)' }}
            >
                <div className="flex items-center justify-between w-full max-w-7xl">
                    <div className="flex flex-col gap-2.5 min-w-[240px]">
                        <div className="flex items-end gap-3">
                            <span className="text-2xl font-black tracking-tighter leading-none flex items-center gap-2">
                                 <Mail size={24} className="text-orange-500" /> Action Required
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest opacity-80 mb-0.5 text-orange-400">
                                Confirm Email to Unlock
                            </span>
                        </div>
                        <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full w-1/3 animate-pulse" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleResend}
                            disabled={isResending || isSent || isChecking}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-12 px-8 rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {isResending ? <Loader2 size={14} className="animate-spin" /> : isSent ? <Check size={14} strokeWidth={4} /> : <RefreshCw size={14} strokeWidth={4} />}
                            <span>{isSent ? 'LINK SENT!' : 'RESEND LINK'}</span>
                        </button>
                        
                        <button 
                            onClick={handleCheckStatus}
                            disabled={isChecking || isResending}
                            className="bg-orange-50 text-white h-12 px-10 rounded-2xl text-[12px] font-black uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-[0.97] transition-all shadow-xl shadow-orange-500/20 flex items-center gap-4 disabled:opacity-70"
                        >
                            {isChecking ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} strokeWidth={3} />}
                            <span className="leading-none">VERIFY STATUS</span>
                            <div className="w-px h-4 bg-white/20 mx-0.5" />
                            <ArrowRight size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Verification Toasts */}
            <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div 
                        key={toast.id}
                        className="pointer-events-auto flex items-center gap-4 px-5 py-4 bg-[#1A2B3B] text-white rounded-[20px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)] border border-white/10 min-w-[340px] max-w-md animate-slide-in-right overflow-hidden relative group"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                            toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                            {toast.type === 'success' ? <Check size={20} strokeWidth={3} /> : 
                             toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">
                                {toast.type === 'success' ? 'Synchronized' : 'System Guidance'}
                            </p>
                            <p className="text-sm font-bold leading-relaxed">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="p-1 text-white/30 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
};

export default VerificationBanner;