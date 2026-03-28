import type { DiagnosisInput, DiagnosisResult, RefundBreakdownItem, RiskFactor, RiskLevel } from "./types";
import { generateDraftEmail } from "./draftEmail";

const DISCLAIMER =
  "本診断結果は一般的な情報提供を目的としており、法的助言ではありません。個別の契約内容・状況によって判断は異なります。重要な判断をされる場合は、弁護士・司法書士等の専門家にご相談ください。";

const RISK_RULES: RiskFactor[] = [
  {
    id: "no_contract_mention",
    label: "契約書への記載が確認できていない",
    issue:
      "請求されている費用について、契約書への記載が確認できていません。費用請求には契約上の根拠が必要な可能性があります。",
    score: 20,
    checks: [
      "契約書（賃貸借契約書・重要事項説明書）に当該費用の記載があるか確認する",
      "記載がない場合、費用の根拠を書面で確認する",
    ],
    applies: (input) => input.contractMention === "unknown" && input.fees.length > 0,
  },
  {
    id: "no_explanation",
    label: "費用について説明を受けていない",
    issue:
      "費用についての説明を受けていない可能性があります。説明なく費用を請求された場合、その根拠の確認が重要です。",
    score: 25,
    checks: [
      "費用の名目・金額・根拠について書面での説明を求める",
      "いつ・どのような形で費用が発生するか確認する",
    ],
    applies: (input) => input.explanation === "no",
  },
  {
    id: "insufficient_explanation",
    label: "費用の説明が不十分な可能性がある",
    issue:
      "費用について十分な説明を受けていない可能性があります。費用の根拠・算出方法の確認をお勧めします。",
    score: 15,
    checks: [
      "費用の算出根拠・計算方法について確認する",
      "説明内容を書面で提供してもらう",
    ],
    applies: (input) => input.explanation === "insufficient",
  },
  {
    id: "unclear_consent",
    label: "同意の経緯が不明確",
    issue:
      "費用への同意がどのような形でなされたか不明な状況です。同意の根拠・時期の確認が重要です。",
    score: 15,
    checks: [
      "費用への同意がいつ・どのような書面でなされたか確認する",
      "署名した書類の内容を改めて確認する",
    ],
    applies: (input) => input.consentStructure === "unknown",
  },
  {
    id: "management_issues",
    label: "管理上の問題が報告されている",
    issue:
      "管理上の不備（害虫等）が存在する場合、貸主側の管理義務との関係で費用負担の妥当性を確認する余地がある可能性があります。",
    score: 15,
    checks: [
      "管理上の問題について、過去にどのような対応を求めたか記録を確認する",
      "管理会社・貸主への問題報告の経緯を整理する",
      "管理義務と費用負担の関係について確認する",
    ],
    applies: (input) => input.managementIssues,
  },
  {
    id: "renewal_fee_fixed_term",
    label: "定期借家契約での更新料請求の可能性",
    issue:
      "定期借家契約では「更新」という概念がなく（再契約という形になります）、更新料の根拠の確認が特に重要です。",
    score: 20,
    checks: [
      "契約種別（定期借家か普通借家か）を契約書で確認する",
      "更新料の根拠条項が契約書に明記されているか確認する",
      "更新なのか再契約なのかを明確にする",
    ],
    applies: (input) =>
      input.contractType === "fixed_term" && input.fees.includes("renewal_fee"),
  },
  {
    id: "recontracting_fee_no_basis",
    label: "再契約料の根拠確認が必要",
    issue:
      "再契約料は法律上必須の費用ではなく、契約書への記載と説明の有無が重要な確認事項です。",
    score: 10,
    checks: [
      "再契約料の根拠が契約書に記載されているか確認する",
      "再契約料の金額・算出方法を確認する",
    ],
    applies: (input) =>
      input.fees.includes("recontracting_fee") && input.explanation !== "yes",
  },
  {
    id: "key_exchange_fee",
    label: "鍵交換代の根拠確認",
    issue:
      "鍵交換代については、誰の責任で・誰が費用負担するかについて、契約書の記載と実際の対応の確認が重要です。",
    score: 8,
    checks: [
      "鍵交換の実施有無・時期を確認する",
      "鍵交換代の負担者が契約書に明記されているか確認する",
    ],
    applies: (input) => input.fees.includes("key_exchange"),
  },
  {
    id: "cleaning_fee",
    label: "清掃代（入居時クリーニング代）の確認",
    issue:
      "入居時クリーニング代については、契約書への記載と入居時の説明の有無が確認ポイントです。",
    score: 8,
    checks: [
      "クリーニング代が契約書・重要事項説明書に明記されているか確認する",
      "クリーニングの範囲・金額の根拠を確認する",
    ],
    applies: (input) => input.fees.includes("cleaning"),
  },
  {
    id: "agency_fee",
    label: "仲介手数料の上限確認",
    issue:
      "仲介手数料には宅建業法上の上限規定がある可能性があります。金額の根拠確認をお勧めします。",
    score: 8,
    checks: [
      "仲介手数料の金額・算出根拠を確認する",
      "重要事項説明書に記載があるか確認する",
    ],
    applies: (input) => input.fees.includes("agency_fee"),
  },
  {
    id: "guarantor_fee",
    label: "保証会社費用の内容確認",
    issue:
      "保証会社費用については、加入義務の有無・費用内訳・更新時の費用発生根拠を確認することが重要です。",
    score: 5,
    checks: [
      "保証会社への加入が契約の条件になっているか確認する",
      "保証会社費用の内訳・更新料の有無を確認する",
    ],
    applies: (input) => input.fees.includes("guarantor"),
  },
  {
    id: "unclear_fee_name",
    label: "名目が不明確な費用が含まれている可能性",
    issue:
      "費用の名目が明確でない項目が含まれている可能性があります。費用の名目と根拠を個別に確認することをお勧めします。",
    score: 12,
    checks: [
      "請求書・明細書で各費用の名目と金額を個別に確認する",
      "名目が不明な費用については根拠の説明を求める",
    ],
    applies: (input) => input.fees.includes("other"),
  },
];

function computeScore(appliedRules: RiskFactor[]): number {
  const total = appliedRules.reduce((sum, r) => sum + r.score, 0);
  return Math.min(total, 100);
}

function computeRisk(score: number): RiskLevel {
  if (score <= 25) return "safe";
  if (score <= 55) return "review";
  return "caution";
}

function buildSummary(risk: RiskLevel, appliedRules: RiskFactor[], input: DiagnosisInput): string {
  const feeCount = input.fees.length;
  const feeLabel = feeCount > 0 ? `${feeCount}種類の費用` : "費用";

  if (risk === "safe") {
    return `入力内容を確認した結果、${feeLabel}について特段の懸念点は見当たりませんでした。念のため契約書の記載内容を確認しておくと安心です。`;
  }
  if (risk === "review") {
    const labels = appliedRules.map((r) => r.label).join("、");
    return `入力内容を確認した結果、${feeLabel}について「${labels}」などの確認事項が見つかりました。契約書と説明内容を照合することをお勧めします。`;
  }
  // caution
  const topIssues = appliedRules
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((r) => r.label)
    .join("、");
  return `入力内容を確認した結果、${feeLabel}について「${topIssues}」など重要な確認事項が複数見つかりました。費用の根拠を確認し、必要に応じて専門家への相談もご検討ください。`;
}

// ---------------------------------------------------------------------------
// 返還可能額の目安ロジック（保守的な仮置き値）
// ---------------------------------------------------------------------------

/** リスク強度に応じたmax側の補正係数（1.0〜1.5） */
function refundRiskMultiplier(input: DiagnosisInput): number {
  let mult = 1.0;
  if (input.contractMention === "unknown") mult += 0.15;
  if (input.explanation === "no") mult += 0.2;
  else if (input.explanation === "insufficient") mult += 0.1;
  if (input.consentStructure === "unknown") mult += 0.1;
  if (input.managementIssues) mult += 0.1;
  return Math.min(mult, 1.5);
}

function estimateRefund(
  input: DiagnosisInput
): Pick<DiagnosisResult, "estimatedRefundMin" | "estimatedRefundMax" | "estimatedBreakdown"> {
  const mult = refundRiskMultiplier(input);
  const amount = input.amount;
  const feeCount = input.fees.length;

  // amount は複数費用の合計額の可能性があるため、単純に費用数で割って使う
  // 例: 3費用で15万円 → 1費用あたり5万円の参考値
  // これにより単一費用で全額が返還目安になる不自然な表示を防ぐ
  const perFeeAmount = amount && feeCount > 0 ? amount / feeCount : undefined;

  const items: RefundBreakdownItem[] = [];

  for (const fee of input.fees) {
    let baseMin = 0;
    let baseMax = 0;
    let label: string = fee;

    switch (fee) {
      case "agency_fee":
        // 仲介手数料は宅建業法上の上限が存在する可能性あり
        // 賃料1ヶ月＋消費税が目安のため、固定レンジを基本とする
        label = "仲介手数料";
        baseMin = 5000;
        baseMax = 16500;
        break;

      case "key_exchange":
        // 鍵交換代は業者によりほぼ固定。市場価格1〜1.5万円程度
        label = "鍵交換代";
        baseMin = 3000;
        baseMax = 13200;
        break;

      case "cleaning":
        // 入居時クリーニング代。1R〜1LDK相場で2〜6万円程度
        // 保守的に3万円以内を目安とする
        label = "清掃代";
        baseMin = 5000;
        baseMax = 30000;
        break;

      case "renewal_fee":
        // 更新料: 一般的に賃料0.5〜2ヶ月分。根拠確認の余地あり
        // perFeeAmountがある場合は控えめに参照（上限8万）
        // ない場合は保守的な固定値
        label = "更新料";
        baseMin = 0;
        baseMax = perFeeAmount
          ? Math.min(Math.round(perFeeAmount * 0.35), 80000)
          : 20000;
        break;

      case "recontracting_fee":
        // 再契約料: 法的必須性のない費用。根拠確認が重要
        label = "再契約料";
        baseMin = 0;
        baseMax = perFeeAmount
          ? Math.min(Math.round(perFeeAmount * 0.3), 60000)
          : 15000;
        break;

      case "guarantor":
        // 保証会社費用: 加入義務・更新料の根拠確認が中心
        // 返還可能性は限定的なため、かなり保守的なレンジ
        label = "保証会社費用";
        baseMin = 0;
        baseMax = 8000;
        break;

      case "other":
        // 名目不明費用: 根拠が不明のため原則的に目安算出は困難
        // 単独で入力されている場合のみ、perFeeAmountの一部を参考表示
        label = "その他費用（名目不明）";
        baseMin = 0;
        baseMax =
          feeCount === 1 && perFeeAmount
            ? Math.min(Math.round(perFeeAmount * 0.2), 20000)
            : 0;
        break;
    }

    // リスク係数をmaxに適用（minは変えない）
    // 1000円単位に丸めて見栄えを整える
    const adjMax = Math.round((baseMax * mult) / 1000) * 1000;

    items.push({ feeType: fee, label, min: baseMin, max: adjMax });
  }

  const totalMin = items.reduce((s, i) => s + i.min, 0);
  const totalMax = items.reduce((s, i) => s + i.max, 0);

  return {
    estimatedRefundMin: totalMin,
    estimatedRefundMax: totalMax,
    estimatedBreakdown: items,
  };
}

export function diagnose(input: DiagnosisInput): DiagnosisResult {
  const appliedRules = RISK_RULES.filter((rule) => rule.applies(input));
  const score = computeScore(appliedRules);
  const overallRisk = computeRisk(score);
  const summary = buildSummary(overallRisk, appliedRules, input);

  const issues = appliedRules.map((r) => r.issue);

  // Deduplicate checks and add basics
  const checksSet = new Set<string>();
  for (const rule of appliedRules) {
    rule.checks.forEach((c) => checksSet.add(c));
  }
  // Always add baseline checks
  checksSet.add("賃貸借契約書・重要事項説明書の原本を手元で確認する");
  if (input.fees.length > 0) {
    checksSet.add("請求書・明細書を書面で受け取り、費用項目を個別に確認する");
  }
  const nextChecks = Array.from(checksSet);

  const draftEmail = generateDraftEmail(input, appliedRules);
  const refund = estimateRefund(input);

  return {
    overallRisk,
    score,
    summary,
    issues,
    nextChecks,
    draftEmail,
    disclaimer: DISCLAIMER,
    ...refund,
  };
}
