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

// POST used instead of GET because we send fingerprint in body
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { promptId, fingerprint } = body;

    if (!promptId || typeof promptId !== "string" || promptId.length > 200) {
      return NextResponse.json({ error: "Invalid promptId" }, { status: 400 });
    }
    if (!fingerprint || typeof fingerprint !== "string" || fingerprint.length > 100) {
      return NextResponse.json({ error: "Invalid fingerprint" }, { status: 400 });
    }

    const ip = getIP(req);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const [{ data: liked }, { count }] = await Promise.all([
      supabase.rpc("has_liked", {
        p_prompt_id: promptId,
        p_fingerprint: fingerprint,
        p_ip: ip,
      }),
      supabase
        .from("prompt_likes")
        .select("*", { count: "exact", head: true })
        .eq("prompt_id", promptId),
    ]);

    return NextResponse.json({ liked: !!liked, count: count || 0 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
