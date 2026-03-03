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
    const { email, workspace_id, workspace_name, inviter_name, role } = await req.json();

    // @ts-ignore
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const signupUrl = `https://wisefunnel.io/#/signup?email=${encodeURIComponent(email)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="padding: 48px 40px; text-align: center; background-color: #f9731608; border-bottom: 1px solid #edf2f7;">
              <div style="margin-bottom: 24px;">
                <img src="https://iwvlmpgeodctctmaacja.supabase.co/storage/v1/object/sign/Logos/logo_wisefunnel_shape.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81YWQxY2Y0Zi0wZTkzLTRhMWUtOTM0NC1hYWJlZjM2ZjEzMWYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMb2dvcy9sb2dvX3dpc2VmdW5uZWxfc2hhcGUucG5nIiwiaWF0IjoxNzY5MTc5MjcxLCJleHAiOjE5MjY4NTkyNzF9.TpVVTbV6gQbWPG0NfUajQOj6YX8UM0rCoh9t3BRXZxA" alt="Wisefunnel" height="40" style="height: 40px; display: inline-block;" />
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #1a202c; line-height: 1.2;">
                You've been invited to join ${workspace_name}
              </h1>
              <p style="margin: 16px 0 0; font-size: 16px; font-weight: 500; color: #4a5568;">
                ${inviter_name} added you to their agency workspace as a ${role}.
              </p>
            </div>

            <div style="padding: 40px; text-align: center;">
              <p style="margin: 0 0 32px; font-size: 15px; color: #4a5568; line-height: 1.6;">
                Ready to start building high-converting funnels? Create your account now to access the ${workspace_name} command center.
              </p>
              
              <a href="${signupUrl}" style="display: inline-block; padding: 18px 40px; background-color: #f97316; color: #ffffff; border-radius: 16px; font-weight: 800; font-size: 16px; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);">
                Accept Invitation & Sign Up
              </a>
            </div>

            <div style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #edf2f7; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700;">
                Wisefunnel Technologies Inc. <br/> 
                Secure Agency Infrastructure
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Wisefunnel Team <invites@leads.wisefunnel.io>',
        to: [email],
        subject: `[Invite] Join ${workspace_name} on Wisefunnel`,
        html: html
      })
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
