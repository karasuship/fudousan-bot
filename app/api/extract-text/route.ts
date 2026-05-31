import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `以下の画像またはPDFはメール・書面・チャットのスクリーンショットです。
本文テキストをそのまま抽出してください。
レイアウト・装飾は無視して、文章のみを返してください。`;

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
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            fileBlock,
            { type: "text", text: "テキストを抽出してください。" },
          ],
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    return NextResponse.json({ text });
  } catch (e) {
    console.error("extract-text error:", e);
    return NextResponse.json({ error: "抽出中にエラーが発生しました" }, { status: 500 });
  }
}
