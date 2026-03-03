
export {};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    let { action, phone, code, workspace_id, funnel_id } = requestData;

    if (!phone) {
      phone = requestData.quiz_answers?.phone || 
              requestData.lead?.phone || 
              requestData.contactInfo?.phone || 
              requestData.contact_form?.phone;
    }

    if (!phone) throw new Error("Missing Phone Number");
    const sanitizedPhone = String(phone).trim().startsWith('+') ? String(phone).trim() : '+' + String(phone).trim().replace(/[^\d]/g, '');

    // @ts-ignore
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    let wsMetadata: any = {};
    if (workspace_id) {
      try {
        const wsRes = await fetch(`${SUPABASE_URL}/rest/v1/workspaces?id=eq.${workspace_id}&select=metadata`, {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        });
        const workspaces = await wsRes.json();
        wsMetadata = workspaces?.[0]?.metadata?.verification || {};
      } catch (e) {}
    }

    // Fix: Added @ts-ignore to resolve Deno namespace error in non-Deno environment
    // @ts-ignore
    const getValidCred = (wsValue: any, envKey: string) => (typeof wsValue === 'string' && wsValue.trim().length > 0) ? wsValue.trim() : (Deno.env.get(envKey) || '');

    const TWILIO_SID = getValidCred(wsMetadata.twilioSid, 'TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = getValidCred(wsMetadata.twilioToken, 'TWILIO_AUTH_TOKEN');
    const TWILIO_VERIFY_SID = getValidCred(wsMetadata.twilioServiceSid, 'TWILIO_VERIFY_SERVICE_SID');

    const authHeader = `Basic ${btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`)}`;
    const baseUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}`;
    
    let endpoint = '';
    const params = new URLSearchParams();
    params.append('To', sanitizedPhone);

    if (action === 'send') {
      endpoint = `${baseUrl}/Verifications`;
      params.append('Channel', 'sms');
    } else if (action === 'verify') {
      endpoint = `${baseUrl}/VerificationCheck`;
      params.append('Code', String(code).trim());
    } else {
      throw new Error(`Invalid OTP action: ${action}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      },
      body: params.toString()
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: result.message || 'Twilio failed' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Log Usage for Successful SMS Sent
    if (action === 'send' && result.status === 'pending' && workspace_id && funnel_id) {
        await fetch(`${SUPABASE_URL}/rest/v1/usage_logs`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                workspace_id,
                funnel_id,
                type: 'sms',
                status: 'sent'
            })
        });
    }

    return new Response(JSON.stringify(result), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
