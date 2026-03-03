
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import { Funnel, FunnelPage } from '../types';
import { Globe, AlertCircle, Loader2 } from 'lucide-react';
import PreviewArea from '../components/PreviewArea';
// import { sendLeadNotificationEmail } from '../services/emailService'; // Temporarily commented out for isolation
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
    const isSubmittingLead = useRef(false); // Tracks if a lead submission is in progress

    const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});

    const funnelIdFromPath = params.funnelId;
    const isPreview = searchParams.get('preview') === 'true';

    const [resolvedFunnelId, setResolvedFunnelId] = useState<string | null>(null);

    // State to hold the lead ID once created, to prevent duplicate submissions
    const [currentLeadId, setCurrentLeadId] = useState<string | null>(() => {
        if (funnelIdFromPath) return sessionStorage.getItem(`wf_active_lead_${funnelIdFromPath}`);
        return null;
    });

    // Update lead ID if funnel is resolved and no current lead ID is set
    useEffect(() => {
        if (resolvedFunnelId && !currentLeadId) {
            setCurrentLeadId(sessionStorage.getItem(`wf_active_lead_${resolvedFunnelId}`));
        }
    }, [resolvedFunnelId, currentLeadId]);

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

    // Track funnel and page visits
    useEffect(() => {
        if (funnel?.id && activePage?.id && !isPreview) {
            const recordVisit = async () => {
                const pageSessionKey = `wf_v_p_${activePage.id}`;
                const funnelSessionKey = `wf_v_f_${funnel.id}`;
                
                try {
                    if (!sessionStorage.getItem(funnelSessionKey)) {
                        const { error: funnelVisitError } = await supabase.rpc('increment_funnel_visits', { f_id: funnel.id });
                        if (!funnelVisitError) {
                            sessionStorage.setItem(funnelSessionKey, 'true');
                        } else {
                            console.error('Funnel visit recording error:', funnelVisitError);
                        }
                    }

                    if (!sessionStorage.getItem(pageSessionKey)) {
                        const { error: pageVisitError } = await supabase.rpc('increment_funnel_page_visits', { p_id: activePage.id });
                        if (!pageVisitError) {
                            sessionStorage.setItem(pageSessionKey, 'true');
                        } else {
                            console.error('Page visit recording error:', pageVisitError);
                        }
                    }
                } catch (err) {
                    console.error("Visit recording error:", err);
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

                setFunnel({ ...funnelData, workspaceId: funnelData.workspace_id, pages });
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

    // Direct Supabase lead insertion function
    const syncLead = async (finalAnswers: Record<string, any>) => {
        console.log("Attempting to sync lead...");

        // Prevent duplicate submissions or submissions in preview/if already synced
        if (!resolvedFunnelId || isPreview || isSubmittingLead.current || currentLeadId) {
            console.log("Sync lead conditions not met. Details:", {
                resolvedFunnelId,
                isPreview,
                isSubmitting: isSubmittingLead.current,
                currentLeadId,
            });
            return;
        }
        
        isSubmittingLead.current = true;
        console.log("Submitting lead with data:", finalAnswers);

        try {
            const domain = window.location.hostname; // Get current domain
            const { data, error } = await supabase.from('leads').insert([{
                funnel_id: resolvedFunnelId,
                workspace_id: funnel.workspaceId || (funnel as any).workspace_id,
                form_data: finalAnswers,
                status: 'new', // Default status
                domain: domain // Store the domain
            }]).select().single(); // Ensure we get the inserted data back

            if (error) {
                console.error('Supabase lead insert error:', error);
                throw error; // Re-throw error for caller
            }

            if (data) {
                console.log("Lead synced successfully. Lead ID:", data.id);
                setCurrentLeadId(data.id); // Store the new lead ID
                sessionStorage.setItem(`wf_active_lead_${resolvedFunnelId}`, data.id); // Persist lead ID in session
                
                // IMPORTANT: Call email notification *after* successful lead save
                // try {
                //     await sendLeadNotificationEmail(funnel, data.id, finalAnswers);
                // } catch (emailError) {
                //     console.error("Failed to send lead notification email:", emailError);
                // }
            }
        } catch (err) {
            console.error('Error during syncLead:', err);
        } finally {
            console.log("Finished sync lead attempt.");
            isSubmittingLead.current = false; // Reset loading state
        }
    };

    // Handles moving to the next page or submitting the lead
    const handleNextPage = async (answers?: Record<string, any>) => {
        console.log(`%c--- handleNextPage Triggered ---`, 'color: #3b82f6; font-weight: bold;');
    
        const currentAnswers = { ...quizAnswers, ...answers };
        setQuizAnswers(currentAnswers);
    
        if (!funnel || !activePage) {
            console.log("handleNextPage: Funnel or activePage is not set. Aborting.");
            return;
        }
    
        const currentIndex = funnel.pages.findIndex(p => p.id === activePage.id);
        const nextPageIndex = currentIndex + 1;
        const isLastPage = nextPageIndex >= funnel.pages.length;
        const nextPage = !isLastPage ? funnel.pages[nextPageIndex] : null;
        const shouldAttemptLeadSync =
            activePage.type !== 'end' &&
            !isPreview &&
            !sessionStorage.getItem(`wf_active_lead_${resolvedFunnelId}`) &&
            !isSubmittingLead.current &&
            (isLastPage || nextPage?.type === 'end');
    
        console.log("Page Details:", {
            currentPage: activePage.title,
            isLastPage: isLastPage,
            nextPageType: nextPage?.type,
            shouldAttemptLeadSync
        });

        if (shouldAttemptLeadSync) {
            console.log("%cLead sync conditions met before page transition. Syncing lead...", 'color: #10b981; font-weight: bold;');
            await syncLead(currentAnswers);
        }

        if (!isLastPage && nextPage) {
            const funnelSlug = funnel.slug || funnel.name.toLowerCase().replace(/\s+/g, '-');
            const pageSlug = nextPage.slug || nextPage.title.toLowerCase().replace(/\s+/g, '-');
            const path = `/funnel/${funnel.id}/${funnelSlug}/${pageSlug}`;
            const search = searchParams.toString();
            
            console.log(`%cNavigating to next page: ${nextPage.title}`, 'color: #6366f1; font-weight: bold;');
            navigate(`${path}${search ? `?${search}` : ''}`, { replace: isPreview });
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
            onNextPage={handleNextPage} // Handler for navigating between pages
        />
    );
};

export default PublicFunnel;
