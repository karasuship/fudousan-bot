import type { Phase1Answers, FeeId } from "@/lib/types";

const FEE_ID_MAP: Partial<Record<FeeId, string>> = {
  cleaning:  "cleaning",
  support24: "support_24h",
  key:       "key_exchange",
  adminFee:  "admin_fee",
  guarantee: "guarantor",
  insurance: "fire_insurance",
  brokerage: "agency",
  keyMoney:  "key_money",
  other:     "other",
};

export interface Phase1ApiExtras {
  voluntaryExplainedFees: string[];
  paymentBeforeJuusetsu: boolean;
}

export function adaptPhase1ToApiExtras(answers: Phase1Answers): Phase1ApiExtras {
  const voluntaryExplainedFees: string[] = [];
  if (answers.voluntaryExplained === "yes") {
    for (const feeId of answers.selectedFees) {
      const apiId = FEE_ID_MAP[feeId];
      if (apiId) voluntaryExplainedFees.push(apiId);
    }
  }

  const paymentBeforeJuusetsu =
    answers.hasPaid &&
    (answers.documentedIn === "estimate_only" || answers.documentedIn === "nowhere");

  return { voluntaryExplainedFees, paymentBeforeJuusetsu };
}
