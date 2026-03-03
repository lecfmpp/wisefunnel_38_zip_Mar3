import { Funnel, FunnelElement, FunnelPage } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface Country {
    code: string;
    name: string;
    dialCode: string;
    flag: string;
    format: string;
    zipPlaceholder: string;
    zipRegex: string;
    zipFormat: string;
    zipLimit: number;
}

export const COUNTRIES: Country[] = [
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '(###) ###-####', zipPlaceholder: '90210', zipRegex: '^\\d{5}$', zipFormat: '#####', zipLimit: 5 },
    { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: '(###) ###-####', zipPlaceholder: 'K1A 0B1', zipRegex: '^[A-Z]\\d[A-Z] \\d[A-Z]\\d$', zipFormat: 'A#A #A#', zipLimit: 7 },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: '#### ######', zipPlaceholder: 'SW1A 1AA', zipRegex: '^[A-Z]{1,2}\\d[A-Z\\d]? \\d[A-Z]{2}$', zipFormat: 'A*** ***', zipLimit: 8 },
    { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: '### ### ###', zipPlaceholder: '2000', zipRegex: '^\\d{4}$', zipFormat: '####', zipLimit: 4 },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: '#### #######', zipPlaceholder: '10117', zipRegex: '^\\d{5}$', zipFormat: '#####', zipLimit: 5 },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '## ## ## ## ##', zipPlaceholder: '75001', zipRegex: '^\\d{5}$', zipFormat: '#####', zipLimit: 5 },
    { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', format: '(##) #####-####', zipPlaceholder: '01001-000', zipRegex: '^\\d{5}-\\d{3}$', zipFormat: '#####-###', zipLimit: 9 },
    { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', format: '### ### ###', zipPlaceholder: '1000-001', zipRegex: '^\\d{4}-\\d{3}$', zipFormat: '####-###', zipLimit: 8 },
    { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', format: '### ### ###', zipPlaceholder: '28001', zipRegex: '^\\d{5}$', zipFormat: '#####', zipLimit: 5 },
    { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', format: '## #### ####', zipPlaceholder: '01000', zipRegex: '^\\d{5}$', zipFormat: '#####', zipLimit: 5 },
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: '#####-#####', zipPlaceholder: '110001', zipRegex: '^\\d{6}$', zipFormat: '######', zipLimit: 6 },
    { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', format: '## ########', zipPlaceholder: '1011 AB', zipRegex: '^\\d{4} [A-Z]{2}$', zipFormat: '#### AA', zipLimit: 7 },
    { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', format: '### #######', zipPlaceholder: '00100', zipRegex: '^\\d{5}$', zipFormat: '#####', zipLimit: 5 },
    { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', format: '## ### ## ##', zipPlaceholder: '1000', zipRegex: '^\\d{4}$', zipFormat: '####', zipLimit: 4 },
    { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', format: '## ### ####', zipPlaceholder: '00000', zipRegex: '^\\d{5}$', zipFormat: '#####', zipLimit: 5 },
];

const LOGO_STORAGE_URL = 'https://iwvlmpgeodctctmaacja.supabase.co/storage/v1/object/public/Logo%20Slider';

export const UNIVERSAL_LOGOS = [
    { id: '1', src: `${LOGO_STORAGE_URL}/logo-slider-1.webp`, alt: 'Partner 1' },
    { id: '2', src: `${LOGO_STORAGE_URL}/logo-slider-2.webp`, alt: 'Partner 2' },
    { id: '3', src: `${LOGO_STORAGE_URL}/logo-slider-3.webp`, alt: 'Partner 3' },
    { id: '4', src: `${LOGO_STORAGE_URL}/logo-slider-4.webp`, alt: 'Partner 4' },
    { id: '5', src: `${LOGO_STORAGE_URL}/logo-slider-5.webp`, alt: 'Partner 5' },
    { id: '6', src: `${LOGO_STORAGE_URL}/logo-slider-6.webp`, alt: 'Partner 6' },
    { id: '7', src: `${LOGO_STORAGE_URL}/logo-slider-7.webp`, alt: 'Partner 7' },
    { id: '8', src: `${LOGO_STORAGE_URL}/logo-slider-8.webp`, alt: 'Partner 8' },
];

const COMMON_HEADER: FunnelElement = {
    id: 'el-header-global',
    type: 'header',
    content: {
        logoText: 'WISEFUNNEL',
        logoImage: '',
        phone: '800-555-0199',
        ctaText: 'Get Started',
        ctaType: 'quiz',
        ctaLink: '',
        showCta: true,
        showLogo: true,
        showBrandText: true,
        ctaTextStyle: { size: 'sm', backgroundColor: '#F97316', textColor: '#ffffff' },
        logoSize: 'M',
        phoneStyle: { fontSize: 'm', fontWeight: 'bold', color: '#9CA3AF' }
    },
    style: { backgroundColor: '#ffffff', paddingTop: '6', paddingBottom: '6', sticky: true }
};

const COMMON_FOOTER: FunnelElement = {
    id: 'el-footer-global',
    type: 'footer-complex',
    content: {
        logoText: 'WISEFUNNEL',
        logoImage: '',
        logoSize: 'M',
        footerDescription: 'Precision lead generation solutions powered by Wisefunnel Technologies.',
        copyrightText: '© 2025 All Rights Reserved.',
        showLogo: true,
        showBrandText: true,
        mainLinks: [{ text: 'Privacy Policy', href: '#' }, { text: 'Terms of Use', href: '#' }],
        socialLinks: { facebook: '#', twitter: '#', instagram: '#', linkedin: '#' }
    },
    style: { backgroundColor: '#111827', color: '#ffffff', paddingTop: '10', paddingBottom: '10' }
};

export const DEFAULT_RESULT_CTA = {
    enabled: true,
    text: "Claim Full Results via WhatsApp",
    linkType: "whatsapp",
    whatsappNumber: "1234567890",
    whatsappMessage: "Hi! I just finished the assessment and I am interested in my custom report.",
    style: {
        backgroundColor: "#25D366",
        textColor: "#ffffff",
        cornerRadius: "xl",
        size: "lg",
        shadow: "md"
    }
};

const createQuizStep = (id: string, title: string, subtitle: string, type: 'single' | 'slider' | 'input' | 'multiple' | 'zip' | 'otp', field: string, options?: any[], validation?: any): FunnelPage => ({
    id,
    title,
    type: 'quiz',
    visits_count: 0,
    elements: [{
        id: uuidv4(),
        type: 'quiz-step',
        content: { question: title, subtitle, quizType: type, field, options, validation },
        style: { backgroundColor: '#ffffff', paddingTop: '10', paddingBottom: '10' }
    }]
});

export const BLUEPRINTS: Record<string, Funnel> = {
    'business-loan': {
        id: 'blueprint-business-loan',
        name: 'Business Loan Qualification',
        theme: { primaryColor: '#F97316', fontFamily: 'Inter' },
        settings: {
            metaTitle: 'Business Loan Assessment 2025',
            metaDescription: 'Find the best funding options for your company growth.',
            metaImage: '', favicon: '', customCSS: '', trackingHead: '', trackingBody: '',
            cookieBanner: { enabled: true, text: 'We use cookies to secure your assessment.' },
            progressBar: true,
            otpVerification: { enabled: true },
            emailVerification: { enabled: true, allowValid: true, allowCatchAll: false, allowDisposable: false, allowUnknown: false, allowInvalid: false },
            emailNotifications: { 
                enabled: true, 
                recipients: [], 
                subject: "Action Required: Your Business Funding Match is Ready", 
                headline: "Hi {name}!", 
                primaryColor: "#F97316", 
                callLeadEnabled: true, 
                viewLeadEnabled: true, 
                customCtaEnabled: true, 
                customCtaText: "Unlock My Funding Report", 
                customCtaLink: "" 
            }
        },
        pages: [
            { 
                id: 'p-start-loan', 
                title: 'Landing', 
                type: 'start', 
                visits_count: 0, 
                elements: [ 
                    { ...COMMON_HEADER, content: { ...COMMON_HEADER.content, logoText: 'FUNDINGPRO', logoImage: 'https://api.iconify.design/lucide:landmark.svg?color=%23F97316', ctaText: 'Get Funded' } }, 
                    { id: 'h-loan', type: 'hero', content: { headline: 'Secure the capital your business deserves.', subheadline: 'Access up to $500k in business funding with competitive rates and 24-hour approvals.', heroCtaText: 'Check Eligibility', heroImage: 'https://iwvlmpgeodctctmaacja.supabase.co/storage/v1/object/public/Hero/hero_business_loan.webp' }, style: { layout: '2-column', backgroundColor: '#ffffff', paddingTop: '24', paddingBottom: '24' } }, 
                    { id: 'l-loan', type: 'logos', content: { logos: UNIVERSAL_LOGOS }, style: { backgroundColor: '#f9fafb', paddingTop: '10', paddingBottom: '10' } }, 
                    { id: 'how-loan', type: 'how-it-works', content: { headline: 'Our 3-Step Funding Process', steps: [{ title: 'Assessment', description: 'Tell us about your business goals.', icon: 'Target' }, { title: 'Matching', description: 'Our AI identifies the best terms.', icon: 'Zap' }, { title: 'Get Funded', description: 'Receive capital in 24 hours.', icon: 'CheckCircle' }] }, style: { backgroundColor: '#ffffff', paddingTop: '24', paddingBottom: '24' } }, 
                    { id: 'test-loan', type: 'testimonials-slider', content: { headline: 'Success Stories', testimonials: [{ quote: "Secured $250k in under 24 hours. Smooth as it gets.", author: "Marcus Thompson", role: "CEO, TechFlow", avatar: "https://i.pravatar.cc/150?u=m1" }, { quote: "The application was incredibly simple. We had our funding before the weekend.", author: "Sarah Jenkins", role: "Founder, GreenLeaf Retail", avatar: "https://i.pravatar.cc/150?u=w1" }, { quote: "Professional support and aggressive rates. Best decision we made this year.", author: "David Chen", role: "Operations, BuildRight", avatar: "https://i.pravatar.cc/150?u=m2" }] }, style: { backgroundColor: '#f9fafb', paddingTop: '24', paddingBottom: '24' } }, 
                    { id: 'faq-loan', type: 'faq', content: { headline: 'Funding Questions', faqItems: [{ question: "How fast can I get funded?", answer: "Our partners typically deliver capital within 24-48 business hours after final approval." }, { question: "Will checking my rate affect my credit?", answer: "No. Our initial qualification uses a soft credit pull that has zero impact on your personal or business credit scores." }, { question: "What industries do you work with?", answer: "We cover over 40+ industries including retail, healthcare, construction, and technology." }] }, style: { backgroundColor: '#ffffff', paddingTop: '24', paddingBottom: '24' } }, 
                    { ...COMMON_FOOTER, content: { ...COMMON_FOOTER.content, logoText: 'FUNDINGPRO' } } 
                ] 
            },
            createQuizStep('bl1', 'How much funding does your business need?', 'This helps us match you with lenders within your required capital range.', 'single', 'primaryValue', [
                { value: "25000", label: "$10k - $25k", icon: "Coins" },
                { value: "75000", label: "$25k - $75k", icon: "Banknote" },
                { value: "150000", label: "$75k - $150k", icon: "Wallet" },
                { value: "350000", label: "$150k - $350k", icon: "Landmark" },
                { value: "500000", label: "$350k - $500k", icon: "Briefcase" },
                { value: "500001", label: "$50k+", icon: "TrendingUp" }
            ]),
            createQuizStep('bl2', 'How long have you been in operation?', 'Lending criteria often depends on business maturity.', 'single', 'businessAge', [
                { value: "0-6", label: "0 - 6 Months", icon: "Clock", scoreModifier: -30, disqualify: true },
                { value: "6-12", label: "6 - 12 Months", icon: "Calendar", scoreModifier: -10 },
                { value: "1-2", label: "1 - 2 Years", icon: "CalendarCheck", scoreModifier: 10 },
                { value: "2+", label: "2+ Years", icon: "Award", scoreModifier: 25 }
            ]),
            createQuizStep('bl3', 'What is your average monthly revenue?', 'Use the slider to represent your gross monthly sales.', 'slider', 'monthlyRevenue', undefined, {
                min: 0,
                max: 250000,
                step: 5000,
                default: 25000,
                format: "currency"
            }),
            createQuizStep('bl4', 'Estimated personal credit score?', 'We use this to determine the best interest rate for your profile.', 'single', 'creditScore', [
                { value: "poor", label: "Poor (< 580)", icon: "ShieldAlert", scoreModifier: -25 },
                { value: "fair", label: "Fair (580 - 659)", icon: "Shield", scoreModifier: 0 },
                { value: "good", label: "Good (660 - 719)", icon: "ShieldCheck", scoreModifier: 15 },
                { value: "excellent", label: "Excellent (720+)", icon: "Zap", scoreModifier: 30 }
            ]),
            createQuizStep('bl5', 'What is your industry?', 'Certain industries qualify for specialized government or private programs.', 'single', 'industry', [
                { value: "retail", label: "Retail / E-commerce", icon: "ShoppingBag" },
                { value: "construction", label: "Construction / Trade", icon: "Hammer" },
                { value: "medical", label: "Medical / Healthcare", icon: "Stethoscope", scoreModifier: 10 },
                { value: "technology", label: "Technology / SaaS", icon: "Cpu" },
                { value: "other", label: "Other Service Industry", icon: "User" }
            ]),
            createQuizStep('bl6', 'How soon do you need the funds?', 'This helps us prioritize fast-track lenders if needed.', 'single', 'urgency', [
                { value: "urgent", label: "Within 48 Hours", icon: "Zap" },
                { value: "soon", label: "Within 2 Weeks", icon: "Timer" },
                { value: "planning", label: "Just Planning Ahead", icon: "Search" }
            ]),
            createQuizStep('bl7', 'Check Your Eligibility', 'Enter your details to view your personalized lending matches.', 'input', 'contactInfo'),
            createQuizStep('bl-otp', 'Identity Verification', '4-digit PIN for security.', 'otp', 'otp_code'),
            { 
                id: 'p-res-loan', 
                title: 'Qualified Result', 
                type: 'end', 
                visits_count: 0, 
                elements: [{ 
                    id: 'r-loan', 
                    type: 'quiz-result', 
                    content: { 
                        minScoreThreshold: 30,
                        headline: "Great News! You are pre-qualified for up to {estimatedValue}", 
                        subheadline: "Based on your {industry} profile and revenue, we've matched you with top-tier business lenders.",
                        metrics: [
                            { 
                                icon: "HandCoins", 
                                label: "Max Funding Amount", 
                                valueRule: "IF score > 80 THEN '$500,000' ELSE IF score > 50 THEN '$250,000' ELSE '$75,000'", 
                                description: "Total potential capital available." 
                            },
                            { 
                                icon: "Percent", 
                                label: "Estimated APR", 
                                valueRule: "IF creditScore == 'excellent' THEN '4.9% - 8.2%' ELSE IF creditScore == 'good' THEN '8.5% - 14%' ELSE '15%+'", 
                                description: "Competitive rates based on your credit tier." 
                            },
                            { 
                                icon: "Zap", 
                                label: "Time to Fund", 
                                valueRule: "IF urgency == 'urgent' AND score > 60 THEN '24-48 Hours' ELSE '3-5 Business Days'", 
                                description: "Speed of delivery to your bank account." 
                            }
                        ], 
                        cta: { ...DEFAULT_RESULT_CTA, text: "Unlock My Funding Report" } 
                    }, 
                    style: { backgroundColor: '#ffffff', paddingTop: '20', paddingBottom: '20' } 
                }] 
            },
            {
                id: 'p-fail-loan',
                title: 'Not Qualified',
                type: 'end',
                visits_count: 0,
                elements: [{
                    id: 'rf-loan',
                    type: 'quiz-result',
                    content: {
                        headline: "Thank you for your interest.",
                        subheadline: "Based on your current profile, we cannot offer funding at this time. Focus on established business history (6+ months) to qualify in the future.",
                        metrics: [
                            { icon: "AlertCircle", label: "Status", valueRule: "Not Qualified", description: "Minimum operational requirements not met." }
                        ],
                        cta: { enabled: false }
                    },
                    style: { backgroundColor: '#ffffff', paddingTop: '20', paddingBottom: '20' }
                }]
            }
        ]
    },
    'solar-panel': {
        id: 'blueprint-solar-assessment',
        name: 'Solar Panel Assessment',
        theme: { primaryColor: '#F97316', fontFamily: 'Inter' },
        settings: {
            metaTitle: 'Solar Savings Assessment 2025',
            metaDescription: 'Calculate your home solar savings potential and ROI.',
            metaImage: '', favicon: '', customCSS: '', trackingHead: '', trackingBody: '',
            cookieBanner: { enabled: true, text: 'We use cookies to enhance your assessment.' },
            progressBar: true,
            otpVerification: { enabled: true },
            emailVerification: { enabled: true, allowValid: true, allowCatchAll: false, allowDisposable: false, allowUnknown: false, allowInvalid: false },
            emailNotifications: { 
                enabled: true, 
                recipients: [], 
                subject: "Your Solar Savings Estimate is Ready ☀️", 
                headline: "Hi {name}!", 
                primaryColor: "#F97316", 
                callLeadEnabled: true, 
                viewLeadEnabled: true, 
                customCtaEnabled: true, 
                customCtaText: "View My Solar Report", 
                customCtaLink: "" 
            }
        },
        pages: [
            { 
                id: 'p-start-solar', 
                title: 'Landing', 
                type: 'start', 
                visits_count: 0, 
                elements: [ 
                    { ...COMMON_HEADER, content: { ...COMMON_HEADER.content, logoText: 'SUNGUARD', logoImage: 'https://api.iconify.design/lucide:sun.svg?color=%23F97316', ctaText: 'Check Savings' } }, 
                    { id: 'h-solar', type: 'hero', content: { headline: 'Slash your electric bill to $0 with precision solar.', subheadline: 'Join 50,000+ homeowners saving $1,500+ annually with local incentives.', heroCtaText: 'Check Eligibility', heroImage: 'https://iwvlmpgeodctctmaacja.supabase.co/storage/v1/object/public/Hero/hero_solar.webp' }, style: { layout: '2-column', backgroundColor: '#ffffff', paddingTop: '24', paddingBottom: '24' } }, 
                    { id: 'l-solar', type: 'logos', content: { logos: UNIVERSAL_LOGOS }, style: { backgroundColor: '#f9fafb', paddingTop: '10', paddingBottom: '10' } }, 
                    { id: 'how-solar', type: 'how-it-works', content: { headline: 'Our 3-Step Savings Audit', steps: [{ title: 'Site Analysis', description: 'We analyze your roof sun exposure.', icon: 'Sun' }, { title: 'Local Incentives', description: 'Our AI identifies tax credits.', icon: 'Target' }, { title: 'Go Solar', description: 'Eliminate your monthly bill.', icon: 'Zap' }] }, style: { backgroundColor: '#ffffff', paddingTop: '24', paddingBottom: '24' } }, 
                    { id: 'test-solar', type: 'testimonials-slider', content: { headline: 'Homeowner Success', testimonials: [{ quote: "My bill went from $240 to $8. The ROI was even better than projected.", author: "Elena Rodriguez", role: "Homeowner, CA", avatar: "https://i.pravatar.cc/150?u=w1" }, { quote: "Professional audit and zero-down financing made this a no-brainer.", author: "Mark Stevens", role: "Homeowner, AZ", avatar: "https://i.pravatar.cc/150?u=m1" }] }, style: { backgroundColor: '#f9fafb', paddingTop: '24', paddingBottom: '24' } }, 
                    { id: 'faq-solar', type: 'faq', content: { headline: 'Solar Inquiries', faqItems: [{ question: "Do I need to pay upfront?", answer: "Most our partners offer zero-down financing where you pay for power, not the panels." }, { question: "What if my roof is shaded?", answer: "We use satellite data to determine if your roof has adequate sun exposure for high efficiency." }] }, style: { backgroundColor: '#ffffff', paddingTop: '24', paddingBottom: '24' } }, 
                    { ...COMMON_FOOTER, content: { ...COMMON_FOOTER.content, logoText: 'SUNGUARD' } } 
                ] 
            },
            createQuizStep('sol1', 'Do you own your home?', 'Solar programs are typically designed for homeowners.', 'single', 'homeOwnership', [
                { value: "own", label: "Yes, I own", icon: "Home", scoreModifier: 30 },
                { value: "rent", label: "No, I rent", icon: "Building", scoreModifier: -50, disqualify: true },
                { value: "buying", label: "In the process of buying", icon: "Key", scoreModifier: 10 }
            ]),
            createQuizStep('sol2', 'What is your average monthly electric bill?', 'High bills often lead to the highest solar savings.', 'slider', 'monthlyBill', undefined, {
                min: 50,
                max: 600,
                step: 10,
                default: 150,
                format: "currency"
            }),
            createQuizStep('sol3', 'How much sun does your roof get?', 'Shading from trees or buildings affects system efficiency.', 'single', 'roofShading', [
                { value: "full_sun", label: "Full Sun", icon: "Sun", scoreModifier: 20 },
                { value: "partial_sun", label: "Partial Sun", icon: "CloudSun", scoreModifier: 5 },
                { value: "mostly_shaded", label: "Mostly Shaded", icon: "Cloud", scoreModifier: -15 }
            ]),
            createQuizStep('sol4', 'What type of roof do you have?', 'This helps us determine the mounting hardware required.', 'single', 'roofType', [
                { value: "asphalt", label: "Asphalt Shingle", icon: "Grid" },
                { value: "tile", label: "Tile / Clay", icon: "Layers" },
                { value: "metal", label: "Metal", icon: "Shield" },
                { value: "flat", label: "Flat Roof", icon: "Maximize" }
            ]),
            createQuizStep('sol5', 'Estimated credit score?', 'Required for zero-down solar financing programs.', 'single', 'creditQualifier', [
                { value: "excellent", label: "Excellent (700+)", icon: "Star", scoreModifier: 20 },
                { value: "good", label: "Good (640-699)", icon: "ThumbsUp", scoreModifier: 10 },
                { value: "fair", label: "Fair (Below 640)", icon: "Minus", scoreModifier: -10 }
            ]),
            createQuizStep('sol6', 'When are you looking to go solar?', 'Federal tax credits may have upcoming deadlines.', 'single', 'timeline', [
                { value: "asap", label: "Immediately", icon: "Zap" },
                { value: "1-3_months", label: "1 - 3 Months", icon: "Calendar" },
                { value: "researching", label: "Just Researching", icon: "Search" }
            ]),
            createQuizStep('sol7', 'Get Your Solar Savings Report', 'Enter your info to see local incentives and your estimated ROI.', 'input', 'contactInfo'),
            createQuizStep('sol-otp', 'Identity Verification', '4-digit PIN for security.', 'otp', 'otp_code'),
            { 
                id: 'p-res-solar', 
                title: 'Qualified Result', 
                type: 'end', 
                visits_count: 0, 
                elements: [{ 
                    id: 'r-solar', 
                    type: 'quiz-result', 
                    content: { 
                        minScoreThreshold: 20,
                        headline: "Great News! Your home is a prime candidate for Solar.", 
                        subheadline: "Based on your {monthlyBill} monthly bill, you could eliminate up to 95% of your electricity costs.",
                        metrics: [
                            { 
                                icon: "PiggyBank", 
                                label: "20-Year Savings", 
                                valueRule: "CALCULATE savingsValue by taking monthlyBill * 12 * 20. If score > 70, multiply by 0.9. If score < 50, multiply by 0.7.", 
                                description: "Total estimated savings over the life of the system." 
                            },
                            { 
                                icon: "Leaf", 
                                label: "Environmental Impact", 
                                valueRule: "IF monthlyBill > 200 THEN '7.5 Tons CO2/Year' ELSE '4.2 Tons CO2/Year'", 
                                description: "Equivalent to planting 100+ trees annually." 
                            },
                            { 
                                icon: "ArrowUpCircle", 
                                label: "Home Value Increase", 
                                valueRule: "IF homeOwnership == 'own' THEN 'Approx. 4.1%' ELSE 'N/A'", 
                                description: "Solar installations typically increase property resale value." 
                            }
                        ], 
                        cta: { ...DEFAULT_RESULT_CTA, text: "View My Solar Report" } 
                    }, 
                    style: { backgroundColor: '#ffffff', paddingTop: '20', paddingBottom: '20' } 
                }] 
            },
            {
                id: 'p-fail-solar',
                title: 'Not Qualified',
                type: 'end',
                visits_count: 0,
                elements: [{
                    id: 'rf-solar',
                    type: 'quiz-result',
                    content: {
                        headline: "Solar might not be the right fit yet.",
                        subheadline: "Currently, solar programs are optimized for property owners. Since you are renting, we suggest contacting your landlord about renewable energy options.",
                        metrics: [
                            { icon: "XCircle", label: "Eligibility", valueRule: "Not Qualified", description: "Home ownership is required for most programs." }
                        ],
                        cta: { enabled: false }
                    },
                    style: { backgroundColor: '#ffffff', paddingTop: '20', paddingBottom: '20' }
                }]
            }
        ]
    }
};

export const MOCK_FUNNEL = BLUEPRINTS['business-loan'];