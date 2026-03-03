import React, { useEffect, useState, useMemo } from 'react';
import { HashRouter, BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import FunnelBuilder from './pages/FunnelBuilder';
import Dashboard from './pages/Dashboard';
import Funnels from './pages/Funnels';
import TemplateSelector from './pages/TemplateSelector';
import Leads from './pages/Leads';
import LeadBuyers from './pages/LeadBuyers';
import ClientFinder from './pages/ClientFinder';
import Outbound from './pages/Outbound';
import Integrations from './pages/Integrations';
import ComingSoon from './pages/ComingSoon';
import AdBuilder from './pages/AdBuilder';
import WorkspaceSettings from './pages/WorkspaceSettings';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MyAccount from './pages/MyAccount';
import LandingPage from './pages/LandingPage';
import PublicAI from './pages/PublicAI';
import PublicFunnel from './pages/PublicFunnel';
import PublicTemplates from './pages/PublicTemplates';
import PublicIntegrations from './pages/PublicIntegrations';
import PublicLeadReport from './pages/PublicLeadReport';
import PublicLiveReport from './pages/PublicLiveReport';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Imprint from './pages/Imprint';
import { supabase } from './services/supabaseClient';
import TrialBanner from './components/TrialBanner';
import VerificationBanner from './components/VerificationBanner';
import Distribution from './pages/Distribution';

const getDomainContext = () => {
  const hostname = window.location.hostname;
  
  // App domains (Builder, Dashboard, etc.)
  if (
    hostname === 'localhost' || 
    hostname === 'wisefunnel.io' ||
    hostname === 'www.wisefunnel.io' ||
    hostname === 'wiseform.io' ||
    hostname === 'www.wiseform.io' ||
    hostname === 'landing.wiseform.io' ||
    hostname.includes('web.app') ||
    hostname.includes('run.app') ||
    hostname.includes('cloudworkstations.dev')
  ) {
    return { type: 'app' as const };
  }

  // Subdomain of wiseform.io for public funnels
  if (hostname.endsWith('wiseform.io')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) { // subdomain.wiseform.io
      return { type: 'funnel' as const, slug: parts[0] };
    }
     // Fallback for edge cases, treat root as app
    return { type: 'app' as const };
  }
  
  // Assume everything else is a custom domain for a funnel
  return { type: 'funnel' as const, slug: hostname };
};

const AuthListener: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<any>(null);
  const [isVerificationPending, setIsVerificationPending] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      const currentPath = location.pathname.toLowerCase();
      const rawHash = window.location.hash.toLowerCase();
      const pathPart = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
      
      const publicPaths = ['/', '/login', '/signup', '/reset-password', '/ai-builder', '/templates', '/public-integrations', '/terms', '/privacy', '/cookies', '/imprint'];
      const publicPrefixes = ['/funnel/', '/reports/live/', '/leads/public/'];
      
      const isPublicPath = publicPaths.some(p => 
        currentPath === p || 
        currentPath === p + '/' ||
        pathPart === p ||
        pathPart === p + '/' ||
        pathPart.startsWith(p + '?')
      ) || publicPrefixes.some(pref => 
        currentPath.startsWith(pref) || 
        pathPart.startsWith(pref) ||
        rawHash.includes(pref)
      );

      const pending = sessionStorage.getItem('wf_verification_pending') === 'true' || 
                      (currentSession?.user && !currentSession.user.email_confirmed_at);
      
      setIsVerificationPending(!!pending);

      if (currentSession || pending) {
        const authPages = ['/login']; 
        if (authPages.includes(currentPath) || authPages.includes(pathPart)) {
          navigate('/dashboard' + location.search, { replace: true });
        }
      } else {
        if (!isPublicPath) {
          navigate('/login', { replace: true });
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const pending = sessionStorage.getItem('wf_verification_pending') === 'true' || 
                      (session?.user && !session.user.email_confirmed_at);
      
      setIsVerificationPending(!!pending);
      setSession(session);

      if (event === 'SIGNED_OUT') {
        const rawHash = window.location.hash.toLowerCase();
        const currentPath = window.location.pathname.toLowerCase();
        const pathPart = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;

        const publicPaths = ['/', '/login', '/signup', '/reset-password', '/ai-builder', '/templates', '/public-integrations', '/terms', '/privacy', '/cookies', '/imprint'];
        const publicPrefixes = ['/funnel/', '/reports/live/', '/leads/public/'];
        
        const isPublicPath = publicPaths.some(p => 
            currentPath === p || pathPart === p || pathPart.startsWith(p + '?')
        ) || publicPrefixes.some(pref => 
            currentPath.startsWith(pref) || pathPart.startsWith(pref) || rawHash.includes(pref)
        );
        
        if (!isPublicPath && sessionStorage.getItem('wf_verification_pending') !== 'true') {
          localStorage.removeItem('active_workspace_id');
          navigate('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate, location.search]);

  const isPublicPage = useMemo(() => {
    const currentPath = location.pathname.toLowerCase();
    const rawHash = window.location.hash.toLowerCase();
    const pathPart = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
    
    const publicPaths = ['/', '/login', '/signup', '/reset-password', '/ai-builder', '/templates', '/public-integrations', '/terms', '/privacy', '/cookies', '/imprint'];
    const publicPrefixes = ['/funnel/', '/reports/live/', '/leads/public/'];
    
    return publicPaths.some(p => 
        currentPath === p || currentPath === p + '/' || pathPart === p || pathPart === p + '/' || pathPart.startsWith(p + '?')
    ) || publicPrefixes.some(pref => 
        currentPath.startsWith(pref) || pathPart.startsWith(pref) || rawHash.includes(pref) || rawHash.startsWith('#/funnel/')
    );
  }, [location.pathname]);

  return (
    <div className={`flex flex-col ${isPublicPage ? 'min-h-screen' : 'h-screen overflow-hidden'}`}>
      {!isPublicPage && isVerificationPending && <VerificationBanner />}
      {session && !isPublicPage && <TrialBanner />}
      <div className={`flex-1 flex flex-col ${isPublicPage ? '' : 'min-h-0'}`}>
        {children}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const domainContext = useMemo(() => getDomainContext(), []);

  if (domainContext.type === 'funnel') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<PublicFunnel domainSlug={domainContext.slug} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <HashRouter>
      <AuthListener>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ai-builder" element={<PublicAI />} />
          <Route path="/templates" element={<PublicTemplates />} />
          <Route path="/public-integrations" element={<PublicIntegrations />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/imprint" element={<Imprint />} />
          
          <Route path="/funnel/:funnelId/*" element={<PublicFunnel />} />
          <Route path="/leads/public/:leadId/:funnelId" element={<PublicLeadReport />} />
          <Route path="/reports/live/:buyerId/*" element={<PublicLiveReport />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/funnels" element={<Funnels />} />
          <Route path="/builder" element={<FunnelBuilder />} />
          <Route path="/internal-templates" element={<TemplateSelector />} />
          <Route path="/leads" element={<Leads />} />
          
          <Route path="/client-finder" element={<ClientFinder />} />
          <Route path="/outbound" element={<Outbound />} />
          <Route path="/distribution" element={<Distribution />} />

          <Route path="/lead-buyers" element={<LeadBuyers />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/account" element={<MyAccount />} />
          <Route path="/ad-builder" element={<AdBuilder />} />
          <Route path="/settings" element={<WorkspaceSettings />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthListener>
    </HashRouter>
  );
};

export default App;
