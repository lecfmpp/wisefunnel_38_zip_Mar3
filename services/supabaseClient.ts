
import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const SUPABASE_URL = 'https://iwvlmpgeodctctmaacja.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dmxtcGdlb2RjdGN0bWFhY2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzY3MTUsImV4cCI6MjA4MTYxMjcxNX0.hMs9OGPTdhPAs0lSKzDWE1Cc-K27NoW11--niolkoWY';

// Standard initialization with real production keys
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Flag is always true now as we have hardcoded valid production keys
export const isSupabaseConfigured = true;

/**
 * Utility to get current session with robust error handling
 */
export const getSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (e) {
        console.error("Auth session error:", e);
        return null;
    }
};
