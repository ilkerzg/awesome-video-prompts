import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function getIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 45);
  const real = req.headers.get("x-real-ip");
  if (real) return real.slice(0, 45);
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const { promptId, fingerprint } = await req.json();
    if (!promptId || typeof promptId !== "string" || promptId.length > 200) {
      return NextResponse.json({ error: "Invalid promptId" }, { status: 400 });
    }
    if (!fingerprint || typeof fingerprint !== "string" || fingerprint.length > 100) {
      return NextResponse.json({ error: "Invalid fingerprint" }, { status: 400 });
    }

    const ip = getIP(req);
    const supabase = createClient(await cookies());

    const { error } = await supabase.rpc("track_view", {
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

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
