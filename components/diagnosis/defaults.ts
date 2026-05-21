import type { FeeDetail, FeeEntry, FeeId2, ThreeLayerCheck } from "@/lib/types_v2";

export const DEFAULT_THREE_LAYER: ThreeLayerCheck = {
  voluntaryExplained: "unknown",
  ownerOrAgentExplained: "unknown",
  evidenceProvided: "unknown",
};

export function createDefaultFeeDetail(feeId: FeeId2): FeeDetail | null {
  switch (feeId) {
    case "agency_fee":
      return {
        feeId: "agency_fee",
        amountMonths: "unknown",
        principleExplained: "unknown",
        writtenConsentRequested: "unknown",
        landlordFeeExplained: "unknown",
        isRenewal: false,
        newBrokerageActExists: null,
      };
    case "key_exchange":
      return {
        feeId: "key_exchange",
        receivedDate: null,
        executedDate: null,
        hasEvidenceDocument: "unknown",
        requestedBeforeJuusetsu: "unknown",
      };
    case "cleaning":
      return {
        feeId: "cleaning",
        timingExplained: "unknown",
        amountBasisExplained: "unknown",
        vendorInfoProvided: "unknown",
      };
    case "disinfection":
    case "support_24h":
    case "admin_fee":
      return {
        feeId,
        deniedIfRefused: "unknown",
      };
    case "guarantor":
      return {
        feeId: "guarantor",
        mandatoryExplained: "unknown",
        companyChoiceExplained: "unknown",
        amountBasisExplained: "unknown",
        renewalFeeExplained: "unknown",
        groupCompanyExplained: "unknown",
      };
    case "fire_insurance":
      return {
        feeId: "fire_insurance",
        mandatoryExplained: "unknown",
        otherPlanChoiceExplained: "unknown",
        amountBasisExplained: "unknown",
        agentRelationshipExplained: "unknown",
      };
    case "unknown_label":
    case "label_mismatch":
    case "entity_mismatch":
      return {
        feeId,
        mismatchType: [],
        mismatchExplained: "unknown",
      };
    case "special_clause":
      return {
        feeId: "special_clause",
        clauseReadAloud: "unknown",
        disadvantageExplained: "unknown",
        sourceExplained: "unknown",
        refusalConsequenceExplained: "unknown",
      };
    case "key_money":
      return {
        feeId: "key_money",
        sourceExplained: "unknown",
        negotiationAttempt: null,
      };
    default:
      return null;
  }
}

export function createDefaultFeeEntry(feeId: FeeId2): FeeEntry {
  return {
    feeId,
    amount: null,
    threeLayer: { ...DEFAULT_THREE_LAYER },
    detail: createDefaultFeeDetail(feeId),
  };
}
