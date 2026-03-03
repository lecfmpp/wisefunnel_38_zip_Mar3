import React, { useState, useEffect } from 'react';
import { 
    LayoutGrid, 
    Wrench, 
    Users, 
    LayoutTemplate, 
    UserPlus, 
    Network, 
    Settings, 
    Sparkles, 
    PanelLeftClose, 
    PanelLeftOpen,
    Radar,
    Send,
    Split
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import LogoIcon from './LogoIcon';
import { supabase } from '../services/supabaseClient';

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    badge?: string;
    badgeColor?: string;
    highlight?: boolean;
    minPlanRank: number; 
}

interface SidebarGroup {
    title: string;
    number: string;
    items: SidebarItem[];
}

interface GlobalSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ activeTab, onTabChange, isCollapsed, toggleCollapse }) => {
    const navigate = useNavigate();
    const [currentPlanRank, setCurrentPlanRank] = useState<number>(0);

    useEffect(() => {
        const fetchPlan = async () => {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) return;

            const { data, error } = await supabase
                .from('workspaces')
                .select('plan_type')
                .eq('id', workspaceId)
                .single();

            if (!error && data) {
                const plan = data.plan_type?.toLowerCase() || '';
                if (plan.includes('scale')) setCurrentPlanRank(2);
                else if (plan.includes('growth')) setCurrentPlanRank(1);
                else setCurrentPlanRank(0);
            }
        };

        fetchPlan();
        window.addEventListener('workspaceChanged', fetchPlan);
        return () => window.removeEventListener('workspaceChanged', fetchPlan);
    }, []);

    const methodologyGroups: SidebarGroup[] = [
        {
            title: "Money first",
            number: "01",
            items: [
                { id: 'client-finder', label: 'Find Buyers', icon: Radar, path: '/client-finder', minPlanRank: 2 },
                { id: 'lead-buyers', label: 'Profit Room', icon: UserPlus, path: '/lead-buyers', minPlanRank: 1 },
                { id: 'outbound', label: 'Email & Pitch', icon: Send, path: '/outbound', minPlanRank: 2 },
            ]
        },
        {
            title: "Funnels",
            number: "02",
            items: [
                { id: 'build', label: 'Build', icon: Wrench, path: '/funnels', minPlanRank: 1 },
                { id: 'ad-builder', label: 'Campaigns', icon: LayoutTemplate, path: '/ad-builder', minPlanRank: 1, badge: 'Soon', badgeColor: 'bg-orange-100 text-orange-600' },
            ]
        },
        {
            title: "Leads",
            number: "03",
            items: [
                { id: 'leads', label: 'CRM', icon: Users, path: '/leads', minPlanRank: 1 },
                { id: 'distribution', label: 'Distribution', icon: Split, path: '/distribution', minPlanRank: 2, badge: 'Soon', badgeColor: 'bg-orange-100 text-orange-600' },
            ]
        }
    ];

    const utilityItems: SidebarItem[] = [
        { id: 'integrations', label: 'Integrations', icon: Network, path: '/integrations', minPlanRank: 0 },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', minPlanRank: 0 },
    ];

    const handleClick = (id: string, path: string) => {
        onTabChange(id);
        navigate(path);
    };

    const renderItem = (item: SidebarItem) => {
        const isActive = activeTab === item.id;
        const aiHighlightClass = item.highlight && !isActive 
            ? 'border-purple-200 bg-purple-50/30 hover:border-purple-400 group-ai' 
            : '';

        return (
            <div key={item.id} className="px-3 mb-1">
                <button
                    onClick={() => handleClick(item.id, item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 border-2 group relative overflow-visible ${
                        isActive 
                            ? 'bg-[#F97316] text-white border-[#F97316] shadow-lg shadow-orange-500/20 font-medium scale-[1.02]' 
                            : `text-sidebar-foreground/70 bg-transparent border-transparent hover:border-[#F97316] hover:bg-orange-50/50 ${aiHighlightClass}`
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : ''}
                >
                    <item.icon 
                        size={18} 
                        className={`shrink-0 transition-colors ${
                            isActive ? 'text-white' : item.highlight ? 'text-purple-600' : 'text-sidebar-foreground/50 group-hover:text-[#F97316]'
                        }`} 
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                    {!isCollapsed && (
                        <>
                            <span className={`flex-1 text-left text-[13px] truncate font-medium ${isActive ? 'text-white' : ''}`}>
                                {item.label}
                            </span>
                            {item.badge && (
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm ml-1 ${
                                    isActive ? 'bg-white text-[#F97316]' : item.badgeColor || 'bg-sidebar-border text-sidebar-foreground'
                                }`}>
                                    {item.badge}
                                </span>
                            )}
                        </>
                    )}
                </button>
            </div>
        );
    };

    return (
        <div className={`h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-30 shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col justify-center gap-4 py-6' : 'h-16 justify-between px-4'}`}>
                <Link to="/" className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                    <LogoIcon className="w-8 h-8" />
                    {!isCollapsed && (
                        <span className="font-black text-xl text-[#1A2B3B] tracking-tighter whitespace-nowrap">wisefunnel</span>
                    )}
                </Link>

                <button onClick={toggleCollapse} className="text-sidebar-foreground/70 hover:text-[#F97316] hover:bg-orange-50 rounded-lg p-1.5 transition-all">
                    {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 space-y-7 scrollbar-hide relative pb-10">
                <div className="px-3">
                    <button onClick={() => handleClick('dashboard', '/dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all border-2 ${activeTab === 'dashboard' ? 'bg-[#F97316] text-white border-[#F97316] font-medium' : 'text-sidebar-foreground/70 border-transparent hover:bg-orange-50/50'} ${isCollapsed ? 'justify-center' : ''}`}>
                        <LayoutGrid size={18} />
                        {!isCollapsed && <span className="text-[13px] font-medium">Dashboard</span>}
                    </button>
                </div>

                {methodologyGroups.map((group) => (
                    <div key={group.title} className="relative">
                        {!isCollapsed && (
                            <div className="px-6 mb-2">
                                <h3 className="text-orange-500 text-[12px] font-medium tracking-wider whitespace-nowrap">
                                    {group.title}
                                </h3>
                            </div>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map(renderItem)}
                        </div>
                    </div>
                ))}

                <div className="pt-2">
                    <div className="h-px bg-sidebar-border mx-6 mb-6 opacity-60" />
                    <div className="space-y-0.5">
                        {utilityItems.map(renderItem)}
                        {/* {renderItem({
                            id: 'ai-builder',
                            label: 'Funnel Wiser',
                            icon: Sparkles,
                            path: '/ai-builder',
                            badge: 'AI',
                            badgeColor: 'bg-white text-purple-600',
                            highlight: true,
                            minPlanRank: 0
                        })} */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSidebar;
