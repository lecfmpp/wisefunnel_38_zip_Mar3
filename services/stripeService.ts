import { supabase } from './supabaseClient';

export interface CheckoutSessionParams {
    priceId: string;
    workspaceId: string;
    successUrl: string;
    cancelUrl: string;
    applyDiscount?: boolean;
    // Fix: Added missing 'user_id' property to satisfy CheckoutSessionParams type requirements
    user_id?: string;
    loadingMessage?: string; 
}

/**
 * Standardized Stripe Price IDs for the Wisefunnel plans.
 * These match the user-provided IDs from the Stripe Dashboard.
 */
export const STRIPE_PRICES = {
    growth: {
        monthly: 'price_1StefYCIULCRuGLOHujmXU6t',
        yearly: 'price_1StefYCIULCRuGLO2ydWcpbK'
    },
    scale: {
        monthly: 'price_1SteixCIULCRuGLOUfZOYl00',
        yearly: 'price_1SteixCIULCRuGLO91NSWCcX'
    }
};

/**
 * Maps a Price ID back to a standardized plan name for UI consistency.
 */
export const getPlanFromPriceId = (priceId: string): 'Growth' | 'Scale' | 'Free' => {
    if (priceId === STRIPE_PRICES.scale.monthly || priceId === STRIPE_PRICES.scale.yearly) return 'Scale';
    if (priceId === STRIPE_PRICES.growth.monthly || priceId === STRIPE_PRICES.growth.yearly) return 'Growth';
    return 'Free';
};

export const getPriceId = (plan: string, cycle: string): string => {
    const p = plan.toLowerCase().includes('scale') ? 'scale' : 'growth';
    const c = cycle.toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
    return STRIPE_PRICES[p][c];
};

export const createCheckoutSession = async (params: CheckoutSessionParams) => {
    try {
        console.log(`[Stripe] Initiating session for Price ID: ${params.priceId} (Discount: ${params.applyDiscount})`);
        
        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
            body: {
                price_id: params.priceId,
                workspace_id: params.workspaceId,
                success_url: params.successUrl,
                cancel_url: params.cancelUrl,
                apply_discount: params.applyDiscount,
                // Fix: Added 'user_id' to the Edge Function payload
                user_id: params.user_id
            },
        });

        if (error) {
            let errorMessage = error.message;
            try {
                const errData = await error.context.json();
                if (errData?.error) errorMessage = errData.error;
            } catch (e) {}
            
            console.error("[Stripe] Invocation Error:", errorMessage);
            throw new Error(errorMessage);
        }
        
        if (data?.error) {
            console.error("[Stripe] Edge Function Logic Error:", data.error);
            throw new Error(data.error);
        }

        if (data?.url) {
            window.location.href = data.url;
        } else {
            throw new Error("Stripe did not return a valid checkout URL.");
        }
    } catch (err: any) {
        console.error("[Stripe] Critical Failure:", err.message);
        throw err;
    }
};

export const verifyAndSyncSession = async (sessionId: string, workspaceId: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('stripe-verify', {
            body: {
                session_id: sessionId,
                workspace_id: workspaceId
            },
        });

        if (error) throw error;
        return data; 
    } catch (err: any) {
        console.error("[Stripe] Verification Error:", err.message);
        throw err;
    }
};

export const openCustomerPortal = async (workspaceId: string, returnUrl: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('stripe-portal', {
            body: {
                workspace_id: workspaceId,
                return_url: returnUrl,
            },
        });

        if (error) throw error;
        
        if (data?.url) {
            window.location.href = data.url;
        }
    } catch (err: any) {
        console.error("[Stripe] Portal Error:", err.message);
        throw err;
    }
};

export const fetchInvoices = async (workspaceId: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('stripe-invoices', {
            body: { workspace_id: workspaceId },
        });

        if (error) throw error;
        return data.invoices || [];
    } catch (err: any) {
        console.error("[Stripe] Invoices Fetch Error:", err.message);
        throw err;
    }
};
