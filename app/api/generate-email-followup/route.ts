import Anthropic from "@anthropic-ai/sdk";
import { FEE_LABEL } from "@/lib/types_v2";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface FollowupEmailRequest {
  timing: string;
  previousEmail: string;
  agentReply: string;
  followupType: "competitive" | "evidence";
  fees?: Array<{ feeId: string; amount: number | null }>;
  hasGuarantor?: "yes" | "no" | null;
}

type FeeAnalysis = {
  feeId: string;
  status: "resolved" | "partial" | "unresolved";
  agentSaid?: string;
};

// ─── 整形用systemプロンプト ────────────────────────────────────────────────────

const FORMATTING_SYSTEM = `日本語の文章整形の専門家。
与えられたメールの骨格を自然な日本語に整形してください。
論点の内容・意味を変えない。
新しい内容を追加しない。
断定しない。
Markdownを使わない。
プレーンテキストのみ。
担当者への敬意を示しながら確認事項を伝える文体。
責めるのではなく一緒に解決したいという姿勢。`;

// ─── 競合型メール骨格 ─────────────────────────────────────────────────────────

function buildCompetitiveFrame(fees: FollowupEmailRequest["fees"]): string {
  const validFees = (fees ?? []).filter((f) => f.amount != null && f.amount > 0);
  const feeLines = validFees
    .map((f) => `${(FEE_LABEL as Record<string, string>)[f.feeId] ?? f.feeId}：¥${f.amount!.toLocaleString("ja-JP")}`)
    .join("\n");
  const total = (fees ?? []).reduce((sum, f) => sum + (f.amount ?? 0), 0);

  return `件名：Re：初期費用のお見積もりについて

ご担当者様

先日はご回答いただきありがとうございました。

現在、同じ物件について他社様にも
お問い合わせをしている状況です。

現時点でいただいている見積もりは
以下の通りです：

─────────────────────
${feeLines}
合計：¥${total.toLocaleString("ja-JP")}
─────────────────────

この総額を下回るご提案をいただけますでしょうか。

ご対応いただけるようであれば、
ぜひ御社での契約を前向きに検討いたします。

ご回答をお待ちしております。

[お名前]`;
}

// ─── 費目別2通目ブロック ──────────────────────────────────────────────────────

function buildFeeBlock2(feeId: string, agentReply: string, hasGuarantor?: "yes" | "no" | null): string {
  switch (feeId) {
    case "agency_fee":
      return `【仲介手数料について】
ご回答ありがとうございます。
引き続き確認させてください。
0.5ヶ月分への調整と、貸主様からの
広告料・手数料のお受領状況について
書面でのご回答をいただけますでしょうか。`;

    case "key_exchange":
      return `【鍵交換代について】
前入居者の退去日と新品交換であることが
確認できる資料を書面でご提示ください。
また貸主様への確認状況もご教示ください。`;

    case "cleaning": {
      const isExit = agentReply.includes("退去");
      if (isExit) {
        return `【クリーニング費について】
退去時清掃とのご回答でしたが、
敷金からの清算との二重負担に
ならないかをご確認ください。`;
      }
      return `【クリーニング費について】
入居前清掃とのご回答でしたが、
本来貸主様のご負担とされることが多く、
借主負担とする根拠について
貸主様にご確認いただけますでしょうか。`;
    }

    case "disinfection":
      return `【消毒・抗菌処理費について】
貸主様のご意向か御社のご規定か、
実施日・実施業者・処理内容について
書面でのご提示をお願いします。`;

    case "support_24h":
      return `【24時間サポートについて】
サービス内容・契約期間・運営会社について
書面でのご提示をお願いします。
火災保険の付帯サービスとの重複についても
ご確認ください。`;

    case "admin_fee":
      return `【書類作成費について】
仲介手数料との関係（内訳に含まれるか否か）と
別途請求とする場合の具体的な根拠について
書面でのご回答をお願いします。`;

    case "guarantor":
      if (hasGuarantor === "yes") {
        return `【保証会社費用について】
連帯保証人を立てる予定である旨を伝えましたが、
その上でも必須とのご回答でしょうか。
貸主様へのご確認状況と選択可能な保証会社の一覧、
管理会社・仲介会社とのグループ関係の有無について
書面でのご回答をお願いします。`;
      }
      return `【保証会社費用について】
選択可能な保証会社の一覧と
管理会社・仲介会社とのグループ関係の有無について
ご教示ください。`;

    case "fire_insurance":
      return `【火災保険料について】
貸主様が求める最低限の補償内容
（補償額・特約等）を書面でご提示ください。`;

    case "key_money":
      return `【礼金について】
ご調整またはフリーレント転換での
総額調整についてご検討いただけますでしょうか。`;

    default:
      return "";
  }
}

// ─── 根拠追求型フレーム ───────────────────────────────────────────────────────

function buildEvidenceFrame(feeBlocks: string[]): string {
  const content = feeBlocks.join("\n\n");
  return `件名：Re：初期費用のお見積もりについて

ご担当者様

先日はご回答いただきありがとうございました。

引き続き以下の点についてご確認をお願いします。

${content}

各費目について書面でのご回答を
いただけますと幸いです。
根拠をご確認できれば、速やかに
契約手続きに進めさせていただきます。

[お名前]`;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FollowupEmailRequest;
    const { previousEmail, agentReply, followupType, fees, hasGuarantor } = body;

    // ─── 競合型 ──────────────────────────────────────────────────────────────
    if (followupType === "competitive") {
      const frame = buildCompetitiveFrame(fees);
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: FORMATTING_SYSTEM,
        messages: [{ role: "user", content: frame }],
      });
      const content = response.content[0];
      const draftEmail = content.type === "text" ? content.text : "";
      return Response.json({ draftEmail });
    }

    // ─── 根拠追求型 ──────────────────────────────────────────────────────────

    // Step1: 費目ごとの状態を分析
    const analysisResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `賃貸初期費用の交渉支援の専門家。
1通目のメールと業者の返答を読み、
各費目について以下のいずれかに分類してください：
- resolved：削除・値引き・明確な回答が得られた
- partial：部分的な回答・追加確認が必要
- unresolved：回答なし・曖昧・はぐらかされた

回答はJSON形式のみ。以下の形式で：
[{"feeId":"agency_fee","status":"partial","agentSaid":"1ヶ月が弊社規定です"}]

費目名は日本語で書かれていても対応するfeeIdに変換してください。
feeIdの一覧：agency_fee/key_exchange/cleaning/disinfection/support_24h/admin_fee/guarantor/fire_insurance/key_money`,
      messages: [{
        role: "user",
        content: `【1通目のメール】\n${previousEmail}\n\n【業者からの返答】\n${agentReply}`,
      }],
    });

    const analysisText =
      analysisResponse.content[0].type === "text"
        ? analysisResponse.content[0].text
        : "[]";

    // JSON部分を抽出（マークダウンコードブロック対応）
    const jsonMatch = analysisText.match(/\[[\s\S]*\]/);
    let analysis: FeeAnalysis[] = [];
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]) as FeeAnalysis[];
      } catch {
        analysis = [];
      }
    }

    // Step2: partial/unresolvedの費目ブロックを組み立てる
    const actionable = analysis.filter(
      (a) => a.status === "partial" || a.status === "unresolved"
    );
    const feeBlocks = actionable
      .map((a) => buildFeeBlock2(a.feeId, agentReply, hasGuarantor))
      .filter(Boolean);

    if (feeBlocks.length === 0) {
      return Response.json({
        draftEmail: "業者の返答を分析できませんでした。返信内容をご確認ください。",
      });
    }

    // Step3: 整形
    const frame = buildEvidenceFrame(feeBlocks);
    const formatResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: FORMATTING_SYSTEM,
      messages: [{ role: "user", content: frame }],
    });
    const content = formatResponse.content[0];
    const draftEmail = content.type === "text" ? content.text : "";

    return Response.json({ draftEmail });
  } catch {
    return Response.json({ error: "2通目の生成に失敗しました" }, { status: 500 });
  }
}
