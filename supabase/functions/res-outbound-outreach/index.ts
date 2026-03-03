
/* Fix: Removed redundant Deno declaration and scoped variables to module to fix redeclaration errors */
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
    const { workspace_id, sender_name, sender_email, to, subject, html } = await req.json();

    // @ts-ignore
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    // 1. Verify workspace domain status in DB
    const res = await fetch(`${SUPABASE_URL}/rest/v1/workspaces?id=eq.${workspace_id}&select=metadata`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    const workspace = (await res.json())[0];
    const isVerified = workspace?.metadata?.domain_verified === true;
    
    // 2. Resolve 'From' address
    // If verified, use the user's specific email. 
    // If not, fallback to our default test domain to prevent DMARC rejection.
    // Fix: Corrected typo in fallback fromAddress (removed extra @ and dot)
    let fromAddress = `Wisefunnel <notifications@leads.wisefunnel.io>`;
    let replyTo = sender_email;

    if (isVerified && sender_email.includes(workspace.metadata.custom_sending_domain)) {
        fromAddress = `${sender_name} <${sender_email}>`;
    }

    console.log(`Dispatching outbound from: ${fromAddress} for workspace: ${workspace_id}`);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: html,
        reply_to: replyTo
      })
    });

    const data = await resendResponse.json();

    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
