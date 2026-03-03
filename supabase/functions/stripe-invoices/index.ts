import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { workspace_id } = await req.json();
    
    // @ts-ignore
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-ignore
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 1. Get Customer ID from Supabase
    const res = await fetch(`${supabaseUrl}/rest/v1/workspaces?id=eq.${workspace_id}&select=stripe_customer_id`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    const workspace = (await res.json())[0];
    
    if (!workspace?.stripe_customer_id) {
        return new Response(JSON.stringify({ invoices: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // 2. Fetch Invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: workspace.stripe_customer_id,
      limit: 12,
    });

    return new Response(JSON.stringify({ 
        invoices: invoices.data.map(inv => ({
            id: inv.id,
            created: inv.created,
            amount_paid: inv.amount_paid,
            status: inv.status,
            invoice_pdf: inv.invoice_pdf
        }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})