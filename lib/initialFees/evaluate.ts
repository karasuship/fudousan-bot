// lib/initialFees/evaluate.ts
// evaluateInitialFees: InitialFeesCanonical → DiagnosisResult
// diagnose.ts / feeEvaluator.ts のロジックをこのファイルに集約する。
// draftEmail は API 層（Anthropic）で生成するため、空文字列を入れる。
// 既存ファイルは変更しない。

import type {
  DiagnosisResult,
  DetectedIssue,
  NegotiationLines,
  NegotiationLineItem,
  GuaranteeBreakdown,
} from "@/lib/types";
import type { InitialFeesCanonical, CanonicalFeeItem, CanonicalAmounts, MarketContext } from "./types";
import { ISSUE_DB } from "@/lib/issueDB";
import { evaluateFee } from "@/lib/feeEvaluator";
import type { FeeEvalInput, ExplanationType } from "@/lib/feeEvaluator";

// ── 定数 ──────────────────────────────────────────────────────────────────────

const DISCLAIMER =
  "本診断結果は一般的な情報提供を目的としており、法的助言ではありません。個別の契約内容・状況によって判断は異なります。重要な判断をされる場合は、弁護士・司法書士等の専門家にご相談ください。";

const LANDING_OPTIONS: Record<string, string[]> = {
  agency_fee:      ["0.5ヶ月までの調整", "他費用との相殺調整", "フリーレントへの振替"],
  key_exchange:    ["全額削除", "フリーレントへの振替", "大家負担への変更"],
  cleaning:        ["全額削除", "退去時請求との二重回避", "フリーレントへの振替"],
  guarantor:       ["保証会社の見直し（他社比較）", "委託手数料の有無を確認", "直接申込への切替確認"],
  guarantee_base:  ["保証会社の見直し（他社比較）", "プラン変更の確認", "相場超過分の調整確認", "他費用との相殺確認"],
  guarantee_admin: ["仲介手数料への組み込み確認", "別途請求理由の確認", "他費用との相殺確認"],
  disinfection:    ["全額削除（任意サービス）", "フリーレントへの振替", "不要なら即断れる"],
  support_24h:     ["全額削除（任意加入）", "火災保険との内容重複を確認", "フリーレントへの振替"],
  admin_fee:       ["仲介手数料への組み込み確認", "根拠の書面説明を要求", "削除交渉"],
  other:           ["任意オプションの削除", "フリーレントへの振替", "必須費用からの切り離し"],
};

const FEE_TYPE_FACTOR: Record<string, number> = {
  other:           0.9,
  disinfection:    1.0,
  support_24h:     1.0,
  admin_fee:       0.9,
  key_exchange:    0.75,
  cleaning:        0.7,
  agency_fee:      0.5,
  guarantor:       0.7,
  guarantee_base:  0.5,
  guarantee_admin: 1.0,
};

// ── 市場係数 ──────────────────────────────────────────────────────────────────

function getMarketFactor(ctx: MarketContext): number {
  let f = 1.0;
  if (ctx.areaType === "urban")      f *= 0.9;
  else if (ctx.areaType === "local") f *= 1.1;
  if (ctx.season === "peak")         f *= 0.85;
  else if (ctx.season === "off")     f *= 1.15;
  if (ctx.buildingAge === "new")     f *= 0.9;
  else if (ctx.buildingAge === "old") f *= 1.1;
  return Math.min(1.3, Math.max(0.7, f));
}

function upgradeNeg(n: "high" | "medium" | "low"): "high" | "medium" | "low" {
  return n === "low" ? "medium" : "high";
}

// ── 費目ごとのスコア加算 ──────────────────────────────────────────────────────

function feeScoreContrib(fee: CanonicalFeeItem): number {
  let s = 0;
  if (fee.id === "agency" && fee.detail.type === "agency") {
    if (fee.detail.amountMonths === "over") s += 20;
    else if (fee.detail.amountMonths === "one" && !fee.detail.hasWrittenConsent) s += 15;
    if (fee.detail.bothSidesCharged === "yes") s += 10;
  } else if (fee.id === "key_exchange" && fee.detail.type === "key_exchange") {
    if (fee.detail.exchangeConfirmed === "not_done") s += 20;
    else if (fee.detail.exchangeConfirmed === "unconfirmed") s += 10;
    if (fee.detail.isNewBuilding) s += 15;
  } else if (fee.id === "cleaning" && fee.detail.type === "cleaning") {
    if (fee.detail.wasExplainedAsMandatory && fee.detail.hasContractBasis === "no") s += 15;
    if (fee.detail.includesDisinfection) s += 10;
  } else if (fee.id === "support_plan" && fee.detail.type === "support_plan") {
    if (!fee.detail.couldRefuse) s += 20;
  } else if (fee.id === "ad_fee") {
    s += 25;
  } else if (fee.id === "unknown") {
    s += 12;
  }
  return s;
}

// ── グローバルスコア ──────────────────────────────────────────────────────────

function computeScore(
  canonical: InitialFeesCanonical,
  feeScoreSum: number,
  unknownCount: number,
): number {
  let score = feeScoreSum;
  switch (canonical.explanation) {
    case "none":      score += 25; break;
    case "pressured": score += 30; break;
    case "rushed":    score += 20; break;
    case "oral":      score += 10; break;
  }
  switch (canonical.couldRefuse) {
    case "told_no_contract":      score += 25; break;
    case "refused_and_pressured": score += 20; break;
    case "no":                    score += 10; break;
  }
  if (canonical.hasDocuments === "no")          score += 15;
  else if (canonical.hasDocuments === "unknown") score += 8;
  if (unknownCount >= 2) score += 10;
  return Math.min(score, 100);
}

function computeRisk(score: number): "safe" | "review" | "caution" {
  if (score <= 25) return "safe";
  if (score <= 55) return "review";
  return "caution";
}

function buildSummary(risk: "safe" | "review" | "caution", feeCount: number): string {
  if (risk === "safe")
    return `入力された${feeCount}件の費用について、現時点での重大な問題は検出されなかった。念のため書面で記録を保持すること。`;
  if (risk === "review")
    return `入力された${feeCount}件の費用に確認が必要な論点が見つかった。書面による根拠確認が次のステップ。`;
  return `入力された${feeCount}件の費用に複数の重要な構造的問題が検出された。書面での確認を優先して行うこと。`;
}

// ── explanation → ExplanationType マッピング ──────────────────────────────────

const EXPLANATION_MAP: Record<InitialFeesCanonical["explanation"], ExplanationType> = {
  written:  "formal",
  oral:     "weak_oral",
  none:     "none",
  pressured:"pressure",
  rushed:   "pressure",
};

// ── 費目 → FeeEvalInput マッピング ────────────────────────────────────────────

function mapFeeToEvalInput(
  fee: CanonicalFeeItem,
  explanation: ExplanationType,
): FeeEvalInput | null {
  switch (fee.id) {
    case "agency": {
      if (fee.detail.type !== "agency") return null;
      const d = fee.detail;
      return {
        feeType: "broker",
        label:   fee.label,
        mandatory: d.amountMonths === "over" ? "agent" : "unknown",
        explanation,
        evidence: "claimed_only",
        benefit:  "mixed",
        salesJustification: "none",
      };
    }
    case "key_exchange": {
      if (fee.detail.type !== "key_exchange") return null;
      const d = fee.detail;
      const evidence =
        d.exchangeConfirmed === "confirmed"   ? "documented" :
        d.exchangeConfirmed === "unconfirmed" ? "claimed_only" : "none";
      return {
        feeType: "key_exchange",
        label:   fee.label,
        mandatory: "agent",
        explanation,
        evidence,
        benefit: "landlord",
        salesJustification: "none",
      };
    }
    case "cleaning": {
      if (fee.detail.type !== "cleaning") return null;
      const d = fee.detail;
      const evidence =
        d.hasInvoice              ? "documented" :
        d.hasContractBasis === "yes" ? "claimed_only" : "unknown";
      return {
        feeType: "cleaning",
        label:   fee.label,
        mandatory:  d.wasExplainedAsMandatory ? "agent" : "not_explained",
        explanation,
        evidence,
        benefit: "landlord",
        salesJustification: "none",
      };
    }
    case "guarantor": {
      if (fee.detail.type !== "guarantor") return null;
      const d = fee.detail;
      return {
        feeType: "guarantee",
        label:   fee.label,
        mandatory: d.wasMandatory ? "owner" : "optional",
        explanation,
        evidence: "claimed_only",
        benefit:  "mixed",
        salesJustification: "none",
      };
    }
    case "support_plan": {
      if (fee.detail.type !== "support_plan") return null;
      const d = fee.detail;
      return {
        feeType: "support",
        label:   d.planName || fee.label,
        mandatory: d.couldRefuse ? "optional" : "agent",
        explanation: d.wasExplained
          ? (explanation === "none" ? "weak_oral" : explanation)
          : "none",
        evidence: "claimed_only",
        benefit:  "mixed",
        salesJustification: "none",
      };
    }
    case "document_fee": {
      return {
        feeType: "admin",
        label:   fee.label,
        mandatory: "agent",
        explanation,
        evidence: "claimed_only",
        benefit:  "mixed",
        salesJustification: "none",
      };
    }
    case "fire_insurance": {
      return {
        feeType: "insurance",
        label:   fee.label,
        mandatory: "owner",
        explanation,
        evidence: "claimed_only",
        benefit:  "tenant",
        salesJustification: "none",
      };
    }
    case "unknown": {
      if (fee.detail.type !== "unknown") return null;
      return {
        feeType: "disinfect",
        label:   fee.detail.labelOnInvoice || fee.label,
        mandatory: "unknown",
        explanation,
        evidence: "unknown",
        benefit:  "unknown",
        salesJustification: "none",
      };
    }
    default:
      return null;
  }
}

// ── 費目を1回だけループして score + evalInputs を収集 ─────────────────────────

interface FeePassResult {
  scoreSum:     number;
  unknownCount: number;
  evalInputs:   FeeEvalInput[];
}

function passFees(fees: CanonicalFeeItem[], explanationType: ExplanationType): FeePassResult {
  let scoreSum = 0;
  let unknownCount = 0;
  const evalInputs: FeeEvalInput[] = [];

  for (const fee of fees) {
    scoreSum += feeScoreContrib(fee);
    if (fee.id === "unknown") unknownCount++;
    const e = mapFeeToEvalInput(fee, explanationType);
    if (e !== null) evalInputs.push(e);
  }

  return { scoreSum, unknownCount, evalInputs };
}

// ── Issue 検出 ────────────────────────────────────────────────────────────────

// ISSUE_DB の condition 関数が参照するフィールドを満たす内部型
interface IssueCondInput {
  mode:         string;
  situation:    string;
  explanation:  string;
  couldRefuse:  string;
  hasDocuments: string;
  overallRisk:  string;
  score:        number;
  issueCount:   number;
  facts: ReadonlyArray<{
    realityCategory: string;
    perceivedLabel:  string;
    amount?:         number;
    detail:          CanonicalFeeItem["detail"];
  }>;
}

function detectIssues(
  canonical: InitialFeesCanonical,
  overallRisk: string,
  score: number,
): DetectedIssue[] {
  const condInput: IssueCondInput = {
    mode:         "initial_fees",
    situation:    canonical.situation,
    explanation:  canonical.explanation,
    couldRefuse:  canonical.couldRefuse,
    hasDocuments: canonical.hasDocuments,
    overallRisk,
    score,
    issueCount:   0, // conditions が循環参照しないよう 0 を渡す
    facts: canonical.fees.map((fee) => ({
      realityCategory: fee.id,
      perceivedLabel:  fee.label,
      amount:          fee.amount,
      detail:          fee.detail,
    })),
  };

  return ISSUE_DB.filter((issue) => {
    try { return issue.condition(condInput); }
    catch { return false; }
  }).map((issue): DetectedIssue => ({
    id:          issue.id,
    category:    issue.category,
    title:       issue.title,
    rule:        issue.rule,
    explanation: issue.explanation,
    checkPoints: issue.checkPoints,
    nextAction:  issue.nextAction,
    severity:    issue.severity,
  }));
}

// ── 返金推定 ──────────────────────────────────────────────────────────────────

function estimateRefund(fees: CanonicalFeeItem[]): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const fee of fees) {
    switch (fee.id) {
      case "agency":       min += 5000;  max += 16500; break;
      case "key_exchange":               max += 13200; break;
      case "cleaning":                   max += 30000; break;
      case "support_plan":               max += 20000; break;
      case "ad_fee":       min += 10000; max += 50000; break;
      case "unknown":                    max += 15000; break;
    }
  }
  max = Math.min(max, 200000);
  if (min > max) min = max;
  return { min, max };
}


// ── 保証会社費用 ──────────────────────────────────────────────────────────────

function computeBaseExcess(baseFee: number, rent: number | undefined): number {
  if (!rent) return 0;
  // canonical に guarantorStatus がないため固定 50% ベンチマーク
  return Math.max(0, baseFee - Math.round(rent * 0.50));
}

function buildGuaranteeBreakdown(amounts: CanonicalAmounts): GuaranteeBreakdown | undefined {
  if (amounts.guaranteeBase === undefined && amounts.guaranteeAdmin === undefined) return undefined;
  const adminFee   = amounts.guaranteeAdmin ?? 0;
  const baseExcess = amounts.guaranteeBase
    ? computeBaseExcess(amounts.guaranteeBase, amounts.rent)
    : 0;
  return {
    baseFee:         amounts.guaranteeBase,
    adminFee:        amounts.guaranteeAdmin,
    baseExcess,
    guarantorStatus: undefined,
    totalPotential:  baseExcess + adminFee,
  };
}

// ── 費目別内訳（itemizedReviewBreakdown） ─────────────────────────────────────

function buildItemizedReview(
  canonical: InitialFeesCanonical,
): DiagnosisResult["itemizedReviewBreakdown"] {
  const { amounts, marketContext } = canonical;
  const hasGuaranteeSplit =
    amounts.guaranteeBase !== undefined || amounts.guaranteeAdmin !== undefined;
  const factor = getMarketFactor(marketContext);
  const rent   = amounts.rent;

  type EntryDef = {
    key:         string;
    amtVal:      number | undefined;
    label:       string;
    baseNeg:     "high" | "medium" | "low";
    calcReview:  (a: number) => { min: number; max: number };
  };

  const entries: EntryDef[] = [
    { key: "disinfection", amtVal: amounts.disinfectFee, label: "消毒・除菌代",           baseNeg: "high", calcReview: (a) => ({ min: 0, max: a }) },
    { key: "support_24h",  amtVal: amounts.support24Fee, label: "24時間サポートプラン",   baseNeg: "high", calcReview: (a) => ({ min: 0, max: a }) },
    { key: "admin_fee",    amtVal: amounts.adminFee,     label: "事務手数料・書類作成費", baseNeg: "high", calcReview: (a) => ({ min: 0, max: a }) },
    { key: "other",        amtVal: amounts.otherFees,    label: "その他任意費用",         baseNeg: "high", calcReview: (a) => ({ min: 0, max: a }) },
    { key: "key_exchange", amtVal: amounts.lockFee,      label: "鍵交換代",               baseNeg: "high", calcReview: (a) => ({ min: 0, max: a }) },
    { key: "cleaning",     amtVal: amounts.cleaningFee,  label: "清掃代",                 baseNeg: "high", calcReview: (a) => ({ min: 0, max: a }) },
    {
      key: "agency_fee",
      amtVal: amounts.brokerFee,
      label: "仲介手数料",
      baseNeg: "medium",
      calcReview: (a) => {
        if (rent && rent > 0) {
          const half = Math.round(rent * 0.55);
          return { min: 0, max: Math.min(a, Math.max(0, a - half)) };
        }
        return { min: 0, max: Math.round(a * 0.5) };
      },
    },
  ];

  // guarantor 全体フォールバック（split がない場合・canonical には直接保存されないため amtVal=undefined）
  if (!hasGuaranteeSplit) {
    entries.push({
      key:     "guarantor",
      amtVal:  undefined,
      label:   "保証会社費用（本体）",
      baseNeg: "medium",
      calcReview: (a) => ({ min: 0, max: Math.min(a, Math.round(a * 0.3)) }),
    });
  }

  const result: NonNullable<DiagnosisResult["itemizedReviewBreakdown"]> = [];

  for (const entry of entries) {
    if (!entry.amtVal) continue;
    const amt = entry.amtVal;

    let neg = entry.baseNeg;
    if (marketContext.season === "off")   neg = upgradeNeg(neg);
    if (marketContext.region === "local") neg = upgradeNeg(neg);
    if (entry.key === "key_exchange" &&
        (marketContext.buildingAge === "new" || marketContext.buildingAge === "young")) {
      if (neg === "high") neg = "medium";
    }

    const { min, max: baseMax } = entry.calcReview(amt);
    const feeFactor = FEE_TYPE_FACTOR[entry.key] ?? 0.7;
    const reviewMax = Math.min(amt, Math.round(baseMax * factor * feeFactor));
    result.push({
      feeType:      entry.key,
      label:        entry.label,
      inputAmount:  amt,
      reviewMin:    min,
      reviewMax,
      negotiability: neg,
      landingOptions: LANDING_OPTIONS[entry.key] ?? [],
    });
  }

  // 保証料 sub-amounts
  if (hasGuaranteeSplit) {
    if (amounts.guaranteeBase && amounts.guaranteeBase > 0) {
      const excess = computeBaseExcess(amounts.guaranteeBase, rent);
      let neg: "high" | "medium" | "low" = "medium";
      if (marketContext.season === "off")   neg = upgradeNeg(neg);
      if (marketContext.region === "local") neg = upgradeNeg(neg);
      result.push({
        feeType:       "guarantee_base",
        label:         "保証料（本体）",
        inputAmount:   amounts.guaranteeBase,
        reviewMin:     0,
        reviewMax:     excess,
        negotiability: neg,
        landingOptions: LANDING_OPTIONS.guarantee_base ?? [],
      });
    }
    if (amounts.guaranteeAdmin && amounts.guaranteeAdmin > 0) {
      let neg: "high" | "medium" | "low" = "high";
      if (marketContext.season === "off") neg = upgradeNeg(neg);
      result.push({
        feeType:       "guarantee_admin",
        label:         "委託保証料・保証関連事務費",
        inputAmount:   amounts.guaranteeAdmin,
        reviewMin:     0,
        reviewMax:     amounts.guaranteeAdmin,
        negotiability: neg,
        landingOptions: LANDING_OPTIONS.guarantee_admin ?? [],
      });
    }
  }

  return result.length > 0 ? result : undefined;
}

// ── 交渉ライン ────────────────────────────────────────────────────────────────

function buildNegotiationLines(canonical: InitialFeesCanonical): NegotiationLines | undefined {
  const { amounts, marketContext } = canonical;
  const hasGuaranteeSplit =
    amounts.guaranteeBase !== undefined || amounts.guaranteeAdmin !== undefined;
  const hasAnyAmount =
    amounts.brokerFee    !== undefined ||
    amounts.cleaningFee  !== undefined ||
    amounts.lockFee      !== undefined ||
    amounts.support24Fee !== undefined ||
    amounts.disinfectFee !== undefined ||
    amounts.adminFee     !== undefined ||
    amounts.otherFees    !== undefined ||
    hasGuaranteeSplit;

  if (!hasAnyAmount) return undefined;

  const factor     = getMarketFactor(marketContext);
  const rent       = amounts.rent;
  const adminFee   = amounts.guaranteeAdmin ?? 0;
  const baseExcess = amounts.guaranteeBase
    ? computeBaseExcess(amounts.guaranteeBase, rent)
    : 0;

  const minItems: NegotiationLineItem[] = [];
  if (adminFee > 0)
    minItems.push({ feeType: "guarantee_admin", label: "委託保証料・保証関連事務費", amount: adminFee,              basis: "仲介手数料に含まれる性質の手続き費用" });
  if (amounts.disinfectFee)
    minItems.push({ feeType: "disinfection",   label: "消毒・除菌代",               amount: amounts.disinfectFee,  basis: "任意サービス" });
  if (amounts.support24Fee)
    minItems.push({ feeType: "support_24h",    label: "24時間サポートプラン",        amount: amounts.support24Fee,  basis: "任意加入" });
  if (amounts.adminFee)
    minItems.push({ feeType: "admin_fee",      label: "事務手数料・書類作成費",      amount: amounts.adminFee,      basis: "仲介手数料に含まれる業務" });
  if (amounts.otherFees)
    minItems.push({ feeType: "other",          label: "その他任意費用",              amount: amounts.otherFees,     basis: "任意費用" });

  const realItems: NegotiationLineItem[] = [...minItems];
  if (amounts.lockFee) {
    const amt = Math.round(amounts.lockFee * factor * FEE_TYPE_FACTOR.key_exchange);
    if (amt > 0) realItems.push({ feeType: "key_exchange", label: "鍵交換代", amount: amt, basis: "借主負担の根拠確認が必要" });
  }
  if (amounts.cleaningFee) {
    const amt = Math.round(amounts.cleaningFee * factor * FEE_TYPE_FACTOR.cleaning);
    if (amt > 0) realItems.push({ feeType: "cleaning", label: "清掃代", amount: amt, basis: "入居前清掃は貸主負担が原則" });
  }
  if (baseExcess > 0)
    realItems.push({ feeType: "guarantee_base", label: "保証料（相場超過分）", amount: baseExcess, basis: "相場（連帯保証人なし50%）超過分" });

  const aggrItems: NegotiationLineItem[] = [...realItems];
  if (amounts.brokerFee) {
    const overPaid = rent
      ? Math.max(0, amounts.brokerFee - Math.round(rent * 0.55))
      : Math.round(amounts.brokerFee * 0.5);
    if (overPaid > 0)
      aggrItems.push({ feeType: "agency_fee", label: "仲介手数料（超過分）", amount: overPaid, basis: "0.5ヶ月超の部分" });
  }

  const sum = (items: NegotiationLineItem[]) => items.reduce((s, i) => s + i.amount, 0);
  return {
    minimum:    { total: sum(minItems),  items: minItems  },
    realistic:  { total: sum(realItems), items: realItems },
    aggressive: { total: sum(aggrItems), items: aggrItems },
  };
}

function toFreeRentMonths(total: number, rent: number): number {
  return Math.min(6, Math.floor(total / rent));
}

// ── メイン関数 ────────────────────────────────────────────────────────────────

export function evaluateInitialFees(input: InitialFeesCanonical): DiagnosisResult {
  const explanationType = EXPLANATION_MAP[input.explanation];

  // 1. 費目を1回だけループして score 寄与 + evalInputs を収集
  const { scoreSum, unknownCount, evalInputs } = passFees(input.fees, explanationType);

  // 2. スコア → リスク → サマリ
  const score       = computeScore(input, scoreSum, unknownCount);
  const overallRisk = computeRisk(score);
  const summary     = buildSummary(overallRisk, input.fees.length);

  // 3. 論点検出（ISSUE_DB）
  const issues = detectIssues(input, overallRisk, score);

  // 4. nextChecks
  const nextChecks = [
    ...new Set([
      ...issues.flatMap((i) => i.checkPoints).slice(0, 6),
      "契約書・重要事項説明書を手元に用意する",
      "疑問点をメールで管理会社に送り書面回答を求める",
    ]),
  ].slice(0, 8);

  // 5. 費目評価（collectedした evalInputs を evaluateFee に渡す）
  const feeEvaluations = evalInputs.map(evaluateFee);

  // 6. 返金推定
  const refund = estimateRefund(input.fees);

  // 7. 費目別内訳 + estimatedOutcome
  const itemizedReviewBreakdown = buildItemizedReview(input);
  let estimatedOutcome: DiagnosisResult["estimatedOutcome"];
  if (itemizedReviewBreakdown && itemizedReviewBreakdown.length > 0) {
    const total   = itemizedReviewBreakdown.reduce((s, x) => s + x.reviewMax, 0);
    const minAmt  = Math.min(total, Math.round(total * 0.4));
    const rent    = input.amounts.rent;
    const freeRentMonths = rent && rent > 0 ? toFreeRentMonths(total, rent) : undefined;
    estimatedOutcome = { reducibleMin: minAmt, reducibleMax: total, freeRentMonths };
  }

  // 9. 交渉ライン
  const negotiationLines = buildNegotiationLines(input);

  // 10. 保証会社費用内訳
  const guaranteeBreakdown = buildGuaranteeBreakdown(input.amounts);

  return {
    mode:                  "initial_fees",
    overallRisk,
    score,
    summary,
    issues,
    nextChecks,
    draftEmail:            "", // API 層で Anthropic が生成
    disclaimer:            DISCLAIMER,
    estimatedRefundMin:    refund.min,
    estimatedRefundMax:    refund.max,
    itemizedReviewBreakdown,
    estimatedOutcome,
    negotiationLines,
    guaranteeBreakdown,
    feeEvaluations: feeEvaluations.length > 0 ? feeEvaluations : undefined,
  };
}
