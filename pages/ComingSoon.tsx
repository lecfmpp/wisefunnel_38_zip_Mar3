import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalSidebar from '../components/GlobalSidebar';
import WorkspaceNavbar from '../components/WorkspaceNavbar';
import { Rocket, ArrowLeft } from 'lucide-react';

const ComingSoon: React.FC<{ title: string; description?: string }> = ({ title, description }) => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-background font-sans">
            <GlobalSidebar activeTab="" onTabChange={() => {}} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <WorkspaceNavbar />
                <main className="flex-1 flex items-center justify-center p-12">
                    <div className="max-w-md w-full text-center space-y-8 animate-fade-in-down">
                        <div className="w-24 h-24 bg-primary/10 text-primary rounded-[16px] flex items-center justify-center mx-auto shadow-xl shadow-primary/5">
                            <Rocket size={48} />
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-[34px] font-black text-[#1a2b3b] tracking-tight">{title}</h1>
                            <p className="text-muted-foreground font-medium">{description || "We're currently building something amazing. This feature will be available in the next major update."}</p>
                        </div>
                        <button 
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-all shadow-sm"
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ComingSoon;