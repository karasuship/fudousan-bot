import { diagnoseV2 } from "@/lib/diagnose_v2";
import type { DiagnosisInput2 } from "@/lib/types_v2";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const input: DiagnosisInput2 = await req.json();
    const result = diagnoseV2(input);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "診断に失敗しました" }, { status: 500 });
  }
}
