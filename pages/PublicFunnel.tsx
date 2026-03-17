
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import { Funnel, FunnelPage } from '../types';
import { Globe, AlertCircle, Loader2 } from 'lucide-react';
import PreviewArea from '../components/PreviewArea';
import { upsertLead, type LeadUpsertResult, type LeadContactData } from '../services/leadService';
import LogoIcon from '../components/LogoIcon';

interface PublicFunnelProps {
    domainSlug?: string;
}

const PublicFunnel: React.FC<PublicFunnelProps> = ({ domainSlug }) => {
    const params = useParams<{ funnelId: string; "*" : string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [funnel, setFunnel] = useState<Funnel | null>(null);
    const [activePage, setActivePage] = useState<FunnelPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Quiz answers accumulator - separate from contact data
    const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
    
    // Track the persisted lead after upsert (avoid duplicates)
    const [currentLeadResult, setCurrentLeadResult] = useState<LeadUpsertResult | null>(null);

    // Ref to prevent duplicate lead submissions
    const isSubmittingLead = useRef(false);

    const funnelIdFromPath = params.funnelId;
    const isPreview = searchParams.get('preview') === 'true';

    const [resolvedFunnelId, setResolvedFunnelId] = useState<string | null>(null);

    // Removed sessionStorage leadId tracking - we rely on database as source of truth
    // currentLeadId state replaced by currentLeadResult from upsertLead()

    const getTargetViewMode = useCallback(() => {
        const urlOverride = searchParams.get('v');
        if (urlOverride === 'm') return 'mobile';
        if (urlOverride === 'd') return 'desktop';
        return window.innerWidth < 768 ? 'mobile' : 'desktop';
    }, [searchParams]);

    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(getTargetViewMode());

    useEffect(() => {
        const handleResize = () => {
            if (!searchParams.get('v')) { // Only adjust if 'v' param is not set
                const newMode = window.innerWidth < 768 ? 'mobile' : 'desktop';
                setViewMode(prev => prev !== newMode ? newMode : prev);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [searchParams]);

    // Track page visits
    useEffect(() => {
        if (funnel?.id && activePage?.id && !isPreview) {
            const recordVisit = async () => {
                const sessionKey = `wf_v_p_${activePage.id}`;
                // Check if visit for this page in this session is already recorded
                if (sessionStorage.getItem(sessionKey)) return;
                
                try {
                    // Call the Supabase RPC function to increment page visits
                    await supabase.rpc('increment_funnel_page_visits', { page_id_input: activePage.id });
                    sessionStorage.setItem(sessionKey, 'true'); // Mark as visited for this session
                } catch (err) {
                    console.error("Page visit recording error:", err);
                }
            };
            recordVisit();
        }
    }, [funnel?.id, activePage?.id, isPreview]);

    // Fetch funnel data
    useEffect(() => {
        const fetchPublicFunnel = async () => {
            try {
                setLoading(true);
                setError(null);

                let query = supabase.from('funnels').select('*, funnel_pages(*)');

                // Determine query based on domainSlug or funnelIdFromPath
                if (domainSlug) {
                    query = query.or(`slug.eq.${domainSlug},settings->>customDomain.eq.${domainSlug}`);
                } else if (funnelIdFromPath) {
                    query = query.eq('id', funnelIdFromPath);
                } else {
                    setError("404"); // No identifier found
                    setLoading(false);
                    return;
                }

                const { data: funnelData, error: funnelError } = await query.single();

                if (funnelError || !funnelData) throw new Error("Campaign Not Found");

                setResolvedFunnelId(funnelData.id);

                // Check if funnel is live (unless in preview mode)
                if (funnelData.status !== 'live' && !isPreview) throw new Error("OFFLINE");

                const pathParts = params["*"]?.split('/').filter(Boolean) || [];
                let pageSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'landing-page'; // Default to 'landing-page' slug

                // Ensure pages are sorted by order_index
                const pages: FunnelPage[] = (funnelData.funnel_pages || []).map(p => ({ ...p })).sort((a,b) => (a.order_index ?? 0) - (b.order_index ?? 0));

                // Helper to find a page by slug
                const findPage = (slugToFind: string) => {
                    const search = slugToFind.toLowerCase();
                    return pages.find(p =>
                        (p.slug && p.slug.toLowerCase() === search) ||
                        (p.title && p.title.toLowerCase().replace(/\s+/g, '-') === search) // Fallback to slugified title
                    );
                };

                let selectedPage = findPage(pageSlug);

                // If the slug doesn't match, fall back to the first page (likely 'start' type)
                if (!selectedPage) {
                    selectedPage = pages.find(p => p.type === 'start') || pages[0];
                }

                setFunnel({ ...funnelData, pages });
                setActivePage(selectedPage);

            } catch (err: any) {
                if (err.message === "Campaign Not Found") {
                    setError("404");
                } else if (err.message === "OFFLINE") {
                    setError("OFFLINE");
                } else {
                    console.error("Public Funnel Fetch Error:", err);
                    setError("An unexpected error occurred.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPublicFunnel();

    }, [funnelIdFromPath, isPreview, params, domainSlug, location]); // Rerun if these change


    // --- Loading, Error, and Offline States ---
    if (loading) return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-400">
            <Loader2 className="animate-spin" size={48} />
        </div>
    );

    if (error === "404") return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-100 p-4">
            <div className="text-center bg-white p-12 rounded-2xl shadow-xl">
                <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-gray-800">Campaign Not Found</h1>
                <p className="text-gray-600 mt-2">The link you followed may be broken, or the campaign may have been removed.</p>
            </div>
        </div>
    );

    if (error === "OFFLINE") return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-100 p-4">
            <div className="text-center bg-white p-12 rounded-2xl shadow-xl">
                 <Globe className="mx-auto text-gray-400 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-gray-800">Campaign Offline</h1>
                <p className="text-gray-600 mt-2">This campaign is not currently active. Please check back later.</p>
            </div>
        </div>
    );

    if (error || !funnel || !activePage) return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-100 p-4">
            <div className="text-center bg-white p-12 rounded-2xl shadow-xl">
                <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-gray-800">An Error Occurred</h1>
                <p className="text-gray-600 mt-2">{error || "Could not load the funnel."}</p>
            </div>
        </div>
    );

    // --- Navigation and Submission Logic ---

    /**
     * Handle contact form submission
     * Creates/updates lead immediately via server-side upsert
     */
    const handleContactFormSubmit = async (
        contactData: LeadContactData, 
        currentAnswers: Record<string, any> = {}
    ): Promise<{ success: boolean; leadId?: string; error?: string }> => {
        console.log("[PublicFunnel] Submitting contact form:", contactData);
        
        if (!funnel || !activePage) {
            return { success: false, error: "Page not ready" };
        }

        if (isSubmittingLead.current) {
            return { success: false, error: "Already submitting" };
        }
        isSubmittingLead.current = true;

        try {
            // Extract contact fields from answers; remaining are quiz data
            const { name, email, phone, ...quizData } = currentAnswers;
            // Use the contactData passed (more direct) but also ensure normalization
            const normalizedContact: LeadContactData = {
                name: contactData.name.trim(),
                email: contactData.email.trim().toLowerCase(),
                phone: contactData.phone?.trim() || undefined
            };

            const result = await upsertLead(resolvedFunnelId!, normalizedContact, quizData, {
                showErrorsToUser: true
            });

            setCurrentLeadResult(result);
            console.log("[PublicFunnel] Lead upserted successfully:", result);

            return { success: true, leadId: result.leadId };

        } catch (err: any) {
            console.error("[PublicFunnel] Contact form submission failed:", err);
            return { success: false, error: err.message || "Failed to save your information." };
        } finally {
            isSubmittingLead.current = false;
        }
    };

    /**
     * Update quiz answers for the current lead
     * Called when user answers quiz questions on any page
     */
    const handleQuizAnswersUpdate = async (answers: Record<string, any>) => {
        setQuizAnswers(prev => ({ ...prev, ...answers }));

        // If we already have a lead, update their quiz answers progressively
        if (currentLeadResult?.leadId && currentLeadResult.contactData) {
            try {
                // Merge all answers and strip contact fields - only send quiz data
                const allAnswers = { ...quizAnswers, ...answers };
                const { name, email, phone, ...quizData } = allAnswers;
                
                await upsertLead(
                    resolvedFunnelId!, 
                    currentLeadResult.contactData, 
                    quizData
                );
                console.log("[PublicFunnel] Updated quiz answers for lead:", currentLeadResult.leadId);
            } catch (err) {
                console.warn("[PublicFunnel] Failed to update quiz answers:", err);
                // Non-fatal - will be retried on final submission
            }
        }
    };

    /**
     * Main navigation handler called by PreviewArea
     * @param answers - All collected answers so far (may include contact data on first submission)
     */
    const handleNextPage = async (answers?: Record<string, any>) => {
        console.log(`%c--- handleNextPage Triggered ---`, 'color: #3b82f6; font-weight: bold;', { answers });

        if (!funnel || !activePage) {
            console.log("handleNextPage: Funnel or activePage is not set. Aborting.");
            return;
        }

        // Merge new answers with existing quiz answers
        const currentAnswers = { ...quizAnswers, ...answers };
        setQuizAnswers(currentAnswers);

        // Extract contact data from answers if present (from contact form)
        // The contact form fields are: name, email, phone (and possibly other)
        const extractedContact: LeadContactData | null = 
            (answers?.email && answers?.name) 
                ? {
                    name: String(answers.name).trim(),
                    email: String(answers.email).trim().toLowerCase(),
                    phone: answers.phone ? String(answers.phone).trim() : undefined
                }
                : null;

        const currentIndex = funnel.pages.findIndex(p => p.id === activePage.id);
        const nextPageIndex = currentIndex + 1;
        const isLastPage = nextPageIndex >= funnel.pages.length;

        console.log("Page Navigation:", {
            currentPage: activePage.title,
            isLastPage,
            hasContactData: !!extractedContact,
            hasExistingLead: !!currentLeadResult
        });

        // If contact data is provided AND we haven't submitted a lead yet, upsert now
        if (extractedContact && !currentLeadResult && !isContactSubmitting) {
            console.log("%cSubmitting contact data via upsert...", 'color: #10b981; font-weight: bold;');
            
            const submitResult = await handleContactFormSubmit(extractedContact, currentAnswers);
            
            if (!submitResult.success) {
                // Show error and abort navigation - user must fix
                console.error("%cLead submission failed, aborting navigation.", 'color: #ef4444; font-weight: bold;', submitResult.error);
                return;
            }
            
            console.log("%cLead submitted successfully, proceeding to next page.", 'color: #10b981; font-weight: bold;');
        } else if (extractedContact && currentLeadResult) {
            // Lead already exists, just update quiz answers progressively
            console.log("%cLead already exists, updating quiz answers.", 'color: #6366f1; font-weight: bold;');
            await handleQuizAnswersUpdate(currentAnswers);
        } else if (!extractedContact && isLastPage && !currentLeadResult) {
            // Reached last page but no contact data? This shouldn't happen in a properly configured funnel
            console.warn("%cReached final page without contact data. Check funnel structure.", 'color: #f59e0b; font-weight: bold;');
        }

        // Navigate to next page if not last
        if (!isLastPage) {
            const nextPage = funnel.pages[nextPageIndex];
            const funnelSlug = funnel.slug || funnel.name.toLowerCase().replace(/\s+/g, '-');
            const pageSlug = nextPage.slug || nextPage.title.toLowerCase().replace(/\s+/g, '-');
            const path = `/funnel/${funnel.id}/${funnelSlug}/${pageSlug}`;
            const search = searchParams.toString();
            
            console.log(`%cNavigating to next page: ${nextPage.title}`, 'color: #6366f1; font-weight: bold;');
            navigate(`${path}${search ? `?${search}` : ''}`, { replace: isPreview });
        } else {
            console.log("%cReached final page. Lead processing complete.", 'color: #10b981; font-weight: bold;');
        }
    };

    return (
        <PreviewArea
            funnel={funnel}
            page={activePage}
            viewMode={viewMode}
            onSelectElement={() => {}} // Not needed for public view
            selectedElementId={null}
            selectedField={null}
            onUpdateElement={() => {}} // Not needed for public view
            isLive={true}
            isPreview={isPreview}
            onNextPage={handleNextPage} // Handler for navigating between pages and lead submission
            quizAnswers={quizAnswers}
            setQuizAnswers={setQuizAnswers}
        />
    );
};

export default PublicFunnel;
