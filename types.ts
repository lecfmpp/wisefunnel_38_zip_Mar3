import React from 'react';

export type ElementType = 'header' | 'hero' | 'how-it-works' | 'feature-split' | 'services-grid' | 'faq' | 'testimonials-slider' | 'blog-posts' | 'cta-banner' | 'footer-complex' | 'quiz-step' | 'quiz-processing' | 'quiz-result' | 'logos';

export interface TextStyle {
  fontSize?: 's' | 'm' | 'l' | 'xl';
  fontWeight?: 'normal' | 'medium' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  marginTop?: number;
  marginBottom?: number;
  mobile?: {
    fontSize?: 's' | 'm' | 'l' | 'xl';
    fontWeight?: 'normal' | 'medium' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    marginTop?: number;
    marginBottom?: number;
  };
}

export interface ButtonStyle {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'filled' | 'outline';
  fontWeight?: 'normal' | 'medium' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  backgroundColor?: string;
  textColor?: string;
  cornerRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  mobile?: {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fullWidth?: boolean;
    cornerRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  };
}

export interface ImageStyle {
  alignment?: 'left' | 'center' | 'right';
  width?: 'auto' | '100%';
  cornerRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  opacity?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: number;
  scale?: number;
  objectPosition?: string;
}

export interface ElementStyle {
  backgroundColor?: string;
  color?: string;
  paddingTop?: string;
  paddingBottom?: string;
  backgroundType?: 'color' | 'image';
  backgroundImage?: string;
  backgroundOpacity?: number;
  layout?: '1-column' | '2-column' | '3-column';
  alignment?: 'left' | 'center' | 'right';
  reverse?: boolean;
  sticky?: boolean;
  [key: string]: any;
}

export interface FunnelElement {
  id: string;
  type: ElementType;
  content: {
    logoText?: string;
    logoImage?: string;
    showLogo?: boolean;
    showBrandText?: boolean;
    navLinks?: Array<{ text: string; href?: string; type?: 'url' | 'section'; targetSection?: string }>;
    phone?: string;
    ctaText?: string;
    headline?: string;
    subheadline?: string;
    heroImage?: string;
    question?: string;
    subtitle?: string;
    quizType?: 'single' | 'slider' | 'input' | 'multiple' | 'zip' | 'otp';
    field?: string;
    options?: Array<{ 
      label: string; 
      value: string; 
      icon?: string; 
      scoreModifier?: number;
      disqualify?: boolean;
      linkType?: 'url' | 'section' | 'page' | 'quiz';
      linkUrl?: string;
    }>;
    validation?: { min?: number; max?: number; step?: number; format?: 'currency' | 'number' | 'percent'; default?: number };
    metrics?: Array<{ label: string; icon: string; description: string; valueRule: string }>;
    [key: string]: any;
  }; 
  style: ElementStyle;
}

export interface FunnelPage {
  id: string;
  title: string;
  slug?: string;
  type: 'start' | 'quiz' | 'processing' | 'end';
  elements: FunnelElement[];
  confetti?: boolean;
  trackingCode?: string;
  redirectUrl?: string;
  order_index?: number;
  parent_id?: string | null;
  visits_count?: number;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  recipients: string[];
  subject: string;
  headline: string;
  primaryColor: string;
  callLeadEnabled: boolean;   
  callLeadText?: string;
  callLeadColor?: string;
  viewLeadEnabled: boolean;
  viewLeadText?: string;
  viewLeadColor?: string;
  customCtaEnabled: boolean;
  customCtaText: string;
  customCtaLink: string;
  customCtaColor?: string;
  logoUrl?: string;
}

export interface EmailVerificationSettings {
  enabled: boolean;
  provider?: 'findymail' | 'abstract' | 'neverbounce' | 'zerobounce';
  apiKey?: string;
  allowValid: boolean;
  allowCatchAll: boolean;
  allowDisposable: boolean;
  allowUnknown: boolean;
  allowInvalid: boolean;
}

export interface FunnelSettings {
  metaTitle: string;
  metaDescription: string;
  metaImage: string;
  favicon: string;
  customCSS: string;
  trackingHead: string;
  trackingBody: string;
  customDomain?: string;
  cookieBanner: { 
    enabled: boolean; 
    text: string;
    showNecessary?: boolean;
    showPreferences?: boolean;
    necessaryLabel?: string;
    allLabel?: string;
    preferencesLabel?: string;
  };
  progressBar: boolean;
  emailNotifications?: EmailNotificationSettings;
  otpVerification?: { 
    enabled: boolean; 
    provider?: 'twilio' | 'messagebird' | 'none'; 
    twilioSid?: string;
    twilioToken?: string;
    twilioServiceSid?: string;
  };
  emailVerification?: EmailVerificationSettings;
  hideBranding?: boolean;
}

export interface Funnel {
  id: string;
  workspaceId?: string;
  name: string;
  slug?: string;
  theme: {
    primaryColor: string;
    fontFamily: string;
  };
  status?: 'draft' | 'live';
  lastEdited?: string;
  thumbnailUrl?: string;
  contactsCount?: number;
  settings: FunnelSettings;
  pages: FunnelPage[];
  visits_count?: number;
  is_template?: boolean;
}

export interface DistributionRule {
    id: string;
    workspace_id: string;
    funnel_id: string;
    operator: string;
    min_points: number;
    buyer_ids: string[];
}

export interface PotentialBuyer {
  id: string;
  businessName: string;
  category: string;
  location: string;
  phone: string;
  website: string;
  rating?: number;
}

export type BuyerStatus = 'active' | 'hold' | 'not-contacted' | 'contacted' | 'negotiation' | 'rejected';

export interface Lead {
    id: string;
    created_at: string;
    source: string;
    funnel_id: string;
    name: string;
    email: string;
    phone: string;
    status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
    quiz_answers: Record<string, any>;
    email_verified_status?: string;
    phone_verified_status?: string;
    source_funnel_name?: string;
}

export interface LeadBuyerExtended {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: BuyerStatus;
  statusReason?: string;
  assignedLeads: number;
  funnelIds: string[];
  paymentAmount?: number;
  niche?: string;
  location?: string;
}