import { describe, it, expect } from "vitest";
import { diagnoseV2, detectTimelineIssues } from "../diagnose_v2";
import type {
  DiagnosisInput2,
  FeeEntry,
  ThreeLayerCheck,
  TimelineEntry,
} from "../types_v2";

// ─── 共通ヘルパー ──────────────────────────────────────────────────────────────

const defaultThreeLayer: ThreeLayerCheck = {
  voluntaryExplained: "unknown",
  ownerOrAgentExplained: "unknown",
  evidenceProvided: "unknown",
};

function baseInput(overrides: Partial<DiagnosisInput2> = {}): DiagnosisInput2 {
  return {
    timing: "pre_contract",
    stage: "pre_sign",
    monthlyRent: null,
    totalAmount: null,
    fees: [],
    timeline: [],
    agentResponse: null,
    emailTone: "polite",
    ...overrides,
  };
}

// ─── ケース1：重説前支払いの検出 ──────────────────────────────────────────────

describe("ケース1：重説前支払いの検出", () => {
  it("fee_payment が juusetsu より前の場合、payment_before_juusetsu が high で検出される", () => {
    const timeline: TimelineEntry[] = [
      { event: "fee_payment", date: "2025-03-01", certainty: "certain" },
      { event: "juusetsu",    date: "2025-03-10", certainty: "certain" },
    ];

    const issues = detectTimelineIssues(timeline);

    const target = issues.find((i) => i.id === "payment_before_juusetsu");
    expect(target).toBeDefined();
    expect(target?.severity).toBe("high");
  });

  it("fee_payment が juusetsu と同日の場合、payment_before_juusetsu は検出されない", () => {
    const timeline: TimelineEntry[] = [
      { event: "fee_payment", date: "2025-03-10", certainty: "certain" },
      { event: "juusetsu",    date: "2025-03-10", certainty: "certain" },
    ];

    const issues = detectTimelineIssues(timeline);
    expect(issues.find((i) => i.id === "payment_before_juusetsu")).toBeUndefined();
  });
});

// ─── ケース2：仲介手数料の原則説明なし ────────────────────────────────────────

describe("ケース2：仲介手数料の原則説明なし", () => {
  it("principleExplained:no + amountMonths:one → agency_fee_principle_not_explained が free_rent で検出される", () => {
    const fee: FeeEntry = {
      feeId: "agency_fee",
      amount: 100000,
      threeLayer: defaultThreeLayer,
      detail: {
        feeId: "agency_fee",
        amountMonths: "one",
        principleExplained: "no",
        writtenConsentRequested: "unknown",
        landlordFeeExplained: "unknown",
        isRenewal: false,
        newBrokerageActExists: null,
      },
    };

    const result = diagnoseV2(baseInput({ fees: [fee] }));

    const target = result.issues.find((i) => i.id === "agency_fee_principle_not_explained");
    expect(target).toBeDefined();
    expect(target?.strategy).toBe("free_rent");
  });
});

// ─── ケース3：鍵交換代の実施証明なし ──────────────────────────────────────────

describe("ケース3：鍵交換代の実施証明なし", () => {
  it("hasEvidenceDocument:no → key_exchange_no_evidence が high で検出される", () => {
    const fee: FeeEntry = {
      feeId: "key_exchange",
      amount: 20000,
      threeLayer: defaultThreeLayer,
      detail: {
        feeId: "key_exchange",
        receivedDate: null,
        executedDate: null,
        hasEvidenceDocument: "no",
        requestedBeforeJuusetsu: "unknown",
      },
    };

    const result = diagnoseV2(baseInput({ fees: [fee] }));

    const target = result.issues.find((i) => i.id === "key_exchange_no_evidence");
    expect(target).toBeDefined();
    expect(target?.severity).toBe("high");
  });
});

// ─── ケース4：任意費用の強制（消毒代） ────────────────────────────────────────
// コード上のissue idは disinfection_bundled（optional_denied_if_refused ではない）

describe("ケース4：任意費用の強制（消毒代）", () => {
  it("deniedIfRefused:yes → disinfection_bundled が delete strategy で検出される", () => {
    const fee: FeeEntry = {
      feeId: "disinfection",
      amount: 15000,
      threeLayer: defaultThreeLayer,
      detail: {
        feeId: "disinfection",
        deniedIfRefused: "yes",
      },
    };

    const result = diagnoseV2(baseInput({ fees: [fee] }));

    const target = result.issues.find((i) => i.id === "disinfection_bundled");
    expect(target).toBeDefined();
    expect(target?.strategy).toBe("delete");
  });
});

// ─── ケース5：保証会社のグループ会社未開示 ────────────────────────────────────

describe("ケース5：保証会社のグループ会社未開示", () => {
  it("groupCompanyExplained:unknown → guarantor_group_company_unexplained が high で検出される", () => {
    const fee: FeeEntry = {
      feeId: "guarantor",
      amount: 30000,
      threeLayer: defaultThreeLayer,
      detail: {
        feeId: "guarantor",
        mandatoryExplained: "unknown",
        companyChoiceExplained: "yes",
        amountBasisExplained: "unknown",
        renewalFeeExplained: "unknown",
        groupCompanyExplained: "unknown",
      },
    };

    const result = diagnoseV2(baseInput({ fees: [fee] }));

    const target = result.issues.find((i) => i.id === "guarantor_group_company_unexplained");
    expect(target).toBeDefined();
    expect(target?.severity).toBe("high");
  });
});

// ─── ケース6：複数費目選択時の複合論点 ────────────────────────────────────────

describe("ケース6：複数費目・複合論点", () => {
  it("仲介手数料（原則説明なし）と鍵交換代（証明なし）を同時選択 → 両issue + compoundCount >= 2", () => {
    const agencyFee: FeeEntry = {
      feeId: "agency_fee",
      amount: 100000,
      threeLayer: defaultThreeLayer,
      detail: {
        feeId: "agency_fee",
        amountMonths: "one",
        principleExplained: "no",
        writtenConsentRequested: "unknown",
        landlordFeeExplained: "unknown",
        isRenewal: false,
        newBrokerageActExists: null,
      },
    };

    const keyExchangeFee: FeeEntry = {
      feeId: "key_exchange",
      amount: 20000,
      threeLayer: defaultThreeLayer,
      detail: {
        feeId: "key_exchange",
        receivedDate: null,
        executedDate: null,
        hasEvidenceDocument: "no",
        requestedBeforeJuusetsu: "unknown",
      },
    };

    const result = diagnoseV2(baseInput({ fees: [agencyFee, keyExchangeFee] }));

    expect(result.issues.find((i) => i.id === "agency_fee_principle_not_explained")).toBeDefined();
    expect(result.issues.find((i) => i.id === "key_exchange_no_evidence")).toBeDefined();
    expect(result.compoundCount).toBeGreaterThanOrEqual(2);
  });
});

// ─── ケース7：DiagnosisResult2のpayload完全性 ─────────────────────────────────

describe("ケース7：DiagnosisResult2 のpayload完全性", () => {
  it("diagnoseV2の戻り値に timing・stage・issues・feeStrategies が含まれる", () => {
    const fee: FeeEntry = {
      feeId: "disinfection",
      amount: 15000,
      threeLayer: defaultThreeLayer,
      detail: {
        feeId: "disinfection",
        deniedIfRefused: "yes",
      },
    };

    const input = baseInput({
      timing: "post_contract",
      stage: "post_payment",
      fees: [fee],
      emailTone: "firm",
    });

    const result = diagnoseV2(input);

    expect(result.timing).toBe("post_contract");
    expect(result.stage).toBe("post_payment");
    expect(Array.isArray(result.issues)).toBe(true);
    expect(Array.isArray(result.feeStrategies)).toBe(true);
    expect(result.feeStrategies.length).toBe(1);
    expect(result.feeStrategies[0].feeId).toBe("disinfection");
  });
});
