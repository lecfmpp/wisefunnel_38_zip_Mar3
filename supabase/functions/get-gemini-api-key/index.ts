// get-gemini-api-key - production proxy for Gemini API
// Restricts origins to allowed list. Do NOT return the GEMINI_API_KEY to clients.

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://wisefunnel.io",
  "https://www.wisefunnel.io",
  "https://wisefunnel-service-158243979884.us-central1.run.app",
  "https://wisefunnel-service-158243979884.us-east1.run.app"
];

function corsHeaders(origin: string | null) {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, x-goog-api-key",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Vary"] = "Origin";
  } else {
    h["Access-Control-Allow-Origin"] = "null";
  }
  return h;
}

console.info("get-gemini-api-key starting");

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const url = new URL(req.url);

  // Health / ping
  if (req.method === "GET" && url.pathname.endsWith("/ping")) {
    const hasKey = !!Deno.env.get("GEMINI_API_KEY");
    const headers = corsHeaders(origin);
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify({ ok: true, gemini_api_key_present: hasKey }), {
      status: 200,
      headers,
    });
  }

  // Enforce allowlist for POST
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    const headers = corsHeaders(origin);
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers,
    });
  }

  // Only POST accepted for proxy
  if (req.method !== "POST") {
    const headers = corsHeaders(origin);
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify({ error: "Only POST allowed for this endpoint" }), {
      status: 405,
      headers,
    });
  }

  // Ensure key configured
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    const headers = corsHeaders(origin);
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
      status: 500,
      headers,
    });
  }

  // Parse and validate JSON
  let clientBody: unknown;
  try {
    clientBody = await req.json();
  } catch (err) {
    const headers = corsHeaders(origin);
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers,
    });
  }

  if (!clientBody || typeof clientBody !== "object" || Array.isArray(clientBody)) {
    const headers = corsHeaders(origin);
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify({ error: "Request body must be a JSON object" }), {
      status: 400,
      headers,
    });
  }

  const bodyObj = clientBody as Record<string, unknown>;

  // Require model string at top-level and forward remaining fields as gemini payload
  const model = bodyObj["model"];
  if (!model || typeof model !== "string") {
    const headers = corsHeaders(origin);
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify({ error: "Request body must include a 'model' string property." }), {
      status: 400,
      headers,
    });
  }

  // Build payload to forward: copy all fields except model
  const geminiPayload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(bodyObj)) {
    if (k === "model") continue;
    geminiPayload[k] = v;
  }

  // Minimal sanity check: ensure payload has at least one of expected fields (added 'contents')
  const hasExpected =
    "contents" in geminiPayload ||
    "input" in geminiPayload ||
    "instances" in geminiPayload ||
    "messages" in geminiPayload ||
    "prompt" in geminiPayload;
  if (!hasExpected) {
    const headers = corsHeaders(origin);
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify({
      error: "Payload missing expected Gemini fields. Include one of: contents, input, instances, messages, or prompt."
    }), {
      status: 400,
      headers,
    });
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(geminiPayload),
    });

    const respText = await geminiResp.text();
    const contentType = geminiResp.headers.get("content-type") ?? "application/json";

    if (geminiResp.status >= 400) {
      // Helpful for debugging — remove or redact later if it contains sensitive data
      try {
        console.error("gemini upstream error body:", respText);
      } catch (e) {
        console.error("Failed to log gemini error body:", e);
      }
    } else {
      console.info("gemini upstream status:", geminiResp.status);
    }

    const headers = corsHeaders(origin);
    headers["Content-Type"] = contentType;

    return new Response(respText, {
      status: geminiResp.status,
      headers,
    });
  } catch (err) {
    console.error("get-gemini-api-key function error:", err);
    const headers = corsHeaders(origin);
    headers["Content-Type"] = "application/json";
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
});