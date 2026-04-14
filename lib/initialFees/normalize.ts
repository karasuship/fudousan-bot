// ── InitialFeesInput → InitialFeesCanonical 変換 ─────────────────────────
// フォーム送信 body（InitialFeesInput）を canonical 表現に正規化する。
// このファイルはロジックのみを含み、型定義は types.ts から import する。

import type { InitialFeesInput } from "@/lib/types";
import type {
  InitialFeesCanonical,
  CanonicalFeeItem,
  CanonicalAmounts,
  MarketContext,
} from "./types";

// ── ヘルパー：文字列 or 数値 → number | undefined ────────────────────────
function toNum(v: number | string | undefined | null): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isNaN(n) ? undefined : n;
}

// ── facts 配列 → CanonicalFeeItem[] ──────────────────────────────────────
function normalizeFees(facts: InitialFeesInput["facts"]): CanonicalFeeItem[] {
  return facts.map((fact): CanonicalFeeItem => ({
    id: fact.realityCategory,
    label: fact.perceivedLabel,
    amount: toNum(fact.amount),
    detail: fact.detail,
  }));
}

// ── feeAmounts + guarantor 系 + 基本金額 → CanonicalAmounts ───────────────
function normalizeAmounts(input: InitialFeesInput): CanonicalAmounts {
  const fa = input.feeAmounts ?? {};
  return {
    rent:         toNum(input.monthlyRent),
    deposit:      toNum(input.depositAmount),
    keyMoney:     toNum(input.keyMoneyAmount),
    brokerFee:    toNum(fa.agency_fee),
    guaranteeBase: toNum(input.guaranteeBaseFee),
    guaranteeAdmin: toNum(input.guaranteeAdminFee),
    cleaningFee:  toNum(fa.cleaning),
    lockFee:      toNum(fa.key_exchange),
    support24Fee: toNum(fa.support_24h),
    disinfectFee: toNum(fa.disinfection),
    adminFee:     toNum(fa.admin_fee),
    otherFees:    toNum(fa.other),
  };
}

// ── marketContext のデフォルト値補完 ────────────────────────────────────
const DEFAULT_MARKET_CONTEXT: MarketContext = {
  region: "metro",
  season: "peak",
  buildingAge: "old",
  areaType: null,
};

function normalizeMarketContext(
  ctx: InitialFeesInput["marketContext"]
): MarketContext {
  if (!ctx) return { ...DEFAULT_MARKET_CONTEXT };
  return {
    region:     ctx.region,
    season:     ctx.season,
    buildingAge: ctx.buildingAge,
    areaType:   ctx.areaType,
  };
}

// ── メイン変換関数 ────────────────────────────────────────────────────────
export function normalize(input: InitialFeesInput): InitialFeesCanonical {
  return {
    situation:    input.situation,
    emailTone:    input.emailTone,
    explanation:  input.explanation,
    couldRefuse:  input.couldRefuse,
    hasDocuments: input.hasDocuments,
    fees:         normalizeFees(input.facts),
    amounts:      normalizeAmounts(input),
    marketContext: normalizeMarketContext(input.marketContext),
    freeText:     input.freeText,
  };
}
