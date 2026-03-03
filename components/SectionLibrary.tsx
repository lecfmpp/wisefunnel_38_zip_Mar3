
import React, { useState } from 'react';
import { 
    Layout, 
    X, 
    Zap, 
    Star, 
    Users, 
    HelpCircle, 
    MessageSquare, 
    Smartphone, 
    Monitor,
    Image as ImageIcon,
    Plus,
    CheckCircle2,
    Search,
    ListChecks,
    Rocket,
    Send,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import { ElementType } from '../types';

interface SectionCategory {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const CATEGORIES: SectionCategory[] = [
    { id: 'all', label: 'All Blocks', icon: <Layout size={16} /> },
    { id: 'content', label: 'Landing Blocks', icon: <Monitor size={16} /> },
    { id: 'quiz', label: 'Quiz Flow', icon: <Zap size={16} /> },
    { id: 'social', label: 'Social Proof', icon: <Users size={16} /> },
    { id: 'results', label: 'Result Sets', icon: <Rocket size={16} /> },
];

interface SectionTemplate {
    type: ElementType;
    category: string;
    name: string;
    description: string;
    icon: React.ReactNode;
}

const TEMPLATES: SectionTemplate[] = [
    { type: 'hero', category: 'content', name: 'Conversion Hero', description: 'Headline, subheadline, and high-contrast CTA.', icon: <Layout className="text-primary" size={24} /> },
    { type: 'logos', category: 'social', name: 'Trust Logos', description: 'Auto-scrolling industry authority badges.', icon: <ImageIcon className="text-blue-500" size={24} /> },
    { type: 'how-it-works', category: 'content', name: 'Process Steps', description: 'Break down your value proposition in steps.', icon: <ListChecks className="text-emerald-500" size={24} /> },
    { type: 'testimonials-slider', category: 'social', name: 'Customer Praise', description: 'Clean review cards with author metadata.', icon: <MessageSquare className="text-orange-500" size={24} /> },
    { type: 'faq', category: 'content', name: 'Simple Accordion', description: 'Expandable Q&A to eliminate objections.', icon: <HelpCircle className="text-purple-500" size={24} /> },
    { type: 'quiz-step', category: 'quiz', name: 'Logic Step', description: 'Interactive quiz question with branching.', icon: <Zap className="text-amber-500" size={24} /> },
    { type: 'quiz-processing', category: 'quiz', name: 'AI Analyzer', description: 'Engaging loading state for logic flows.', icon: <BarChart3 className="text-indigo-500" size={24} /> },
    { type: 'quiz-result', category: 'results', name: 'Success Page', description: 'The outcome of your qualifying quiz.', icon: <Rocket className="text-emerald-600" size={24} /> },
    { type: 'footer-complex', category: 'content', name: 'Agency Footer', description: 'Social links, compliance, and quick nav.', icon: <Send className="text-slate-600" size={24} /> },
];

interface SectionLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: ElementType) => void;
}

const SectionLibrary: React.FC<SectionLibraryProps> = ({ isOpen, onClose, onSelect }) => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredTemplates = TEMPLATES.filter(t => {
        const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#1a2b3b]/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-4xl h-[700px] rounded-[40px] shadow-2xl overflow-hidden animate-scale-in flex">
                {/* Sidebar Categories */}
                <div className="w-[280px] bg-muted/20 border-r border-border p-10 space-y-10">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-[#1a2b3b] tracking-tight">Block Library</h3>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select a conversion engine</p>
                    </div>

                    <div className="space-y-1.5">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeCategory === cat.id ? 'bg-[#1a2b3b] text-white shadow-lg' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                            >
                                <div className={activeCategory === cat.id ? 'text-primary' : ''}>{cat.icon}</div>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pt-10 border-t border-border/60">
                        <div className="p-5 bg-orange-50 border border-orange-100 rounded-3xl space-y-3">
                             <div className="flex items-center gap-2 text-orange-600">
                                 <Zap size={14} fill="currentColor" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Pro Logic</span>
                             </div>
                             <p className="text-[11px] text-orange-800/70 font-medium leading-relaxed">
                                 All blocks are mobile-optimized and cross-tested for maximum agency throughput.
                             </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    <div className="h-20 px-10 border-b border-gray-50 flex items-center justify-between shrink-0">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Search building blocks..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-muted/30 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <button onClick={onClose} className="p-3 text-muted-foreground hover:bg-muted rounded-full transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                            {filteredTemplates.map((t, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => onSelect(t.type)}
                                    className="group p-6 bg-white border-2 border-border/60 rounded-[32px] hover:border-primary hover:shadow-xl transition-all cursor-pointer flex gap-6 items-center active:scale-[0.98]"
                                >
                                    <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors shrink-0">
                                        {t.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-black text-lg text-[#1a2b3b] group-hover:text-primary transition-colors tracking-tight">{t.name}</h4>
                                        <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed">{t.description}</p>
                                    </div>
                                    <div className="ml-auto w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-primary">
                                        <Plus size={20} strokeWidth={3} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredTemplates.length === 0 && (
                            <div className="py-24 text-center space-y-4 opacity-30 grayscale pointer-events-none">
                                <Search size={64} className="mx-auto" />
                                <p className="font-black uppercase tracking-widest text-sm">No matching components found</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-8 bg-muted/10 border-t border-border flex items-center justify-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select a block to inject it into your funnel canvas</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SectionLibrary;
