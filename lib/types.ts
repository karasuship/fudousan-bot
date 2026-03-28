export type ContractType = "ordinary" | "fixed_term" | "unknown";
export type Phase = "move_in" | "renewal" | "recontracting" | "move_out" | "other";
export type FeeType =
  | "renewal_fee"
  | "recontracting_fee"
  | "agency_fee"
  | "key_exchange"
  | "cleaning"
  | "guarantor"
  | "other";
export type EmailTone = "polite" | "firm" | "factual";
export type RiskLevel = "safe" | "review" | "caution";

export type DiagnosisMode =
  | "initial_fees"
  | "contract_review"
  | "renewal"
  | "maintenance"
  | "move_out"
  | "deposit_refund";

// ─── 既存の入力型（後方互換維持）────────────────────────────────────────
export interface DiagnosisInput {
  contractType: ContractType;
  phase: Phase;
  fees: FeeType[];
  amount?: number;
  contractMention: "yes" | "unknown";
  explanation: "yes" | "insufficient" | "no";
  consentStructure: "yes" | "unknown";
  managementIssues: boolean;
  freeText?: string;
  emailTone: EmailTone;
}

// ─── モード別入力型 ──────────────────────────────────────────────────────

export interface ContractReviewInput {
  mode: "contract_review";
  contractType: ContractType;
  hasRenewalClause: boolean;
  hasSpecialClauses: boolean;
  hasPenaltyClauses: boolean;
  hasCheckbox: boolean;
  hasOralExplanation: boolean;
  emailTone: EmailTone;
  freeText?: string;
}

export interface MaintenanceInput {
  mode: "maintenance";
  issueType: string;
  issueDuration: string;
  lifeImpact: string;
  alreadyContacted: boolean;
  hasEvidence: boolean;
  isUrgent: boolean;
  emailTone: EmailTone;
  freeText?: string;
}

export interface MoveOutInput {
  mode: "move_out";
  fees: FeeType[];
  amount?: number;
  hasOwnerFault: boolean;
  isNormalWear: boolean;
  hasContractSpecialClause: boolean;
  hasEntryPhotos: boolean;
  hasInspection: boolean;
  hasDetailedQuote: boolean;
  contractMention: "yes" | "unknown";
  emailTone: EmailTone;
  freeText?: string;
}

export interface DepositRefundInput {
  mode: "deposit_refund";
  depositAmount?: number;
  expectedRefund?: number;
  deductionItems: string[];
  hasDetailedStatement: boolean;
  hasReturnSchedule: boolean;
  emailTone: EmailTone;
  freeText?: string;
}

// ─── 診断結果型 ──────────────────────────────────────────────────────────

export interface RefundBreakdownItem {
  feeType: string;
  label: string;
  min: number;
  max: number;
}

export interface DiagnosisResult {
  mode?: DiagnosisMode;
  overallRisk: RiskLevel;
  score: number;
  summary: string;
  issues: string[];
  nextChecks: string[];
  draftEmail: string;
  disclaimer: string;
  estimatedRefundMin: number;
  estimatedRefundMax: number;
  estimatedBreakdown: RefundBreakdownItem[];
}

export interface RiskFactor {
  id: string;
  label: string;
  issue: string;
  score: number;
  checks: string[];
  applies: (input: DiagnosisInput) => boolean;
}
