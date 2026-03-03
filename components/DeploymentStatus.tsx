import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, Copy, Check, ExternalLink, X } from 'lucide-react';

const messages = [
    "Syncing with global DNS servers...",
    "Provisioning your SSL certificate...",
    "Optimizing assets for the Edge Network...",
    "Warming up the cache for supersonic speeds...",
    "Almost there! Polishing the pixels...",
    "Your funnel is about to make you a legend!"
];

const BrandedLoader: React.FC = () => (
    <motion.div 
        className="relative w-20 h-20"
        animate={{ rotate: 360 }}
        transition={{ loop: Infinity, ease: "linear", duration: 1.5 }}
    >
        <div className="absolute inset-0 border-4 border-orange-200/50 rounded-full" />
        <div className="absolute inset-0 border-t-4 border-primary rounded-full" />
    </motion.div>
);

const DeploymentAnimation: React.FC = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % messages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="text-center space-y-8 py-8">
            <BrandedLoader />
            <div className="h-10">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="text-xl font-bold text-[#1a2b3b]"
                    >
                        {messages[index]}
                    </motion.p>
                </AnimatePresence>
            </div>
            <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto">
                Your funnel is going live! Soon you'll be able to drive traffic from Google, Meta, or TikTok and watch the conversions roll in.
            </p>
        </div>
    );
};

const DeploymentSuccess: React.FC<{ 
    displayUrl: string; 
    liveUrl: string;
    onClose: () => void; 
    activeTab: 'standard' | 'custom';
}> = ({ displayUrl, liveUrl, onClose, activeTab }) => {
    const [copied, setCopied] = useState(false);

    const triggerConfetti = useCallback(() => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FB923C', '#F97316', '#EA580C', '#D97706'] });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FB923C', '#F97316', '#EA580C', '#D97706'] });
        }, 250);
    }, []);

    useEffect(() => {
        triggerConfetti();
    }, [triggerConfetti]);

    const onCopy = () => {
        navigator.clipboard.writeText(liveUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="text-center space-y-6 py-4 animate-fade-in-down">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-green-500/10 border border-green-100">
                <CheckCircle2 size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
                <h3 className="text-3xl font-black text-[#1a2b3b]">
                    Your Funnel is Live!
                </h3>
                <p className="text-gray-500 font-medium">
                    Your funnel is now ready to convert. Time to show the world how professional you are.
                </p>
            </div>

            <div className="p-4 bg-gray-100/60 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-between gap-3">
                <p className="text-sm font-bold truncate text-primary flex-1 text-left pl-2">{displayUrl}</p>
                <button onClick={onCopy} className={`p-2.5 rounded-xl transition-all ${copied ? 'bg-green-100' : 'bg-white shadow-sm border'}`}>
                    {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-500" />}
                </button>
            </div>
            
            <div className="flex gap-4">
                <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-[#1a2b3b] text-white rounded-xl font-bold text-base shadow-lg shadow-black/10 transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2">
                    <ExternalLink size={16} />
                    Open Live Site
                </a>
                <button onClick={onClose} className="px-6 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-base transition-all hover:bg-gray-200 active:scale-95">Close</button>
            </div>
        </div>
    );
};


const DeploymentStatus: React.FC<{ 
    status: 'publishing' | 'success';
    displayUrl: string; 
    liveUrl: string;
    onClose: () => void; 
    activeTab: 'standard' | 'custom';
}> = (props) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-12">
                    {props.status === 'publishing' && <DeploymentAnimation />}
                    {props.status === 'success' && <DeploymentSuccess {...props} />}
                </div>
            </div>
        </div>
    );
};

export default DeploymentStatus;
