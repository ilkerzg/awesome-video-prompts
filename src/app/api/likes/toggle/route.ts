import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function getIP(req: NextRequest): string {
  // Trust only specific headers (Vercel/Cloudflare set these)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 45);
  const real = req.headers.get("x-real-ip");
  if (real) return real.slice(0, 45);
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { promptId, fingerprint } = body;

    // Validation
    if (!promptId || typeof promptId !== "string" || promptId.length > 200) {
      return NextResponse.json({ error: "Invalid promptId" }, { status: 400 });
    }
    if (!fingerprint || typeof fingerprint !== "string" || fingerprint.length > 100) {
      return NextResponse.json({ error: "Invalid fingerprint" }, { status: 400 });
    }

    const ip = getIP(req);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.rpc("toggle_like", {
      p_prompt_id: promptId,
      p_fingerprint: fingerprint,
      p_ip: ip,
    });

    if (error) {
      if (error.message?.includes("Rate limit")) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
