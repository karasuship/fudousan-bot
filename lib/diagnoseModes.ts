import type {
  ContractReviewInput,
  MaintenanceInput,
  MoveOutInput,
  DepositRefundInput,
  DiagnosisResult,
  DetectedIssue,
  RiskLevel,
} from "./types";

const DISCLAIMER =
  "本診断結果は一般的な情報提供を目的としており、法的助言ではありません。個別の契約内容・状況によって判断は異なります。重要な判断をされる場合は、弁護士・司法書士等の専門家にご相談ください。";

function computeRisk(score: number): RiskLevel {
  if (score <= 20) return "safe";
  if (score <= 50) return "review";
  return "caution";
}

// ─── Mode 2: 契約書チェック ────────────────────────────────────────────

function generateContractReviewEmail(input: ContractReviewInput): string {
  const checks: string[] = [];

  if (input.hasPenaltyClauses) {
    checks.push("・違約金・早期退去ペナルティ・クリーニング代などの特約について、具体的な金額・算出根拠をご教示ください");
  }
  if (input.hasSpecialClauses) {
    checks.push("・特約条項の内容・根拠・適用条件について書面でご説明ください");
  }
  if (!input.hasCheckbox && (input.hasPenaltyClauses || input.hasSpecialClauses)) {
    checks.push("・特約への同意の形式（署名・捺印・チェックボックス等）をご確認いただけますでしょうか");
  }
  if (!input.hasOralExplanation) {
    checks.push("・重要事項説明において上記事項の口頭説明はございましたでしょうか。説明の有無・内容をご確認ください");
  }
  if (input.contractType === "fixed_term" && input.hasRenewalClause) {
    checks.push("・定期借家契約における再契約の条件・費用・手続きについて詳しくご説明ください");
  }
  if (checks.length === 0) {
    checks.push("・契約書・重要事項説明書の各費用項目について、根拠となる条項をご教示ください");
  }

  const checkItems = checks.join("\n");

  if (input.emailTone === "polite") {
    return `件名：賃貸契約書の内容についての確認のお願い

○○不動産株式会社（または担当者）様

お世話になっております。
このたびは入居のお手続きでお世話になっております。
入居者の○○（お名前）と申します。

契約書・重要事項説明書の内容について、署名前にいくつか確認させていただきたい点がございます。
お忙しいところ大変恐縮ですが、下記についてご回答いただけますでしょうか。

【確認事項】
${checkItems}

ご確認・ご回答のほど、どうぞよろしくお願いいたします。

---
入居者氏名：（お名前）
物件名・部屋番号：（物件情報）
ご連絡先：（メールアドレスまたは電話番号）`;
  }

  if (input.emailTone === "firm") {
    return `件名：契約書内容の確認について

担当者様

署名前に下記の点について確認させていただきます。

【確認事項】
${checkItems}

書面にてご回答をお願いいたします。

---
氏名：（お名前）
物件名・部屋番号：（物件情報）
連絡先：（連絡先）`;
  }

  return `件名：契約書内容の確認（${input.contractType === "fixed_term" ? "定期借家" : "普通借家"}）

担当者様

下記事項について書面にてご回答ください。

【確認事項】
${checkItems}

以上、ご回答をお待ちしております。

氏名：（お名前）
物件名：（物件情報）`;
}

export function diagnoseContractReview(input: ContractReviewInput): DiagnosisResult {
  const issues: DetectedIssue[] = [];
  const nextChecks: string[] = [];
  let score = 0;

  if (input.hasPenaltyClauses) {
    issues.push({
      id: "contract_penalty_clause",
      category: "契約",
      title: "ペナルティ特約の存在",
      rule: "ペナルティ特約は①金額・条件が明記され、②説明を受け、③明示的に同意した場合のみ有効。",
      explanation: "違約金・清掃費などの特約が含まれています。特約の有効性は内容の明確性・説明・同意の方法に左右されます。内容と根拠を事前に確認することをお勧めします。",
      checkPoints: [
        "特約の具体的な内容・金額が明記されているか確認する",
        "特約への同意の形式（署名・捺印・チェックボックス等）を確認する",
      ],
      nextAction: [
        "契約書のペナルティ条項を特定し3要件（明記・説明・同意）を確認する",
      ],
      severity: "medium",
    });
    nextChecks.push("特約の具体的な内容・金額が明記されているか確認する");
    nextChecks.push("特約への同意の形式（署名・捺印・チェックボックス等）を確認する");
    score += 15;
  }

  if (!input.hasCheckbox && (input.hasPenaltyClauses || input.hasSpecialClauses)) {
    issues.push({
      id: "contract_no_explicit_consent",
      category: "契約",
      title: "特約への明示的な同意なし",
      rule: "特約への同意は署名・捺印・チェックボックス等の明示的な形式で取られる必要がある。",
      explanation: "特約へのチェックボックス等の明示的な同意が確認できていません。同意の経緯・方法を確認することをお勧めします。",
      checkPoints: [
        "特約への同意がどの書面のどの形式で取られたか確認したか",
      ],
      nextAction: [
        "同意の形式（どの書面に署名したか）を特定する",
      ],
      severity: "medium",
    });
    score += 10;
  }

  if (!input.hasOralExplanation) {
    issues.push({
      id: "contract_no_oral_explanation",
      category: "説明",
      title: "重要事項の口頭説明なし",
      rule: "宅建業者は重要事項説明書を交付するだけでなく、宅建士による口頭での説明が義務（宅建業法35条）。",
      explanation: "費用・特約について口頭での説明を受けていない可能性があります。重要事項説明は書面と口頭での説明が原則です。",
      checkPoints: [
        "重要事項説明書の内容を改めて確認し、疑問点を署名前に書面で質問する",
      ],
      nextAction: [
        "説明を受けていない項目を特定し書面で説明を求める",
      ],
      severity: "high",
    });
    nextChecks.push("重要事項説明書の内容を改めて確認し、疑問点を署名前に書面で質問する");
    score += 15;
  }

  if (input.hasSpecialClauses) {
    issues.push({
      id: "contract_special_clauses",
      category: "契約",
      title: "特約条項の存在",
      rule: "特約条項は内容・根拠・有効性について事前確認が必要。借主に不利な特約は明記と説明を要する。",
      explanation: "特約条項が含まれています。特約の内容・根拠・有効性について事前に確認することをお勧めします。",
      checkPoints: [
        "特約の内容が具体的・明確に記載されているか確認する",
      ],
      nextAction: [
        "特約の内容・根拠を書面で確認する",
      ],
      severity: "medium",
    });
    nextChecks.push("特約の内容が具体的・明確に記載されているか確認する");
    score += 10;
  }

  if (input.contractType === "fixed_term" && input.hasRenewalClause) {
    issues.push({
      id: "contract_fixed_term_renewal",
      category: "契約",
      title: "定期借家契約の更新条項",
      rule: "定期借家契約では「更新」はなく「再契約」という形になる（借地借家法38条）。更新条項の内容・適用範囲・再契約時の条件確認が重要。",
      explanation: "定期借家契約では「更新」はなく「再契約」という形になります。更新条項の内容・適用範囲・再契約時の条件を確認することが重要です。",
      checkPoints: [
        "定期借家契約における再契約条件・費用を確認する",
      ],
      nextAction: [
        "契約書の種別（普通借家/定期借家）を確認する",
        "定期借家の場合は更新料の請求根拠を書面で確認する",
      ],
      severity: "high",
    });
    nextChecks.push("定期借家契約における再契約条件・費用を確認する");
    score += 20;
  }

  nextChecks.push("賃貸借契約書・重要事項説明書の原本を手元で確認する");
  nextChecks.push("疑問点は署名前に書面で質問し、回答を記録として残す");

  const overallRisk = computeRisk(score);
  const summary =
    overallRisk === "safe"
      ? "契約書の内容について特段の懸念点は見当たりませんでした。署名前に最終確認を行いましょう。"
      : overallRisk === "review"
      ? "確認が必要な条項・特約が見つかりました。署名前に書面で確認することをお勧めします。"
      : "複数の確認が必要な条項が見つかりました。署名前に管理会社への確認を行いましょう。";

  return {
    mode: "contract_review",
    overallRisk,
    score: Math.min(score, 100),
    summary,
    issues:
      issues.length > 0
        ? issues
        : [
            {
              id: "contract_no_issue",
              category: "契約",
              title: "確認事項なし",
              rule: "現時点での確認事項は見つかりませんでした。",
              explanation: "現時点では特段の懸念点は見当たりませんでした。",
              checkPoints: ["署名前に全費用の根拠を確認する"],
              nextAction: ["契約書の最終確認を行う"],
              severity: "low",
            },
          ],
    nextChecks: [...new Set(nextChecks)],
    draftEmail: generateContractReviewEmail(input),
    disclaimer: DISCLAIMER,
    estimatedRefundMin: 0,
    estimatedRefundMax: 0,
  };
}

// ─── Mode 4: 管理不備・修繕相談 ───────────────────────────────────────

const ISSUE_TYPE_LABELS: Record<string, string> = {
  water_leak: "水漏れ・雨漏り",
  equipment: "設備不具合",
  pest: "害虫・害獣",
  noise: "騒音・振動",
  common_area: "共用部の不備",
  mold: "カビ・湿気",
  other: "設備・管理上の不備",
};

const DURATION_LABELS: Record<string, string> = {
  today: "本日",
  few_days: "数日前から",
  week_plus: "1週間以上前から",
  month_plus: "1ヶ月以上前から",
};

function generateMaintenanceEmail(input: MaintenanceInput): string {
  const issueLabel = ISSUE_TYPE_LABELS[input.issueType] ?? input.issueType;
  const durationLabel = DURATION_LABELS[input.issueDuration] ?? input.issueDuration;
  const impactLabel =
    input.lifeImpact === "severe"
      ? "日常生活に重大な支障が生じています"
      : input.lifeImpact === "moderate"
      ? "日常生活に一部支障が生じています"
      : "現時点では日常生活への支障は少ないですが、早期対応を希望します";
  const evidenceNote = input.hasEvidence
    ? "状況を写真・動画にて記録しております"
    : "状況の写真記録を準備しております";

  if (input.emailTone === "polite") {
    return `件名：${issueLabel}についての修繕依頼のお願い

○○不動産株式会社（または担当者）様

お世話になっております。
入居者の○○（お名前）と申します。

${durationLabel}より、お部屋にて${issueLabel}が発生しております。
${impactLabel}。${evidenceNote}。

お忙しいところ大変恐縮ですが、下記についてご確認・ご対応いただけますでしょうか。

【対応依頼事項】
・修繕対応の可否および対応予定日をお知らせください
・対応が難しい場合は、理由と今後の対応方針を書面でご説明ください
・緊急対応が必要な場合の連絡先・手順をご教示ください

対応状況のご連絡をいただけますと幸いです。
どうぞよろしくお願いいたします。

---
入居者氏名：（お名前）
物件名・部屋番号：（物件情報）
ご連絡先：（メールアドレスまたは電話番号）
${input.freeText ? `\n補足：${input.freeText}` : ""}`;
  }

  if (input.emailTone === "firm") {
    return `件名：${issueLabel}の修繕対応について

担当者様

${durationLabel}より${issueLabel}が発生しています。${impactLabel}。

【依頼事項】
・速やかな修繕対応および対応予定日の連絡
・対応不可の場合は理由と代替案の書面説明
・今後の対応方針のご回答

記録のため書面（メール）でのご回答をお願いします。

---
氏名：（お名前）
物件名・部屋番号：（物件情報）
連絡先：（連絡先）`;
  }

  return `件名：${issueLabel}修繕の依頼

担当者様

下記の不具合について対応を依頼します。

発生日：${durationLabel}
内容：${issueLabel}
生活への影響：${impactLabel}

対応可否・予定日を書面にてご回答ください。

氏名：（お名前）
物件名：（物件情報）`;
}

export function diagnoseMaintenance(input: MaintenanceInput): DiagnosisResult {
  const issues: DetectedIssue[] = [];
  const nextChecks: string[] = [];
  let score = 0;

  const issueLabel = ISSUE_TYPE_LABELS[input.issueType] ?? input.issueType;

  if (input.isUrgent) {
    issues.push({
      id: "maintenance_urgent",
      category: "管理不備",
      title: `${issueLabel}の緊急対応が必要`,
      rule: "生命・健康に関わる設備不具合は賃貸人が速やかに修繕する義務がある（民法607条の2）。",
      explanation: `${issueLabel}について緊急性が高い状況です。速やかに管理会社・貸主へ書面で連絡し、対応依頼を記録として残すことが重要です。`,
      checkPoints: [
        "緊急連絡先（管理会社・緊急対応窓口）に今すぐ連絡し、メールでも記録を残す",
      ],
      nextAction: [
        "緊急連絡先に即座に連絡し対応を依頼する",
        "連絡後もメールで記録を残す",
      ],
      severity: "high",
    });
    nextChecks.push("緊急連絡先（管理会社・緊急対応窓口）に今すぐ連絡し、メールでも記録を残す");
    score += 30;
  }

  if (input.lifeImpact === "severe") {
    issues.push({
      id: "maintenance_severe_impact",
      category: "管理不備",
      title: "日常生活への重大な支障",
      rule: "賃貸人には貸室を使用収益に適した状態に維持する義務がある（民法606条）。修繕義務違反は賃料減額請求の対象となりえる。",
      explanation: "不具合が日常生活に重大な支障をきたしています。賃貸人には修繕義務がある可能性があります。状況と対応経過を書面で記録することが重要です。",
      checkPoints: [
        "生活への支障状況を詳細に記録し、管理会社への書面連絡で記録を残す",
      ],
      nextAction: [
        "発生日時・状況・被害を記録する",
        "管理会社にメールで修繕依頼を送付し記録を残す",
      ],
      severity: "high",
    });
    nextChecks.push("生活への支障状況を詳細に記録し、管理会社への書面連絡で記録を残す");
    score += 25;
  } else if (input.lifeImpact === "moderate") {
    issues.push({
      id: "maintenance_moderate_impact",
      category: "管理不備",
      title: "日常生活への影響あり",
      rule: "賃貸人には修繕義務がある（民法606条）。速やかな対応を書面で依頼することが重要。",
      explanation: "不具合が日常生活に影響を与えています。速やかな対応を書面で依頼することをお勧めします。",
      checkPoints: [
        "不具合の状況と生活への影響を書面で管理会社に報告したか",
      ],
      nextAction: [
        "不具合の状況をメールで管理会社に報告する",
      ],
      severity: "medium",
    });
    score += 15;
  }

  if (!input.alreadyContacted) {
    issues.push({
      id: "maintenance_not_reported",
      category: "管理不備",
      title: "管理会社への報告未済",
      rule: "管理不備の証明には書面での報告記録が必要。口頭のみの連絡は証拠として残らない。",
      explanation: "まだ管理会社・貸主への書面連絡を行っていない場合、メール等で報告・依頼を行い記録を残すことが最初のステップです。",
      checkPoints: [
        "不具合の発生日・状況・生活への影響を記録し、管理会社へメールで報告する",
      ],
      nextAction: [
        "不具合の状況をメールで管理会社に報告する",
        "送信記録を保存する",
      ],
      severity: "medium",
    });
    nextChecks.push("不具合の発生日・状況・生活への影響を記録し、管理会社へメールで報告する");
    score += 10;
  } else {
    nextChecks.push("これまでの連絡・回答記録を整理しておく");
  }

  if (!input.hasEvidence) {
    issues.push({
      id: "maintenance_no_evidence",
      category: "管理不備",
      title: "不具合の証拠記録なし",
      rule: "管理不備・損耗等の証明には写真・動画等の記録が必要。記録がない場合、事後的な証明が困難になる。",
      explanation: "写真・動画などの証拠記録がない場合、今すぐ記録しておくことをお勧めします。後の対応に役立ちます。",
      checkPoints: [
        "不具合の状況を写真・動画で記録する（日時も確認できるよう配慮）",
      ],
      nextAction: [
        "現状の問題箇所を写真・動画で記録する（日時確認できる形で）",
      ],
      severity: "medium",
    });
    nextChecks.push("不具合の状況を写真・動画で記録する（日時も確認できるよう配慮）");
    score += 10;
  }

  nextChecks.push("管理会社・貸主への連絡はメール等の書面で行い、対応状況を保存する");
  nextChecks.push("対応期限・対応方針を書面で確認する");

  const overallRisk = computeRisk(score);
  const summary =
    overallRisk === "safe"
      ? `${issueLabel}について、現時点での緊急性は低いと考えられます。管理会社への書面連絡で記録を残しておきましょう。`
      : overallRisk === "review"
      ? `${issueLabel}について、対応が必要な状況です。書面で管理会社へ連絡し、対応方針を確認することをお勧めします。`
      : `${issueLabel}について、緊急性が高いまたは生活への影響が大きい状況です。速やかに書面で管理会社への対応依頼を行いましょう。`;

  return {
    mode: "maintenance",
    overallRisk,
    score: Math.min(score, 100),
    summary,
    issues:
      issues.length > 0
        ? issues
        : [
            {
              id: "maintenance_no_issue",
              category: "管理不備",
              title: "緊急性低",
              rule: "現時点での緊急性は低いと考えられます。",
              explanation: "現時点での緊急性は低いと考えられます。記録を残しておきましょう。",
              checkPoints: ["管理会社への書面連絡で記録を残す"],
              nextAction: ["不具合の状況をメールで管理会社に報告する"],
              severity: "low",
            },
          ],
    nextChecks: [...new Set(nextChecks)],
    draftEmail: generateMaintenanceEmail(input),
    disclaimer: DISCLAIMER,
    estimatedRefundMin: 0,
    estimatedRefundMax: 0,
  };
}

// ─── Mode 5: 退去費用チェック ──────────────────────────────────────────

function generateMoveOutEmail(input: MoveOutInput): string {
  const feeList = input.facts.map((f) => f.labelOnInvoice || f.realityCategory).join("・");

  const checks: string[] = [
    `・${feeList}の各費用について、根拠となる契約条項と算出方法をご教示ください`,
  ];

  if (input.isNormalWear) {
    checks.push(
      "・通常の使用による損耗（通常損耗）として判断している箇所がある場合、貸主・借主の負担区分の根拠をご説明ください"
    );
  }
  if (!input.hasDetailedQuote) {
    checks.push(
      "・各費用の工事内容・単価・数量・金額が記載された詳細な内訳明細の提供をお願いいたします"
    );
  }
  if (input.hasContractSpecialClause) {
    checks.push(
      "・退去時の費用負担に関する特約がある場合、特約の内容・金額・同意の方法をご確認ください"
    );
  }

  const checkItems = checks.join("\n");

  if (input.emailTone === "polite") {
    return `件名：退去費用・原状回復費用についての確認のお願い

○○不動産株式会社（または担当者）様

お世話になっております。
入居者の○○（お名前）と申します。

このたびの退去に際し、ご請求いただいた費用（${feeList}）について、いくつか確認させていただきたい点がございます。
お忙しいところ大変恐縮ですが、下記についてご回答いただけますでしょうか。

【確認事項】
${checkItems}

ご対応のほど、どうぞよろしくお願いいたします。

---
入居者氏名：（お名前）
物件名・部屋番号：（物件情報）
ご連絡先：（メールアドレスまたは電話番号）`;
  }

  if (input.emailTone === "firm") {
    return `件名：退去費用の根拠確認について

担当者様

退去に際しご請求いただいた費用（${feeList}）について、以下の点を確認させていただきます。

【確認事項】
${checkItems}

書面にてご回答をお願いいたします。なお、確認が完了するまでお支払いを保留させていただく場合がございます。

---
氏名：（お名前）
物件名・部屋番号：（物件情報）
連絡先：（連絡先）`;
  }

  return `件名：退去費用根拠の確認（${feeList}）

担当者様

退去費用について下記事項を書面にてご回答ください。

【確認事項】
${checkItems}

以上、ご回答をお待ちしております。

氏名：（お名前）
物件名：（物件情報）`;
}

function estimateMoveOutRefund(input: MoveOutInput): {
  estimatedRefundMin: number;
  estimatedRefundMax: number;
} {
  let min = 0;
  let max = 0;

  for (const fact of input.facts) {
    switch (fact.realityCategory) {
      case "cleaning":
        min += input.isNormalWear ? 5000 : 0;
        max += input.isNormalWear ? 30000 : input.hasContractSpecialClause ? 15000 : 0;
        break;
      case "key_exchange":
        max += input.contractMention === "unknown" ? 13200 : 5000;
        break;
      case "repair":
      case "unknown":
        max += !input.hasDetailedQuote ? 20000 : 5000;
        break;
    }
  }

  return {
    estimatedRefundMin: min,
    estimatedRefundMax: Math.min(max, 200000),
  };
}

export function diagnoseMoveOut(input: MoveOutInput): DiagnosisResult {
  const issues: DetectedIssue[] = [];
  const nextChecks: string[] = [];
  let score = 0;

  if (!input.hasDetailedQuote) {
    issues.push({
      id: "move_out_no_detailed_quote",
      category: "手続き",
      title: "退去費用の詳細明細なし",
      rule: "退去費用の請求には工事箇所・単価・数量・金額の明細が必要。明細なき一括請求は根拠の確認が困難な状態となる。",
      explanation: "費用の詳細な内訳明細（工事箇所・単価・数量・金額）が提供されていません。各費用の根拠・算出方法を書面で確認することが重要です。",
      checkPoints: ["費用の詳細な明細書の提供を求める"],
      nextAction: ["費用明細書の提供を書面で求める"],
      severity: "medium",
    });
    nextChecks.push("費用の詳細な明細書の提供を求める");
    score += 20;
  }

  if (input.isNormalWear) {
    issues.push({
      id: "move_out_normal_wear",
      category: "手続き",
      title: "通常損耗の借主負担",
      rule: "通常の使用による損耗（通常損耗）は原則として貸主負担（国土交通省原状回復ガイドライン）。費用の負担区分・根拠の確認が必要。",
      explanation: "通常の使用による損耗（通常損耗）は原則として貸主負担とされています（国土交通省原状回復ガイドライン）。費用の負担区分・根拠を確認することをお勧めします。",
      checkPoints: ["通常損耗と経年劣化の扱いについて契約書・ガイドラインと照合する"],
      nextAction: [
        "費用明細の各項目を通常損耗・原状回復・特約負担に分類する",
        "通常損耗分の費用負担根拠を書面で確認する",
      ],
      severity: "high",
    });
    nextChecks.push("通常損耗と経年劣化の扱いについて契約書・ガイドラインと照合する");
    score += 20;
  }

  if (!input.hasEntryPhotos) {
    issues.push({
      id: "move_out_no_entry_photos",
      category: "実態",
      title: "入居時の状況記録なし",
      rule: "入居時の損耗・傷の有無は退去時の原状回復費用の基準となる。入居時写真がない場合、前入居者による損耗を立証できない。",
      explanation: "入居時の状況写真がない場合、入居前からの損傷等の証明が難しくなります。現状の写真・記録を整理しておくことをお勧めします。",
      checkPoints: ["現在の室内状況を写真で記録しておく"],
      nextAction: ["入居時の状況を証明できる記録（写真・書面）を探す"],
      severity: "medium",
    });
    nextChecks.push("現在の室内状況を写真で記録しておく");
    score += 15;
  }

  if (!input.hasInspection) {
    issues.push({
      id: "move_out_no_inspection",
      category: "手続き",
      title: "退去立会い確認の未実施",
      rule: "退去立会いは損耗箇所・原因・費用負担を双方で確認する機会。立会いなく費用を請求する場合、請求根拠の形成過程が不透明となる。",
      explanation: "退去立会い確認を行っていない場合、その後の費用請求の根拠確認が重要です。立会い実施の有無・内容を記録しておきましょう。",
      checkPoints: ["立会い確認の実施状況・確認書類の有無を確認する"],
      nextAction: ["退去立会いの有無と確認内容を記録する"],
      severity: "medium",
    });
    nextChecks.push("立会い確認の実施状況・確認書類の有無を確認する");
    score += 10;
  }

  if (input.contractMention === "unknown") {
    issues.push({
      id: "move_out_contract_unknown",
      category: "実態",
      title: "費用根拠の契約書記載が未確認",
      rule: "退去費用の請求は契約書・重要事項説明書の記載条項に基づく必要がある。照合なき費用支払いは根拠のない費用を支払うリスクを生む。",
      explanation: "費用の根拠となる契約書・特約の記載が確認できていません。各費用の根拠条項を確認することをお勧めします。",
      checkPoints: ["賃貸借契約書・特約の退去時費用に関する記載を確認する"],
      nextAction: ["契約書の退去時特約を確認する"],
      severity: "medium",
    });
    nextChecks.push("賃貸借契約書・特約の退去時費用に関する記載を確認する");
    score += 15;
  }

  if (input.hasContractSpecialClause) {
    issues.push({
      id: "move_out_special_clause",
      category: "契約",
      title: "退去時費用の特約記載あり",
      rule: "退去時の原状回復費用を借主に負担させる特約は、明記と説明がなければ原則として無効（国土交通省原状回復ガイドライン）。",
      explanation: "契約書に退去時の特約がある場合、特約の有効性（内容の明確性・説明の有無・同意の形式）を確認することをお勧めします。",
      checkPoints: [
        "特約の内容・金額の具体性を確認する",
        "特約への同意の形式（署名・捺印・チェックボックス等）を確認する",
      ],
      nextAction: ["特約の内容・根拠を書面で確認する"],
      severity: "medium",
    });
    nextChecks.push("特約の内容・金額の具体性を確認する");
    nextChecks.push("特約への同意の形式（署名・捺印・チェックボックス等）を確認する");
    score += 10;
  }

  nextChecks.push("賃貸借契約書・重要事項説明書の原本を手元で確認する");
  nextChecks.push("請求書・明細書を書面で受け取り、費用項目を個別に確認する");

  const refund = estimateMoveOutRefund(input);
  const overallRisk = computeRisk(score);
  const summary =
    overallRisk === "safe"
      ? "退去費用について特段の懸念点は見当たりませんでした。念のため明細を確認しておきましょう。"
      : overallRisk === "review"
      ? "確認が必要な費用が見つかりました。内訳・根拠を書面で確認することをお勧めします。"
      : "複数の確認が必要な点が見つかりました。費用の根拠・負担区分を確認し、必要に応じて書面で問い合わせましょう。";

  return {
    mode: "move_out",
    overallRisk,
    score: Math.min(score, 100),
    summary,
    issues:
      issues.length > 0
        ? issues
        : [
            {
              id: "move_out_no_issue",
              category: "手続き",
              title: "確認事項なし",
              rule: "現時点での懸念点は見当たりませんでした。",
              explanation: "現時点では特段の懸念点は見当たりませんでした。",
              checkPoints: ["明細を確認しておく"],
              nextAction: ["念のため明細書を保存する"],
              severity: "low",
            },
          ],
    nextChecks: [...new Set(nextChecks)],
    draftEmail: generateMoveOutEmail(input),
    disclaimer: DISCLAIMER,
    ...refund,
  };
}

// ─── Mode 6: 敷金精算チェック ──────────────────────────────────────────

function generateDepositRefundEmail(input: DepositRefundInput): string {
  const deductionList =
    input.deductionItems.length > 0 ? input.deductionItems.join("・") : "差引項目";

  const checks: string[] = [];
  if (!input.hasDetailedStatement) {
    checks.push(`・差引項目（${deductionList}）の名目・金額・算出根拠が記載された明細書をご提供ください`);
  } else {
    checks.push(`・差引項目（${deductionList}）の各費用について、根拠となる契約条項と算出方法をご教示ください`);
  }
  if (!input.hasReturnSchedule) {
    checks.push("・敷金返還の予定日・振込先等についてご連絡いただけますでしょうか");
  }
  if (input.depositAmount && input.expectedRefund !== undefined) {
    checks.push(
      `・敷金（${input.depositAmount.toLocaleString("ja-JP")}円）から${(input.depositAmount - input.expectedRefund).toLocaleString("ja-JP")}円を差し引く根拠をご確認ください`
    );
  }
  if (checks.length === 0) {
    checks.push("・敷金精算の明細書・算出根拠をご提供ください");
  }

  const checkItems = checks.join("\n");

  if (input.emailTone === "polite") {
    return `件名：敷金精算内容についての確認のお願い

○○不動産株式会社（または担当者）様

お世話になっております。
入居者の○○（お名前）と申します。

このたびの退去に際しての敷金精算について、いくつか確認させていただきたい点がございます。
お忙しいところ大変恐縮ですが、下記についてご回答いただけますでしょうか。

【確認事項】
${checkItems}

ご対応のほど、どうぞよろしくお願いいたします。

---
入居者氏名：（お名前）
物件名・部屋番号：（物件情報）
ご連絡先：（メールアドレスまたは電話番号）`;
  }

  if (input.emailTone === "firm") {
    return `件名：敷金精算の根拠確認について

担当者様

敷金精算について以下の点を確認させていただきます。

【確認事項】
${checkItems}

書面にてご回答をお願いいたします。

---
氏名：（お名前）
物件名・部屋番号：（物件情報）
連絡先：（連絡先）`;
  }

  return `件名：敷金精算根拠の確認

担当者様

敷金精算について下記事項を書面にてご回答ください。

【確認事項】
${checkItems}

以上、ご回答をお待ちしております。

氏名：（お名前）
物件名：（物件情報）`;
}

export function diagnoseDepositRefund(input: DepositRefundInput): DiagnosisResult {
  const issues: DetectedIssue[] = [];
  const nextChecks: string[] = [];
  let score = 0;

  if (!input.hasDetailedStatement) {
    issues.push({
      id: "deposit_no_statement",
      category: "手続き",
      title: "敷金精算の明細未提示",
      rule: "敷金から差し引く場合、各項目の名目・金額・算出根拠を記した明細書を借主に提示する義務がある。",
      explanation: "差引明細（費目・金額・算出根拠）が提示されていません。各費用の名目・金額・算出根拠が記載された明細書の提供を求めることが重要です。",
      checkPoints: ["各差引項目の名目・金額・算出根拠が記載された明細書の提供を求める"],
      nextAction: ["明細書の提供を書面で求める"],
      severity: "high",
    });
    nextChecks.push("各差引項目の名目・金額・算出根拠が記載された明細書の提供を求める");
    score += 25;
  }

  if (input.deductionItems.length > 0) {
    issues.push({
      id: "deposit_deduction_items",
      category: "手続き",
      title: "差引項目の根拠確認",
      rule: "敷金からの差引は契約書上の根拠・借主の責任・適正費用の3要件を満たす必要がある。",
      explanation: `差引項目（${input.deductionItems.join("・")}）について、各費用の根拠と算出方法の確認をお勧めします。`,
      checkPoints: ["各差引項目が契約書・特約のどの条項に基づくか確認する"],
      nextAction: ["明細の各項目について根拠3要件を書面で確認する"],
      severity: "medium",
    });
    nextChecks.push("各差引項目が契約書・特約のどの条項に基づくか確認する");
    score += 10 + (input.deductionItems.length >= 3 ? 10 : 0);
  }

  if (!input.hasReturnSchedule) {
    issues.push({
      id: "deposit_no_return_schedule",
      category: "手続き",
      title: "敷金返還日程の未連絡",
      rule: "敷金は退去後に精算・返還されるべきもの。返還日程・方法の連絡がない場合、返還義務の履行が確認できない。",
      explanation: "敷金の返還予定日・返還方法についての連絡がない状況です。返還時期・方法を書面で確認することをお勧めします。",
      checkPoints: ["敷金返還の予定日・振込先等を書面で問い合わせる"],
      nextAction: ["管理会社に敷金返還の予定日・方法を書面で確認する"],
      severity: "medium",
    });
    nextChecks.push("敷金返還の予定日・振込先等を書面で問い合わせる");
    score += 15;
  }

  const gap =
    input.depositAmount !== undefined && input.expectedRefund !== undefined
      ? input.depositAmount - input.expectedRefund
      : 0;

  if (gap > 0 && !input.hasDetailedStatement) {
    issues.push({
      id: "deposit_gap_no_statement",
      category: "手続き",
      title: "差引額の根拠説明なし",
      rule: "差引がある場合は各費目の根拠が必要。明細なき差引は請求根拠が存在しない状態。",
      explanation: `差引額（約${gap.toLocaleString("ja-JP")}円）に対して明細が提示されていないため、各費用の根拠確認が特に重要です。`,
      checkPoints: ["差引額の根拠となる費目一覧を書面で求める"],
      nextAction: ["差引額の根拠説明を書面で求める"],
      severity: "high",
    });
    score += 5;
  }

  nextChecks.push("賃貸借契約書・特約の内容を再確認し、差引根拠と照合する");
  nextChecks.push("敷金精算書を書面で受け取り、内容を保存する");

  const potentialMax =
    gap > 0 ? Math.min(Math.round((gap * 0.3) / 1000) * 1000, 100000) : 0;

  const overallRisk = computeRisk(score);
  const summary =
    overallRisk === "safe"
      ? "敷金精算について現時点での大きな懸念点は見当たりませんでした。"
      : overallRisk === "review"
      ? "確認が必要な差引項目が見つかりました。明細・根拠の確認をお勧めします。"
      : "複数の確認が必要な点があります。差引根拠・明細を書面で確認し、記録として残しましょう。";

  return {
    mode: "deposit_refund",
    overallRisk,
    score: Math.min(score, 100),
    summary,
    issues:
      issues.length > 0
        ? issues
        : [
            {
              id: "deposit_no_issue",
              category: "手続き",
              title: "確認事項なし",
              rule: "現時点での懸念点は見当たりませんでした。",
              explanation: "現時点での懸念点は見当たりませんでした。",
              checkPoints: ["敷金精算書を保存しておく"],
              nextAction: ["念のため精算書を保存する"],
              severity: "low",
            },
          ],
    nextChecks: [...new Set(nextChecks)],
    draftEmail: generateDepositRefundEmail(input),
    disclaimer: DISCLAIMER,
    estimatedRefundMin: 0,
    estimatedRefundMax: potentialMax,
  };
}
