import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { FeeEntry, FeeId2 } from "@/lib/types_v2";
import { createDefaultFeeEntry } from "@/components/diagnosis/defaults";

const client = new Anthropic();

const VALID_FEE_IDS: FeeId2[] = [
  "agency_fee", "key_exchange", "cleaning", "disinfection",
  "support_24h", "admin_fee", "guarantor", "fire_insurance",
  "key_money", "unknown_label",
];

const SYSTEM_PROMPT = `あなたは日本の賃貸契約の見積書・請求書を読み取るアシスタントです。
画像またはPDFから費目名と金額を抽出し、以下のJSONフォーマットのみを返してください。

費目IDは以下のみ使用してください：
- agency_fee: 仲介手数料
- key_exchange: 鍵交換代
- cleaning: クリーニング費・ハウスクリーニング
- disinfection: 消毒・抗菌処理・除菌
- support_24h: 24時間サポート・緊急駆けつけ・安心サポート
- admin_fee: 書類作成費・事務手数料・管理事務代行費
- guarantor: 保証会社費用・保証料・家賃保証
- fire_insurance: 火災保険料・家財保険料
- key_money: 礼金
- unknown_label: 上記に該当しない費用

必ずJSONのみを返してください（前後に説明文を入れないこと）：
{"fees":[{"feeId":"<費目ID>","amount":<金額（円・整数）またはnull>,"rawLabel":"<書類上の費目名>"}]}

- amountは金額が読み取れない場合はnull
- 敷金・前払い賃料・日割り賃料・仲介保証金は除外
- 礼金はkey_moneyとして含める`;

function isValidFeeId(id: string): id is FeeId2 {
  return (VALID_FEE_IDS as string[]).includes(id);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "対応していないファイル形式です（JPEG / PNG / PDF）" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const isImage = file.type.startsWith("image/");

    const fileBlock: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam = isImage
      ? {
          type: "image",
          source: {
            type: "base64",
            media_type: file.type as ImageMediaType,
            data: base64,
          },
        }
      : {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        };

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            fileBlock,
            { type: "text", text: "この書類から費目と金額を抽出してください。" },
          ],
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "抽出結果を解析できませんでした" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      fees: Array<{ feeId: string; amount: number | null; rawLabel: string }>;
    };

    const fees: FeeEntry[] = parsed.fees
      .filter((f) => isValidFeeId(f.feeId))
      .map((f) => {
        const entry = createDefaultFeeEntry(f.feeId as FeeId2);
        return { ...entry, amount: typeof f.amount === "number" ? f.amount : null };
      });

    return NextResponse.json({
      fees,
      rawLabels: parsed.fees.map((f) => ({
        feeId: f.feeId,
        rawLabel: f.rawLabel,
        amount: f.amount,
      })),
    });
  } catch (e) {
    console.error("extract-fees error:", e);
    return NextResponse.json({ error: "抽出中にエラーが発生しました" }, { status: 500 });
  }
}
