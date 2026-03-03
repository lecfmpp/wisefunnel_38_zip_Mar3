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
    const body = await req.json();
    const { price_id, workspace_id, success_url, cancel_url, apply_discount, user_id } = body;
    
    if (!price_id) throw new Error("Missing Price ID for the session.");
    
    // @ts-ignore
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
        throw new Error("Stripe Secret Key is not configured in environment.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const sessionOptions: any = {
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: 'subscription',
      success_url,
      cancel_url,
      metadata: { 
        workspace_id,
        user_id // Subscription is now tied to the user profile
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: { 
            workspace_id,
            user_id 
        }
      }
    };

    if (apply_discount === true) {
        const couponId = 'TRIAL25';
        try {
            await stripe.coupons.retrieve(couponId);
        } catch (e: any) {
            if (e.raw?.type === 'invalid_request_error') {
                await stripe.coupons.create({
                    id: couponId,
                    percent_off: 25,
                    duration: 'once',
                    name: 'Early Bird 25% Discount',
                });
            } else {
                throw e;
            }
        }
        sessionOptions.discounts = [{ coupon: couponId }];
    } else {
        sessionOptions.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})