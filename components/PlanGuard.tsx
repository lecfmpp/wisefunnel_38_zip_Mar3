import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface PlanGuardProps {
    children: React.ReactNode;
}

const PlanGuard: React.FC<PlanGuardProps> = ({ children }) => {
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            const workspaceId = localStorage.getItem('active_workspace_id');
            if (!workspaceId) {
                setIsChecking(false);
                return;
            }
            // Logic moved to action-level check in pages
            setIsChecking(false);
        };

        checkAccess();

        const handleWsChange = () => checkAccess();
        window.addEventListener('workspaceChanged', handleWsChange);
        
        return () => {
            window.removeEventListener('workspaceChanged', handleWsChange);
        };
    }, []);

    if (isChecking) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden h-full">
            <div className="flex-1 flex flex-col min-h-0">
                {children}
            </div>
        </div>
    );
};

export default PlanGuard;