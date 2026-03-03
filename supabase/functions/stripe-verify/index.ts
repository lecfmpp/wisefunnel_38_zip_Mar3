import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICE_MAP: Record<string, string> = {
  'price_1StefYCIULCRuGLOHujmXU6t': 'Growth',
  'price_1StefYCIULCRuGLO2ydWcpbK': 'Growth',
  'price_1SteixCIULCRuGLOUfZOYl00': 'Scale',
  'price_1SteixCIULCRuGLO91NSWCcX': 'Scale'
};

// @ts-ignore
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id, workspace_id } = await req.json();
    
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

    const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription']
    });

    const subscription = session.subscription as any;
    const priceId = subscription?.plan?.id;
    const planName = PRICE_MAP[priceId] || 'Growth';
    const userId = session.metadata?.user_id;

    if (!userId) throw new Error("User ID missing from session metadata.");

    // Sync with Profiles table (User level)
    const profileUpdateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          plan_type: planName,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
    });

    if (!profileUpdateRes.ok) throw new Error("Failed to update user profile record.");

    // Also sync the specific workspace that initiated the checkout for immediate feedback
    await fetch(`${supabaseUrl}/rest/v1/workspaces?id=eq.${workspace_id}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
          plan_type: planName,
          subscription_status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
    });

    return new Response(JSON.stringify({ success: true, plan: planName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})