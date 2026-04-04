import type { InitialFeesInput, DiagnosisResult, DetectedIssue } from "./types";
import { ISSUE_DB } from "./issueDB";

const DISCLAIMER =
  "本診断結果は一般的な情報提供を目的としており、法的助言ではありません。個別の契約内容・状況によって判断は異なります。重要な判断をされる場合は、弁護士・司法書士等の専門家にご相談ください。";

function computeScore(input: InitialFeesInput): number {
  let score = 0;

  if (input.explanation === "none") score += 25;
  else if (input.explanation === "pressured") score += 30;
  else if (input.explanation === "rushed") score += 20;
  else if (input.explanation === "oral") score += 10;

  if (input.couldRefuse === "told_no_contract") score += 25;
  else if (input.couldRefuse === "refused_and_pressured") score += 20;
  else if (input.couldRefuse === "no") score += 10;

  if (input.hasDocuments === "no") score += 15;
  else if (input.hasDocuments === "unknown") score += 8;

  for (const fact of input.facts) {
    if (fact.realityCategory === "agency") {
      const d = fact.detail as any;
      if (d.amountMonths === "over") score += 20;
      else if (d.amountMonths === "one" && !d.hasWrittenConsent) score += 15;
      if (d.bothSidesCharged === "yes") score += 10;
    }
    if (fact.realityCategory === "key_exchange") {
      const d = fact.detail as any;
      if (d.exchangeConfirmed === "not_done") score += 20;
      else if (d.exchangeConfirmed === "unconfirmed") score += 10;
      if (d.isNewBuilding) score += 15;
    }
    if (fact.realityCategory === "cleaning") {
      const d = fact.detail as any;
      if (d.wasExplainedAsMandatory && d.hasContractBasis === "no") score += 15;
      if (d.includesDisinfection) score += 10;
    }
    if (fact.realityCategory === "support_plan") {
      const d = fact.detail as any;
      if (!d.couldRefuse) score += 20;
    }
    if (fact.realityCategory === "ad_fee") score += 25;
    if (fact.realityCategory === "unknown") score += 12;
  }

  const unknownCount = input.facts.filter((f) => f.realityCategory === "unknown").length;
  if (unknownCount >= 2) score += 10;

  return Math.min(score, 100);
}

function computeRisk(score: number) {
  if (score <= 25) return "safe" as const;
  if (score <= 55) return "review" as const;
  return "caution" as const;
}

function buildSummary(risk: string, score: number, facts: any[]): string {
  const count = facts.length;
  if (risk === "safe")
    return `入力された${count}件の費用について、現時点での重大な問題は検出されなかった。念のため書面で記録を保持すること。`;
  if (risk === "review")
    return `入力された${count}件の費用に確認が必要な論点が見つかった。書面による根拠確認が次のステップ。`;
  return `入力された${count}件の費用に複数の重要な構造的問題が検出された。書面での確認を優先して行うこと。`;
}

function detectIssuesForInput(input: InitialFeesInput): DetectedIssue[] {
  return ISSUE_DB.filter((issue) => {
    try {
      return issue.condition(input);
    } catch {
      return false;
    }
  }).map((issue) => ({
    id: issue.id,
    category: issue.category,
    title: issue.title,
    rule: issue.rule,
    explanation: issue.explanation,
    checkPoints: issue.checkPoints,
    nextAction: issue.nextAction,
    severity: issue.severity,
  }));
}

function estimateRefund(facts: any[]): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const fact of facts) {
    switch (fact.realityCategory) {
      case "agency":
        min += 5000;
        max += 16500;
        break;
      case "key_exchange":
        max += 13200;
        break;
      case "cleaning":
        max += 30000;
        break;
      case "support_plan":
        max += 20000;
        break;
      case "ad_fee":
        min += 10000;
        max += 50000;
        break;
      case "unknown":
        max += 15000;
        break;
    }
  }
  return { min, max: Math.min(max, 200000) };
}

export async function diagnoseInitialFees(input: InitialFeesInput): Promise<DiagnosisResult> {
  const score = computeScore(input);
  const overallRisk = computeRisk(score);
  const summary = buildSummary(overallRisk, score, input.facts);
  const issues = detectIssuesForInput(input);

  const nextChecks = [
    ...new Set([
      ...issues.flatMap((i) => i.checkPoints).slice(0, 6),
      "契約書・重要事項説明書を手元に用意する",
      "疑問点をメールで管理会社に送り書面回答を求める",
    ]),
  ].slice(0, 8);

  const refund = estimateRefund(input.facts);

  return {
    mode: "initial_fees",
    overallRisk,
    score,
    summary,
    issues,
    nextChecks,
    draftEmail: "", // route.ts で Anthropic API 生成後に上書き
    disclaimer: DISCLAIMER,
    estimatedRefundMin: refund.min,
    estimatedRefundMax: refund.max,
  };
}
