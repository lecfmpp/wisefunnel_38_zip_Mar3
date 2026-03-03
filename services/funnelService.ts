
import { supabase } from "./supabaseClient";
import { Funnel, FunnelPage } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { UNIVERSAL_LOGOS } from "../constants";

const PUBLIC_STORAGE_URL = 'https://iwvlmpgeodctctmaacja.supabase.co/storage/v1/object/public/Hero';

export const slugify = (text: string): string => {
  return text
    .toString()
    .normalize('NFD') // Handles accented characters
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Robust, niche-specific content mapping using Public Storage URLs
const nicheConfig = [
  { 
    keywords: ['business loan', 'funding'], 
    brandName: 'FUNDINGPRO', 
    brandIcon: 'https://api.iconify.design/lucide:landmark.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_business_loan.webp`,
    headline: 'Secure the capital your business deserves.',
    subheadline: 'Access up to $500k in business funding with competitive rates and 24-hour approvals.',
    ctaText: 'Check Eligibility',
    steps: [
        { title: 'Assessment', description: 'Tell us about your business goals.', icon: 'Target' },
        { title: 'Matching', description: 'Our AI identifies the best terms.', icon: 'Zap' },
        { title: 'Get Funded', description: 'Receive capital in 24 hours.', icon: 'CheckCircle' }
    ]
  },
  { 
    keywords: ['solar'], 
    brandName: 'SUNGUARD', 
    brandIcon: 'https://api.iconify.design/lucide:sun.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_solar.webp`,
    headline: 'Slash your electric bill to $0 with precision solar.',
    subheadline: 'Join 50,000+ homeowners saving $1,500+ annually with local incentives.',
    ctaText: 'Check Savings',
    steps: [
        { title: 'Site Analysis', description: 'We analyze your roof sun exposure.', icon: 'Sun' },
        { title: 'Local Incentives', description: 'Our AI identifies tax credits.', icon: 'Target' },
        { title: 'Go Solar', description: 'Eliminate your monthly bill.', icon: 'Zap' }
    ]
  },
  { 
    keywords: ['home insurance'], 
    brandName: 'HOMEGUARDPRO', 
    brandIcon: 'https://api.iconify.design/lucide:home.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_home_insurance.webp`,
    headline: 'Protect your home for less with top-tier rates.',
    subheadline: 'Compare the nation\'s leading home insurance providers in under 60 seconds.',
    ctaText: 'Get My Quote',
    steps: [
        { title: 'Home Details', description: 'Tell us about your property.', icon: 'Home' },
        { title: 'Market Scan', description: 'We compare 30+ top carriers.', icon: 'Search' },
        { title: 'Save Big', description: 'Lock in your lowest premium.', icon: 'ShieldCheck' }
    ]
  },
  { 
    keywords: ['home improvement'], 
    brandName: 'HOMEFIXPRO', 
    brandIcon: 'https://api.iconify.design/lucide:wrench.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_home_improvements.webp`,
    headline: 'Transform your home with verified local pros.',
    subheadline: 'Get matched with top-rated contractors for your next remodel or repair project.',
    ctaText: 'Start My Project',
    steps: [
        { title: 'Describe Project', description: 'Tell us what you need built.', icon: 'Hammer' },
        { title: 'Expert Match', description: 'We find verified local pros.', icon: 'Users' },
        { title: 'Get Quotes', description: 'Compare and choose the best.', icon: 'FileText' }
    ]
  },
  { 
    keywords: ['car insurance', 'auto insurance'], 
    brandName: 'AUTOGUARD', 
    brandIcon: 'https://api.iconify.design/lucide:car.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_car_insurance.webp`,
    headline: 'Stop overpaying for your car insurance.',
    subheadline: 'Drivers save an average of $600/year when they compare with AutoGuard.',
    ctaText: 'Save Now',
    steps: [
        { title: 'Driver Profile', description: 'Simple 30-second driver quiz.', icon: 'User' },
        { title: 'Rate Compare', description: 'Instantly view multiple quotes.', icon: 'TrendingDown' },
        { title: 'Switch & Save', description: 'Finalize and start saving today.', icon: 'Check' }
    ]
  },
  { 
    keywords: ['real estate'], 
    brandName: 'ESTATEPRO', 
    brandIcon: 'https://api.iconify.design/lucide:building-2.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_real_estate.webp`,
    headline: 'The smartest way to buy or sell your home.',
    subheadline: 'Connect with the top 1% of agents in your area and maximize your ROI.',
    ctaText: 'Get Started',
    steps: [
        { title: 'Property Goals', description: 'Buying, selling, or investing?', icon: 'Home' },
        { title: 'Agent Match', description: 'Matched with local specialists.', icon: 'Star' },
        { title: 'Close Fast', description: 'Expert guidance to the finish.', icon: 'Key' }
    ]
  },
  { 
    keywords: ['mortgage'], 
    brandName: 'MORTGAGEPRO', 
    brandIcon: 'https://api.iconify.design/lucide:landmark.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_mortgage.webp`,
    headline: 'Lock in your lowest mortgage rate today.',
    subheadline: 'Prequalify in minutes for home purchases or refinancing with zero impact on credit.',
    ctaText: 'Check My Rate',
    steps: [
        { title: 'Financial Goal', description: 'New purchase or refinance?', icon: 'DollarSign' },
        { title: 'Lender Match', description: 'Compare specialized programs.', icon: 'Zap' },
        { title: 'Prequalify', description: 'Get your official letter fast.', icon: 'FileCheck' }
    ]
  },
  { 
    keywords: ['financial advisor', 'finance', 'financial planning'], 
    brandName: 'FINANCEPRO', 
    brandIcon: 'https://api.iconify.design/lucide:banknote.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_financing_planning.webp`,
    headline: 'Secure your financial future with expert advice.',
    subheadline: 'Get matched with a fiduciary advisor tailored to your wealth goals.',
    ctaText: 'Plan My Future',
    steps: [
        { title: 'Wealth Quiz', description: 'Define your investment profile.', icon: 'BarChart' },
        { title: 'Expert Match', description: 'Connect with fiduciary pros.', icon: 'Users' },
        { title: 'Grow Wealth', description: 'Start your custom roadmap.', icon: 'TrendingUp' }
    ]
  },
  { 
    keywords: ['divorce', 'family law'], 
    brandName: 'LEGALGUARD', 
    brandIcon: 'https://api.iconify.design/lucide:gavel.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_divorce.webp`,
    headline: 'Expert legal support for your family\'s future.',
    subheadline: 'Connect with compassionate, experienced family law attorneys in your area.',
    ctaText: 'Speak to Counsel',
    steps: [
        { title: 'Case Details', description: 'Confidential case overview.', icon: 'FileText' },
        { title: 'Attorney Match', description: 'Matched with local specialists.', icon: 'Shield' },
        { title: 'Consultation', description: 'Schedule your expert review.', icon: 'Calendar' }
    ]
  },
  { 
    keywords: ['personal injury'], 
    brandName: 'INJURYGUARD', 
    brandIcon: 'https://api.iconify.design/lucide:shield.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_law_injury.webp`,
    headline: 'Get the compensation you deserve.',
    subheadline: 'Don\'t settle for less. We connect you with top personal injury litigators.',
    ctaText: 'Check My Claim',
    steps: [
        { title: 'Incident Info', description: 'Simple incident report quiz.', icon: 'AlertTriangle' },
        { title: 'Claim Review', description: 'Legal pros assess your case.', icon: 'Scale' },
        { title: 'Get Paid', description: 'Fight for max compensation.', icon: 'CheckCircle' }
    ]
  },
  { 
    keywords: ['medicare', 'senior healthcare'], 
    brandName: 'MEDIGUARD', 
    brandIcon: 'https://api.iconify.design/lucide:heart-pulse.svg?color=%23F97316', 
    heroImage: `https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?w=1200`,
    headline: 'Simplify your Medicare choices.',
    subheadline: 'Compare Advantage and Supplement plans to find the right coverage at the right price.',
    ctaText: 'Check Benefits',
    steps: [
        { title: 'Coverage Needs', description: 'Select your health priorities.', icon: 'Heart' },
        { title: 'Plan Compare', description: 'See all options side-by-side.', icon: 'Search' },
        { title: 'Enroll Fast', description: 'Expert help with transition.', icon: 'ClipboardCheck' }
    ]
  },
  { 
    keywords: ['life insurance'], 
    brandName: 'LIFEGUARDPRO', 
    brandIcon: 'https://api.iconify.design/lucide:shield-check.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/hero_life_insurance.webp`,
    headline: 'Peace of mind for the ones you love.',
    subheadline: 'Protect your family\'s future with affordable, high-coverage life insurance.',
    ctaText: 'Get Protected',
    steps: [
        { title: 'Profile', description: 'Basic health and age info.', icon: 'User' },
        { title: 'Coverage Match', description: 'Find the best policy terms.', icon: 'Target' },
        { title: 'Secure Future', description: 'Peace of mind in minutes.', icon: 'Shield' }
    ]
  },
  { 
    keywords: ['marketing agency', 'smma', 'growth'], 
    brandName: 'GROWTHPRO', 
    brandIcon: 'https://api.iconify.design/lucide:rocket.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/smma.webp`,
    headline: 'Scale your business with data-driven growth.',
    subheadline: 'Stop guessing. Start growing with our custom ROI blueprint and audit.',
    ctaText: 'Get My Audit',
    steps: [
        { title: 'Audit', description: 'We analyze your current ads.', icon: 'Search' },
        { title: 'Blueprint', description: 'Custom scaling roadmap.', icon: 'Map' },
        { title: 'Growth', description: 'Execute and dominate.', icon: 'TrendingUp' }
    ]
  },
  { 
    keywords: ['pay per lead'], 
    brandName: 'LEADSCALE PRO', 
    brandIcon: 'https://api.iconify.design/lucide:zap.svg?color=%23F97316', 
    heroImage: `${PUBLIC_STORAGE_URL}/pay_per_lead.webp`,
    headline: 'High-intent leads, delivered on demand.',
    subheadline: 'Tired of shared leads? We generate exclusive, real-time leads that actually convert.',
    ctaText: 'Scale My Sales',
    steps: [
        { title: 'Niche Scan', description: 'Tell us your target industry.', icon: 'Target' },
        { title: 'Volume Test', description: 'We estimate daily lead flow.', icon: 'Zap' },
        { title: 'Lead Delivery', description: 'Start receiving hot leads.', icon: 'Mail' }
    ]
  },
];

const allKeywords = nicheConfig.flatMap(c => c.keywords).sort((a, b) => b.length - a.length);

const getBrandingForNiche = (niche: string) => {
  const lowerNiche = niche.toLowerCase();
  const matchedKeyword = allKeywords.find(keyword => lowerNiche.includes(keyword));

  if (matchedKeyword) {
    const matchedConfig = nicheConfig.find(config => config.keywords.includes(matchedKeyword));
    if (matchedConfig) return matchedConfig;
  }

  return {
    brandName: niche.toUpperCase().replace(/\s+/g, '') + 'PRO',
    brandIcon: 'https://api.iconify.design/lucide:shield-check.svg?color=%23F97316',
    heroImage: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=1200',
    headline: `Precision ${niche} Solutions.`,
    subheadline: 'Compare tailored results from top-rated providers in under 60 seconds.',
    ctaText: 'Get Started',
    steps: [
        { title: 'Analysis', description: 'Answer a few simple questions.', icon: 'Target' },
        { title: 'Matching', description: 'Our AI finds the best providers.', icon: 'Search' },
        { title: 'Success', description: 'Lock in your results.', icon: 'Zap' }
    ]
  };
};

export const mapTemplateToFunnel = (templateData: any, workspaceId: string): Partial<Funnel> => {
    const { niche, quizConfig, resultsPageConfig, emailConfig } = templateData;
    const pages: Partial<FunnelPage>[] = [];
    const config = getBrandingForNiche(niche);
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

    pages.push({
        id: uuidv4(),
        title: 'Landing Page',
        slug: createUniqueSlug('Landing Page'),
        type: 'start',
        order_index: 0,
        visits_count: 0,
        elements: [
            {
                id: uuidv4(),
                type: 'header',
                content: { 
                    logoText: config.brandName, 
                    logoImage: config.brandIcon,
                    phone: '800-555-0100', 
                    ctaText: config.ctaText, 
                    showCta: true,
                    showLogo: true,
                    showBrandText: true,
                    logoSize: 'M',
                    phoneStyle: { fontSize: 'm', fontWeight: 'bold', color: '#9CA3AF' }
                },
                style: { backgroundColor: '#ffffff', paddingTop: '6', paddingBottom: '6', sticky: true }
            },
            {
                id: uuidv4(),
                type: 'hero',
                content: { 
                    headline: config.headline, 
                    subheadline: config.subheadline,
                    heroCtaText: config.ctaText,
                    heroImage: config.heroImage
                },
                style: { layout: '2-column', backgroundColor: '#ffffff', paddingTop: '24', paddingBottom: '24' }
            },
            {
                id: uuidv4(),
                type: 'logos',
                content: { logos: UNIVERSAL_LOGOS },
                style: { backgroundColor: '#f9fafb', paddingTop: '10', paddingBottom: '10' }
            },
            {
                id: uuidv4(),
                type: 'how-it-works',
                content: {
                    headline: `Our 3-Step ${niche} Process`,
                    subheadline: 'We make securing results fast, transparent, and completely digital.',
                    steps: config.steps
                },
                style: { backgroundColor: '#ffffff', paddingTop: '24', paddingBottom: '24' }
            },
            {
                id: uuidv4(),
                type: 'testimonials-slider',
                content: {
                    headline: 'Client Success Stories',
                    subheadline: 'Join thousands who trust our data-driven engine.',
                    testimonials: [
                        { quote: "The process was incredibly smooth. I was matched with a preferred rate I couldn\'t find anywhere else.", author: "Mark Stevens", role: "Verified Partner", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
                        { quote: "Finally, a platform that understands lead quality. The verification stack alone is worth every penny.", author: "Sarah Jenkins", role: "Operations Lead", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
                        { quote: "We doubled our conversion rate in the first week. The UI is clean and the user experience is flawless.", author: "David Chen", role: "Agency Director", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" }
                    ]
                },
                style: { backgroundColor: '#f9fafb', paddingTop: '24', paddingBottom: '24' }
            },
            {
                id: uuidv4(),
                type: 'faq',
                content: {
                    headline: 'Common Questions',
                    faqItems: [
                        { question: "How does the process work?", answer: `Simply complete our quick ${niche} qualification quiz to receive a customized report and matching results.` },
                        { question: "Is my data secure?", answer: "Yes, we use bank-level encryption and strictly adhere to GDPR and CCPA standards to protect your sensitive information." },
                        { question: "How long until I see results?", answer: "Most users receive their matching results and eligibility reports instantly after completing the evaluation." }
                    ]
                },
                style: { backgroundColor: '#ffffff', paddingTop: '24', paddingBottom: '24' }
            },
            {
                id: uuidv4(),
                type: 'footer-complex',
                content: { 
                    logoText: config.brandName, 
                    logoImage: config.brandIcon,
                    logoSize: 'M',
                    footerDescription: `Precision ${niche} solutions powered by Wisefunnel Technologies.`,
                    copyrightText: `© ${new Date().getFullYear()} ${config.brandName}. All Rights Reserved.`,
                    mainLinks: [{ text: 'Privacy Policy', href: '#' }, { text: 'Terms of Use', href: '#' }],
                    socialLinks: { facebook: '#', twitter: '#', instagram: '#', linkedin: '#', whatsapp: '' }
                },
                style: { backgroundColor: '#111827', color: '#ffffff', paddingTop: '15', paddingBottom: '12' }
            }
        ]
    });

    if (quizConfig && quizConfig.steps) {
        quizConfig.steps.forEach((step: any, idx: number) => {
            pages.push({
                id: uuidv4(),
                title: step.title,
                slug: createUniqueSlug(step.title),
                type: 'quiz',
                order_index: idx + 1,
                visits_count: 0,
                elements: [{
                    id: uuidv4(),
                    type: 'quiz-step',
                    content: {
                        question: step.title,
                        subtitle: step.subtitle,
                        quizType: step.type,
                        field: step.field,
                        options: step.options || [],
                        validation: step.validation || {}
                    },
                    style: { backgroundColor: '#ffffff', paddingTop: '10', paddingBottom: '10' }
                }]
            });
        });
    }

    if (resultsPageConfig) {
        pages.push({
            id: uuidv4(),
            title: 'Results',
            slug: createUniqueSlug('Results'),
            type: 'end',
            order_index: pages.length,
            confetti: true,
            visits_count: 0,
            elements: [{
                id: uuidv4(),
                type: 'quiz-result',
                content: {
                    headline: resultsPageConfig.headlineTemplate.replace(/{[^}]+}/g, 'pros'),
                    subheadline: resultsPageConfig.subheadlineTemplate.replace(/{[^}]+}/g, 'immediate'),
                    metrics: resultsPageConfig.metrics.map((m: any) => ({ ...m })),
                    cta: {
                        enabled: true,
                        text: emailConfig?.ctaButtonText || "View Full Report",
                        link: "#",
                        style: { backgroundColor: "#F97316", textColor: "#ffffff", cornerRadius: "xl", size: "lg" }
                    }
                },
                style: { backgroundColor: '#ffffff', paddingTop: '20', paddingBottom: '20' }
            }]
        });
    }

    return {
        name: niche,
        workspaceId,
        theme: { primaryColor: '#F97316', fontFamily: 'Inter' },
        visits_count: 0,
        settings: {
            metaTitle: `${niche} Report`,
            metaDescription: `Access your custom ${niche} evaluation.`,
            metaImage: '', favicon: '', customCSS: '', trackingHead: '', trackingBody: '',
            cookieBanner: { enabled: true, text: 'We use cookies to enhance your experience.' },
            progressBar: true,
            emailNotifications: {
                enabled: true,
                recipients: [],
                subject: emailConfig?.subject || `Your ${niche} Report`,
                headline: (emailConfig?.headline || 'Your results are ready!').replace(/{[^}]+}/g, 'Partner'),
                primaryColor: '#F97316',
                callLeadEnabled: true,
                viewLeadEnabled: true,
                customCtaEnabled: true,
                customCtaText: emailConfig?.ctaButtonText || 'View My Results',
                customCtaLink: ''
            }
        },
        pages: pages as FunnelPage[]
    };
};

export const isFunnelNameTaken = async (name: string, excludeId?: string): Promise<boolean> => {
    let query = supabase.from('funnels').select('id').eq('name', name.trim());
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    return !!data;
};

export const isSlugTaken = async (slug: string, excludeId?: string): Promise<boolean> => {
    let query = supabase.from('funnels').select('id').eq('slug', slug.trim().toLowerCase());
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    return !!data;
};

export const generateUniqueFunnelName = async (baseName: string): Promise<string> => {
    let finalName = baseName.trim();
    let isTaken = await isFunnelNameTaken(finalName);
    let attempts = 0;
    while (isTaken && attempts < 5) {
        const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        finalName = `${baseName.trim()} (${suffix})`;
        isTaken = await isFunnelNameTaken(finalName);
        attempts++;
    }
    return isTaken ? `${baseName.trim()} - ${Date.now().toString().slice(-4)}` : finalName;
};

export const incrementFunnelPageVisits = async (pageId: string) => {
    try {
        await supabase.rpc('increment_funnel_page_visits', { page_id_input: pageId });
    } catch (err) {
        console.error("Page visit recording error:", err);
    }
};
