import { createClient } from "npm:@insforge/sdk";

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Initialize client with Deno-injected environment variables
  const client = createClient({
    baseUrl: Deno.env.get("INSFORGE_BASE_URL") ?? "",
    anonKey: Deno.env.get("ANON_KEY") ?? "",
  });

  // Query database to keep database connections active/warm
  const { data, error } = await client.database
    .from("projects")
    .select("id")
    .limit(1);

  if (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: "pong",
      database: "connected",
      recordsCount: data?.length ?? 0,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}

