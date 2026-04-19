import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { promptIds } = body;

    if (!Array.isArray(promptIds) || promptIds.length === 0 || promptIds.length > 200) {
      return NextResponse.json({ error: "Invalid promptIds" }, { status: 400 });
    }
    // Validate every id
    const safeIds = promptIds.filter(
      (id) => typeof id === "string" && id.length > 0 && id.length < 200,
    );

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data } = await supabase.rpc("get_like_counts", { p_prompt_ids: safeIds });

    const counts: Record<string, number> = {};
    (data as { prompt_id: string; like_count: number }[] | null)?.forEach((row) => {
      counts[row.prompt_id] = Number(row.like_count);
    });

    return NextResponse.json({ counts });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
