import { supabase } from './supabaseClient';

export const sendOtp = async (phone: string, workspaceId: string, funnelId: string) => {
    const { data, error } = await supabase.functions.invoke('twilio-otp', {
        body: { action: 'send', phone, workspace_id: workspaceId, funnel_id: funnelId }
    });
    if (error) throw error;
    return data;
};

export const verifyOtp = async (phone: string, code: string, workspaceId: string) => {
    const { data, error } = await supabase.functions.invoke('twilio-otp', {
        body: { action: 'verify', phone, code, workspace_id: workspaceId }
    });
    if (error) throw error;
    if (data.status !== 'approved') {
        throw new Error('Invalid verification code.');
    }
    return data;
};