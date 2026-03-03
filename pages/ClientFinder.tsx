import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import GlobalSidebar from '../components/GlobalSidebar';
import PlanGuard from '../components/PlanGuard';
import UpgradeModal from '../components/UpgradeModal';
import { 
    Search, 
    Globe, 
    MapPin, 
    Navigation, 
    Loader2, 
    Star, 
    Phone, 
    ExternalLink, 
    Rocket,
    CheckCircle2,
    Info as InfoIcon,
    X,
    Mail,
    Zap,
    Target,
    ArrowRight,
    Building2,
    ShieldCheck,
    Plus,
    Cpu,
    Fingerprint,
    Sparkles,
    History,
    Trash2,
    Ban,
    UserPlus,
    Clock,
    ChevronRight,
    ChevronDown, 
    AlertCircle,
    Download,
    Lock
} from 'lucide-react';
import { PotentialBuyer } from '../types';
import { findPotentialBuyers } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import LogoIcon from '../components/LogoIcon';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }

const SCAN_MESSAGES = [
    { threshold: 0, label: "Warming up the scouts. We don't do 'bulk', we do 'bankable'.", icon: <Cpu size={16} /> },
    { threshold: 15, label: "Scoping out local spend. Spotting the clients with the biggest wallets.", icon: <Target size={16} /> },
    { threshold: 35, label: "Crawling local indices. Filtering out the window shoppers...", icon: <Globe size={16} /> },
    { threshold: 55, label: "Cross-referencing ratings. Your agency only deserves 5-star partners.", icon: <Star size={16} /> },
    { threshold: 75, label: "Scraping direct lines. Skipping the gatekeepers where possible.", icon: <Fingerprint size={16} /> },
    { threshold: 90, label: "Verifying identities. No ghost businesses allowed in your pipeline.", icon: <ShieldCheck size={16} /> },
    { threshold: 98, label: "Finalizing the hit list. Almost time to close the deal.", icon: <Zap size={16} /> }
];

const TARGET_NICHES = [
    'Roofing', 'Solar', 'Home Insurance', 'Home Improvement', 'Car Insurance', 
    'Real Estate', 'Mortgage', 'Financial Planning', 'Family Law', 
    'Personal Injury', 'Life Insurance', 'Digital Agency', 'Medicare', 'Business Loans'
];

const ClientFinder: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => typeof id === 'string' && removeToast(id), 4000);
    };
    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    const [niche, setNiche] = useState('Roofing');
    const [customNiche, setCustomNiche] = useState('');
    const [location, setLocation] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [radius, setRadius] = useState(25);
    const [keywords, setKeywords] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [potentialBuyers, setPotentialBuyers] = useState<PotentialBuyer[]>([]);
    const [isLocating, setIsLocating] = useState(false);
    const [recentSearches, setRecentSearches] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [workspace, setWorkspace] = useState<any>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isScalePlan = useMemo(() => {
        return workspace?.plan_type?.toLowerCase().includes('scale');
    }, [workspace]);

    const locationRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetchInitialData();
        window.addEventListener('workspaceChanged', fetchInitialData);
        
        const handleClickOutside = (e: MouseEvent) => {
            if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
                setShowLocationDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('workspaceChanged', fetchInitialData);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        const workspaceId = localStorage.getItem('active_workspace_id');
        if (!workspaceId) { setIsLoading(false); return; }
        
        try {
            const { data: ws } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
            setWorkspace(ws);

            const { data, error } = await supabase
                .from('client_finder_history')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            setRecentSearches(data || []);
        } catch (err) {
            console.error("History fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocationChange = (val: string) => {
        setLocation(val);
        if (!val) {
            setShowLocationDropdown(false);
            setLocationSuggestions([]);
            return;
        }
        setShowLocationDropdown(true);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        
        if (val.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        setIsSearchingLocation(true);
        debounceTimer.current = setTimeout(async () => {
            try {
                // Using the free OpenStreetMap Nominatim API
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`);
                const data = await response.json();
                setLocationSuggestions(data);
            } catch (err) {
                console.error("Location lookup failed", err);
            } finally {
                setIsSearchingLocation(false);
            }
        }, 600);
    };

    const selectLocation = (suggestion: any) => {
        // Construct a cleaner, more readable location string
        const city = suggestion.address.city || suggestion.address.town || suggestion.address.village || '';
        const state = suggestion.address.state || '';
        const country = suggestion.address.country || '';
        const displayName = [city, state, country].filter(Boolean).join(', ');
        
        setLocation(displayName || suggestion.display_name);
        setLocationSuggestions([]);
        setShowLocationDropdown(false);
    };

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (isSearching) {
            setProgress(0);
            timer = setInterval(() => {
                setProgress(prev => {
                    if (prev < 30) return prev + Math.random() * 5; 
                    if (prev < 70) return prev + Math.random() * 1.5; 
                    if (prev < 90) return prev + Math.random() * 0.4; 
                    if (prev < 99) return prev + 0.05; 
                    return prev;
                });
            }, 150);
        }
        return () => clearInterval(timer);
    }, [isSearching]);

    const activeScanMessage = [...SCAN_MESSAGES].reverse().find(m => progress >= m.threshold) || SCAN_MESSAGES[0];

    const handleSearch = async () => {
        if (!isScalePlan) {
            setShowUpgradeModal(true);
            return;
        }

        const activeNiche = customNiche || niche;
        if (!location || !activeNiche) {
            addToast("Please specify a location and niche first.", "info");
            return;
        }
        
        const workspaceId = localStorage.getItem('active_workspace_id');
        if (!workspaceId) {
            addToast("Workspace context required.", "error");
            return;
        }

        setIsSearching(true);
        setPotentialBuyers([]);
        setShowLocationDropdown(false);
        
        try {
            const searchQuery = `${keywords} in ${activeNiche}`.trim();
            const results = await findPotentialBuyers(searchQuery, location, radius);
            const mappedResults = results.map((r: any, i: number) => ({ ...r, id: `pb-${Date.now()}-${i}` }));
            
            setProgress(100);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setPotentialBuyers(mappedResults);

            if (mappedResults.length > 0) {
                await supabase.from('client_finder_history').insert([{
                    workspace_id: workspaceId,
                    niche: activeNiche,
                    location,
                    radius,
                    search_query: keywords,
                    results: mappedResults
                }]);
                fetchInitialData(); // Refreshes history
            }

            addToast(`AI Scan complete. Found ${mappedResults.length} prospects.`, 'success');
        } catch (err) {
            console.error(err);
            addToast(`Market scan failed. Scouts are resting.`, 'error');
        } finally {
            setIsSearching(false);
            setProgress(0);
        }
    };

    const handleExportCSV = () => {
        if (potentialBuyers.length === 0) return;
        
        const headers = ["First Name", "Last Name", "Email", "Company", "Website", "Phone", "Location", "Industry", "Rating"];
        
        const rows = potentialBuyers.map(pb => {
            const inferredEmail = `contact@${pb.businessName.toLowerCase().replace(/[^\w]/g, '')}.com`;
            return [
                "Founder",
                "",
                inferredEmail,
                `"${pb.businessName}"`,
                `"${pb.website || ''}"`,
                `"${pb.phone || ''}"`,
                `"${pb.location}"`,
                `"${pb.category}"`,
                `"${pb.rating || '4.0'}"`
            ];
        });
        
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `wisefunnel_prospects_${(customNiche || niche).toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addToast("Export complete. File is ready for Instantly/SmartLead.", "success");
    };

    const loadHistorySearch = (search: any) => {
        setNiche(search.niche);
        setCustomNiche('');
        setLocation(search.location);
        setRadius(search.radius);
        setKeywords(search.search_query || '');
        setPotentialBuyers(search.results || []);
        setShowHistory(false);
        addToast(`Restored scan from ${new Date(search.created_at).toLocaleDateString()}`, "info");
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            addToast("Geolocation is not supported by your browser", "error");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                setIsLocating(false);
                addToast("Location synced successfully!", "success");
            },
            () => {
                setIsLocating(false);
                addToast("Failed to fetch location.", "error");
            }
        );
    };

    const recruitBuyer = async (pb: PotentialBuyer) => {
        const workspaceId = localStorage.getItem('active_workspace_id');
        if (!workspaceId) {
            addToast("Workspace context required.", "error");
            return;
        }

        try {
            const { error } = await supabase.from('lead_buyers').insert([{
                workspace_id: workspaceId,
                name: pb.businessName,
                email: `contact@${pb.businessName.toLowerCase().replace(/\s+/g, '')}.com`,
                phone: pb.phone || '(555) 000-0000',
                niche: customNiche || niche,
                location: pb.location || location,
                notes: `Recruited via AI Client Finder. Category: ${pb.category}. Rating: ${pb.rating || 'N/A'}. Website: ${pb.website || 'N/A'}`,
                status: 'not-contacted'
            }]);

            if (error) throw error;
            
            setPotentialBuyers(prev => prev.filter(item => item.id !== pb.id));
            addToast(`${pb.businessName} added to your Profit Room!`, 'success');
        } catch (err: any) {
            console.error("Recruitment error details:", err);
            addToast(`Recruitment failed: ${err.message}`, 'error');
        }
    };

    const discardProspect = (id: string) => {
        setPotentialBuyers(prev => prev.filter(p => p.id !== id));
        addToast("Prospect removed.", "info");
    };

    if (isLoading) return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-8">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        scale: [0.8, 1.1, 1],
                        opacity: 1,
                        rotate: 360
                    }} 
                    transition={{ 
                        rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                        scale: { duration: 0.5 }
                    }}
                    className="relative"
                >
                    <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LogoIcon className="w-10 h-10 opacity-40" />
                    </div>
                </motion.div>
                <div className="flex flex-col items-center gap-2">
                    <motion.p 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="font-black text-2xl tracking-tight text-[#1a2b3b]"
                    >
                        Loading Discovery Engine...
                    </motion.p>
                </div>
            </motion.div>
        </AnimatePresence>
    );

    return (
        <div className="flex min-h-screen bg-background font-sans selection:bg-orange-100 overflow-hidden">
            <GlobalSidebar 
                activeTab="client-finder" 
                onTabChange={(id) => navigate(`/${id}`)} 
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <WorkspaceNavbar />
                
                <PlanGuard>
                    <main className="flex-1 w-full mx-auto px-12 pt-12 pb-32 overflow-y-auto scrollbar-hide space-y-12 h-full">
                        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight mb-2">Instant Buyer Discovery</h1>
                                <p className="text-muted-foreground font-medium max-w-2xl text-lg">
                                    Uncover high-intent lead buyers in any niche and location, ready to pay for your data right now.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowHistory(!showHistory)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${showHistory ? 'bg-primary text-white shadow-xl' : 'bg-white border border-border text-[#1a2b3b] hover:bg-muted'}`}
                            >
                                <History size={18} />
                                {showHistory ? 'Close History' : 'Recent Scans'}
                            </button>
                        </div>

                        {showHistory && (
                            <div className="max-w-[1400px] mx-auto animate-fade-in-down">
                                <div className="bg-white border border-border rounded-[24px] p-8 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Clock size={16} /> Market Scouting History
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {recentSearches.length > 0 ? recentSearches.map((s) => (
                                            <button 
                                                key={s.id} 
                                                onClick={() => loadHistorySearch(s)}
                                                className="p-5 border border-border rounded-2xl text-left hover:border-primary hover:shadow-md transition-all group relative overflow-hidden bg-muted/5"
                                            >
                                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRight size={16} className="text-primary" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">{s.niche}</p>
                                                <p className="font-bold text-[#1a2b3b] truncate mb-1">{s.location}</p>
                                                <p className="text-xs text-muted-foreground font-medium">{new Date(s.created_at).toLocaleDateString()} • {s.results?.length || 0} prospects</p>
                                            </button>
                                        )) : (
                                            <div className="col-span-full py-10 text-center opacity-40">
                                                <History size={32} className="mx-auto mb-2" />
                                                <p className="text-sm font-bold">No previous scans found.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1400px] mx-auto">
                            <div className="lg:col-span-3 space-y-8">
                                <div className="bg-white border border-border rounded-[24px] p-10 shadow-sm space-y-10 relative group">
                                    {/* Icon container with isolated overflow-hidden */}
                                    <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                            <Target size={160} />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 relative z-10">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground block ml-1">1. Target Market Niche</label>
                                        <div className="flex flex-wrap gap-2">
                                            {TARGET_NICHES.map((n) => (
                                                <button 
                                                    key={n}
                                                    onClick={() => { setNiche(n); setCustomNiche(''); }}
                                                    className={`px-5 py-3 rounded-2xl text-sm font-black transition-all border-2 ${(!customNiche && niche === n) ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-white border-border text-muted-foreground hover:border-primary/50'}`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                            <div className={`relative flex items-center px-5 py-3 rounded-2xl border-2 transition-all min-w-[160px] group ${customNiche ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-primary/40 focus-within:border-primary'}`}>
                                                <span className={`text-[10px] font-black uppercase mr-2 transition-colors ${customNiche ? 'text-primary' : 'text-primary/60'}`}>Other</span>
                                                <input 
                                                    type="text"
                                                    value={customNiche}
                                                    onChange={(e) => { setCustomNiche(e.target.value); setNiche(''); }}
                                                    className="bg-transparent border-none outline-none text-sm font-black text-[#1a2b3b] w-full placeholder:text-primary/30"
                                                    placeholder="..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-20">
                                        <div className="md:col-span-2 space-y-3 relative" ref={locationRef}>
                                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground block ml-1">2. Location Territory</label>
                                            <div className="relative">
                                                <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                <input 
                                                    type="text" 
                                                    placeholder="City, State or Zip..." 
                                                    value={location} 
                                                    onChange={(e) => handleLocationChange(e.target.value)} 
                                                    onFocus={() => setShowLocationDropdown(true)}
                                                    className="w-full pl-12 pr-12 py-4 bg-muted/20 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50" 
                                                />
                                                <button onClick={useMyLocation} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors">
                                                    {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {showLocationDropdown && (locationSuggestions.length > 0 || isSearchingLocation) && (
                                                    <motion.div 
                                                        initial={{ opacity: 0.5, y: -15, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_16px_70px_-12px_rgba(0,0,0,0.3)] z-[100] overflow-hidden border border-border/50"
                                                    >
                                                        {isSearchingLocation && (
                                                            <div className="p-8 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                                                <Loader2 size={24} className="animate-spin text-primary" />
                                                                <span className="text-xs font-black uppercase tracking-widest">Scanning World Territories...</span>
                                                            </div>
                                                        )}
                                                        {!isSearchingLocation && locationSuggestions.length === 0 && (
                                                            <div className="p-8 flex flex-col items-center justify-center gap-4 text-muted-foreground text-center">
                                                                <Search size={32} className="opacity-30"/>
                                                                <span className="text-sm font-bold">No territories identified. Try adjusting your search.</span>
                                                            </div>
                                                        )}
                                                        {!isSearchingLocation && locationSuggestions.length > 0 && (
                                                            <div className="bg-muted/30 px-5 py-2 border-b border-border/30">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Suggested Locations</p>
                                                            </div>
                                                        )}
                                                        <div className="max-h-[300px] overflow-y-auto">
                                                            {locationSuggestions.map((s, index) => {
                                                                const mainText = s.address.city || s.address.town || s.address.village || s.display_name.split(',')[0];
                                                                const subText = s.display_name;
                                                                
                                                                return (
                                                                    <button 
                                                                        key={s.place_id}
                                                                        onClick={() => selectLocation(s)}
                                                                        className="w-full text-left p-5 transition-all duration-200 ease-in-out group flex items-center gap-5 relative hover:bg-slate-50 border-b border-border/10 last:border-0"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-muted/80 flex items-center justify-center transition-all shrink-0">
                                                                            <MapPin size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-base font-black text-[#1a2b3b] truncate transition-colors">
                                                                                {mainText}
                                                                            </p>
                                                                            <p className="text-xs font-medium text-muted-foreground truncate transition-colors">
                                                                                {subText}
                                                                            </p>
                                                                        </div>
                                                                        <ChevronRight size={18} className="text-muted-foreground/30 group-hover:text-primary transition-all transform group-hover:translate-x-1" />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground block ml-1">Search Radius</label>
                                            <div className="relative">
                                                <select value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full py-4 px-4 bg-muted/20 border-2 border-border rounded-2xl text-sm font-bold outline-none cursor-pointer appearance-none bg-white">
                                                    {[5, 10, 25, 50, 100].map(r => <option key={r} value={r}>{r} miles</option>)}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Separated Keywords and Search button to avoid overlapping issues and improve clarity */}
                                <div className="bg-white border border-border rounded-[24px] p-10 shadow-sm relative group z-10">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground block ml-1">3. Refining Keywords (Optional)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Add specific keywords (e.g., 'commercial', 'metal roofing')..." 
                                                value={keywords} 
                                                onChange={(e) => setKeywords(e.target.value)} 
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                                                className="w-full pl-6 pr-44 py-6 bg-muted/10 border-2 border-border/50 rounded-[28px] text-base font-bold focus:border-primary focus:bg-white outline-none transition-all" 
                                            />
                                            <button 
                                                onClick={handleSearch} 
                                                disabled={isSearching || !location} 
                                                className="absolute right-4 top-1/2 -translate-y-1/2 px-8 py-3 bg-[#1a2b3b] text-white rounded-[20px] font-black text-sm shadow-xl active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isSearching ? <Loader2 size={18} className="animate-spin" /> : (
                                                    <>
                                                        {!isScalePlan && <Lock size={16} className="text-orange-400" />}
                                                        <Globe size={18} /> Find Buyers
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isSearching && (
                            <div className="max-w-[1400px] mx-auto animate-fade-in-down space-y-10 py-10 bg-white border border-border rounded-[32px] p-12 shadow-sm">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end px-2">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live Scan Tracking</span>
                                            <h4 className="text-2xl font-black text-[#1A2B3B]">{activeScanMessage.label}</h4>
                                        </div>
                                        <span className="text-3xl font-black text-primary">{Math.min(Math.round(progress), 99)}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200 shadow-inner">
                                        <div 
                                            className="h-full bg-primary rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {SCAN_MESSAGES.slice(0, 4).map((step, idx) => {
                                        const isDone = progress > step.threshold + 20;
                                        const isCurrent = progress >= step.threshold && progress < step.threshold + 20;
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-500 ${isDone ? 'bg-emerald-50 border-emerald-100 opacity-60' : isCurrent ? 'bg-white border-primary/20 shadow-xl scale-105' : 'bg-slate-50 border-transparent opacity-40'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-primary text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                                                    {isDone ? <CheckCircle2 size={20} strokeWidth={4} /> : isCurrent ? <Loader2 size={20} className="animate-spin" /> : step.icon}
                                                </div>
                                                <span className={`text-xs font-black uppercase tracking-widest ${isCurrent ? 'text-[#1A2B3B]' : 'text-slate-500'}`}>{isDone ? "Verified" : "Scouting Log"}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {potentialBuyers.length > 0 && (
                            <div className="max-w-[1400px] mx-auto animate-fade-in-down space-y-6 pb-10">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-xl font-black text-[#1a2b3b]">Market Discoveries</h3>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={handleExportCSV}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm"
                                        >
                                            <Download size={16} /> Export for Outreach (CSV)
                                        </button>
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">{potentialBuyers.length} Premium Targets Found</span>
                                    </div>
                                </div>
                                <div className="bg-white border border-border rounded-[24px] overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-muted/10 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                <th className="px-8 py-5">Company Profile</th>
                                                <th className="px-8 py-5">Verified Location</th>
                                                <th className="px-8 py-5">Contact Hub</th>
                                                <th className="px-8 py-5 text-right pr-12">Action Control</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                            {potentialBuyers.map((pb) => (
                                                <tr key={pb.id} className="hover:bg-muted/5 transition-all group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all border border-border/50"><Building2 size={24} /></div>
                                                            <div>
                                                                <p className="font-black text-[#1a2b3b] text-base group-hover:text-primary transition-colors">{pb.businessName}</p>
                                                                <div className="flex text-yellow-400 mt-1 gap-0.5">{[...Array(5)].map((_,i) => <Star key={i} size={12} fill={i < Math.floor(pb.rating || 4) ? "currentColor" : "none"} className={i < Math.floor(pb.rating || 4) ? "" : "text-gray-200"} />)}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6"><div className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><MapPin size={14} className="text-primary/40" />{pb.location}</div></td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex gap-2">
                                                            {pb.phone && <a href={`tel:${pb.phone}`} className="p-2.5 bg-muted/40 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"><Phone size={16} strokeWidth={2.5} /></a>}
                                                            {pb.website && <a href={pb.website} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-muted/40 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"><ExternalLink size={16} strokeWidth={2.5} /></a>}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right pr-12">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button onClick={() => discardProspect(pb.id)} className="p-2.5 text-muted-foreground hover:text-rose-50 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                                                            <button onClick={() => recruitBuyer(pb)} className="px-6 py-3 bg-[#F97316] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center gap-2"><UserPlus size={16} strokeWidth={2.5} /> Add to Profit Room</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end px-4">
                                    <button onClick={() => { setPotentialBuyers([]); addToast("Session cleared.", "info"); }} className="text-xs font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-2"><Ban size={14} /> Discard Results</button>
                                </div>
                            </div>
                        )}

                        {!isSearching && potentialBuyers.length === 0 && (
                            <div className="max-w-[1400px] mx-auto py-24 text-center space-y-8 bg-white border border-border rounded-[32px] shadow-sm">
                                <div className="w-24 h-24 bg-primary/5 text-primary/20 rounded-[40px] flex items-center justify-center mx-auto">
                                    <Search size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-[#1a2b3b]">Ready to scout the market?</h3>
                                    <p className="text-muted-foreground font-medium max-w-sm mx-auto">Select a niche and territory above to identify high-intent lead buyers in seconds.</p>
                                </div>
                            </div>
                        )}
                    </main>
                </PlanGuard>
            </div>

            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                workspace={workspace} 
                featureName="Client Finder" 
            />

            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto flex items-center gap-3 px-5 py-4 bg-[#1a2b3b] text-white rounded-[16px] shadow-2xl min-w-[320px] animate-slide-in-right border border-white/10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Zap size={20} />}
                        </div>
                        <div className="flex-1"><p className="text-xs font-black uppercase opacity-50 mb-0.5">{toast.type === 'success' ? 'Success' : 'Notification'}</p><p className="text-sm font-bold">{toast.message}</p></div>
                        <button onClick={() => removeToast(toast.id)} className="p-1 opacity-50 hover:opacity-100 transition-colors"><X size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientFinder;