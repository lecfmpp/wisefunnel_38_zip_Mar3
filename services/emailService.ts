import { supabase } from './supabaseClient';

type ContactData = { name: string; email: string; phone?: string; other?: string; email_verified_status?: string; phone_verified_status?: string };
type SendOutboundParams = {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  html: string;
  workspaceId: string;
};

/**
 * Configuration is managed entirely on the server-side within Supabase Edge Functions.
 */
export const isEmailServiceConfigured = (): boolean => {
  return true;
};

/**
 * Invoke the dedicated Edge Function to send lead notification emails via Resend.
 * Passes the raw quiz answers to be dynamically mapped by the backend.
 */
export const sendLeadNotificationEmail = async (
  contactData: ContactData,
  quizAnswers: Record<string, any>,
  funnelPages: any[],
  funnelSettings: any,
  funnelName: string,
  funnelId: string,
  leadId?: string
) => {
  try {
    console.info(`[EmailService] Preparing dispatch for lead: ${leadId || 'new'}`);

    const branding = funnelSettings?.emailNotifications || {};
    
    // Construct a label map to ensure all categories of quiz steps have human-readable labels in the email
    const fieldLabels: Record<string, string> = {};
    funnelPages.forEach(p => {
        const step = p.elements?.find((el: any) => el.type === 'quiz-step');
        if (step?.content?.field) {
            fieldLabels[step.content.field] = step.content.question || p.title;
            // Handle specific case for 'other' field in contact forms
            if (step.content.field === 'contactInfo' && step.content.showOtherField) {
                fieldLabels['other'] = step.content.otherFieldLabel || 'Additional Notes';
            }
        }
    });

    // Standardizing to path params for public links
    const publicCrmUrl = `https://wisefunnel.io/#/leads/public/${leadId || 'current'}/${funnelId}`;

    // Ensure 'other' field from contact form is part of the intelligence payload if present
    const enrichedAnswers = { ...quizAnswers };
    if (contactData.other && !enrichedAnswers.other) {
        enrichedAnswers.other = contactData.other;
    }

    const payload = {
      funnel_id: funnelId,
      funnel_name: funnelName,
      workspace_id: funnelSettings?.workspaceId || funnelSettings?.workspace_id,
      reply_to: contactData.email, 
      
      // Send raw answers and the labels map for the Edge Function to build the table
      quiz_answers: enrichedAnswers,
      field_labels: fieldLabels,
      
      lead: {
        id: leadId,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        other: contactData.other,
        quiz_answers: enrichedAnswers,
        email_verified_status: contactData.email_verified_status || 'pending',
        phone_verified_status: contactData.phone_verified_status || 'pending'
      },
      settings: {
        enabled: branding.enabled ?? true,
        recipients: branding.recipients ?? [],
        subject: branding.subject ?? `New Lead: ${funnelName}`,
        headline: branding.headline ?? 'A new qualified lead has arrived!',
        primaryColor: branding.primaryColor ?? '#f97316',
        logoUrl: branding.logoUrl ?? '',
        // Enhanced CTA Flags
        callLeadEnabled: branding.callLeadEnabled ?? true,
        callLeadText: branding.callLeadText ?? 'Call Lead Directly',
        callLeadColor: branding.callLeadColor ?? '#10b981',
        viewLeadEnabled: branding.viewLeadEnabled ?? true,
        viewLeadText: branding.viewLeadText ?? 'View Intelligence Report',
        viewLeadColor: branding.viewLeadColor ?? '#2563eb',
        customCtaEnabled: branding.customCtaEnabled ?? false,
        customCtaText: branding.customCtaText ?? 'Visit Website',
        customCtaLink: branding.customCtaLink ?? '',
        customCtaColor: branding.customCtaColor ?? '#f97316',
        // Inject the generated public URL
        viewLeadUrl: publicCrmUrl
      }
    };

    console.debug('[EmailService] Invoking Edge Function with enriched payload:', payload);

    const { data, error } = await supabase.functions.invoke('resend-lead-notifications', {
      body: payload,
    });

    if (error) {
      console.error('[EmailService] Edge Function Error:', error);
      throw error;
    }

    if (data?.error) {
      console.error('[EmailService] Resend API Error:', data.error);
      return { success: false, error: data.error };
    }

    console.info('[EmailService] Dispatch Successful:', data?.id);
    return { success: true, resendId: data?.id };
  } catch (err: any) {
    console.error('[EmailService] Critical Failure:', err);
    return { success: false, error: err?.message };
  }
};

/**
 * Sends a manual outbound outreach email via a dedicated Edge Function.
 * Includes workspace_id to allow backend to determine if custom domain is verified.
 */
export const sendOutboundEmail = async (params: SendOutboundParams) => {
  try {
    const payload = {
      workspace_id: params.workspaceId,
      sender_name: params.fromName,
      sender_email: params.fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    };

    const { data, error } = await supabase.functions.invoke('res-outbound-outreach', {
      body: payload,
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('[EmailService] Outbound dispatch failed:', err);
    throw err;
  }
};