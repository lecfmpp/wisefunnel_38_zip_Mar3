
import React, { useEffect, useState, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Funnel, FunnelPage, FunnelElement, ElementStyle, TextStyle, ButtonStyle, ImageStyle } from '../types';
import * as LucideIcons from 'lucide-react';
import { 
    Star, Phone, ChevronDown, Check, Facebook, Twitter, Instagram, Youtube, 
    ArrowRight, Plus, GripHorizontal, Copy, Trash2, ArrowLeftRight, 
    ArrowUp, ArrowDown, Menu, X, ArrowLeft, Loader2, HandCoins, Percent, Zap,
    ChevronRight, Circle, HelpCircle, ShieldCheck, CheckCircle2, Linkedin, Quote, GripVertical,
    MessageSquare, AlertCircle, Info as InfoIcon, Cookie, MapPin, Tag, PieChart, Mail, UserCircle, MessageCircle,
    Type, Smartphone, RefreshCw, Clock, ShieldAlert, Settings, Shield, ExternalLink
} from 'lucide-react';
import LogoIcon from './LogoIcon';
import PhoneInput from './PhoneInput';
import ZipInput from './ZipInput';
import { COUNTRIES, DEFAULT_RESULT_CTA, Country, UNIVERSAL_LOGOS } from '../constants';
import { supabase } from '../services/supabaseClient';
import { sendOtp, verifyOtp } from '../services/otpService';

interface PreviewAreaProps {
  funnel: Funnel;
  page: FunnelPage;
  viewMode: 'desktop' | 'mobile';
  onSelectElement: (elementId: string, fieldId: string | null) => void;
  selectedElementId: string | null;
  selectedField: string | null;
  onUpdateElement: (updates: any) => void;
  globalHeader?: FunnelElement;
  globalFooter?: FunnelElement;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onSwapElement: (elementId: string) => void;
  onMoveElement: (elementId: string, direction: 'up' | 'down') => void;
  onNextPage?: (answers?: Record<string, any>) => void;
  onPhoneVerified?: (status: string) => Promise<void>;
  isLive?: boolean;
  quizAnswers?: Record<string, any>;
  setQuizAnswers?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onToolbarPositionUpdate?: (y: number, x: number) => void;
}

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    // @ts-ignore
    const IconComponent = LucideIcons[name];
    if (!IconComponent) return <HelpCircle className={className} />;
    return <IconComponent className={className} />;
}

const Selectable: React.FC<{
    isSelected: boolean;
    label: string;
    onSelect: () => void;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
    fieldId?: string;
    disabled?: boolean;
    onClick?: () => void;
}> = ({ isSelected, label, onSelect, children, className = '', style, elementId, fieldId, disabled, onClick }) => {
    return (
        <div 
            onClick={(e) => { 
                if (disabled) {
                    if (onClick) onClick();
                    return;
                }
                e.stopPropagation(); 
                onSelect(); 
            }}
            className={`relative group transition-all duration-200 ${className} ${isSelected ? 'outline outline-2 outline-primary outline-dashed -outline-offset-2 rounded-lg z-20 cursor-default' : !disabled ? 'hover:outline hover:outline-2 hover:outline-primary/50 hover:outline-dashed hover:-outline-offset-2 hover:rounded-lg cursor-pointer' : ''} ${!disabled ? 'pointer-events-auto' : ''}`}
            style={style}
        >
            {isSelected && (
                <span className="absolute -top-3 left-0 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-t uppercase tracking-wider z-50 shadow-sm whitespace-nowrap">
                    {label}
                </span>
            )}
            <div className={!disabled ? "pointer-events-none [&_.pointer-events-auto]:pointer-events-auto [&_input]:pointer-events-auto [&_button]:pointer-events-auto [&_textarea]:pointer-events-auto" : ""}>
                {children}
            </div>
        </div>
    );
}

const SectionWrapper: React.FC<{
    element: FunnelElement;
    isSelected: boolean;
    onSelect: () => void;
    viewMode: 'desktop' | 'mobile';
    children: React.ReactNode;
    className?: string;
    id?: string;
    fullWidthContent?: boolean;
    disabled?: boolean;
}> = ({ element, isSelected, onSelect, viewMode, children, className = '', id, fullWidthContent = false, disabled }) => {
    const isMobile = viewMode === 'mobile';
    const isHero = element.type === 'hero';
    const isQuiz = ['quiz-step', 'quiz-processing', 'quiz-result'].includes(element.type);
    const layout = isHero ? (element.style?.layout || '2-column') : '1-column';
    const reverse = isHero ? (element.style?.reverse || false) : false;
    
    const sectionStyles: React.CSSProperties = {
        backgroundColor: element.style?.backgroundColor || 'transparent',
        paddingTop: `60px`,
        paddingBottom: `60px`,
    };

    const gridClasses = isMobile 
        ? `flex flex-col ${isQuiz ? 'gap-12 items-center' : 'gap-8'}` 
        : isQuiz
            ? 'flex flex-col items-center justify-center text-center gap-16 w-full'
            : layout === '2-column' 
                ? `grid grid-cols-2 gap-12 md:gap-24 items-center ${reverse ? 'flex-row-reverse' : ''}`
                : 'flex flex-col text-center items-center';

    return (
        <section 
            id={id}
            data-element-id={element.id}
            onClick={(e) => { 
                if (disabled) return;
                e.stopPropagation(); 
                onSelect(); 
            }}
            className={`relative transition-all duration-300 ${className} ${isSelected ? 'outline outline-2 outline-primary outline-dashed z-[500] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]' : !disabled ? 'hover:outline hover:outline-1 hover:outline-primary/30' : ''}`}
            style={sectionStyles}
        >
            {isSelected && (
                <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest z-[510] shadow-2xl pointer-none border border-white/20 backdrop-blur-md">{element.type.replace('-', ' ')}</div>
            )}
            <div className={`${fullWidthContent ? 'w-full px-0' : isMobile ? 'w-full px-6' : 'max-w-4xl mx-auto px-6'} ${gridClasses}`}>
                {children}
            </div>
        </section>
    );
}

const RESEND_DELAYS = [60, 120, 300];
const MAX_RESENDS = 3;
const MAX_OTP_FAILURES = 2;

const PreviewArea: React.FC<PreviewAreaProps> = ({ 
    funnel, 
    page, 
    viewMode, 
    onSelectElement, 
    selectedElementId, 
    selectedField, 
    onUpdateElement, 
    globalHeader, 
    globalFooter, 
    onDuplicateElement, 
    onDeleteElement, 
    onSwapElement, 
    onMoveElement,
    onNextPage,
    onPhoneVerified, 
    isLive = false,
    quizAnswers: externalAnswers,
    setQuizAnswers: setExternalAnswers,
    onToolbarPositionUpdate
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [internalAnswers, setInternalAnswers] = useState<Record<string, any>>({});
  const activeAnswers = externalAnswers || internalAnswers;
  const updateAnswers = setExternalAnswers || setInternalAnswers;

  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', other: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(COUNTRIES[0].code);
  const [selectedZipCountry, setSelectedZipCountry] = useState<Country>(COUNTRIES[0]);
  const [zipError, setZipError] = useState<string | null>(null);
  const [multiSelect, setMultiSelect] = useState<string[]>([]);
  const [otpPin, setOtpPin] = useState(['', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [hasAcceptedCookies, setHasAcceptedCookies] = useState(() => {
    if (!isLive) return false;
    return !!sessionStorage.getItem(`cookies_accepted_${funnel.id}`);
  });
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);
  const [cookieSettings, setCookieSettings] = useState({ necessary: true, analytics: true, marketing: true });

  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpFailures, setOtpFailures] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  
  const isMobile = viewMode === 'mobile';

  const totalScore = useMemo(() => {
      let score = 0; 
      funnel.pages.forEach(p => {
          p.elements.forEach(el => {
              if (el.type === 'quiz-step' && el.content.field) {
                  const val = activeAnswers[el.content.field];
                  if (val !== undefined && val !== null && el.content.options) {
                      if (Array.isArray(val)) {
                          val.forEach(v => {
                              const opt = el.content.options?.find((o: any) => o.value === v);
                              if (opt && opt.scoreModifier) score += opt.scoreModifier;
                          });
                      } else {
                          const opt = el.content.options.find((o: any) => o.value === val);
                          if (opt && opt.scoreModifier) score += opt.scoreModifier;
                      }
                  }
              }
          });
      });
      return score;
  }, [activeAnswers, funnel.pages]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const calculateToolbarPos = useCallback(() => {
    if (!selectedElementId || !canvasRef.current || !onToolbarPositionUpdate) return;
    
    const element = canvasRef.current.querySelector(`[data-element-id="${selectedElementId}"]`);
    if (element) {
        const elementRect = element.getBoundingClientRect();
        onToolbarPositionUpdate(elementRect.top + (elementRect.height / 2), elementRect.right);
    }
  }, [selectedElementId, onToolbarPositionUpdate]);

  useLayoutEffect(() => {
    calculateToolbarPos();
    const currentCanvas = canvasRef.current;
    if (currentCanvas) {
        currentCanvas.addEventListener('scroll', calculateToolbarPos);
    }
    window.addEventListener('resize', calculateToolbarPos);
    
    return () => {
        if (currentCanvas) currentCanvas.removeEventListener('scroll', calculateToolbarPos);
        window.removeEventListener('resize', calculateToolbarPos);
    };
  }, [selectedElementId, page.elements, viewMode, calculateToolbarPos]);

  useEffect(() => {
    if (selectedElementId && canvasRef.current && !isLive) {
        requestAnimationFrame(() => {
            const element = canvasRef.current?.querySelector(`[data-element-id="${selectedElementId}"]`);
            if (element) {
                const canvasRect = canvasRef.current!.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                const isOutOfView = (
                    elementRect.top < canvasRect.top || 
                    elementRect.bottom < canvasRect.bottom
                );
                if (isOutOfView) {
                    element.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }
        });
    }
  }, [selectedElementId, page.elements, isLive]);

  useEffect(() => {
    if (page.type === 'processing' && isLive) {
        setIsProcessing(true);
        const timer = setTimeout(() => {
            setIsProcessing(false);
            handleNextStep();
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [page.id, isLive]);

  useEffect(() => {
    const isOtpPage = page.elements.some(el => el.type === 'quiz-step' && el.content.quizType === 'otp');
    if (isOtpPage && isLive && activeAnswers.phone) {
        handleResendOtp(true);
    }
  }, [page.id, isLive]);

  useEffect(() => {
    if (canvasRef.current && !isLive) {
        canvasRef.current.scrollTop = 0;
    }
    setMultiSelect([]);
    setOtpPin(['', '', '', '']);
  }, [page.id, isLive]);

  useEffect(() => {
    let interval: any;
    if (resendCountdown > 0) {
        interval = setInterval(() => {
            setResendCountdown(prev => prev - 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const quizPages = funnel.pages.filter(p => p.type === 'quiz' || p.type === 'processing' || p.type === 'end');
  const currentQuizIndex = quizPages.findIndex(p => p.id === page.id);
  const progress = currentQuizIndex >= 0 ? ((currentQuizIndex + 1) / quizPages.length) * 100 : 0;

  const navigateToPage = (targetPage: FunnelPage) => {
    if (!isLive) return;
    const isOtp = targetPage.elements.some(el => el.type === 'quiz-step' && el.content.quizType === 'otp');
    if (isOtp && funnel.settings.otpVerification?.enabled === false) {
        const currentIndex = funnel.pages.findIndex(p => p.id === targetPage.id);
        const nextTarget = funnel.pages
            .slice(currentIndex + 1)
            .find(p => !p.parent_id);
        
        if (nextTarget) {
            navigateToPage(nextTarget);
            return;
        }
    }

    const primary = targetPage.parent_id 
        ? funnel.pages.find(p => p.id === targetPage.parent_id) || targetPage
        : targetPage;

    const fSlug = funnel.slug || funnel.name.toLowerCase().replace(/\s+/g, '-');
    const pSlug = primary.slug || primary.title.toLowerCase().replace(/\s+/g, '-');
    navigate(`/funnel/${funnel.id}/${fSlug}/${pSlug}${location.search}`);
  };

  const handleNextStep = (targetPageId?: string) => {
    if (onNextPage) {
        onNextPage(activeAnswers);
        return;
    }
    if (!funnel || !isLive) return;

    if (targetPageId) {
        const target = funnel.pages.find(p => p.id === targetPageId);
        if (target) {
            navigateToPage(target);
            return;
        }
    }

    const currentOrder = page.order_index ?? 0;
    const nextSteps = funnel.pages
        .filter(p => !p.parent_id && (p.order_index ?? 0) > currentOrder)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    
    const nextBaseStep = nextSteps[0];

    if (nextBaseStep) {
        if (nextBaseStep.type === 'end') {
            const resultEl = nextBaseStep.elements.find(el => el.type === 'quiz-result');
            const min = resultEl?.content?.minScoreThreshold ?? 0;
            const max = resultEl?.content?.maxScoreThreshold ?? 1000000;
            
            if (totalScore < min || totalScore > max) {
                const failurePage = funnel.pages.find(p => 
                    p.type === 'end' && 
                    (p.title.toLowerCase().includes('disqualified') || p.title.toLowerCase().includes('fail') || p.title.toLowerCase().includes('not qualified'))
                );
                if (failurePage) {
                    navigateToPage(failurePage);
                    return;
                }
            }
        }
        navigateToPage(nextBaseStep);
    }
  };

  const handleAction = (actionType: string, actionLink: string) => {
      if (!isLive) return;
      if (actionType === 'url') {
          window.open(actionLink.startsWith('http') ? actionLink : `https://${actionLink}`, '_blank');
          return;
      }
      if (actionType === 'page') {
          handleNextStep(actionLink);
          return;
      }
      if (actionType === 'quiz') {
          if (page.type === 'start') {
              const firstQuizPage = funnel.pages.find(p => p.type === 'quiz' && !p.parent_id);
              if (firstQuizPage) {
                  navigateToPage(firstQuizPage);
                  return;
              }
          }
          handleNextStep();
          return;
      }
      handleNextStep();
  };

  const navigateToLandingPage = () => {
    if (!isLive) return;
    const landingPage = funnel.pages.find(p => p.type === 'start') || funnel.pages[0];
    navigateToPage(landingPage);
  };

  const handleCtaClick = (linkType?: string, linkUrl?: string, element?: FunnelElement) => {
    if (!isLive) return;
    const effectiveType = linkType || 'quiz';
    if (element?.type === 'quiz-result' && element.content.cta) {
        const cta = element.content.cta;
        if (cta.linkType === 'whatsapp') {
            const num = (cta.whatsappNumber || '').replace(/\D/g, '');
            const msg = encodeURIComponent(replaceVariables(cta.whatsappMessage || ''));
            window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
            return;
        }
    }
    handleAction(effectiveType, linkUrl || '');
  };

  const handleAnswerSelect = (field: string, value: any, optionObj?: any) => {
    if (!isLive) return;
    const newAnswers = { ...activeAnswers, [field]: value };
    updateAnswers(newAnswers);
    
    if (onNextPage) {
        onNextPage(newAnswers);
        return;
    }

    if (optionObj?.disqualify) {
        const failurePage = funnel.pages.find(p => 
            p.type === 'end' && 
            (p.title.toLowerCase().includes('disqualified') || p.title.toLowerCase().includes('fail') || p.title.toLowerCase().includes('not qualified'))
        );
        if (failurePage) {
            navigateToPage(failurePage);
            return;
        }
    }

    handleAction(optionObj?.linkType || 'quiz', optionObj?.linkUrl || '');
  };

  const toggleMultiSelect = (val: string, field: string) => {
    if (!isLive) return;
    const current = Array.isArray(activeAnswers[field]) ? [...activeAnswers[field]] : [];
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    updateAnswers(prev => ({ ...prev, [field]: next }));
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhoneLength = (phone: string) => {
      const country = COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0];
      const digits = phone.replace(/\D/g, '');
      const countryDigits = country.dialCode.replace(/\D/g, '');
      const required = (country.format.match(/#/g)?.length || 0) + countryDigits.length;
      return digits.length === required;
  };

  const handleZipValidation = (field: string) => {
      if (!isLive) return false;
      const zipValue = activeAnswers[field] || '';
      const regex = new RegExp(selectedZipCountry.zipRegex);
      if (!zipValue.trim()) { setZipError(`Please enter your ${selectedZipCountry.code} zip code.`); return false; }
      if (!regex.test(zipValue.trim())) { setZipError(`Incorrect format for ${selectedZipCountry.name}. Use: ${selectedZipCountry.zipPlaceholder}`); return false; }
      setZipError(null);
      return true;
  }

  const handleFinalSubmit = async () => {
      if (!isLive || isSubmitting) return;
      const errors: Record<string, string> = {};
      const email = contactForm.email.trim().toLowerCase();
      
      if (!contactForm.name.trim()) errors.name = "Full name is required.";
      if (!email) errors.email = "Email is required.";
      else if (!validateEmail(email)) errors.email = "Please enter a valid email address.";
      if (!contactForm.phone.trim()) errors.phone = "Phone number is required.";
      else if (!validatePhoneLength(contactForm.phone)) errors.phone = "Please enter a complete phone number.";
      
      const fullE164Phone = contactForm.phone.replace(/[^\d+]/g, '');

      let emailVerifiedStatus = 'pending';

      if (funnel.settings.emailVerification?.enabled && !errors.email && isLive) {
          setIsSubmitting(true);
          try {
              const { data: verificationResult, error: verificationError } = await supabase.functions.invoke('verify-email-findymail', {
                  body: { 
                      email, 
                      workspace_id: funnel.workspaceId, 
                      funnel_id: funnel.id 
                  }
              });

              if (verificationError) throw verificationError;

              const findyData = verificationResult?.details || {};
              const isSafe = findyData.verified === true;
              const status = verificationResult?.status; 
              
              emailVerifiedStatus = isSafe ? 'Verified' : 'Unverified';
              const v = funnel.settings.emailVerification;

              let isBlocked = false;
              if (status === 'disposable' && !v.allowDisposable) {
                  isBlocked = true;
                  errors.email = "Disposable email addresses are restricted. Please use a work or personal email.";
              } else if (status === 'invalid' && !v.allowInvalid) {
                  isBlocked = true;
                  errors.email = "The email address provided is invalid. Please check for typos.";
              }

              if (isBlocked) {
                  setFormErrors(errors);
                  setIsSubmitting(false);
                  return; 
              }
          } catch (err) {
              console.error("Email verification engine failed:", err);
              emailVerifiedStatus = 'api_error';
          } finally {
              setIsSubmitting(false);
          }
      }

      if (Object.keys(errors).length > 0) { 
          setFormErrors(errors); 
          return; 
      }
      
      const enrichedAnswers = { 
          ...activeAnswers, 
          phone: fullE164Phone, 
          email: contactForm.email, 
          name: contactForm.name,
          email_verified_status: emailVerifiedStatus,
          phone_verified_status: 'pending'
      };
      
      updateAnswers(prev => ({ ...prev, ...enrichedAnswers }));

      setFormErrors({});
      setIsSubmitting(true);
      try {
        if (onNextPage) {
            await onNextPage(enrichedAnswers);
        } else {
            handleNextStep();
        }
      } catch (err) { 
          addToast("Something went wrong during submission.", "error");
      } finally { 
          setIsSubmitting(false); 
      }
  };

  const handleOtpChange = (idx: number, val: string) => {
      if (!isLive || isLockedOut) return;
      if (val.length > 1) val = val[val.length - 1];
      const next = [...otpPin];
      next[idx] = val;
      if (val && idx < 3) otpInputsRef.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
      if (!isLive || isLockedOut) return;
      if (e.key === 'Backspace' && !otpPin[idx] && idx > 0) otpInputsRef.current[idx - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
      if (!isLive || isLockedOut) return;
      const code = otpPin.join('');
      if (code.length < 4) { addToast("Please enter the full 4-digit code.", "info"); return; }
      setIsSubmitting(true);
      try {
          const workspaceId = funnel.workspaceId || localStorage.getItem('active_workspace_id');
          if (!workspaceId) throw new Error("Workspace not established.");
          const res = await verifyOtp(activeAnswers.phone, code, workspaceId);
          if (res.status === 'approved' && onPhoneVerified) await onPhoneVerified('verified');
          addToast("Identity Verified Successfully", "success");
          handleNextStep();
      } catch (err: any) { 
          const nextFailures = otpFailures + 1;
          setOtpFailures(nextFailures);
          setOtpPin(['', '', '', '']);
          otpInputsRef.current[0]?.focus();

          if (nextFailures >= MAX_OTP_FAILURES) {
              setIsLockedOut(true);
              addToast("Identity validation failed. Please return to the previous step or try again later.", "error");
          } else {
              addToast(`Invalid code. ${MAX_OTP_FAILURES - nextFailures} attempts remaining.`, "error"); 
          }
      } finally { 
          setIsSubmitting(false); 
      }
  };

  const handleResendOtp = async (silent = false) => {
      if (!isLive || isLockedOut) return;
      if (!activeAnswers.phone) { if (!silent) addToast("No phone number detected for verification.", "error"); return; }
      
      if (resendCountdown > 0 && !silent) {
          addToast(`Please wait ${resendCountdown}s before requesting a new code.`, "info");
          return;
      }
      if (resendAttempts >= MAX_RESENDS && !silent) {
          addToast("Maximum resend attempts reached for this session.", "error");
          return;
      }

      if (!silent) setIsResendingOtp(true);
      try {
          const workspaceId = funnel.workspaceId || localStorage.getItem('active_workspace_id');
          if (!workspaceId) throw new Error("Workspace not established.");
          await sendOtp(activeAnswers.phone, workspaceId, funnel.id);
          
          if (!silent) {
              const nextAttempt = resendAttempts + 1;
              setResendAttempts(nextAttempt);
              setResendCountdown(RESEND_DELAYS[Math.min(nextAttempt - 1, RESEND_DELAYS.length - 1)]);
              addToast("A new security code has been dispatched.", "success");
          }
      } catch (err: any) { 
          if (!silent) addToast(err.message || "Failed to dispatch code.", "error"); 
      } finally { 
          if (!silent) setIsResendingOtp(false); 
      }
  };

  const handleAcceptCookies = (mode: 'all' | 'necessary') => {
    if (!isLive) return;
    const finalSettings = mode === 'all' 
        ? { necessary: true, analytics: true, marketing: true }
        : { necessary: true, analytics: false, marketing: false };
    
    sessionStorage.setItem(`cookies_accepted_${funnel.id}`, 'true');
    sessionStorage.setItem(`cookies_settings_${funnel.id}`, JSON.stringify(finalSettings));
    setHasAcceptedCookies(true);
    setShowCookiePreferences(false);
  };

  const handleSaveCookiePreferences = () => {
    if (!isLive) return;
    sessionStorage.setItem(`cookies_accepted_${funnel.id}`, 'true');
    sessionStorage.setItem(`cookies_settings_${funnel.id}`, JSON.stringify(cookieSettings));
    setHasAcceptedCookies(true);
    setShowCookiePreferences(false);
  };

  const replaceVariables = (str: string) => {
    if (!str) return '';
    let result = str;
    const defaults: Record<string, string> = { 
        name: contactForm.name || activeAnswers.name || 'Partner',
        email: contactForm.email || activeAnswers.email || '',
        phone: contactForm.phone || activeAnswers.phone || '(555) 000-0000',
        estimatedValue: 'High-Value',
        industry: 'your industry',
        zipCode: 'your area',
        propertyType: 'your property',
        loanPurpose: 'your goal',
        nicheVertical: 'your niche',
        primaryGoal: 'your target'
    };
    
    Object.entries(activeAnswers).forEach(([key, val]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        const displayVal = Array.isArray(val) ? val.join(', ') : (typeof val === 'number' ? val.toLocaleString() : val?.toString() || '');
        if (displayVal) result = result.replace(regex, displayVal);
    });
    
    Object.entries(defaults).forEach(([key, val]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, val);
    });

    result = result.replace(/{[^}]+}/g, '');
    return result;
  };

  const getMetricValue = (rule: string) => {
      if (!rule) return '--';
      
      const getNum = (key: string, def: number) => {
          const val = activeAnswers[key];
          if (val === undefined || val === null || val === '') return def;
          const parsed = typeof val === 'number' ? val : parseInt(val.toString());
          return isNaN(parsed) ? def : parsed;
      };

      try {
          if (rule.toUpperCase().startsWith('IF')) {
              const evaluateCondition = (cond: string): boolean => {
                  let processed = cond;
                  Object.entries(activeAnswers).forEach(([k, v]) => {
                      const regex = new RegExp(`\\b${k}\\b`, 'g');
                      const valStr = typeof v === 'string' ? `'${v}'` : v;
                      processed = processed.replace(regex, String(valStr));
                  });
                  processed = processed.replace(/\bscore\b/g, String(totalScore));
                  processed = processed.replace(/\bsafetyFeatures.length\b/g, String((activeAnswers.safetyFeatures || []).length));
                  processed = processed.replace(/==/g, '===');
                  try { return new Function(`return (${processed})`)(); } catch (e) { return false; }
              };

              const parseIfThenElse = (input: string): string => {
                  const ifMatch = input.match(/IF\s+(.*?)\s+THEN\s+(.*?)(?:\s+ELSE\s+(.*))?$/i);
                  if (!ifMatch) return input.replace(/^\'|\'$/g, '');
                  const condition = ifMatch[1];
                  const thenPart = ifMatch[2].trim();
                  const elsePart = ifMatch[3]?.trim();
                  if (evaluateCondition(condition)) {
                      if (thenPart.toUpperCase().startsWith('IF')) return parseIfThenElse(thenPart);
                      return thenPart.replace(/^\'|\'$/g, '');
                  } else if (elsePart) {
                      if (elsePart.toUpperCase().startsWith('IF')) return parseIfThenElse(elsePart);
                      return elsePart.replace(/^\'|\'$/g, '');
                  }
                  return 'Qualified';
              };
              return parseIfThenElse(rule);
          }

          if (rule.toUpperCase().startsWith('CALCULATE')) {
              if (rule.includes('targetVolume * (closeRate/100) * saleValue')) {
                  const tv = getNum('targetVolume', 200);
                  const cr = getNum('closeRate', 10) / 100;
                  const sv = getNum('saleValue', 5000);
                  return `$${Math.round(tv * cr * sv).toLocaleString()}`;
              }
              if (rule.includes('propertyValue * 0.006')) {
                  const pv = getNum('propertyValue', 450000);
                  const ep = getNum('equityPercent', 20);
                  const monthly = pv * 0.006;
                  const final = ep > 20 ? monthly - 150 : monthly;
                  return `$${Math.round(final).toLocaleString()}`;
              }
              if (rule.includes('monthlyBill * 12 * 20')) {
                  const mb = getNum('monthlyBill', 150);
                  const total = mb * 12 * 20;
                  const modifier = totalScore > 70 ? 0.9 : totalScore < 50 ? 0.7 : 0.8;
                  return `$${Math.round(total * modifier).toLocaleString()}`;
              }
          }
      } catch (e) {
          console.debug("Calculation error:", e);
          return 'High Priority';
      }

      if (rule.includes('{')) return replaceVariables(rule);
      return rule;
  }

  const getAppliedButtonStyles = (style: ButtonStyle = {}, context: 'header' | 'hero' | 'other' = 'other') => {
      const activeStyle = (isMobile && style.mobile) ? { ...style, ...style.mobile } : style;
      const isFilled = activeStyle.variant !== 'outline';
      const sizeType = activeStyle.size || 'md';
      const sizeClasses = { sm: 'px-3 py-2 text-[12px]', md: 'px-4 py-3 text-sm', lg: 'px-6 py-4 text-base', xl: 'px-8 py-5 text-lg' }[sizeType as 'sm' | 'md' | 'lg' | 'xl'];
      const inlineStyles: React.CSSProperties = { backgroundColor: isFilled ? (activeStyle.backgroundColor || funnel.theme.primaryColor) : 'transparent', color: isFilled ? (activeStyle.textColor || '#ffffff') : (activeStyle.backgroundColor || funnel.theme.primaryColor), borderColor: isFilled ? 'transparent' : (activeStyle.backgroundColor || funnel.theme.primaryColor), borderWidth: '1px', fontWeight: '800' };
      
      const effectiveFullWidth = isMobile && context !== 'header'
        ? (activeStyle.fullWidth ?? true)
        : (activeStyle.fullWidth ?? false);

      const widthClasses = effectiveFullWidth ? 'w-full' : (context === 'header' ? 'w-full' : 'min-w-[180px]');
      return { classes: `${sizeClasses} rounded-lg ${widthClasses} transition-all active:scale-[0.95] flex items-center justify-center gap-3`, style: inlineStyles };
  }

  const StyledButton: React.FC<{ text: string; styleObj?: ButtonStyle; showIcon?: boolean; className?: string; onClick?: () => void | Promise<any>; leftIcon?: React.ReactNode; context?: 'header' | 'hero' | 'other'; disabled?: boolean }> = ({ text, styleObj, showIcon = true, className = '', onClick, leftIcon, context = 'other', disabled }) => {
      const { classes, style } = getAppliedButtonStyles(styleObj, context as 'header' | 'hero' | 'other');
      return <button onClick={onClick} disabled={disabled} className={`${classes} ${className} pointer-events-auto`} style={style}>{leftIcon} <span className="truncate">{text}</span> {showIcon && <ArrowRight size={18} strokeWidth={2} />}</button>;
  }

  const getAppliedTextStyles = (style: TextStyle = {}, sectionType: string, fieldType: 'headline' | 'subheadline' | 'other' = 'other') => {
      const activeStyle = (isMobile && style.mobile) ? { ...style, ...style.mobile } : style;
      const fontSize = activeStyle.fontSize || 'm';
      const desktopSizes: Record<string, Record<string, string>> = { headline: { s: 'text-xl', m: 'text-2xl md:text-3xl', l: 'text-4xl', xl: 'text-5xl' }, subheadline: { s: 'text-xs', m: 'text-sm md:text-base', l: 'text-lg', xl: 'text-xl' }, other: { s: 'text-[9px]', m: 'text-[10px]', l: 'text-xs', xl: 'text-sm' } };
      const mobileSizes: Record<string, Record<string, string>> = { headline: { s: 'text-xl', m: 'text-2xl', l: 'text-3xl', xl: 'text-4xl' }, subheadline: { s: 'text-xs', m: 'text-sm', l: 'text-base', xl: 'text-lg' }, other: { s: 'text-[9px]', m: 'text-[10px]', l: 'text-xs', xl: 'text-sm' } };
      const activeSizeMap = isMobile ? mobileSizes : desktopSizes;
      const sizeClass = activeSizeMap[fieldType][fontSize];
      const inlineStyles: React.CSSProperties = { color: activeStyle.color || '#1a2b3b', fontWeight: activeStyle.fontWeight === 'bold' || fieldType === 'headline' ? '900' : '500', textAlign: activeStyle.textAlign || (['quiz-step', 'quiz-processing', 'quiz-result'].includes(sectionType) ? 'center' : (isMobile ? 'center' : 'left')) as any };
      return { classes: `${sizeClass} font-black tracking-tight leading-[1.2]`, style: inlineStyles };
  }

  const StyledText: React.FC<{ content: string; styleObj?: TextStyle; sectionType: string; fieldType: 'headline' | 'subheadline' | 'other'; className?: string }> = ({ content, styleObj, sectionType, fieldType, className = '' }) => {
      const { classes, style } = getAppliedTextStyles(styleObj, sectionType, fieldType);
      const Component = fieldType === 'headline' ? 'h1' : fieldType === 'subheadline' ? 'p' : 'span';
      return <Component className={`${classes} ${className}`} style={style}>{content}</Component>;
  }

  const renderElement = (element: FunnelElement) => {
    const isSectionSelected = selectedElementId === element.id;
    const isFieldSelected = (field: string) => isSectionSelected && selectedField === field;
    const selectField = (field: string) => onSelectElement(element.id, field);
    const selectSection = () => onSelectElement(element.id, null);

    const brandingAction = () => handleAction(element.content.logoLinkType || 'quiz', element.content.logoLink || '');

    switch (element.type) {
      case 'header':
        const headerLogoHeight = { SM: 32, MD: 48, LG: 64 }[ (element.content.logoSize || 'MD') as 'SM' | 'MD' | 'LG'];
        const phoneStyle: TextStyle = element.content.phoneStyle || {};
        const activePhoneSize = { s: 'text-[10px]', m: 'text-xs', l: 'text-sm', xl: 'text-base' }[phoneStyle.fontSize || 'm'];
        return (
            <header key={element.id} id={element.id} data-element-id={element.id} onClick={(e) => { if (isLive) return; e.stopPropagation(); selectSection(); }} className={`z-[60] border-b border-gray-50 px-4 md:px-8 bg-white/90 backdrop-blur-md transition-all duration-200 relative ${isSectionSelected && !selectedField ? 'outline outline-2 outline-primary outline-dashed z-[500] shadow-2xl' : !isLive ? 'hover:outline hover:outline-1 hover:outline-primary/30' : ''}`} style={{ paddingTop: '60px', paddingBottom: '60px' }}>
                <div className="max-w-7xl mx-auto flex justify-between items-center gap-6 md:gap-12">
                    <div className={`flex items-center gap-2 md:gap-6 font-black text-xl md:text-2xl tracking-tighter shrink-0 ${isLive ? 'cursor-pointer' : ''}`} onClick={isLive ? brandingAction : undefined}>
                        {element.content.showLogo !== false && (
                            <Selectable disabled={isLive} isSelected={isFieldSelected('logoImage')} label="Logo" onSelect={() => selectField('logoImage')}>
                                {element.content.logoType === 'icon' ? (
                                    <div style={{ height: `${headerLogoHeight}px`, width: `${headerLogoHeight}px` }} className="flex items-center justify-center text-primary">
                                        <DynamicIcon name={element.content.logoIcon || 'Globe'} className="w-full h-full" />
                                    </div>
                                ) : element.content.logoImage ? (
                                    <img src={element.content.logoImage} style={{ height: `${headerLogoHeight}px` }} className="object-contain block" alt="Logo" />
                                ) : (
                                    <div style={{ height: `${headerLogoHeight}px`, width: `${headerLogoHeight}px` }}><LogoIcon className="w-full h-full" /></div>
                                )}
                            </Selectable>
                        )}
                        {element.content.showBrandText !== false && (
                            <Selectable disabled={isLive} isSelected={isFieldSelected('logoText')} label="Brand" onSelect={() => selectField('logoText')}>
                                <span className={`truncate max-w-[100px] sm:max-w-none text-[#1a2b3b]`}>{element.content.logoText}</span>
                            </Selectable>
                        )}
                    </div>
                    <div className="flex items-center gap-4 md:gap-10 flex-shrink min-w-0">
                        {!isMobile && element.content.phone && (
                            <Selectable disabled={isLive} isSelected={isFieldSelected('phone')} label="Phone" onSelect={() => selectField('phone')} className="hidden lg:flex">
                                <a href={isLive ? `tel:${element.content.phone.replace(/\D/g, '')}` : undefined} className={`flex items-center gap-2 transition-colors font-bold ${activePhoneSize} hover:opacity-70`} style={{ color: phoneStyle.color || '#9CA3AF' }}><Phone size={16}/> {element.content.phone}</a>
                            </Selectable>
                        )}
                        {element.content.showCta !== false && (
                            <Selectable disabled={isLive} isSelected={isFieldSelected('ctaText')} label="Header CTA" onSelect={() => selectField('ctaText')} className="min-w-0">
                                <StyledButton text={element.content.ctaText || 'Get Started'} styleObj={element.content.ctaTextStyle || { size: 'sm' }} showIcon={false} context="header" onClick={() => handleAction(element.content.ctaType || 'quiz', element.content.ctaLink || '')} />
                            </Selectable>
                        )}
                    </div>
                </div>
            </header>
        );

      case 'hero':
        const heroBtnStyle = element.content.heroCtaTextStyle || { size: 'lg' };
        const heroCtaFullWidth = isMobile 
            ? (heroBtnStyle.mobile?.fullWidth ?? true) 
            : (heroBtnStyle.fullWidth ?? false);

        return (
            <SectionWrapper key={element.id} id={element.id} element={element} isSelected={isSectionSelected && !selectedField} onSelect={selectSection} viewMode={viewMode} disabled={isLive}>
                <div className={`flex flex-col ${isMobile ? 'items-center text-center space-y-8' : 'items-start text-left space-y-12'} w-full`}>
                    <Selectable disabled={isLive} isSelected={isFieldSelected('headline')} label="Headline" onSelect={() => selectField('headline')} className="w-full"><StyledText content={element.content.headline || ''} styleObj={element.content.headlineStyle} sectionType="hero" fieldType="headline" /></Selectable>
                    {isMobile && <Selectable disabled={isLive} isSelected={isFieldSelected('heroImage')} label="Hero Image" onSelect={() => selectField('heroImage')} className="w-full"><img src={element.content.heroImage} className="rounded-[5px] shadow-2xl w-full h-auto object-cover aspect-[4/3]" alt="hero" /></Selectable>}
                    <Selectable disabled={isLive} isSelected={isFieldSelected('subheadline')} label="Subheadline" onSelect={() => selectField('subheadline')} className="w-full"><StyledText content={element.content.subheadline || ''} styleObj={element.content.subheadlineStyle} sectionType="hero" fieldType="subheadline" className="max-w-2xl opacity-60" /></Selectable>
                    <Selectable disabled={isLive} isSelected={isFieldSelected('heroCtaText')} label="Button" onSelect={() => selectField('heroCtaText')} className={heroCtaFullWidth ? 'w-full' : ''}><StyledButton text={element.content.heroCtaText || ''} styleObj={heroBtnStyle} context="hero" onClick={() => handleCtaClick(element.content.heroCtaType as any, element.content.heroCtaLink)} /></Selectable>
                </div>
                {!isMobile && <div className="relative"><Selectable disabled={isLive} isSelected={isFieldSelected('heroImage')} label="Hero Image" onSelect={() => selectField('heroImage')} className="w-full"><img src={element.content.heroImage} className="relative rounded-[50px] shadow-2xl w-full h-auto object-cover aspect-square ring-1 ring-black/5" alt="hero" /></Selectable></div>}
            </SectionWrapper>
        );

      case 'logos':
        return (
            <SectionWrapper key={element.id} id={element.id} element={element} isSelected={isSectionSelected && !selectedField} onSelect={selectSection} viewMode={viewMode} className="border-y border-gray-50" fullWidthContent={true} disabled={isLive}>
                <div className="flex overflow-hidden relative mask-linear-fade w-full opacity-30 grayscale hover:opacity-50 hover:grayscale-0 transition-all duration-700"><div className="flex animate-scroll whitespace-nowrap min-w-full gap-16 md:gap-40 items-center py-10">{(element.content.logos || UNIVERSAL_LOGOS).concat(element.content.logos || UNIVERSAL_LOGOS).map((logo: any, i: number) => (<img key={i} src={logo.src} alt={logo.alt} className="h-10 md:h-14 object-contain shrink-0" />))}</div></div>
            </SectionWrapper>
        );

      case 'how-it-works':
        return (
            <SectionWrapper key={element.id} id={element.id} element={element} isSelected={isSectionSelected && !selectedField} onSelect={selectSection} viewMode={viewMode} disabled={isLive}>
                <div className="w-full space-y-20">
                    <div className="text-center space-y-6 flex flex-col items-center">
                        <Selectable disabled={isLive} isSelected={isFieldSelected('headline')} label="Headline" onSelect={() => selectField('headline')}><StyledText content={element.content.headline || ''} styleObj={element.content.headlineStyle} sectionType="how-it-works" fieldType="headline" /></Selectable>
                        <Selectable disabled={isLive} isSelected={isFieldSelected('subheadline')} label="Desc" onSelect={() => selectField('subheadline')}><StyledText content={element.content.subheadline || ''} styleObj={element.content.subheadlineStyle} sectionType="how-it-works" fieldType="subheadline" className="max-w-2xl mx-auto opacity-50" /></Selectable>
                    </div>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-12' : 'grid-cols-3 gap-16'}`}>
                        {element.content.steps?.map((step: any, idx: number) => (
                            <div key={idx} className="flex flex-col items-center text-center space-y-8">
                                <div className="w-24 h-24 rounded-[5px] bg-[#F8FAFC] border-2 border-gray-100 flex items-center justify-center text-[#1a2b3b] shadow-sm"><DynamicIcon name={step.icon} className="w-10 h-10" /></div>
                                <div className="space-y-4"><h3 className="text-2xl font-black text-[#1a2b3b]">{step.title}</h3><p className="text-gray-500 font-medium leading-relaxed opacity-70">{step.description}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionWrapper>
        );

      case 'testimonials-slider':
        return (
            <SectionWrapper key={element.id} id={element.id} element={element} isSelected={isSectionSelected && !selectedField} onSelect={selectSection} viewMode={viewMode} disabled={isLive}>
                <div className="w-full space-y-20">
                    <div className="text-center space-y-6 flex flex-col items-center">
                        <Selectable disabled={isLive} isSelected={isFieldSelected('headline')} label="Headline" onSelect={() => selectField('headline')}><StyledText content={element.content.headline || ''} styleObj={element.content.headlineStyle} sectionType="testimonials-slider" fieldType="headline" /></Selectable>
                        <Selectable disabled={isLive} isSelected={isFieldSelected('subheadline')} label="Desc" onSelect={() => selectField('subheadline')}><StyledText content={element.content.subheadline || ''} styleObj={element.content.subheadlineStyle} sectionType="testimonials-slider" fieldType="subheadline" className="max-w-2xl mx-auto opacity-50" /></Selectable>
                    </div>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-3 gap-10'} w-full`}>
                        {element.content.testimonials?.map((t: any, idx: number) => (
                            <div key={idx} className="bg-white p-10 rounded-[5px] border border-gray-100 shadow-xl flex flex-col justify-between group hover:shadow-2xl transition-all duration-500">
                                <div className="space-y-6">
                                    <div className="flex text-orange-400 gap-1 opacity-50">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}</div>
                                    <p className="text-xl font-bold text-[#1a2b3b] leading-relaxed italic">"{t.quote}"</p>
                                </div>
                                <div className="flex items-center gap-4 pt-8 mt-12 border-t border-gray-50">
                                    <img src={t.avatar} className="w-14 h-14 rounded-[5px] object-cover shadow-lg border-2 border-white" alt={t.author} />
                                    <div><p className="font-black text-[#1a2b3b] text-base">{t.author}</p><p className="text-[10px] font-black uppercase text-primary">{t.role}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionWrapper>
        );

      case 'faq':
        return (
            <SectionWrapper key={element.id} id={element.id} element={element} isSelected={isSectionSelected && !selectedField} onSelect={selectSection} viewMode={viewMode} disabled={isLive}>
                <div className="max-w-3xl mx-auto w-full space-y-16">
                    <div className="text-center space-y-4"><Selectable disabled={isLive} isSelected={isFieldSelected('headline')} label="Headline" onSelect={() => selectField('headline')}><StyledText content={element.content.headline || 'Common Inquiries'} styleObj={element.content.headlineStyle} sectionType="faq" fieldType="headline" /></Selectable></div>
                    <div className="space-y-4">
                        {element.content.faqItems?.map((item: any, i: number) => (
                            <div key={i} className="bg-white border-2 border-gray-100 rounded-[5px] overflow-hidden shadow-sm">
                                <button onClick={() => { if (isLive) setOpenFaq(openFaq === i ? null : i); }} className="w-full px-10 py-8 text-left flex items-center justify-between gap-4"><span className="text-xl font-black text-[#1a2b3b]">{item.question}</span><div className={`p-2 rounded-lg transition-all duration-500 ${openFaq === i ? 'bg-[#1a2b3b] text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}><ChevronDown size={20} strokeWidth={3} /></div></button>
                                <div className={`overflow-hidden transition-all duration-500 ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}><div className="px-10 pb-10 text-lg text-gray-500 font-medium leading-relaxed">{item.answer}</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionWrapper>
        );

      case 'quiz-step':
        const quizType = element.content.quizType;
        const fieldName = element.content.field || 'answer';
        const validation = element.content.validation || {};
        return (
            <SectionWrapper key={element.id} id={element.id} element={element} isSelected={isSectionSelected && !selectedField} onSelect={selectSection} viewMode={viewMode} disabled={isLive}>
                <div className="w-full max-w-2xl mx-auto space-y-16">
                    <div className="text-center space-y-6">
                        {funnel.settings.progressBar && (
                            <div className="flex flex-col items-center gap-2 mb-10">
                                <div className="h-1.5 w-64 bg-slate-100 rounded-full overflow-hidden p-0.5"><div className="h-full bg-[#1a2b3b] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
                                <span className="text-[9px] font-black uppercase text-slate-400">Campaign Accuracy: {Math.round(progress)}%</span>
                            </div>
                        )}
                        <Selectable disabled={isLive} isSelected={isFieldSelected('question')} label="Question" onSelect={() => selectField('question')} className="w-full"><StyledText content={replaceVariables(element.content.question || '')} styleObj={element.content.questionStyle} sectionType="quiz-step" fieldType="headline" /></Selectable>
                        <Selectable disabled={isLive} isSelected={isFieldSelected('subtitle')} label="Desc" onSelect={() => selectField('subtitle')} className="w-full"><StyledText content={replaceVariables(element.content.subtitle || '')} styleObj={element.content.subtitleStyle} sectionType="quiz-step" fieldType="subheadline" className="opacity-50" /></Selectable>
                    </div>
                    <div className="w-full pb-10">
                        <Selectable disabled={isLive} isSelected={isFieldSelected('options')} label="Answers & Scoring" onSelect={() => selectField('options')} className="w-full">
                            {quizType === 'single' && (
                                <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
                                    {element.content.options?.map((opt: any, i: number) => (
                                        <button key={i} onClick={() => handleAnswerSelect(fieldName, opt.value, opt)} className="group p-8 bg-white border-2 border-gray-100 rounded-[24px] hover:border-[#1a2b3b] hover:shadow-2xl transition-all duration-500 text-left flex items-center gap-6 active:scale-[0.96] shadow-sm overflow-hidden">
                                            <div className="w-14 h-14 rounded-lg bg-slate-50 text-[#1a2b3b] flex items-center justify-center group-hover:bg-[#1a2b3b] group-hover:text-white transition-all"><DynamicIcon name={opt.icon || 'Zap'} className="w-7 h-7" /></div>
                                            <span className="text-xl font-black text-[#1a2b3b]">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {quizType === 'multiple' && (
                                <div className="space-y-10">
                                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
                                        {element.content.options?.map((opt: any, i: number) => {
                                            const isSelected = Array.isArray(activeAnswers[fieldName]) && activeAnswers[fieldName].includes(opt.value);
                                            return (
                                                <button key={i} onClick={() => toggleMultiSelect(opt.value, fieldName)} className={`group p-8 bg-white border-2 rounded-[24px] transition-all duration-500 text-left flex items-center gap-6 active:scale-[0.96] shadow-sm ${isSelected ? 'border-[#1a2b3b] bg-slate-50' : 'border-gray-100 hover:border-gray-300'}`}>
                                                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-[#1a2b3b] text-white' : 'bg-slate-50 text-[#1a2b3b]'}`}>
                                                        {isSelected ? <Check size={28} strokeWidth={4} /> : <DynamicIcon name={opt.icon || 'Plus'} className="w-7 h-7" />}
                                                    </div>
                                                    <span className="text-xl font-black text-[#1a2b3b]">{opt.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <StyledButton text={element.content.cta?.text || 'Next Phase'} styleObj={element.content.cta?.style} onClick={() => handleNextStep()} />
                                </div>
                            )}
                        </Selectable>

                        {quizType === 'slider' && (
                            <div className="space-y-10 py-6 px-4">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground">Selection Range</span>
                                    <span className="text-4xl font-black text-primary tracking-tighter">{validation.format === 'currency' ? '$' : ''}{(activeAnswers[fieldName] ?? validation.default ?? validation.min ?? 50).toLocaleString()}{validation.format === 'percent' ? '%' : ''}</span>
                                </div>
                                <input type="range" disabled={!isLive} min={validation.min || 0} max={validation.max || 100} step={validation.step || 1} value={activeAnswers[fieldName] ?? validation.default ?? validation.min ?? 50} onChange={(e) => { if (isLive) updateAnswers(prev => ({ ...prev, [fieldName]: parseInt(e.target.value) })); }} className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary" />
                                <StyledButton text={element.content.cta?.text || 'Next Phase'} styleObj={element.content.cta?.style} onClick={() => handleNextStep()} />
                            </div>
                        )}
                        {quizType === 'zip' && (
                            <div className="max-w-md mx-auto space-y-6">
                                <ZipInput value={activeAnswers[fieldName] || ''} disabled={!isLive} onChange={(val) => { if (!isLive) return; updateAnswers(prev => ({ ...prev, [fieldName]: val })); if (zipError) setZipError(null); }} onCountryChange={setSelectedZipCountry} inputClassName="py-6 rounded-[5px] focus:border-primary shadow-inner bg-slate-50 border-2 border-slate-100" />
                                {zipError && <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest"><AlertCircle size={14} /> {zipError}</div>}
                                <StyledButton text={element.content.cta?.text || 'Confirm Territory'} styleObj={element.content.cta?.style} onClick={() => { if (handleZipValidation(fieldName)) handleNextStep(); }} />
                            </div>
                        )}
                        {quizType === 'otp' && (
                            <div className="max-w-md mx-auto space-y-10 w-full">
                                <div className="flex justify-center gap-3">
                                    {otpPin.map((digit, idx) => (<input key={idx} ref={el => { otpInputsRef.current[idx] = el; }} type="text" readOnly={!isLive || isLockedOut} inputMode="numeric" maxLength={1} value={digit} placeholder="0" onChange={(e) => handleOtpChange(idx, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(idx, e)} className={`w-16 h-20 text-center text-4xl font-black bg-white border-4 rounded-[20px] focus:border-primary outline-none transition-all shadow-sm text-[#1a2b3b] ${isLockedOut ? 'border-rose-100 bg-rose-50/50 opacity-50' : 'border-gray-200'}`} />))}
                                </div>
                                <div className="flex flex-col items-center gap-6">
                                    {isLockedOut ? (
                                        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-center space-y-3 animate-fade-in-down">
                                            <ShieldAlert className="text-rose-500 mx-auto" size={32} />
                                            <p className="text-xs font-black text-rose-900 uppercase tracking-widest">Identity Lockout Active</p>
                                            <p className="text-[11px] text-rose-800/70 font-medium">Too many failed attempts. Security protocol activated.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <StyledButton text={element.content.cta?.text || 'Verify Identity'} styleObj={element.content.cta?.style} disabled={isSubmitting || isLockedOut} leftIcon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={24} />} onClick={handleVerifyOtp} />
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-[11px] font-bold text-gray-400">Didn't receive code?</p>
                                                {resendCountdown > 0 ? (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                                                        <Clock size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Resend in {resendCountdown}s</span>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        disabled={isResendingOtp || !isLive || resendAttempts >= MAX_RESENDS} 
                                                        onClick={() => handleResendOtp()} 
                                                        className={`text-[11px] font-black uppercase tracking-widest underline underline-offset-4 transition-all ${resendAttempts >= MAX_RESENDS ? 'text-gray-300 cursor-not-allowed' : 'text-primary hover:text-primary/70'}`}
                                                    >
                                                        {resendAttempts >= MAX_RESENDS ? 'Max attempts reached' : 'Resend Security Code'}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        {quizType === 'input' && fieldName === 'contactInfo' && (
                            <div className="space-y-8 bg-white p-10 md:p-16 rounded-[24px] border border-gray-100 shadow-xl text-left max-w-xl mx-auto">
                                <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Full Identity</label><div className="relative"><UserCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} /><input type="text" disabled={!isLive} placeholder="John Doe" value={contactForm.name} onChange={(e) => { setContactForm({ ...contactForm, name: e.target.value }); if (formErrors.name) setFormErrors({ ...formErrors, name: '' }); }} className={`w-full pl-16 pr-6 py-6 bg-slate-50 border-2 rounded-[24px] font-black text-lg focus:border-primary focus:bg-white outline-none transition-all ${formErrors.name ? 'border-rose-500' : 'border-slate-100'}`} /></div></div>
                                <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Digital Endpoint</label><div className="relative"><Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} /><input type="email" disabled={!isLive} placeholder="john@agency.com" value={contactForm.email} onChange={(e) => { setContactForm({ ...contactForm, email: e.target.value }); if (formErrors.email) setFormErrors({ ...formErrors, email: '' }); }} className={`w-full pl-16 pr-6 py-6 bg-slate-50 border-2 rounded-[24px] font-black text-lg focus:border-primary focus:bg-white outline-none transition-all ${formErrors.email ? 'border-rose-500' : 'border-slate-100'}`} /></div>{formErrors.email && <div className="flex items-start gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest mt-1.5 ml-2"><AlertCircle size={14} className="shrink-0" /><span>{formErrors.email}</span></div>}</div>
                                <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Mobile Line</label><PhoneInput value={contactForm.phone} disabled={!isLive} onCountryChange={setSelectedCountryCode} onChange={(val) => { setContactForm({ ...contactForm, phone: val }); if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' }); }} inputClassName={`py-6 rounded-[24px] font-black text-lg focus:border-primary shadow-inner bg-slate-50 border-2 border-slate-100 transition-all ${formErrors.phone ? 'border-rose-500' : ''}`} /></div>
                                {element.content.showOtherField && <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">{element.content.otherFieldLabel || 'Additional Notes'}</label><div className="relative"><Type className="absolute left-6 top-6 text-muted-foreground" size={20} /><textarea rows={3} disabled={!isLive} placeholder="Type anything else..." value={contactForm.other} onChange={(e) => setContactForm({ ...contactForm, other: e.target.value })} className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-medium text-base focus:border-primary outline-none transition-all resize-none" /></div></div>}
                                <StyledButton disabled={isSubmitting} text={element.content.cta?.text || 'Generate Report'} styleObj={element.content.cta?.style} onClick={handleFinalSubmit} leftIcon={isSubmitting ? <Loader2 className="animate-spin" size={32} /> : null} />
                            </div>
                        )}
                        {quizType === 'input' && fieldName !== 'contactInfo' && (
                            <div className="max-w-xl mx-auto">
                                <textarea rows={4} disabled={!isLive} placeholder={element.content.placeholder || "Type your detailed answer here..."} value={activeAnswers[fieldName] || ''} onChange={(e) => updateAnswers(prev => ({ ...prev, [fieldName]: e.target.value }))} className="w-full p-8 bg-white border-2 border-gray-100 rounded-[32px] font-medium text-lg focus:border-primary outline-none transition-all shadow-xl resize-none" />
                                <StyledButton text={element.content.cta?.text || 'Next Phase'} styleObj={element.content.cta?.style} onClick={() => handleNextStep()} />
                            </div>
                        )}
                    </div>
                </div>
            </SectionWrapper>
        );

      case 'quiz-processing':
        return (
            <SectionWrapper key={element.id} id={element.id} element={element} isSelected={isSectionSelected && !selectedField} onSelect={selectSection} viewMode={viewMode} disabled={isLive}>
                <div className="w-full max-w-2xl mx-auto py-20 flex flex-col items-center justify-center text-center space-y-12">
                    <div className="relative"><div className="w-32 h-32 border-8 border-slate-100 border-t-primary rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><LogoIcon className="w-12 h-12 opacity-20" /></div></div>
                    <div className="space-y-4"><h2 className="text-3xl font-black text-[#1a2b3b]">{element.content.headline || 'Analyzing Responses...'}</h2><p className="text-gray-500 font-medium text-lg">{element.content.subheadline || 'Our AI engine is matching your profile with optimal providers.'}</p></div>
                </div>
            </SectionWrapper>
        );

      case 'quiz-result':
        const metricCount = element.content.metrics?.length || 0;
        const gridColsClass = isMobile 
            ? 'grid-cols-1 gap-8' 
            : metricCount === 1 
                ? 'grid-cols-1 max-w-md mx-auto gap-12' 
                : metricCount === 2 
                    ? 'grid-cols-2 max-w-2xl mx-auto gap-12' 
                    : 'grid-cols-3 gap-12';
        
        return (
            <SectionWrapper key={element.id} id={element.id} element={element} isSelected={isSectionSelected && !selectedField} onSelect={selectSection} viewMode={viewMode} disabled={isLive}>
                <div className="w-full max-w-5xl mx-auto space-y-20 py-10">
                    <div className="text-center space-y-8"><div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[5px] flex items-center justify-center mx-auto mb-6 border-2 border-emerald-100 shadow-xl"><CheckCircle2 size={56} strokeWidth={3} /></div><StyledText content={replaceVariables(element.content.headline || 'Report Synchronized!')} styleObj={element.content.headlineStyle} sectionType="quiz-result" fieldType="headline" /><StyledText content={replaceVariables(element.content.subheadline || 'Based on your data, we have identified these key savings.')} styleObj={element.content.subheadlineStyle} sectionType="quiz-result" fieldType="subheadline" className="max-w-3xl mx-auto opacity-50" /></div>
                    <div className={`grid ${gridColsClass}`}>{element.content.metrics?.map((m: any, i: number) => (<div key={i} className="bg-white p-12 rounded-[24px] border border-gray-100 shadow-sm transition-all duration-700 flex flex-col items-center text-center group"><div className="w-20 h-20 bg-slate-50 text-[#1a2b3b] rounded-lg flex items-center justify-center mb-10 group-hover:bg-[#1a2b3b] group-hover:text-white transition-all"><DynamicIcon name={m.icon} className="w-10 h-10" /></div><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{m.label}</h3><p className="text-2xl font-black text-[#1a2b3b] mb-4 tracking-tighter">{getMetricValue(m.valueRule)}</p><p className="text-base text-gray-500 font-medium leading-relaxed opacity-70">{m.description}</p></div>))}</div>
                    <div className="flex flex-col items-center gap-8 pt-10">
                        {element.content.cta?.enabled !== false && <StyledButton leftIcon={element.content.cta?.linkType === 'whatsapp' ? <MessageCircle size={18} fill="currentColor" /> : null} text={element.content.cta?.text || 'Access Full Results'} styleObj={element.content.cta?.style} context="other" onClick={() => handleCtaClick(element.content.cta?.linkType, element.content.cta?.link, element)} />}
                    </div>
                </div>
            </SectionWrapper>
        );

      case 'footer-complex':
        const footerLogoHeight = { SM: 32, MD: 48, LG: 64 }[ (element.content.logoSize || 'MD') as 'SM' | 'MD' | 'LG'];
        return (
            <footer key={element.id} id={element.id} data-element-id={element.id} onClick={(e) => { if (isLive) return; e.stopPropagation(); selectSection(); }} className={`transition-all duration-300 relative border-t border-white/5`} style={{ backgroundColor: element.style?.backgroundColor || '#0B1222', color: element.style?.color || '#ffffff', paddingTop: '60px', paddingBottom: '60px' }}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className={`grid grid-cols-1 ${isMobile ? 'gap-12' : 'md:grid-cols-3 gap-24'} mb-16`}>
                        <div className="space-y-8">
                            <div className={`flex items-center gap-3 font-black text-3xl tracking-tighter ${isLive ? 'cursor-pointer' : ''}`} onClick={isLive ? brandingAction : undefined}>
                                {element.content.showLogo !== false && (
                                    <Selectable disabled={isLive} isSelected={isFieldSelected('logoImage')} label="Logo" onSelect={() => selectField('logoImage')}>
                                        {element.content.logoType === 'icon' ? (
                                            <div style={{ height: `${footerLogoHeight}px`, width: `${footerLogoHeight}px` }} className="flex items-center justify-center text-white">
                                                <DynamicIcon name={element.content.logoIcon || 'Globe'} className="w-full h-full" />
                                            </div>
                                        ) : element.content.logoImage ? (
                                            <img src={element.content.logoImage} style={{ height: `${footerLogoHeight}px` }} className="h-10 w-auto object-contain" alt="Logo" />
                                        ) : (
                                            <LogoIcon className="w-10 h-10 brightness-0 invert" />
                                        )}
                                    </Selectable>
                                )}
                                {element.content.showBrandText !== false && (
                                    <Selectable disabled={isLive} isSelected={isFieldSelected('logoText')} label="Brand" onSelect={() => selectField('logoText')}>
                                        <span className="text-white uppercase">{element.content.logoText}</span>
                                    </Selectable>
                                )}
                            </div>
                            <Selectable disabled={isLive} isSelected={isFieldSelected('footerDescription')} label="Desc" onSelect={() => selectField('footerDescription')}>
                                <p className="text-gray-400 text-base font-medium leading-relaxed max-w-sm">{element.content.footerDescription || 'Precision lead generation solutions powered by Wisefunnel Technologies.'}</p>
                            </Selectable>
                        </div>
                        <div className="space-y-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Quick Navigation</h4>
                            <ul className="space-y-6">
                                {element.content.mainLinks?.map((link: any, i: number) => (
                                    <li key={i}><a href={isLive ? (link.href || '#') : undefined} className="text-white text-sm font-black hover:text-primary transition-all">{link.text}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-white/5 text-center space-y-6">
                        <Selectable disabled={isLive} isSelected={isFieldSelected('copyrightText')} label="Copyright" onSelect={() => selectField('copyrightText')}>
                            <p className="text-gray-600 text-[11px] font-black uppercase tracking-[0.3em]">{element.content.copyrightText || `© ${new Date().getFullYear()} ALL RIGHTS RESERVED.`}</p>
                        </Selectable>
                    </div>
                </div>
            </footer>
        );

      default:
        return null;
    }
  }

  return (
    <div 
        ref={canvasRef} 
        className={`${isLive ? 'w-full min-h-screen relative' : 'flex-1 overflow-y-auto bg-[#F9FAFB] transition-all duration-700 scroll-smooth scrollbar-hide relative'} ${!isLive && isMobile ? 'max-w-md mx-auto my-12 rounded-[64px] shadow-2xl border-[14px] border-[#0F172A] h-[calc(100vh-160px)] relative overflow-hidden' : ''}`}
    >
      <div className={`${isLive ? '' : 'bg-white min-h-full flex flex-col selection:bg-primary/20'}`}>
        {page.type !== 'start' && globalHeader && renderElement(globalHeader)}
        {page.elements.map(renderElement)}
        {page.type !== 'start' && globalFooter && renderElement(globalFooter)}
      </div>

      {isLive && !funnel.settings.hideBranding && (
          <a 
              href="https://wisefunnel.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[2000] flex items-center gap-2 px-3 py-2 bg-orange-500 rounded-2xl shadow-2xl transition-all group overflow-hidden"
          >
              <img src="https://iwvlmpgeodctctmaacja.supabase.co/storage/v1/object/public/Logos/logo_qhite_wisefunnekl.webp" alt="WiseFunnel Logo" className="w-5 h-5 md:w-6 md:h-6" />
              <div className="flex flex-col pr-1">
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider text-white leading-none mb-0.5">Built with</span>
                  <span className="text-[10px] md:text-xs font-black text-white tracking-tight leading-none">WiseFunnel</span>
              </div>
              <ExternalLink size={10} className="text-white" />
          </a>
      )}

      {isLive && page.type === 'start' && funnel.settings.cookieBanner?.enabled && !hasAcceptedCookies && (
          <div className="fixed bottom-10 left-10 right-10 md:left-auto md:max-w-md z-[1000] animate-slide-in-right">
              <div className="bg-white/95 backdrop-blur-2xl border border-border p-8 rounded-[32px] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.3)] space-y-6">
                  <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"><Cookie size={24} strokeWidth={2.5} /></div>
                      <div className="space-y-1">
                          <h4 className="text-sm font-black text-[#1a2b3b] uppercase tracking-widest">Cookie Transparency</h4>
                          <p className="text-sm font-medium text-gray-600 leading-relaxed">{funnel.settings.cookieBanner?.text || 'We utilize specialized tracking artifacts to optimize your experience.'}</p>
                      </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                      <button 
                        onClick={() => handleAcceptCookies('all')}
                        className="w-full py-4 bg-[#1a2b3b] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.95] transition-all"
                      >
                        {funnel.settings.cookieBanner?.allLabel || 'Accept All'}
                      </button>
                      
                      {funnel.settings.cookieBanner?.showNecessary !== false && (
                        <button 
                            onClick={() => handleAcceptCookies('necessary')}
                            className="w-full py-4 bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-[0.95] transition-all hover:bg-slate-200"
                        >
                            {funnel.settings.cookieBanner?.necessaryLabel || 'Accept Necessary Only'}
                        </button>
                      )}

                      {funnel.settings.cookieBanner?.showPreferences !== false && (
                        <button 
                            onClick={() => setShowCookiePreferences(true)}
                            className="text-xs font-black text-primary underline underline-offset-4 hover:opacity-70 transition-all uppercase tracking-widest mt-2"
                        >
                            {funnel.settings.cookieBanner?.preferencesLabel || 'Manage Preferences'}
                        </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      <AnimatePresence>
        {showCookiePreferences && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-border"
                >
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                                <Settings size={20} />
                            </div>
                            <h2 className="text-xl font-black text-[#1a2b3b] tracking-tight">Cookie Settings</h2>
                        </div>
                        <button onClick={() => setShowCookiePreferences(false)} className="p-2 text-gray-400 hover:bg-muted rounded-full transition-all"><X size={20}/></button>
                    </div>

                    <div className="p-10 space-y-6 overflow-y-auto scrollbar-hide">
                        <div className="flex items-start justify-between p-5 bg-slate-50 border border-border rounded-2xl opacity-70">
                            <div className="space-y-1 max-w-[70%]">
                                <p className="text-sm font-black text-[#1a2b3b] uppercase tracking-tight">Necessary Cookies</p>
                                <p className="text-[10px] text-gray-500 font-medium">Core platform security and session management. Cannot be disabled.</p>
                            </div>
                            <div className="w-10 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                        </div>

                        <div className="flex items-start justify-between p-5 bg-white border border-border rounded-2xl group hover:border-primary/30 transition-all">
                            <div className="space-y-1 max-w-[70%]">
                                <p className="text-sm font-black text-[#1a2b3b] uppercase tracking-tight">Analytics Cookies</p>
                                <p className="text-[10px] text-gray-500 font-medium">Helps us understand visitor behavior to optimize the funnel flow.</p>
                            </div>
                            <button 
                                onClick={() => setCookieSettings(prev => ({ ...prev, analytics: !prev.analytics }))}
                                className={`w-11 h-6 rounded-full relative transition-all duration-300 shadow-inner ${cookieSettings.analytics ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${cookieSettings.analytics ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-start justify-between p-5 bg-white border border-border rounded-2xl group hover:border-primary/30 transition-all">
                            <div className="space-y-1 max-w-[70%]">
                                <p className="text-sm font-black text-[#1a2b3b] uppercase tracking-tight">Marketing Cookies</p>
                                <p className="text-[10px] text-gray-500 font-medium">Used for cross-channel attribution and ad targeting optimization.</p>
                            </div>
                            <button 
                                onClick={() => setCookieSettings(prev => ({ ...prev, marketing: !prev.marketing }))}
                                className={`w-11 h-6 rounded-full relative transition-all duration-300 shadow-inner ${cookieSettings.marketing ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${cookieSettings.marketing ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-border flex gap-4">
                        <button 
                            onClick={handleSaveCookiePreferences}
                            className="flex-1 py-4 bg-[#1a2b3b] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.95] transition-all"
                        >
                            Save Selection
                        </button>
                        <button 
                            onClick={() => handleAcceptCookies('all')}
                            className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.95] transition-all"
                        >
                            Accept All
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {toasts.length > 0 && (
          <div className="fixed bottom-10 right-10 z-[1100] flex flex-col gap-4 pointer-events-none">{toasts.map((toast) => (
              <div key={toast.id} className="pointer-events-auto flex items-center gap-3 px-5 py-4 bg-[#1a2b3b] text-white rounded-[16px] shadow-xl min-w-[380px] animate-slide-in-right border border-white/10 overflow-hidden relative group"><div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-50/20 text-emerald-400' : toast.type === 'error' ? 'bg-rose-50/20 text-rose-400' : 'bg-blue-50/20 text-blue-400'}`}>{toast.type === 'success' ? <CheckCircle2 size={32} /> : toast.type === 'error' ? <AlertCircle size={32} /> : <Zap size={32} />}</div><div className="flex-1"><p className="text-[10px] font-black uppercase opacity-40 mb-1 tracking-[0.2em]">{toast.type === 'success' ? 'Synchronized' : 'System Alert'}</p><p className="text-base font-black tracking-tight">{toast.message}</p></div><button onClick={() => removeToast(toast.id)} className="p-1 opacity-30 hover:opacity-100 transition-opacity"><X size={24} /></button></div>))}</div>
      )}
    </div>
  );
};

export default PreviewArea;
