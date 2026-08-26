import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const beaconApi =
  Deno.env.get("BEACON_API_BASE") ??
  "https://beacon.enteracloud.mx/api/v1/tools";
const beaconToken = Deno.env.get("BEACON_TOKEN") ?? "";
const defaultSlug = Deno.env.get("BEACON_SLUG") ?? "hablemos-tech";

function asString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function isDuplicateLead(detail: string): boolean {
  return /already exists|duplicate|unique/i.test(detail);
}

async function createBeaconLead(payload: Record<string, string>) {
  if (!beaconToken) {
    throw new Error("BEACON_TOKEN not configured");
  }

  const response = await fetch(`${beaconApi.replace(/\/$/, "")}/lead_create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${beaconToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  const detail = String(data.error || "");

  if (isDuplicateLead(detail)) {
    return { duplicate: true, detail };
  }

  if (!response.ok || data.error) {
    throw new Error(`Beacon lead_create failed: ${detail || JSON.stringify(data)}`);
  }

  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const email = asString(body.email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = asString(body.name, email.split("@")[0] || "Suscriptor");
    const company = asString(body.company, "Hablemos Tech");
    const puesto = asString(body.puesto || body.role_area, "Sitio web");
    const phone = asString(body.phone, "0000000000");
    const note = asString(body.note || body.message);
    const kind = asString(body.kind);
    const message = [kind, note].filter(Boolean).join(" · ");

    const beaconResult = await createBeaconLead({
      landing_slug: defaultSlug,
      name,
      email,
      company,
      phone,
      message: [puesto, message].filter(Boolean).join(" · "),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        duplicate: Boolean(beaconResult.duplicate),
        beacon: beaconResult.result ?? beaconResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
