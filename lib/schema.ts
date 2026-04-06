import { z } from "zod";

const EMAIL_TONE = z.enum(["polite", "firm", "factual"]);
const FREE_TEXT = z.string().max(1000).optional();

const keyExchangeDetailSchema = z.object({
  type: z.literal("key_exchange"),
  exchangeConfirmed: z.enum(["confirmed", "unconfirmed", "not_done"]),
  isNewBuilding: z.boolean(),
  hasReceipt: z.boolean(),
});

const cleaningDetailSchema = z.object({
  type: z.literal("cleaning"),
  wasExplainedAsMandatory: z.boolean(),
  hasContractBasis: z.enum(["yes", "no", "unknown"]),
  hasInvoice: z.boolean(),
  includesDisinfection: z.boolean(),
});

const agencyDetailSchema = z.object({
  type: z.literal("agency"),
  amountMonths: z.enum(["half", "one", "over", "unknown"]),
  hasWrittenConsent: z.boolean(),
  bothSidesCharged: z.enum(["yes", "no", "unknown"]),
});

const guarantorDetailSchema = z.object({
  type: z.literal("guarantor"),
  wasMandatory: z.boolean(),
  hadChoiceOfCompany: z.boolean(),
  hasRenewalFee: z.boolean(),
});

const supportPlanDetailSchema = z.object({
  type: z.literal("support_plan"),
  planName: z.string(),
  wasExplained: z.boolean(),
  couldRefuse: z.boolean(),
});

const documentFeeDetailSchema = z.object({
  type: z.literal("document_fee"),
  labelOnInvoice: z.string(),
  hasExplanation: z.boolean(),
});

const renewalDetailSchema = z.object({
  type: z.literal("renewal"),
  contractType: z.enum(["ordinary", "fixed_term", "unknown"]),
  hasContractBasis: z.enum(["yes", "no", "unknown"]),
  amountBasis: z.string(),
});

const unknownFeeDetailSchema = z.object({
  type: z.literal("unknown"),
  labelOnInvoice: z.string(),
});

const factDetailSchema = z.discriminatedUnion("type", [
  keyExchangeDetailSchema,
  cleaningDetailSchema,
  agencyDetailSchema,
  guarantorDetailSchema,
  supportPlanDetailSchema,
  documentFeeDetailSchema,
  renewalDetailSchema,
  unknownFeeDetailSchema,
]);

const factItemSchema = z.object({
  perceivedLabel: z.string(),
  realityCategory: z.enum([
    "key_exchange",
    "cleaning",
    "agency",
    "guarantor",
    "support_plan",
    "document_fee",
    "fire_insurance",
    "renewal",
    "ad_fee",
    "unknown",
  ]),
  amount: z.number().positive().optional(),
  detail: factDetailSchema,
});

export const initialFeesSchema = z.object({
  mode: z.literal("initial_fees"),
  situation: z.enum(["pre_estimate", "pre_sign", "pre_payment", "paid"]),
  emailTone: EMAIL_TONE,
  freeText: FREE_TEXT,
  explanation: z.enum(["written", "oral", "none", "pressured", "rushed"]),
  couldRefuse: z.enum(["yes", "no", "refused_and_pressured", "told_no_contract", "unknown"]),
  hasDocuments: z.enum(["yes", "no", "unknown"]),
  facts: z.array(factItemSchema).min(1, "費用を1つ以上入力してください"),
  claimedTotalAmount: z.number().positive().optional(),
  monthlyRent: z.number().positive().optional(),
  depositAmount: z.number().nonnegative().optional(),
  keyMoneyAmount: z.number().nonnegative().optional(),
  guarantorStatus: z.enum(["has", "none", "unknown"]).optional(),
  guaranteeBaseFee: z.number().positive().optional(),
  guaranteeAdminFee: z.number().positive().optional(),
  feeAmounts: z.object({
    agency_fee: z.number().positive().optional(),
    key_exchange: z.number().positive().optional(),
    cleaning: z.number().positive().optional(),
    guarantor: z.number().positive().optional(),
    disinfection: z.number().positive().optional(),
    support_24h: z.number().positive().optional(),
    admin_fee: z.number().positive().optional(),
    other: z.number().positive().optional(),
  }).optional(),
  marketContext: z.object({
    region: z.enum(["metro", "local"]),
    season: z.enum(["peak", "off"]),
    buildingAge: z.enum(["new", "young", "old"]),
    areaType: z.enum(["urban", "local"]).nullable().optional(),
  }).optional(),
});

export const renewalSchema = z.object({
  mode: z.literal("renewal"),
  situation: z.enum(["pre_estimate", "pre_sign", "pre_payment", "paid"]),
  emailTone: EMAIL_TONE,
  freeText: FREE_TEXT,
  explanation: z.enum(["written", "oral", "none", "pressured", "rushed"]),
  couldRefuse: z.enum(["yes", "no", "refused_and_pressured", "told_no_contract", "unknown"]),
  hasDocuments: z.enum(["yes", "no", "unknown"]),
  facts: z.array(factItemSchema).min(1, "費用を1つ以上入力してください"),
});

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
  issueType: z.string().min(1),
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
  facts: z.array(z.object({
    realityCategory: z.enum(["cleaning", "key_exchange", "repair", "unknown"]),
    amount: z.number().positive().optional(),
    labelOnInvoice: z.string(),
  })).min(1),
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

export const diagnosisSchema = z.discriminatedUnion("mode", [
  initialFeesSchema,
  renewalSchema,
  contractReviewSchema,
  maintenanceSchema,
  moveOutSchema,
  depositRefundSchema,
]);
