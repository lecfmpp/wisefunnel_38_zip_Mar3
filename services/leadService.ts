import { supabase } from './supabaseClient';
import { FunnelPage } from '../types';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';

export interface LeadContactData {
  name: string;
  email: string;
  phone?: string;
  sessionId?: string;
  source?: string;
}

export interface LeadUpsertResult {
  leadId: string;
  status: LeadStatus;
  emailVerifiedStatus: string;
  phoneVerifiedStatus: string;
  contactData: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface LeadQuizUpdate {
  field: string;
  value: any;
}

/**
 * Lead Service
 * 
 * Handles all lead-related operations through the upsert-lead Edge Function.
 * Provides:
 * - Upsert with deduplication
 * - Quiz answer updates
 * - Verification status management
 * - Retry logic and error normalization
 */

const LEAD_UPSERT_FUNCTION = 'upsert-lead';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

/**
 * Sleep utility for retry backoff
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Normalize contact data before sending to server
 */
function normalizeContactData(data: LeadContactData): LeadContactData {
  return {
    ...data,
    email: data.email?.trim().toLowerCase() || '',
    name: data.name?.trim() || '',
    phone: data.phone?.trim().replace(/\D/g, '') || undefined,
  };
}

/**
 * Validate contact data client-side before API call
 */
function validateContactData(data: LeadContactData): string | null {
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return 'Please enter a valid email address';
  }
  if (!data.name || data.name.trim().length === 0) {
    return 'Please enter your name';
  }
  return null;
}

/**
 * Upsert a lead via Edge Function
 * 
 * This is the PRIMARY method for creating or updating leads.
 * Guarantees:
 * - Server-side validation
 * - Deduplication on (funnel_id, email)
 * - Atomic upsert operation
 * - Proper schema mapping
 * 
 * @param funnelId - The funnel UUID
 * @param contactData - Name, email, phone (required: email, name)
 * @param quizAnswers - Optional quiz data to merge
 * @param options - Optional config (showErrorsToUser for UI)
 * @returns LeadUpsertResult with lead ID and status
 * @throws Error with user-friendly message on failure
 */
export const upsertLead = async (
  funnelId: string,
  contactData: LeadContactData,
  quizAnswers: Record<string, any> = {},
  options?: { showErrorsToUser?: boolean }
): Promise<LeadUpsertResult> => {
  // Client-side validation first
  const validationError = validateContactData(contactData);
  if (validationError) {
    const err = new Error(validationError);
    if (options?.showErrorsToUser) {
      err.name = 'ValidationError';
    }
    throw err;
  }

  const normalizedData = normalizeContactData(contactData);
  const payload = {
    funnel_id: funnelId,
    email: normalizedData.email,
    name: normalizedData.name,
    phone: normalizedData.phone,
    quiz_answers: quizAnswers,
    session_id: normalizedData.sessionId,
    source: normalizedData.source,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[leadService] Upserting lead (attempt ${attempt + 1}/${MAX_RETRIES}):`, payload.email);
      
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        lead?: LeadUpsertResult;
        error?: string;
        details?: any;
      }>(LEAD_UPSERT_FUNCTION, {
        body: payload,
      });

      if (error) {
        lastError = new Error(error.message || 'Edge Function invocation failed');
        throw lastError;
      }

      if (!data?.success) {
        lastError = new Error(data?.error || 'Upsert failed');
        // Don't retry on validation errors
        if (data?.error?.includes('Invalid') || data?.error?.includes('required')) {
          throw lastError;
        }
        throw lastError;
      }

      if (!data.lead) {
        throw new Error('No lead returned from upsert');
      }

      console.log(`[leadService] Upsert successful: leadId=${data.lead.id}, isNew=${data.lead.is_new}`);
      return {
        leadId: data.lead.id,
        status: data.lead.status,
        emailVerifiedStatus: data.lead.email_verified_status,
        phoneVerifiedStatus: data.lead.phone_verified_status,
        contactData: {
          name: data.lead.name,
          email: data.lead.email,
          phone: data.lead.phone,
        },
      };

    } catch (err: any) {
      lastError = err;
      console.warn(`[leadService] Upsert attempt ${attempt + 1} failed:`, err.message);
      
      // Don't retry if it's a validation error or 4xx
      if (err.name === 'ValidationError' || (err.status && err.status >= 400 && err.status < 500)) {
        throw err;
      }

      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt)); // Exponential backoff
      }
    }
  }

  // All retries exhausted
  throw lastError || new Error('Failed to upsert lead after retries');
}

/**
 * Update quiz answers for an existing lead
 * 
 * Use this to add/update quiz answers without affecting contact info.
 * This is a partial update that merges with existing quiz_answers.
 * 
 * @param leadId - The lead UUID (must already exist)
 * @param quizAnswers - Key-value pairs to merge
 * @returns true on success
 */
export const updateLeadQuizAnswers = async (
  leadId: string,
  quizAnswers: Record<string, any>
): Promise<boolean> => {
  if (!leadId) {
    throw new Error('leadId is required');
  }

  // We'll use the same upsert endpoint but with just quiz_answers
  // The server will merge them
  try {
    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
    }>('upsert-lead', {
      body: {
        lead_id: leadId,
        quiz_answers: quizAnswers,
      },
    });

    if (error) throw error;
    return data?.success === true;
  } catch (err: any) {
    console.error('[leadService] updateLeadQuizAnswers failed:', err);
    throw err;
  }
};

/**
 * Get lead by ID
 * 
 * Direct database fetch (no Edge Function needed)
 */
export const getLead = async (leadId: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) {
    console.error('[leadService] getLead failed:', error);
    return null;
  }

  return data;
};

/**
 * Update verification status for email or phone
 * 
 * @param leadId - Lead UUID
 * @param type - 'email' or 'phone'
 * @param status - 'verified', 'invalid', 'disposable', 'catch_all'
 */
export const setVerificationStatus = async (
  leadId: string,
  type: 'email' | 'phone',
  status: 'verified' | 'invalid' | 'disposable' | 'catch_all'
): Promise<boolean> => {
  const field = type === 'email' ? 'email_verified_status' : 'phone_verified_status';
  
  const { error } = await supabase
    .from('leads')
    .update({ [field]: status })
    .eq('id', leadId);

  if (error) {
    console.error(`[leadService] setVerificationStatus failed (${type}):`, error);
    return false;
  }

  console.log(`[leadService] Verification status updated: leadId=${leadId}, ${field}=${status}`);
  return true;
};

/**
 * Bulk update quiz answers (useful for multi-page forms)
 */
export const batchUpdateQuizAnswers = async (
  leadId: string,
  answersBatch: Record<string, any>
): Promise<boolean> => {
  return updateLeadQuizAnswers(leadId, answersBatch);
};
