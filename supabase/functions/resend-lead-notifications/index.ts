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
    const body = await req.json();
    console.log('Received notification request for funnel:', body.funnel_name);

    const { funnel_id, funnel_name, lead, settings, field_labels } = body;
    const quiz_answers = body.quiz_answers || lead?.quiz_answers || {};

    if (!lead || !lead.email) {
      return new Response(JSON.stringify({ error: 'Missing lead data or email' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // @ts-ignore
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured in Supabase Secrets');
      return new Response(JSON.stringify({ error: 'Mail server configuration missing' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const recipients = settings?.recipients || [];
    if (!recipients || recipients.length === 0) {
       console.warn('Dispatch aborted: No recipients configured for funnel', funnel_id);
       return new Response(JSON.stringify({ error: 'No recipients configured in Funnel Settings > Email' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const primaryColor = settings?.primaryColor || '#f97316';

    /**
     * Enhanced Variable Replacement Engine
     * Handles both lead identity and custom quiz logic fields
     */
    const replaceVars = (str: string) => {
        if (!str) return str;
        let res = str;
        
        // 1. Map identity and environment variables
        const baseVars: Record<string, any> = {
            name: lead.name || 'Subscriber',
            email: lead.email || '',
            phone: lead.phone || '',
            funnel_name: funnel_name || 'Campaign',
            email_verified_status: lead.email_verified_status || 'pending',
            phone_verified_status: lead.phone_verified_status || 'pending'
        };

        // 2. Combine with all quiz answers
        const allVars = { ...quiz_answers, ...baseVars };

        // 3. Perform global replacement
        Object.entries(allVars).forEach(([key, val]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            const displayVal = Array.isArray(val) ? val.join(', ') : String(val ?? '');
            res = res.replace(regex, displayVal);
        });

        return res;
    };

    // User requested to remove verification badges for now
    const headline = replaceVars(settings?.headline || 'Nice work! A new lead arrived from your funnel.');
    const emailSubject = replaceVars(settings?.subject || `Action Required: New Lead from ${funnel_name}`);

    // Generate Quiz Rows
    const quizRows = Object.entries(quiz_answers)
      .filter(([key, value]) => {
        return value !== null && value !== undefined && value !== '' && !['name', 'email', 'phone', 'contactInfo', 'email_verified_status', 'phone_verified_status'].includes(key);
      })
      .map(([key, value]) => {
        const label = field_labels?.[key] || key
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
          
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        return `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7; width: 40%; vertical-align: top;">
              <div style="font-family: sans-serif; font-size: 11px; font-weight: 700; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">
                ${label}
              </div>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7; text-align: right; vertical-align: top;">
              <div style="font-family: sans-serif; font-size: 14px; font-weight: 600; color: #1a202c;">
                ${displayValue || '--'}
              </div>
            </td>
          </tr>
        `;
      }).join('');

    const buttons = [];
    if (settings.callLeadEnabled !== false && lead.phone) {
        const ctaColor = settings.callLeadColor || '#10b981';
        buttons.push(`
            <a href="tel:${lead.phone}" style="display: block; padding: 16px; background-color: ${ctaColor}; color: #ffffff; border-radius: 12px; font-weight: 800; font-size: 14px; text-decoration: none; margin-bottom: 12px; text-align: center;">
                ${settings.callLeadText || 'Call Lead Directly'}: ${lead.phone}
            </a>
        `);
    }

    if (settings.viewLeadEnabled !== false) {
        let viewLeadUrl = `https://wisefunnel.io/#/leads/public/${lead.id || 'current'}/${funnel_id}`;
        
        try {
            // Attempt to identify a buyer ID for the Live Report link
            const firstRecipientEmail = recipients[0]?.toLowerCase();
            if (firstRecipientEmail && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
                const buyerRes = await fetch(`${SUPABASE_URL}/rest/v1/lead_buyers?email=eq.${firstRecipientEmail}&select=id,name`, {
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    }
                });
                const buyers = await buyerRes.json();
                const buyer = buyers?.[0];

                if (buyer) {
                    const buyerSlug = buyer.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                    viewLeadUrl = `https://wisefunnel.io/#/reports/live/${buyer.id}/${buyerSlug}`;
                } else {
                    // If recipient not found as a buyer, check if there's any buyer linked to this funnel
                    const linkedBuyerRes = await fetch(`${SUPABASE_URL}/rest/v1/lead_buyer_funnels?funnel_id=eq.${funnel_id}&select=lead_buyers(id,name)`, {
                        headers: {
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                        }
                    });
                    const linkedBuyers = await linkedBuyerRes.json();
                    const linkedBuyer = linkedBuyers?.[0]?.lead_buyers;
                    
                    if (linkedBuyer) {
                        const buyerSlug = linkedBuyer.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                        viewLeadUrl = `https://wisefunnel.io/#/reports/live/${linkedBuyer.id}/${buyerSlug}`;
                    }
                }
            }
        } catch (linkError) {
            console.warn('Live Report link generation failed, falling back to public lead report:', linkError.message);
        }

        buttons.push(`
            <a href="${viewLeadUrl}" style="display: block; padding: 16px; background-color: ${settings.viewLeadColor || '#2563eb'}; color: #ffffff; border-radius: 12px; font-weight: 800; font-size: 14px; text-decoration: none; margin-bottom: 12px; text-align: center;">
                ${settings.viewLeadText || 'View Intelligence Report'}
            </a>
        `);
    }

    const logoHtml = settings?.logoUrl ? `
      <div style="margin-bottom: 24px; text-align: center;">
        <img src="${settings.logoUrl}" alt="Logo" height="48" style="height: 48px; max-width: 200px; display: inline-block; object-fit: contain;" />
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <!-- Header Section -->
            <div style="padding: 48px 40px; text-align: center; background-color: ${primaryColor}08; border-bottom: 1px solid #edf2f7;">
              ${logoHtml}
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #1a202c; line-height: 1.2;">
                Nice work! A new lead arrived from your funnel.
              </h1>
              <p style="margin: 16px 0 0; font-size: 16px; font-weight: 600; color: #4a5568;">
                Check the info below and reach out as soon as possible.
              </p>
            </div>

            <!-- Context / Body Section -->
            <div style="padding: 32px 40px 0;">
              <p style="margin: 0; font-size: 15px; color: #4a5568; line-height: 1.6; text-align: center; font-weight: 500;">
                The faster you call or email them, the more likely you are to close this deal and add cash to your business. 🚀
              </p>
            </div>

            <!-- Content Section -->
            <div style="padding: 32px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 12px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.05em;">Prospect Identity</h2>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
                <p style="margin: 0 0 12px; font-size: 15px; color: #1a202c;"><strong>Name:</strong> ${lead.name}</p>
                <p style="margin: 0 0 12px; font-size: 15px; color: #1a202c;"><strong>Email:</strong> ${lead.email}</p>
                <p style="margin: 0; font-size: 15px; color: #1a202c;"><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
              </div>

              <h2 style="margin: 32px 0 16px; font-size: 12px; font-weight: 800; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">Qualification Data</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>${quizRows}</tbody>
              </table>
            </div>

            <!-- Footer / Action Section -->
            <div style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #edf2f7;">
              ${buttons.join('')}
              <p style="margin: 24px 0 0; font-size: 10px; color: #a0aec0; text-align: center; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700;">
                Campaign: ${funnel_name} <br/>
                Generated by Wisefunnel Delivery Infrastructure
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
        from: 'Wisefunnel Notifications <notifications@leads.wisefunnel.io>',
        to: recipients,
        subject: emailSubject,
        html,
        reply_to: lead.email
      })
    });

    const resData = await res.json();
    
    if (!res.ok) {
      console.error('Resend API Error:', resData);
      return new Response(JSON.stringify({ error: resData.message || 'Mail server error' }), { 
        status: res.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify(resData), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error('Critical function error:', err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});