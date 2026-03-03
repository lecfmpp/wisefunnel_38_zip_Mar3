import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, MailCheck, AlertTriangle, ArrowRight, Settings, Mail } from 'lucide-react';
import { Funnel, FunnelSettings } from '../types';
import { SettingsTab } from './SettingsModal';

interface DeployConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onEditSettings: (tab: SettingsTab) => void;
  funnel: Funnel | null;
  onUpdateSettings: (updates: Partial<FunnelSettings>) => void;
}

const DeployConfirmModal: React.FC<DeployConfirmModalProps> = ({ isOpen, onClose, onConfirm, onEditSettings, funnel, onUpdateSettings }) => {
  if (!funnel) return null;

  const smsOtpEnabled = funnel.settings.otpVerification?.enabled ?? true;
  const emailVerificationEnabled = funnel.settings.emailVerification?.enabled ?? false;
  const emailNotificationsEnabled = funnel.settings.emailNotifications?.enabled ?? false;

  const handleSmsOtpToggle = (enabled: boolean) => {
    onUpdateSettings({ otpVerification: { ...(funnel.settings.otpVerification || {}), enabled } });
  };

  const handleEmailVerificationToggle = (enabled: boolean) => {
    onUpdateSettings({ emailVerification: { ...(funnel.settings.emailVerification || {}), enabled } });
  };
  
  const handleEmailNotificationsToggle = (enabled: boolean) => {
    onUpdateSettings({ emailNotifications: { ...(funnel.settings.emailNotifications || {}), enabled } });
    if (enabled) {
        onEditSettings('email'); // Pass 'email' as the initial tab
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1002] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[40px] shadow-2xl w-full max-w-[640px] overflow-hidden"
          >
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-2xl font-black text-[#1a2b3b]">Final Deployment Checklist</h2>
                <p className="text-xs font-medium text-muted-foreground mt-1">Confirm your lead verification and notification settings before going live.</p>
              </div>
              <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors bg-muted/50 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-10 space-y-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest">Lead Security & Delivery</h3>
                    
                    <div className={`p-5 rounded-2xl border-2 transition-all ${smsOtpEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <ShieldCheck className={`w-10 h-10 p-2 rounded-lg ${smsOtpEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`} />
                                <div>
                                    <p className={`font-black ${smsOtpEnabled ? 'text-emerald-900' : 'text-gray-500'}`}>SMS OTP Verification</p>
                                    <p className={`text-xs font-bold ${smsOtpEnabled ? 'text-emerald-700' : 'text-gray-400'}`}>{smsOtpEnabled ? 'ACTIVE' : 'INACTIVE'}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={smsOtpEnabled} onChange={(e) => handleSmsOtpToggle(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                            </label>
                        </div>
                    </div>

                    <div className={`p-5 rounded-2xl border-2 transition-all ${emailVerificationEnabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <MailCheck className={`w-10 h-10 p-2 rounded-lg ${emailVerificationEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`} />
                                <div>
                                    <p className={`font-black ${emailVerificationEnabled ? 'text-blue-900' : 'text-gray-500'}`}>Email Verification</p>
                                    <p className={`text-xs font-bold ${emailVerificationEnabled ? 'text-blue-700' : 'text-gray-400'}`}>{emailVerificationEnabled ? 'ACTIVE' : 'INACTIVE'}</p>
                                </div>
                            </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={emailVerificationEnabled} onChange={(e) => handleEmailVerificationToggle(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 shadow-inner"></div>
                            </label>
                        </div>
                    </div>
                    
                    <div className={`p-5 rounded-2xl border-2 transition-all ${emailNotificationsEnabled ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Mail className={`w-10 h-10 p-2 rounded-lg ${emailNotificationsEnabled ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-400'}`} />
                                <div>
                                    <p className={`font-black ${emailNotificationsEnabled ? 'text-sky-900' : 'text-gray-500'}`}>Email Notifications</p>
                                    <p className={`text-xs font-bold ${emailNotificationsEnabled ? 'text-sky-700' : 'text-gray-400'}`}>{emailNotificationsEnabled ? 'ACTIVE' : 'INACTIVE'}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={emailNotificationsEnabled} onChange={(e) => handleEmailNotificationsToggle(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 shadow-inner"></div>
                            </label>
                        </div>
                        {emailNotificationsEnabled && (
                            <div className="mt-4 pt-4 border-t border-sky-200/60">
                                <div className="p-4 bg-sky-100/50 rounded-xl flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-sky-900">
                                            {(funnel.settings.emailNotifications?.recipients?.length || 0) > 0
                                                ? `${funnel.settings.emailNotifications.recipients.length} Recipient(s) Configured`
                                                : 'No Recipients Added'}
                                        </p>
                                        <p className="text-[10px] text-sky-700/80 font-medium">
                                            {(funnel.settings.emailNotifications?.recipients?.length || 0) > 0
                                                ? 'will be notified of new leads.'
                                                : 'Add emails to receive alerts.'}
                                        </p>
                                    </div>
                                    <button onClick={() => onEditSettings('email')} className="px-5 py-2.5 bg-white text-sky-700 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-white/80 transition-all shadow-sm border border-sky-200">
                                        Configure
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {(smsOtpEnabled || emailVerificationEnabled) && (
                    <div className="flex items-center gap-4 p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl">
                        <AlertTriangle className="text-orange-500 shrink-0" size={24} />
                        <p className="text-sm font-bold text-orange-800 leading-relaxed">
                            Heads up! Having verification services active will consume credits from your workspace balance upon use.
                        </p>
                    </div>
                )}
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-end items-center gap-4">
              <button onClick={onClose} className="px-8 py-3.5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
              <button onClick={onConfirm} className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2">
                Deploy Now <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeployConfirmModal;