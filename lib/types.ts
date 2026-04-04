export type EmailTone = "polite" | "firm" | "factual";
export type RiskLevel = "safe" | "review" | "caution";
export type DiagnosisMode =
  | "initial_fees"
  | "contract_review"
  | "renewal"
  | "maintenance"
  | "move_out"
  | "deposit_refund";

export interface InitialFeesInput {
  mode: "initial_fees";
  situation: "pre_estimate" | "pre_sign" | "pre_payment" | "paid";
  emailTone: EmailTone;
  freeText?: string;
  explanation: "written" | "oral" | "none" | "pressured" | "rushed";
  couldRefuse: "yes" | "no" | "refused_and_pressured" | "told_no_contract" | "unknown";
  hasDocuments: "yes" | "no" | "unknown";
  facts: FactItem[];
}

export interface FactItem {
  perceivedLabel: string;
  realityCategory:
    | "key_exchange"
    | "cleaning"
    | "agency"
    | "guarantor"
    | "support_plan"
    | "document_fee"
    | "fire_insurance"
    | "renewal"
    | "ad_fee"
    | "unknown";
  amount?: number;
  detail: FactDetail;
}

export type FactDetail =
  | KeyExchangeDetail
  | CleaningDetail
  | AgencyDetail
  | GuarantorDetail
  | SupportPlanDetail
  | DocumentFeeDetail
  | RenewalDetail
  | UnknownFeeDetail;

export interface KeyExchangeDetail {
  type: "key_exchange";
  exchangeConfirmed: "confirmed" | "unconfirmed" | "not_done";
  isNewBuilding: boolean;
  hasReceipt: boolean;
}

export interface CleaningDetail {
  type: "cleaning";
  wasExplainedAsMandatory: boolean;
  hasContractBasis: "yes" | "no" | "unknown";
  hasInvoice: boolean;
  includesDisinfection: boolean;
}

export interface AgencyDetail {
  type: "agency";
  amountMonths: "half" | "one" | "over" | "unknown";
  hasWrittenConsent: boolean;
  bothSidesCharged: "yes" | "no" | "unknown";
}

export interface GuarantorDetail {
  type: "guarantor";
  wasMandatory: boolean;
  hadChoiceOfCompany: boolean;
  hasRenewalFee: boolean;
}

export interface SupportPlanDetail {
  type: "support_plan";
  planName: string;
  wasExplained: boolean;
  couldRefuse: boolean;
}

export interface DocumentFeeDetail {
  type: "document_fee";
  labelOnInvoice: string;
  hasExplanation: boolean;
}

export interface RenewalDetail {
  type: "renewal";
  contractType: "ordinary" | "fixed_term" | "unknown";
  hasContractBasis: "yes" | "no" | "unknown";
  amountBasis: string;
}

export interface UnknownFeeDetail {
  type: "unknown";
  labelOnInvoice: string;
}

export interface ContractReviewInput {
  mode: "contract_review";
  contractType: "ordinary" | "fixed_term" | "unknown";
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
  facts: MoveOutFact[];
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

export interface MoveOutFact {
  realityCategory: "cleaning" | "key_exchange" | "repair" | "unknown";
  amount?: number;
  labelOnInvoice: string;
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

export interface DetectedIssue {
  id: string;
  category: string;
  title: string;
  rule: string;
  explanation: string;
  checkPoints: string[];
  nextAction: string[];
  severity: "high" | "medium" | "low";
}

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
  issues: DetectedIssue[];
  nextChecks: string[];
  draftEmail: string;
  disclaimer: string;
  estimatedRefundMin: number;
  estimatedRefundMax: number;
  estimatedBreakdown?: RefundBreakdownItem[];
}

export interface RiskFactor {
  id: string;
  label: string;
  issue: string;
  score: number;
  checks: string[];
  applies: (input: any) => boolean;
}

// ─── 後方互換型（DiagnosisForm.tsx 等で使用）────────────────────────────
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
