import Anthropic from "@anthropic-ai/sdk";
import { diagnosisSchema } from "@/lib/schema";
import { diagnoseContractReview, diagnoseMaintenance, diagnoseMoveOut, diagnoseDepositRefund } from "@/lib/diagnoseModes";
import { normalize } from "@/lib/initialFees/normalize";
import { evaluateInitialFees } from "@/lib/initialFees/evaluate";
import type { InitialFeesInput, DiagnosisResult } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TONE_INSTRUCTIONS: Record<string, string> = {
  polite: "丁寧で低姿勢。管理会社が不快にならない表現。確認・情報収集を目的とした文面。",
  firm: "やや強め。書面での回答を明示的に求める。支払い保留の可能性を示唆してよい。",
  factual: "事実確認のみ。感情表現なし。箇条書きで確認事項を列挙する。",
};

const SITUATION_INSTRUCTIONS: Record<string, string> = {
  pre_estimate: `
ユーザーはまだ一切支払っていない。見積書を確認している段階。
メールの目的：この費用を見積りから削除してほしいという要請。
論理構造：そもそも支払い義務がない（原則論を先に示す）→根拠→削除または説明要求。
実態の有無は問わない。義務がないことを最初に示す。返金・交渉の文言は不要。`,

  pre_sign: `
ユーザーはまだ署名していない。契約直前の段階。
メールの目的：署名前にこの費用の根拠を確認したい・契約書から削除してほしい。
論理構造：支払い義務がない→特約があっても有効要件（暴利でない・合理性・借主の明確な認識と承諾）を満たさない可能性がある→署名前の確認・削除要求。
特約・特記事項への言及を必ず含める。署名前が最後の機会であることを意識した文面にする。`,

  pre_payment: `
ユーザーは契約済みだが請求が来た段階。まだ支払っていない。
メールの目的：支払い前に費用の根拠・内訳を書面で確認したい。
論理構造：支払い根拠を確認する権利がある→算出根拠・実施記録の書面開示を要求→回答があるまで支払いは保留する。
支払い保留の示唆はfirmトーンのみ許可。polite・factualでは「確認後に対応を検討します」にとどめる。`,

  paid: `
ユーザーはすでに支払い済み。
メールの目的：費用の根拠・内訳の開示を求める。根拠が存在しない場合は返還を求める。
論理構造：支払い済みでも根拠不存在なら返還請求が可能→内訳・実施記録・契約上の根拠の書面開示を要求。
「返金してください」は書かない。「根拠をご提示ください。内容を確認のうえ対応を検討します」という表現にとどめる。`,
};

const EXPLANATION_INSTRUCTIONS: Record<string, string> = {
  written: "費用について書面で説明を受けているが、算出根拠の詳細確認を求める文面にする。",
  oral: "口頭のみで書面による説明がなかった事実を明記し、書面での根拠提示を求める。",
  none: "説明を一切受けていない事実を明記し、費用の根拠と説明を書面で求める。",
  pressured: "十分な説明なく承諾を求められた事実を記録として明記し、改めて書面での根拠提示を求める。",
  rushed: "確認する時間が十分に与えられなかった事実を明記し、改めて説明と根拠の提示を求める。",
};

const COULDREFUSE_INSTRUCTIONS: Record<string, string> = {
  yes: "",
  no: "断ろうとしたが断れなかった事実を簡潔に記載する。",
  refused_and_pressured: "断ろうとしたところ圧力をかけられた事実を記録として明記する。感情的にならず事実のみを記載する。",
  told_no_contract: "この費用を断ると契約できないと告げられた事実を明記する。これは消費者契約法上の問題となりうる事実として記録に残す。断定表現は使わず「告げられた」という事実の記載にとどめる。",
  unknown: "",
};

function buildAgencyNotes(facts: InitialFeesInput["facts"]): string {
  const agency = facts.find((f) => f.realityCategory === "agency");
  if (!agency) return "";
  const d = agency.detail as import("@/lib/types").AgencyDetail;
  const notes: string[] = [];
  if (d.amountMonths === "over") {
    notes.push("仲介手数料が1ヶ月分を超えて請求されている。宅地建物取引業法第46条において上限は借主・貸主合算で1ヶ月分であることを根拠として算出根拠の開示を求める。");
  }
  if (d.bothSidesCharged === "yes") {
    notes.push("貸主・借主双方から仲介手数料を受領している場合、借主負担の上限は0.5ヶ月分となる可能性がある。この点の確認を求める文言を含める。");
  }
  if (d.amountMonths === "one" && !d.hasWrittenConsent) {
    notes.push("1ヶ月分の請求は借主の書面による承諾がある場合のみ有効。承諾書類の有無を確認する文言を含める。");
  }
  return notes.length > 0 ? `\n## 仲介手数料に関する追加指示\n${notes.join("\n")}` : "";
}

function buildKeyExchangeNotes(facts: InitialFeesInput["facts"]): string {
  const key = facts.find((f) => f.realityCategory === "key_exchange");
  if (!key) return "";
  const d = key.detail as import("@/lib/types").KeyExchangeDetail;
  if (d.isNewBuilding) {
    return "\n## 鍵交換に関する追加指示\n新築物件のため前入居者が存在しない。鍵交換の必要性自体がない旨を根拠として確認を求める文言を含める。";
  }
  return "";
}

async function generateEmailWithAI(
  result: DiagnosisResult,
  input: InitialFeesInput
): Promise<string> {
  const issuesSummary = result.issues
    .map((i) => `・${i.title}：${i.explanation}`)
    .join("\n");

  const factsSummary = input.facts
    .map(
      (f) =>
        `・${f.perceivedLabel}（${f.realityCategory}）${f.amount ? `：${f.amount.toLocaleString("ja-JP")}円` : ""}`
    )
    .join("\n");

  const agencyNotes = buildAgencyNotes(input.facts);
  const keyExchangeNotes = buildKeyExchangeNotes(input.facts);

  const prompt = `あなたは賃貸借契約の費用確認を行うユーザーの代理としてメールを作成します。

## ユーザーの状況と目的
${SITUATION_INSTRUCTIONS[input.situation] ?? SITUATION_INSTRUCTIONS.pre_estimate}

## 説明の受け方
${EXPLANATION_INSTRUCTIONS[input.explanation] ?? ""}

## 断ろうとしたときの状況
${COULDREFUSE_INSTRUCTIONS[input.couldRefuse] ?? ""}

## 書面の有無
${input.hasDocuments === "no" ? "書面が存在しないため、書面での根拠提示を明示的に求める文言を含める。" : input.hasDocuments === "yes" ? "書面は存在するが内容の正当性確認を求める文面にする。" : ""}

## 費用一覧
${factsSummary}

## 診断で検出された問題点
${issuesSummary}
${agencyNotes}
${keyExchangeNotes}

## メールのトーン
${TONE_INSTRUCTIONS[input.emailTone] ?? TONE_INSTRUCTIONS.polite}

## 作成ルール
- 件名から本文まで完成した状態で出力する
- 交渉・返金請求・法的断定は一切しない（確認・根拠の説明要求のみ）
- 「違法」「不当」などの断定表現は使わない
- 確認事項は検出された問題点に基づいて具体的に記載する
- 署名欄は「氏名：（お名前）」「物件名・部屋番号：（物件情報）」の形式
- 日本語で出力する

メールを出力してください：`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const parsed = diagnosisSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(", ");
    return Response.json({ error: messages }, { status: 422 });
  }

  const data = parsed.data;

  switch (data.mode) {
    case "contract_review":
      return Response.json(diagnoseContractReview(data));

    case "maintenance":
      return Response.json(diagnoseMaintenance(data));

    case "move_out":
      return Response.json(diagnoseMoveOut(data));

    case "deposit_refund":
      return Response.json(diagnoseDepositRefund(data));

    case "initial_fees":
    case "renewal": {
      const input = data as InitialFeesInput;
      const canonical = normalize(input);
      const result = evaluateInitialFees(canonical);
      const draftEmail = await generateEmailWithAI(result, input);
      return Response.json({ ...result, draftEmail });
    }
  }
}
