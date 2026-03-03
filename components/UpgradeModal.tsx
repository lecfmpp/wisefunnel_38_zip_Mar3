import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap, Sparkles, Loader2, X } from 'lucide-react';
import { createCheckoutSession, getPriceId } from '../services/stripeService';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspace: any;
    featureName: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, workspace, featureName }) => {
    const navigate = useNavigate();
    const [isUpgrading, setIsUpgrading] = React.useState(false);

    const isDiscountActive = useMemo(() => {
        return workspace?.metadata?.applied_discount === 'trial25';
    }, [workspace]);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        if (!workspace) return;
        setIsUpgrading(true);
        try {
            const priceId = getPriceId('scale', 'monthly');
            await createCheckoutSession({
                priceId,
                workspaceId: workspace.id,
                successUrl: `${window.location.origin}/#/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: window.location.href,
                applyDiscount: isDiscountActive
            });
        } catch (err) {
            console.error("Upgrade redirection failed:", err);
            setIsUpgrading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#1A2B3B]/60 backdrop-blur-sm p-6 animate-fade-in-down">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden border border-gray-100 relative animate-scale-in">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full transition-colors">
                    <X size={20} />
                </button>

                <div className="p-12 text-center space-y-8">
                    <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                        <Lock size={40} strokeWidth={2.5} />
                    </div>
                    
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 mx-auto mb-2">
                            <Sparkles size={12} fill="currentColor" /> Pro Infrastructure Required
                        </div>
                        <h2 className="text-3xl font-black text-[#1A2B3B] tracking-tight uppercase leading-none">{featureName} Locked</h2>
                        <p className="text-gray-500 font-medium leading-relaxed px-4">
                            The <span className="font-bold text-[#1A2B3B]">{featureName}</span> feature is exclusively available to <span className="font-bold text-[#1A2B3B]">Scale</span> plan partners. Upgrade now to unlock your agency's full potential.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <button 
                            onClick={handleUpgrade}
                            disabled={isUpgrading}
                            className="w-full py-5 bg-[#F97316] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {isUpgrading ? <Loader2 size={20} className="animate-spin" /> : (
                                <>
                                    <Zap size={18} fill="currentColor" /> 
                                    {isDiscountActive ? 'Upgrade to Scale (25% Off)' : 'Upgrade to Scale Now'}
                                </>
                            )}
                        </button>
                        
                        <button 
                            onClick={onClose}
                            className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-[#1A2B3B] transition-all flex items-center justify-center gap-2"
                        >
                            Back to Campaign
                        </button>
                    </div>
                </div>
                
                <div className="bg-[#1A2B3B] p-6 flex items-center justify-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Secure Agency Infrastructure Active</span>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;