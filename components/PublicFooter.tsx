import React from 'react';
import { Link } from 'react-router-dom';
import LogoIcon from './LogoIcon';

const PublicFooter: React.FC = () => {
    return (
        <footer className="bg-white text-[#1A2B3B] border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-16">
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2 group">
                            <LogoIcon className="w-10 h-10" />
                            <span className="font-black text-2xl tracking-tighter text-[#1A2B3B]">wisefunnel</span>
                        </Link>
                        <p className="text-sm text-gray-500 font-bold max-w-xs leading-relaxed">Built by agency owners, for agency owners. The next generation of lead generation fulfillment.</p>
                        <div className="pt-2">
                             <a href="mailto:support@wisefunnel.io" className="text-sm font-black text-[#1A2B3B] hover:text-orange-500 transition-colors flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#1A2B3B]"></div>
                                support@wisefunnel.io
                             </a>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Platform</h4>
                            <ul className="space-y-2">
                                <li><Link to="/templates" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">Blueprints</Link></li>
                                <li><Link to="/public-integrations" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">Connectivity</Link></li>
                                <li><Link to="/ai-builder" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">AI Migration</Link></li>
                                <li><Link to="/#pricing" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">Pricing</Link></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Agency Tools</h4>
                            <ul className="space-y-2">
                                <li><Link to="/dashboard" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">Performance Dashboard</Link></li>
                                <li><Link to="/lead-buyers" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">Lead Buyers Network</Link></li>
                                <li><Link to="/client-finder" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">Client Finder AI</Link></li>
                                <li><a href="https://wa.me/16478623292" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">WhatsApp Support</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Legal</h4>
                            <ul className="space-y-2">
                                <li><Link to="/terms" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">Terms of Service</Link></li>
                                <li><Link to="/privacy" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/cookies" className="text-sm font-bold text-[#1A2B3B]/90 hover:text-orange-500 transition-colors">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="mt-20 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-center items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <span>© 2025 Wisefunnel Technologies Inc.</span>
                </div>
            </div>

            {/* Meta Compliance Disclaimer Section */}
            <div className="bg-gray-50 border-t border-gray-100 py-10 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-[10px] leading-relaxed text-gray-400 font-medium uppercase tracking-wider">
                        This site is not a part of the Facebook website or Facebook Inc. Additionally, This site is NOT endorsed by Facebook in any way. 
                        FACEBOOK is a trademark of FACEBOOK, Inc.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;