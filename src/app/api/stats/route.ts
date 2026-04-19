import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { promptId } = await req.json();
    if (!promptId || typeof promptId !== "string" || promptId.length > 200) {
      return NextResponse.json({ error: "Invalid promptId" }, { status: 400 });
    }

    const supabase = createClient(await cookies());
    const { data } = await supabase.rpc("get_prompt_stats", { p_prompt_id: promptId });

    return NextResponse.json(data || { likes: 0, views: 0, copies: 0 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
