import Anthropic from "@anthropic-ai/sdk";
import { FEE_LABEL } from "@/lib/types_v2";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ComplaintRequest {
  emailText: string;
  agentReply?: string;
  fees: Array<{ feeId: string; amount: number | null }>;
  format: "brief" | "detailed";
}

const BRIEF_SYSTEM = `賃貸トラブルの相談窓口（消費者センター・国交省等）に
電話・持参するときに使う要点メモを作成してください。

## 形式
プレーンテキスト・Markdown不使用
以下の構成で箇条書き（全体で10行以内）：

■ 問題の概要（1〜2行）
■ 請求されていた費用と問題のある費目
■ 業者に確認を求めた内容（要点のみ）
■ 業者の対応
■ 希望すること

口頭で1〜2分で説明できる長さ。
事実のみ・感情的表現なし・断定しない。`;

const DETAILED_SYSTEM = `賃貸トラブルの相談窓口に提出・送付するための
状況整理文書を作成してください。

## 形式
プレーンテキスト・Markdown不使用
以下の構成で文章形式：

【相談の概要】
【問題のある費目と金額】
【業者に確認を求めた内容】
【業者の対応】
【確認できなかった事項】
【希望する対応】

相談窓口が状況を把握しやすい構成。
事実のみ・感情的表現なし。
断定しない（「〜の可能性があります」等）。`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ComplaintRequest;
    const { emailText, agentReply, fees, format } = body;

    const feeLines = fees
      .map((f) => {
        const label = (FEE_LABEL as Record<string, string>)[f.feeId] ?? f.feeId;
        return f.amount ? `${label}：¥${f.amount.toLocaleString("ja-JP")}` : label;
      })
      .join("\n");

    const systemPrompt = format === "brief" ? BRIEF_SYSTEM : DETAILED_SYSTEM;

    const userMessage = `【送ったメール】
${emailText}

【業者からの返信】
${agentReply || "返信なし"}

【請求されていた費用】
${feeLines}

上記を元に状況まとめを作成してください。`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const content = response.content[0];
    const complaintText = content.type === "text" ? content.text : "";

    return Response.json({ complaintText });
  } catch {
    return Response.json(
      { error: "文書の生成に失敗しました" },
      { status: 500 }
    );
  }
}
