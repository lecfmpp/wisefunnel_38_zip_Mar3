import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { funnel_id, email, name, phone, quiz_answers, lead_id, session_id, source } = await req.json();

    // Validation
    if (!funnel_id || !email || !name) {
      return newResponse(
        { success: false, error: "Missing required fields: funnel_id, email, name" },
        400
      );
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return newResponse(
        { success: false, error: "Invalid email format" },
        400
      );
    }

    // Normalize data
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;

    // Initialize Supabase client (using service role key for admin privileges)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return newResponse(
        { success: false, error: "Server configuration error" },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify funnel exists and is live
    const { data: funnel, error: funnelError } = await supabase
      .from("funnels")
      .select("id, status, workspace_id, name")
      .eq("id", funnel_id)
      .single();

    if (funnelError || !funnel) {
      console.error("Funnel not found:", funnel_id, funnelError);
      return newResponse(
        { success: false, error: "Funnel not found or inaccessible" },
        404
      );
    }

    if (funnel.status !== 'live') {
      return newResponse(
        { success: false, error: "Funnel is not active" },
        403
      );
    }

    // Build the upsert payload
    const leadRecord: any = {
      funnel_id: funnel_id,
      workspace_id: funnel.workspace_id,
      email: normalizedEmail,
      name: normalizedName,
      phone: normalizedPhone,
      quiz_answers: quiz_answers || {},
      email_verified_status: 'pending',
      phone_verified_status: 'pending',
      source: source || 'public_form',
      source_funnel_name: funnel.name,
    };

    // If domain is present in request (for tracking), add it
    // (We could extract from headers or request body if needed)

    // Perform upsert with conflict on (funnel_id, email)
    const { data: lead, error: upsertError } = await supabase
      .from("leads")
      .upsert(
        {
          ...leadRecord,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "funnel_id,email",
          // Note: We don't update name/phone on conflict to preserve original? Actually we do want to update phone if provided
          // But we should not overwrite email. We'll let phone update if new one provided.
        }
      )
      .select("id, created_at, status, email_verified_status, phone_verified_status, name, email, phone, quiz_answers")
      .single();

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      // Check for unique violation (shouldn't happen due to upsert, but just in case)
      if (upsertError.code === '23505') {
        return newResponse(
          { success: false, error: "Duplicate lead detected" },
          409
        );
      }
      return newResponse(
        { success: false, error: "Database error", details: upsertError.message },
        500
      );
    }

    // Determine if this was a new insert or an update
    // We can check if created_at is very recent (within last few seconds) or compare with updated_at
    const isNew = lead.created_at && new Date(lead.created_at).getTime() > Date.now() - 10000;

    return newResponse(
      {
        success: true,
        lead: {
          id: lead.id,
          is_new: isNew,
          status: lead.status,
          email_verified_status: lead.email_verified_status,
          phone_verified_status: lead.phone_verified_status,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          quiz_answers: lead.quiz_answers || {},
        },
      },
      200
    );

  } catch (err) {
    console.error("Edge Function error:", err);
    return newResponse(
      { success: false, error: "Internal server error", details: String(err) },
      500
    );
  }
});

/**
 * Helper to create JSON response with CORS headers
 */
function newResponse(body: any, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
