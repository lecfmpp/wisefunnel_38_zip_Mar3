import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import GlobalSidebar from '../components/GlobalSidebar';
import { Search, Users, Briefcase, Sun, Shield, Home, Car, TrendingUp, DollarSign, ChevronsUpDown, XCircle, Loader2, AlertCircle, Gavel, Heart, Star, Rocket, HeartPulse, Zap } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { generateUniqueFunnelName, mapTemplateToFunnel, slugify } from '../services/funnelService';
import { BLUEPRINTS } from '../constants';

interface Template {
  id: string;
  title: string;
  usersCount: number;
  description: string;
  icon: React.ReactNode;
  thumbnailUrl: string;
  isUserTemplate?: boolean;
}

const STORAGE_URL = 'https://iwvlmpgeodctctmaacja.supabase.co/storage/v1/object/public/Hero';

const GLOBAL_TEMPLATES: Template[] = [
    { 
    id: 't1', 
    title: 'Business Loan Funnel', 
    usersCount: 224, 
    description: 'High-converting landing page for financing offers.', 
    icon: <Briefcase size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_business_loan.webp` 
  },
  { 
    id: 't2', 
    title: 'Solar Panel Assessment', 
    usersCount: 277, 
    description: 'Capture leads for solar panel installations.', 
    icon: <Sun size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_solar.webp` 
  },
  { 
    id: 't3', 
    title: 'Home Insurance', 
    usersCount: 279, 
    description: 'Generate high-quality home insurance leads.', 
    icon: <Shield size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_home_insurance.webp` 
  },
  { 
    id: 't4', 
    title: 'Home Improvement Funnel', 
    usersCount: 276, 
    description: 'Perfect for contractors and remodelers.', 
    icon: <Home size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_home_improvements.webp` 
  },
  { 
    id: 't5', 
    title: 'Car Insurance Funnel', 
    usersCount: 278, 
    description: 'Targeted landing page for auto insurance.', 
    icon: <Car size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_car_insurance.webp` 
  },
  { 
    id: 't6', 
    title: 'Real Estate Funnel', 
    usersCount: 275, 
    description: 'Capture buyer and seller leads.', 
    icon: <Home size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_real_estate.webp` 
  },
  { 
    id: 't7', 
    title: 'Mortgage Funnel', 
    usersCount: 274, 
    description: 'Prequalify mortgage applicants.', 
    icon: <TrendingUp size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_mortgage.webp` 
  },
  { 
    id: 't8', 
    title: 'Financial Planning Funnel', 
    usersCount: 273, 
    description: 'Wealth management lead generation.', 
    icon: <DollarSign size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_financing_planning.webp` 
  },
  { 
    id: 't9', 
    title: 'Divorce & Family Law', 
    usersCount: 142, 
    description: 'Confidential legal lead generation flow.', 
    icon: <Gavel size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_divorce.webp` 
  },
  { 
    id: 't10', 
    title: 'Personal Injury Law', 
    usersCount: 156, 
    description: 'High-converting personal injury funnel.', 
    icon: <Shield size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_law_injury.webp` 
  },
  { 
    id: 't11', 
    title: 'Life Insurance Assessment', 
    usersCount: 189, 
    description: 'High-conversion life insurance flow.', 
    icon: <Heart size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/hero_life_insurance.webp` 
  },
  { 
    id: 't12', 
    title: 'SMMA Growth Funnel', 
    usersCount: 312, 
    description: 'Attract high-ticket clients with a custom growth blueprint and ROI audit.', 
    icon: <Rocket size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/smma.webp` 
  },
  { 
    id: 't13', 
    title: 'Medicare Healthcare', 
    usersCount: 164, 
    description: 'Medicare Advantage and Supplement pre-qualification flow.', 
    icon: <HeartPulse size={48} className="text-primary opacity-80" />, 
    thumbnailUrl: 'https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?w=1200' 
  },
  { 
    id: 't14', 
    title: 'Pay Per Lead ROI Engine', 
    usersCount: 104, 
    description: 'Generate high-intent lead buying clients by showing ROI potential.', 
    icon: <Zap size={48} className="text-[#F97316] opacity-80" />, 
    thumbnailUrl: `${STORAGE_URL}/pay_per_lead.webp` 
  }
];

const TemplateSelector: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userTemplates, setUserTemplates] = useState<Template[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

    useEffect(() => {
        fetchUserTemplates();
    }, []);

    const fetchUserTemplates = async () => {
        try {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) return;

            const { data, error: fetchError } = await supabase
                .from('funnels')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('is_template', true);
            
            if (fetchError) throw fetchError;
            
            const mapped = (data || []).map(f => ({
                id: f.id,
                title: f.name,
                usersCount: 1,
                description: 'Personalized workspace template.',
                icon: <Star size={48} className="text-amber-500 opacity-80" />,
                thumbnailUrl: f.thumbnail_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
                isUserTemplate: true
            }));
            setUserTemplates(mapped);
        } catch (err) {
            console.error("Error fetching personal templates:", err);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const handleSelectTemplate = async (template: Template) => {
        setIsCreating(template.id);
        setError(null);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }

            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) throw new Error("No active workspace found.");

            let funnelData: any;
            let pagesToInsert: any[] = [];

            if (template.isUserTemplate) {
                const { data: sourceFunnel, error: sfError } = await supabase.from('funnels').select('*').eq('id', template.id).single();
                if (sfError) throw sfError;

                const { data: sourcePages, error: spError } = await supabase.from('funnel_pages').select('*').eq('funnel_id', template.id);
                if (spError) throw spError;

                const newFunnelName = await generateUniqueFunnelName(`${sourceFunnel.name} (Copy)`);

                funnelData = {
                    workspace_id: workspaceId,
                    name: newFunnelName,
                    slug: slugify(newFunnelName),
                    status: 'draft',
                    theme: sourceFunnel.theme,
                    settings: sourceFunnel.settings,
                    thumbnail_url: sourceFunnel.thumbnail_url,
                    last_edited: new Date().toISOString(),
                    visits_count: 0
                };

                const generatedSlugs = new Set<string>();
                const createUniqueSlug = (title: string): string => {
                    let baseSlug = slugify(title);
                    let slug = baseSlug;
                    let counter = 2;
                    while (generatedSlugs.has(slug)) {
                        slug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                    generatedSlugs.add(slug);
                    return slug;
                };

                pagesToInsert = sourcePages.map(p => ({ 
                    title: p.title, 
                    slug: createUniqueSlug(p.title),
                    type: p.type, 
                    elements: p.elements, 
                    order_index: p.order_index, 
                    confetti: p.confetti,
                    visits_count: 0
                }));

            } else {
                const uniqueName = await generateUniqueFunnelName(template.title);
                const blueprintKey = template.title.toLowerCase().replace(/\s+/g, '-');
                const blueprint = BLUEPRINTS[blueprintKey] || BLUEPRINTS['business-loan'];

                const templatePayload = {
                    niche: template.title, 
                    quizConfig: {
                        steps: blueprint.pages.filter(p => p.type === 'quiz').map(p => ({
                            title: p.title,
                            subtitle: p.elements[0]?.content?.subtitle || '',
                            type: p.elements[0]?.content?.quizType || 'single',
                            field: p.elements[0]?.content?.field || 'input',
                            options: p.elements[0]?.content?.options || [],
                            validation: p.elements[0]?.content?.validation || {}
                        }))
                    },
                    resultsPageConfig: {
                        headlineTemplate: blueprint.pages.find(p => p.type === 'end')?.elements[0]?.content?.headline || "Your Results are Ready",
                        subheadlineTemplate: blueprint.pages.find(p => p.type === 'end')?.elements[0]?.content?.subheadline || "We have found the best matches for you.",
                        metrics: blueprint.pages.find(p => p.type === 'end')?.elements[0]?.content?.metrics || []
                    },
                    emailConfig: blueprint.settings.emailNotifications
                };

                const newFunnel = mapTemplateToFunnel(templatePayload, workspaceId);
                
                funnelData = {
                    workspace_id: workspaceId,
                    name: uniqueName,
                    slug: slugify(uniqueName),
                    status: 'draft',
                    theme: newFunnel.theme,
                    settings: newFunnel.settings,
                    thumbnail_url: template.thumbnailUrl, 
                    last_edited: new Date().toISOString(),
                    visits_count: 0
                };

                pagesToInsert = (newFunnel.pages || []).map(p => ({ 
                    title: p.title, 
                    slug: p.slug, // Pass through the generated slug
                    type: p.type, 
                    elements: p.elements, 
                    order_index: p.order_index, 
                    confetti: p.confetti || false,
                    visits_count: 0
                }));
            }

            const { data: funnel, error: funnelError } = await supabase.from('funnels').insert([funnelData]).select().single();
            if (funnelError) throw funnelError;

            const finalPages = pagesToInsert.map(p => ({ ...p, funnel_id: funnel.id }));
            const { error: pagesError } = await supabase.from('funnel_pages').insert(finalPages);
            if (pagesError) throw pagesError;

            navigate(`/builder?id=${funnel.id}`);
        } catch (err: any) {
            console.error("Funnel Creation Error:", err);
            setError(err.message || "Failed to initialize funnel.");
            setIsCreating(null);
        }
    };

    const combinedTemplates = useMemo(() => [...userTemplates, ...GLOBAL_TEMPLATES], [userTemplates]);

    const filteredTemplates = useMemo(() => {
        return combinedTemplates.filter(template => 
            template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [combinedTemplates, searchTerm]);

    return (
        <div className="flex min-h-screen bg-background font-sans">
            <GlobalSidebar activeTab="build" onTabChange={(id) => navigate(`/${id}`)} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            <div className="flex-1 flex flex-col min-w-0">
                <WorkspaceNavbar />
                <main className="flex-1 w-full mx-auto px-12 py-12 overflow-y-auto scrollbar-hide">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex flex-col gap-2 mb-10">
                            <div className="flex items-center gap-3 cursor-pointer group w-fit">
                                <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight">Select a Blueprint</h1>
                                <ChevronsUpDown size={28} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </div>
                            <p className="text-muted-foreground font-medium">Choose a layout from our library or your personal collection.</p>
                        </div>

                        {error && <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"><AlertCircle size={20} /><p className="text-sm font-bold">{error}</p></div>}

                        <div className="relative mb-12 max-w-md">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search templates..." className="w-full pl-11 pr-11 py-4 bg-white border border-border rounded-[16px] shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                            <AnimatePresence>
                                {filteredTemplates.map((template) => (
                                    <motion.div 
                                        key={template.id} 
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => !isCreating && handleSelectTemplate(template)} 
                                        className={`group bg-white border border-border/60 rounded-[24px] p-4 shadow-sm hover:shadow-2xl hover:border-primary/50 transition-all cursor-pointer flex flex-col h-[420px] relative ${isCreating === template.id ? 'opacity-70 pointer-events-none' : ''}`}
                                    >
                                        {isCreating === template.id && (
                                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-[24px]">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                >
                                                    <Loader2 className="text-primary" size={32} />
                                                </motion.div>
                                                <p className="text-xs font-black uppercase tracking-widest text-primary mt-4">deploying</p>
                                            </div>
                                        )}
                                        <div className="h-52 bg-primary/5 rounded-[16px] flex items-center justify-center mb-6 relative overflow-hidden group-hover:bg-primary/10 transition-all">
                                            <img src={template.thumbnailUrl} className="absolute inset-0 w-full h-full object-.cover opacity-10 group-hover:opacity-20 transition-opacity" />
                                            <div className="transform transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-2 relative z-10">{template.icon}</div>
                                            <div className="absolute bottom-4 left-4 z-10">
                                                <span className={`px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-widest border ${template.isUserTemplate ? 'text-amber-600 border-amber-200' : 'text-primary border-primary/10'}`}>
                                                    {template.isUserTemplate ? 'Personal Blueprint' : 'Verified Canvas'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col px-3 pb-2">
                                            <h3 className="font-black text-2xl text-[#1a2b3b] mb-1.5 truncate group-hover:text-primary transition-colors tracking-tight">{template.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-reaxed line-clamp-3 font-medium">{template.description}</p>
                                        </div>
                                        <div className="mt-auto px-3 pb-2 pt-4 border-t border-border/40 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5"><Users size={14} className="text-muted-foreground" /><span className="text-xs font-bold text-muted-foreground">{template.usersCount}+ using this</span></div>
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all"><TrendingUp size={14} /></div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TemplateSelector;