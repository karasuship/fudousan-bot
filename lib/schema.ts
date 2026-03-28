import { z } from "zod";

const FEE_ENUM = z.enum([
  "renewal_fee",
  "recontracting_fee",
  "agency_fee",
  "key_exchange",
  "cleaning",
  "guarantor",
  "other",
]);

const EMAIL_TONE = z.enum(["polite", "firm", "factual"]);
const FREE_TEXT = z.string().max(1000).optional();

// ─── 既存スキーマ（後方互換維持）────────────────────────────────────────
export const diagnosisInputSchema = z.object({
  contractType: z.enum(["ordinary", "fixed_term", "unknown"]),
  phase: z.enum(["move_in", "renewal", "recontracting", "move_out", "other"]),
  fees: z.array(FEE_ENUM).min(1, "費用を1つ以上選択してください"),
  amount: z.number().positive().optional(),
  contractMention: z.enum(["yes", "unknown"]),
  explanation: z.enum(["yes", "insufficient", "no"]),
  consentStructure: z.enum(["yes", "unknown"]),
  managementIssues: z.boolean(),
  freeText: FREE_TEXT,
  emailTone: EMAIL_TONE,
});

export type DiagnosisInputSchema = z.infer<typeof diagnosisInputSchema>;

// ─── モード別スキーマ ────────────────────────────────────────────────────

export const contractReviewSchema = z.object({
  mode: z.literal("contract_review"),
  contractType: z.enum(["ordinary", "fixed_term", "unknown"]),
  hasRenewalClause: z.boolean(),
  hasSpecialClauses: z.boolean(),
  hasPenaltyClauses: z.boolean(),
  hasCheckbox: z.boolean(),
  hasOralExplanation: z.boolean(),
  emailTone: EMAIL_TONE,
  freeText: FREE_TEXT,
});

export const maintenanceSchema = z.object({
  mode: z.literal("maintenance"),
  issueType: z.string().min(1, "不具合の種類を選択してください"),
  issueDuration: z.string().min(1),
  lifeImpact: z.string().min(1),
  alreadyContacted: z.boolean(),
  hasEvidence: z.boolean(),
  isUrgent: z.boolean(),
  emailTone: EMAIL_TONE,
  freeText: FREE_TEXT,
});

export const moveOutSchema = z.object({
  mode: z.literal("move_out"),
  fees: z.array(FEE_ENUM).min(1, "費用を1つ以上選択してください"),
  amount: z.number().positive().optional(),
  hasOwnerFault: z.boolean(),
  isNormalWear: z.boolean(),
  hasContractSpecialClause: z.boolean(),
  hasEntryPhotos: z.boolean(),
  hasInspection: z.boolean(),
  hasDetailedQuote: z.boolean(),
  contractMention: z.enum(["yes", "unknown"]),
  emailTone: EMAIL_TONE,
  freeText: FREE_TEXT,
});

export const depositRefundSchema = z.object({
  mode: z.literal("deposit_refund"),
  depositAmount: z.number().positive().optional(),
  expectedRefund: z.number().nonnegative().optional(),
  deductionItems: z.array(z.string()),
  hasDetailedStatement: z.boolean(),
  hasReturnSchedule: z.boolean(),
  emailTone: EMAIL_TONE,
  freeText: FREE_TEXT,
});
