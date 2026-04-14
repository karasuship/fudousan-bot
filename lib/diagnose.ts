import type { InitialFeesInput, DiagnosisResult, DetectedIssue, NegotiationLines, NegotiationLineItem, GuaranteeBreakdown } from "./types";
import type { FactItem } from "./types";
import { ISSUE_DB } from "./issueDB";
import { evaluateFee } from "./feeEvaluator";
import type { FeeEvalInput, ExplanationType, FeeTypeKey } from "./feeEvaluator";

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


const LANDING_OPTIONS: Record<string, string[]> = {
  agency_fee: [
    "0.5ヶ月までの調整",
    "他費用との相殺調整",
    "フリーレントへの振替",
  ],
  key_exchange: [
    "全額削除",
    "フリーレントへの振替",
    "大家負担への変更",
  ],
  cleaning: [
    "全額削除",
    "退去時請求との二重回避",
    "フリーレントへの振替",
  ],
  guarantor: [
    "保証会社の見直し（他社比較）",
    "委託手数料の有無を確認",
    "直接申込への切替確認",
  ],
  guarantee_base: [
    "保証会社の見直し（他社比較）",
    "プラン変更の確認",
    "相場超過分の調整確認",
    "他費用との相殺確認",
  ],
  guarantee_admin: [
    "仲介手数料への組み込み確認",
    "別途請求理由の確認",
    "他費用との相殺確認",
  ],
  disinfection: [
    "全額削除（任意サービス）",
    "フリーレントへの振替",
    "不要なら即断れる",
  ],
  support_24h: [
    "全額削除（任意加入）",
    "火災保険との内容重複を確認",
    "フリーレントへの振替",
  ],
  admin_fee: [
    "仲介手数料への組み込み確認",
    "根拠の書面説明を要求",
    "削除交渉",
  ],
  other: [
    "任意オプションの削除",
    "フリーレントへの振替",
    "必須費用からの切り離し",
  ],
};

function getMarketFactor(context: InitialFeesInput["marketContext"]): number {
  let factor = 1.0;
  if (!context) return factor;

  if (context.areaType === "urban") factor *= 0.9;
  else if (context.areaType === "local") factor *= 1.1;

  if (context.season === "peak") factor *= 0.85;
  else if (context.season === "off") factor *= 1.15;

  if (context.buildingAge === "new") factor *= 0.9;
  else if (context.buildingAge === "old") factor *= 1.1;

  return Math.min(1.3, Math.max(0.7, factor));
}

function convertToFreeRent(amount: number, rent: number): number {
  return Math.min(6, Math.floor(amount / rent));
}


function upgradeNegotiability(n: "high" | "medium" | "low"): "high" | "medium" | "low" {
  if (n === "low") return "medium";
  return "high";
}

// ─── 保証料本体の相場超過額を算出 ─────────────────────────────────────────────
function computeGuaranteeBaseExcess(
  baseFee: number,
  rent: number | undefined,
  guarantorStatus: InitialFeesInput["guarantorStatus"]
): number {
  if (!rent) return 0;
  const benchmarkRate = guarantorStatus === "has" ? 0.30 : 0.50;
  const benchmark = Math.round(rent * benchmarkRate);
  return Math.max(0, baseFee - benchmark);
}

function buildItemizedReviewBreakdown(
  input: InitialFeesInput
): DiagnosisResult["itemizedReviewBreakdown"] {
  const { feeAmounts, marketContext } = input;
  const hasGuaranteeSplit = input.guaranteeBaseFee !== undefined || input.guaranteeAdminFee !== undefined;
  if (!feeAmounts && !hasGuaranteeSplit) return undefined;

  const rent = input.monthlyRent;
  const factor = getMarketFactor(input.marketContext);

  const result: NonNullable<DiagnosisResult["itemizedReviewBreakdown"]> = [];

  // 表示順固定: 任意費用（折れやすい順）→ 通常費用
  type FeeAmountKey = keyof NonNullable<InitialFeesInput["feeAmounts"]>;
  const entries: Array<{
    key: FeeAmountKey;
    label: string;
    baseNegotiability: "high" | "medium" | "low";
    calcReview: (amt: number) => { min: number; max: number };
  }> = [
    {
      key: "disinfection",
      label: "消毒・除菌代",
      baseNegotiability: "high",
      calcReview: (amt) => ({ min: 0, max: amt }),
    },
    {
      key: "support_24h",
      label: "24時間サポートプラン",
      baseNegotiability: "high",
      calcReview: (amt) => ({ min: 0, max: amt }),
    },
    {
      key: "admin_fee",
      label: "事務手数料・書類作成費",
      baseNegotiability: "high",
      calcReview: (amt) => ({ min: 0, max: amt }),
    },
    {
      key: "other",
      label: "その他任意費用",
      baseNegotiability: "high",
      calcReview: (amt) => ({ min: 0, max: amt }),
    },
    {
      key: "key_exchange",
      label: "鍵交換代",
      baseNegotiability: "high",
      calcReview: (amt) => ({ min: 0, max: amt }),
    },
    {
      key: "cleaning",
      label: "清掃代",
      baseNegotiability: "high",
      calcReview: (amt) => ({ min: 0, max: amt }),
    },
    {
      key: "agency_fee",
      label: "仲介手数料",
      baseNegotiability: "medium",
      calcReview: (amt) => {
        if (rent && rent > 0) {
          const legalHalf = Math.round(rent * 0.55);
          const overPaid = amt - legalHalf;
          const max = Math.min(amt, Math.max(0, overPaid));
          return { min: 0, max };
        }
        return { min: 0, max: Math.round(amt * 0.5) };
      },
    },
    // guarantor (フォールバック：sub-amountsがない場合のみ使用)
    ...(!hasGuaranteeSplit ? [{
      key: "guarantor" as FeeAmountKey,
      label: "保証会社費用（本体）",
      baseNegotiability: "medium" as const,
      calcReview: (amt: number) => ({ min: 0, max: Math.min(amt, Math.round(amt * 0.3)) }),
    }] : []),
  ];

  for (const entry of entries) {
    const amt = feeAmounts?.[entry.key];
    if (!amt) continue;

    let negotiability = entry.baseNegotiability;

    if (marketContext) {
      // 閑散期または地方は交渉余地が増す
      if (marketContext.season === "off") {
        negotiability = upgradeNegotiability(negotiability);
      }
      if (marketContext.region === "local") {
        negotiability = upgradeNegotiability(negotiability);
      }
      // 新築・築浅は鍵交換の交渉余地が下がる
      if (
        entry.key === "key_exchange" &&
        (marketContext.buildingAge === "new" || marketContext.buildingAge === "young")
      ) {
        if (negotiability === "high") negotiability = "medium";
      }
    }

    const { min, max: baseMax } = entry.calcReview(amt);
    const reviewMax = Math.min(amt, Math.round(baseMax * factor));
    result.push({
      feeType: entry.key,
      label: entry.label,
      inputAmount: amt,
      reviewMin: min,
      reviewMax,
      negotiability,
      landingOptions: LANDING_OPTIONS[entry.key] ?? [],
    });
  }

  // ─── 保証料本体・委託保証料の個別エントリ（sub-amountsが提供された場合のみ）
  if (hasGuaranteeSplit) {
    const rent = input.monthlyRent;
    if (input.guaranteeBaseFee && input.guaranteeBaseFee > 0) {
      const excess = computeGuaranteeBaseExcess(input.guaranteeBaseFee, rent, input.guarantorStatus);
      let neg: "high" | "medium" | "low" = "medium";
      if (marketContext?.season === "off") neg = upgradeNegotiability(neg);
      if (marketContext?.region === "local") neg = upgradeNegotiability(neg);
      result.push({
        feeType: "guarantee_base",
        label: "保証料（本体）",
        inputAmount: input.guaranteeBaseFee,
        reviewMin: 0,
        reviewMax: excess,
        negotiability: neg,
        landingOptions: LANDING_OPTIONS.guarantee_base ?? [],
      });
    }
    if (input.guaranteeAdminFee && input.guaranteeAdminFee > 0) {
      let neg: "high" | "medium" | "low" = "high";
      if (marketContext?.season === "off") neg = upgradeNegotiability(neg);
      result.push({
        feeType: "guarantee_admin",
        label: "委託保証料・保証関連事務費",
        inputAmount: input.guaranteeAdminFee,
        reviewMin: 0,
        reviewMax: input.guaranteeAdminFee,
        negotiability: neg,
        landingOptions: LANDING_OPTIONS.guarantee_admin ?? [],
      });
    }
  }

  return result.length > 0 ? result : undefined;
}

// ─── 保証会社費用内訳を算出 ──────────────────────────────────────────────────
function computeGuaranteeBreakdown(input: InitialFeesInput): GuaranteeBreakdown | undefined {
  if (input.guaranteeBaseFee === undefined && input.guaranteeAdminFee === undefined) return undefined;
  const baseFee = input.guaranteeBaseFee;
  const adminFee = input.guaranteeAdminFee ?? 0;
  const baseExcess = baseFee
    ? computeGuaranteeBaseExcess(baseFee, input.monthlyRent, input.guarantorStatus)
    : 0;
  return {
    baseFee,
    adminFee: input.guaranteeAdminFee,
    baseExcess,
    guarantorStatus: input.guarantorStatus,
    totalPotential: baseExcess + adminFee,
  };
}

// ─── 交渉ラインを内訳付きで算出 ─────────────────────────────────────────────
function buildNegotiationLines(
  input: InitialFeesInput,
  breakdown: DiagnosisResult["itemizedReviewBreakdown"]
): NegotiationLines | undefined {
  if (!breakdown || breakdown.length === 0) return undefined;

  const fa = input.feeAmounts;

  // ── 最低ライン：ほぼ確実に確認・調整できる費目 ───────────────────────────
  const minItems: NegotiationLineItem[] = [];

  const guaranteeAdminItem = breakdown.find((b) => b.feeType === "guarantee_admin");
  if (guaranteeAdminItem && guaranteeAdminItem.reviewMax > 0)
    minItems.push({ feeType: "guarantee_admin", label: guaranteeAdminItem.label, amount: guaranteeAdminItem.reviewMax, basis: "仲介手数料に含まれる性質の手続き費用" });
  if (fa?.disinfection)
    minItems.push({ feeType: "disinfection", label: "消毒・除菌代", amount: fa.disinfection, basis: "任意サービス" });
  if (fa?.support_24h)
    minItems.push({ feeType: "support_24h", label: "24時間サポートプラン", amount: fa.support_24h, basis: "任意加入" });
  if (fa?.admin_fee)
    minItems.push({ feeType: "admin_fee", label: "事務手数料・書類作成費", amount: fa.admin_fee, basis: "仲介手数料に含まれる業務" });
  if (fa?.other)
    minItems.push({ feeType: "other", label: "その他任意費用", amount: fa.other, basis: "任意費用" });

  // ── 現実ライン：最低 + 条件付きで通りやすい費目 ─────────────────────────
  const realItems: NegotiationLineItem[] = [...minItems];

  const keyExchangeItem = breakdown.find((b) => b.feeType === "key_exchange");
  if (keyExchangeItem && keyExchangeItem.reviewMax > 0)
    realItems.push({ feeType: "key_exchange", label: keyExchangeItem.label, amount: keyExchangeItem.reviewMax, basis: "借主負担の根拠確認が必要" });

  const cleaningItem = breakdown.find((b) => b.feeType === "cleaning");
  if (cleaningItem && cleaningItem.reviewMax > 0)
    realItems.push({ feeType: "cleaning", label: cleaningItem.label, amount: cleaningItem.reviewMax, basis: "入居前清掃は貸主負担が原則" });

  const guaranteeBaseItem = breakdown.find((b) => b.feeType === "guarantee_base");
  if (guaranteeBaseItem && guaranteeBaseItem.reviewMax > 0)
    realItems.push({ feeType: "guarantee_base", label: "保証料（相場超過分）", amount: guaranteeBaseItem.reviewMax, basis: `相場(${input.guarantorStatus === "has" ? "連帯保証人あり30%" : "連帯保証人なし50%"})超過分` });

  // ── 強気ライン：現実 + 最大値を狙う場合 ────────────────────────────────
  const aggrItems: NegotiationLineItem[] = [...realItems];

  const agencyFeeItem = breakdown.find((b) => b.feeType === "agency_fee");
  if (agencyFeeItem && agencyFeeItem.reviewMax > 0)
    aggrItems.push({ feeType: "agency_fee", label: "仲介手数料（超過分）", amount: agencyFeeItem.reviewMax, basis: "0.5ヶ月超の部分" });

  const sum = (items: NegotiationLineItem[]) => items.reduce((s, i) => s + i.amount, 0);
  return {
    minimum:   { total: sum(minItems),  items: minItems  },
    realistic: { total: sum(realItems), items: realItems },
    aggressive:{ total: sum(aggrItems), items: aggrItems },
  };
}

// ─── 説明レベルのマッピング ───────────────────────────────────────────────────
const EXPLANATION_TO_EVAL: Record<InitialFeesInput["explanation"], ExplanationType> = {
  written: "formal",
  oral: "weak_oral",
  none: "none",
  pressured: "pressure",
  rushed: "pressure",
};

// ─── FactItem → FeeEvalInput マッピング ───────────────────────────────────────
function mapFactToEvalInput(
  fact: FactItem,
  globalExplanation: InitialFeesInput["explanation"]
): FeeEvalInput | null {
  const explanation = EXPLANATION_TO_EVAL[globalExplanation] ?? "none";

  switch (fact.realityCategory) {
    case "agency": {
      const d = fact.detail as import("./types").AgencyDetail;
      return {
        feeType: "broker",
        label: "仲介手数料",
        mandatory: d.amountMonths === "over" ? "agent" : "unknown",
        explanation,
        evidence: "claimed_only",
        benefit: "mixed",
        salesJustification: "none",
      };
    }
    case "key_exchange": {
      const d = fact.detail as import("./types").KeyExchangeDetail;
      const evidence =
        d.exchangeConfirmed === "confirmed" ? "documented" :
        d.exchangeConfirmed === "unconfirmed" ? "claimed_only" : "none";
      return {
        feeType: "key_exchange",
        label: "鍵交換代",
        mandatory: "agent",
        explanation,
        evidence,
        benefit: "landlord",
        salesJustification: "none",
      };
    }
    case "cleaning": {
      const d = fact.detail as import("./types").CleaningDetail;
      const evidence =
        d.hasInvoice ? "documented" :
        d.hasContractBasis === "yes" ? "claimed_only" : "unknown";
      return {
        feeType: "cleaning",
        label: "清掃代",
        mandatory: d.wasExplainedAsMandatory ? "agent" : "not_explained",
        explanation,
        evidence,
        benefit: "landlord",
        salesJustification: "none",
      };
    }
    case "guarantor": {
      const d = fact.detail as import("./types").GuarantorDetail;
      return {
        feeType: "guarantee",
        label: "保証会社費用",
        mandatory: d.wasMandatory ? "owner" : "optional",
        explanation,
        evidence: "claimed_only",
        benefit: "mixed",
        salesJustification: "none",
      };
    }
    case "support_plan": {
      const d = fact.detail as import("./types").SupportPlanDetail;
      return {
        feeType: "support",
        label: d.planName || "サポートプラン",
        mandatory: d.couldRefuse ? "optional" : "agent",
        explanation: d.wasExplained ? (explanation === "none" ? "weak_oral" : explanation) : "none",
        evidence: "claimed_only",
        benefit: "mixed",
        salesJustification: "none",
      };
    }
    case "document_fee": {
      return {
        feeType: "admin",
        label: "書類作成費",
        mandatory: "agent",
        explanation,
        evidence: "claimed_only",
        benefit: "mixed",
        salesJustification: "none",
      };
    }
    case "fire_insurance": {
      return {
        feeType: "insurance",
        label: "火災保険",
        mandatory: "owner",
        explanation,
        evidence: "claimed_only",
        benefit: "tenant",
        salesJustification: "none",
      };
    }
    case "unknown": {
      const d = fact.detail as import("./types").UnknownFeeDetail;
      return {
        feeType: "disinfect",
        label: d.labelOnInvoice || "その他費用",
        mandatory: "unknown",
        explanation,
        evidence: "unknown",
        benefit: "unknown",
        salesJustification: "none",
      };
    }
    default:
      return null;
  }
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


  const feeEvaluations = input.facts
    .map((fact) => mapFactToEvalInput(fact, input.explanation))
    .filter((e): e is FeeEvalInput => e !== null)
    .map((e) => evaluateFee(e));

  const itemizedReviewBreakdown = buildItemizedReviewBreakdown(input);
  const estimatedRefundMin = 0;
  const estimatedRefundMax = itemizedReviewBreakdown
    ? itemizedReviewBreakdown.reduce((sum, item) => sum + item.reviewMax, 0)
    : 0;
  const negotiationLines = buildNegotiationLines(input, itemizedReviewBreakdown);
  const guaranteeBreakdown = computeGuaranteeBreakdown(input);

  let estimatedOutcome: DiagnosisResult["estimatedOutcome"];
  if (itemizedReviewBreakdown && itemizedReviewBreakdown.length > 0) {
    const totalReducible = itemizedReviewBreakdown.reduce((sum, item) => sum + item.reviewMax, 0);
    const reducibleMax = totalReducible;
    const reducibleMin = Math.min(reducibleMax, Math.round(reducibleMax * 0.4));
    const rent = input.monthlyRent;
    const freeRentMonths = rent && rent > 0 ? convertToFreeRent(totalReducible, rent) : undefined;
    estimatedOutcome = { reducibleMin, reducibleMax, freeRentMonths };
  }

  return {
    mode: "initial_fees",
    overallRisk,
    score,
    summary,
    issues,
    nextChecks,
    draftEmail: "", // route.ts で Anthropic API 生成後に上書き
    disclaimer: DISCLAIMER,
    estimatedRefundMin,
    estimatedRefundMax,
    itemizedReviewBreakdown,
    estimatedOutcome,
    negotiationLines,
    guaranteeBreakdown,
    feeEvaluations: feeEvaluations.length > 0 ? feeEvaluations : undefined,
  };
}
