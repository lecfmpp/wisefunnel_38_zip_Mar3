// Treat as a module
export {};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { email, workspace_id, funnel_id } = await req.json()
    // @ts-ignore
    const apiKey = Deno.env.get('FINDYMAIL_API_KEY')
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    // @ts-ignore
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!apiKey) {
      console.error('[WiseVerify] Configuration Missing: FINDYMAIL_API_KEY not found')
      return new Response(
        JSON.stringify({ status: 'api_error', message: 'Verification engine configuration missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!email) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`[WiseVerify] Handshake started for: ${email}`)

    const response = await fetch('https://app.findymail.com/api/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email })
    })

    const data = await response.json()
    const verificationResult = data.result || 'unknown';
    const finalStatus = verificationResult === 'ok' ? 'valid' : verificationResult;

    // Persist Usage Log
    if (workspace_id && funnel_id) {
        await fetch(`${supabaseUrl}/rest/v1/usage_logs`, {
            method: 'POST',
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                workspace_id,
                funnel_id,
                type: 'email',
                status: finalStatus
            })
        });
    }

    return new Response(
      JSON.stringify({ 
        status: finalStatus,
        details: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('[WiseVerify] Execution Error:', error.message)
    return new Response(
      JSON.stringify({ status: 'api_error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})