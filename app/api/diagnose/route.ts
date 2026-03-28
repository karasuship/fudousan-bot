import { diagnosisInputSchema, contractReviewSchema, maintenanceSchema, moveOutSchema, depositRefundSchema } from "@/lib/schema";
import { diagnose } from "@/lib/diagnose";
import { diagnoseContractReview, diagnoseMaintenance, diagnoseMoveOut, diagnoseDepositRefund } from "@/lib/diagnoseModes";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const mode = (body as { mode?: string }).mode;

  // モード別ディスパッチ
  switch (mode) {
    case "contract_review": {
      const parsed = contractReviewSchema.safeParse(body);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((i) => i.message).join(", ");
        return Response.json({ error: messages }, { status: 422 });
      }
      return Response.json(diagnoseContractReview(parsed.data));
    }

    case "maintenance": {
      const parsed = maintenanceSchema.safeParse(body);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((i) => i.message).join(", ");
        return Response.json({ error: messages }, { status: 422 });
      }
      return Response.json(diagnoseMaintenance(parsed.data));
    }

    case "move_out": {
      const parsed = moveOutSchema.safeParse(body);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((i) => i.message).join(", ");
        return Response.json({ error: messages }, { status: 422 });
      }
      return Response.json(diagnoseMoveOut(parsed.data));
    }

    case "deposit_refund": {
      const parsed = depositRefundSchema.safeParse(body);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((i) => i.message).join(", ");
        return Response.json({ error: messages }, { status: 422 });
      }
      return Response.json(diagnoseDepositRefund(parsed.data));
    }

    // initial_fees / renewal / 未指定 → 既存ロジック
    default: {
      const parsed = diagnosisInputSchema.safeParse(body);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((i) => i.message).join(", ");
        return Response.json({ error: messages }, { status: 422 });
      }
      const result = diagnose(parsed.data);
      return Response.json({ ...result, mode: mode ?? "initial_fees" });
    }
  }
}
