// ── 初期費用モード canonical 入力型 ─────────────────────────────────────────
// InitialFeesInput（フォーム送信 body）を正規化した後の内部表現。
// このファイルは読み取り専用の型定義のみを含み、ロジックは持たない。

import type { EmailTone, FactDetail } from "@/lib/types";

// ── 費目の canonical 表現 ─────────────────────────────────────────────────
export interface CanonicalFeeItem {
  /** realityCategory をそのまま id として使う */
  id: string;
  /** perceivedLabel をそのまま label として使う */
  label: string;
  amount?: number;
  detail: FactDetail;
}

// ── 金額の canonical 表現 ─────────────────────────────────────────────────
// feeAmounts・guarantor 系・monthlyRent などを一か所に集約する。
export interface CanonicalAmounts {
  rent?: number;
  deposit?: number;
  keyMoney?: number;
  brokerFee?: number;
  guaranteeBase?: number;
  guaranteeAdmin?: number;
  cleaningFee?: number;
  lockFee?: number;
  support24Fee?: number;
  disinfectFee?: number;
  adminFee?: number;
  otherFees?: number;
}

// ── 市場コンテキスト ──────────────────────────────────────────────────────
// InitialFeesInput["marketContext"] と同一構造。
export interface MarketContext {
  region: "metro" | "local";
  season: "peak" | "off";
  buildingAge: "new" | "young" | "old";
  areaType?: "urban" | "local" | null;
}

// ── canonical 型本体 ──────────────────────────────────────────────────────
export interface InitialFeesCanonical {
  situation: "pre_estimate" | "pre_sign" | "pre_payment" | "paid";
  emailTone: EmailTone;
  explanation: "written" | "oral" | "none" | "pressured" | "rushed";
  couldRefuse: "yes" | "no" | "refused_and_pressured" | "told_no_contract" | "unknown";
  hasDocuments: "yes" | "no" | "unknown";
  fees: CanonicalFeeItem[];
  amounts: CanonicalAmounts;
  marketContext: MarketContext;
  freeText?: string;
}
