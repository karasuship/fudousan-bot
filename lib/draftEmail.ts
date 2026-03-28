import type { DiagnosisInput, RiskFactor } from "./types";

const FEE_LABELS: Record<string, string> = {
  renewal_fee: "更新料",
  recontracting_fee: "再契約料",
  agency_fee: "仲介手数料",
  key_exchange: "鍵交換代",
  cleaning: "清掃代（入居時クリーニング代）",
  guarantor: "保証会社費用",
  other: "その他費用",
};

const PHASE_LABELS: Record<string, string> = {
  move_in: "入居",
  renewal: "契約更新",
  recontracting: "再契約",
  move_out: "退去",
  other: "手続き",
};

function feeList(fees: string[]): string {
  return fees.map((f) => FEE_LABELS[f] ?? f).join("・");
}

function buildCheckItems(appliedRules: RiskFactor[]): string {
  const uniqueChecks = Array.from(
    new Set(appliedRules.flatMap((r) => r.checks))
  ).slice(0, 5);

  if (uniqueChecks.length === 0) {
    return "・請求費用の根拠となる契約書・重要事項説明書の該当箇所をご教示ください。";
  }

  return uniqueChecks.map((c) => `・${c}`).join("\n");
}

export function generateDraftEmail(
  input: DiagnosisInput,
  appliedRules: RiskFactor[]
): string {
  const phase = PHASE_LABELS[input.phase] ?? "手続き";
  const fees = feeList(input.fees);
  const checkItems = buildCheckItems(appliedRules);

  if (input.emailTone === "polite") {
    return `件名：賃貸契約費用についてのご確認のお願い

○○不動産株式会社（または担当者）様

お世話になっております。
入居者の○○（お名前）と申します。

この度は${phase}に際し、ご連絡いただきありがとうございます。
ご請求いただいた費用（${fees}）について、いくつか確認させていただきたい点がございます。
お忙しいところ大変恐縮ですが、下記についてご回答いただけますでしょうか。

【ご確認いただきたい事項】
${checkItems}

ご対応のほど、どうぞよろしくお願いいたします。

---
入居者氏名：（お名前）
物件名・部屋番号：（物件情報）
ご連絡先：（メールアドレスまたは電話番号）`;
  }

  if (input.emailTone === "firm") {
    return `件名：賃貸契約費用の根拠確認について

担当者様

${phase}に際してご請求いただいた費用（${fees}）について、以下の点を確認させていただきたく存じます。
ご回答をお願いいたします。

【確認事項】
${checkItems}

なお、確認が完了するまでは費用のお支払いを保留させていただく場合がございますので、予めご了承ください。
ご対応いただけますよう、よろしくお願いいたします。

---
氏名：（お名前）
物件名・部屋番号：（物件情報）
連絡先：（連絡先）`;
  }

  // factual
  return `件名：費用根拠の確認（${fees}）

担当者様

${phase}に際しご請求いただいた費用について、下記事項を書面にてご回答ください。

【確認事項】
${checkItems}

以上、ご回答をお待ちしております。

氏名：（お名前）
物件名：（物件情報）`;
}
