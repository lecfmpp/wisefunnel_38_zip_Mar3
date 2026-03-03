import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import LogoIcon from '../components/LogoIcon';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to update password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6 font-sans">
            <div className="mb-10">
                <Link to="/" className="flex items-center gap-2">
                    <LogoIcon className="w-10 h-10" />
                    <span className="font-black text-2xl tracking-tighter text-[#1A2B3B]">wisefunnel</span>
                </Link>
            </div>

            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-gray-100 p-10 space-y-8 animate-scale-in">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black text-[#1A2B3B] tracking-tight">Create New Password</h1>
                    <p className="text-gray-500 font-medium">Please enter and confirm your new agency credentials.</p>
                </div>

                {error && (
                    <div className="p-4 rounded-2xl flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 animate-fade-in-down">
                        <AlertCircle size={20}/>
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                {success ? (
                    <div className="text-center space-y-6 py-4 animate-fade-in-down">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 border border-emerald-100">
                            <CheckCircle2 size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900">Password Updated</h3>
                            <p className="text-gray-500 font-medium">Your account is now secure. Redirecting to login...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    required 
                                    type="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="Min. 8 characters" 
                                    className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input 
                                    required 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    placeholder="Repeat new password" 
                                    className="w-full pl-12 pr-4 py-4 bg-muted/30 border-2 border-border rounded-[16px] text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all" 
                                />
                            </div>
                        </div>
                        <button disabled={isLoading} className="w-full py-5 bg-[#F97316] text-white rounded-[16px] font-black text-base shadow-xl shadow-orange-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-70">
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Update Password <ArrowRight size={20} /></>}
                        </button>
                    </form>
                )}
            </div>
            
            <p className="mt-8 text-sm font-medium text-gray-400">
                Securely hosted by <span className="font-bold text-[#1A2B3B]">wisefunnel</span>
            </p>
        </div>
    );
};

export default ResetPasswordPage;