// ─── 型定義 ──────────────────────────────────────────────────────────────────

export type ExplanationType =
  | "substantial"   // 実質説明あり
  | "formal"        // 重説読み上げ・書面記載のみ
  | "weak_oral"     // 軽い口頭説明
  | "none"          // 説明なし
  | "pressure";     // 圧力・急かしあり

export type MandatoryType =
  | "owner"         // オーナー条件
  | "agent"         // 不動産屋都合
  | "unknown"       // 主体不明
  | "optional"      // 任意
  | "not_explained";

export type BenefitType =
  | "tenant"        // 借主便益
  | "landlord"      // 貸主便益
  | "mixed"
  | "unknown";

export type EvidenceType =
  | "documented"
  | "claimed_only"
  | "unknown"
  | "none";

export type SalesJustification =
  | "none"
  | "company_rule"
  | "everyone_pays"
  | "industry_standard"
  | "minimum_fee";

export type OutcomeType =
  | "remove"
  | "half"
  | "difference"
  | "offset"
  | "hold"
  | "keep";

export type FeeTypeKey =
  | "disinfect"
  | "support"
  | "cleaning"
  | "key_exchange"
  | "broker"
  | "admin"
  | "insurance"
  | "guarantee";

// ─── 基礎負担原則 ─────────────────────────────────────────────────────────────

const BASE_RULE: Record<FeeTypeKey, string> = {
  disinfect: "landlord",
  support: "tenant_optional",
  cleaning: "landlord",
  key_exchange: "landlord",
  broker: "mixed",
  admin: "mixed",
  insurance: "tenant_conditional",
  guarantee: "tenant_conditional",
};

// ─── 入出力型 ─────────────────────────────────────────────────────────────────

export interface FeeEvalInput {
  feeType: FeeTypeKey;
  label: string;
  mandatory: MandatoryType;
  explanation: ExplanationType;
  evidence: EvidenceType;
  benefit: BenefitType;
  salesJustification: SalesJustification;
}

export interface FeeEvalResult {
  feeType: FeeTypeKey;
  label: string;
  outcome: OutcomeType;
  reason: string;
  ignore_message: string | null;
}

// ─── 判定ロジック（Step1〜5） ─────────────────────────────────────────────────

function getBaseRule(feeType: FeeTypeKey): string {
  return BASE_RULE[feeType];
}

function getInitialOutcome(feeType: FeeTypeKey): OutcomeType {
  switch (feeType) {
    case "disinfect":
    case "support":
    case "cleaning":
    case "key_exchange":
      return "remove";
    case "broker":
    case "admin":
    case "insurance":
    case "guarantee":
      return "difference";
  }
}

// Step2: MandatoryType で補正
function adjustByMandatory(outcome: OutcomeType, mandatory: MandatoryType): OutcomeType {
  if (mandatory === "agent" || mandatory === "unknown") {
    return "remove";
  }
  if (mandatory === "owner") {
    if (outcome === "remove") return "half";
  }
  return outcome;
}

// Step3: Explanation で補正
function adjustByExplanation(outcome: OutcomeType, explanation: ExplanationType): OutcomeType {
  if (explanation === "pressure" || explanation === "none") {
    return "remove";
  }
  if (explanation === "formal") {
    return outcome; // 形式説明は影響させない
  }
  if (explanation === "substantial") {
    if (outcome === "remove") return "half";
  }
  return outcome;
}

// Step4: Evidence + Benefit で補正
function adjustByEvidence(outcome: OutcomeType, evidence: EvidenceType, benefit: BenefitType): OutcomeType {
  if (evidence === "none" || evidence === "unknown") {
    return "hold"; // 支払い保留
  }
  if (benefit === "landlord") {
    return "remove";
  }
  if (benefit === "tenant") {
    if (outcome === "remove") return "half";
  }
  return outcome;
}

// Step5: Salesトーク無効判定
function ignoreSalesJustification(justification: SalesJustification): boolean {
  return (["company_rule", "everyone_pays", "industry_standard", "minimum_fee"] as SalesJustification[]).includes(justification);
}

// ─── テキスト生成 ─────────────────────────────────────────────────────────────

// ユーザー向けラベル（half は「終わり」に見せない）
export const OUTCOME_LABELS: Record<OutcomeType, string> = {
  remove:     "削除を求める",
  half:       "一部負担＋残りは調整",
  difference: "差額の見直し",
  offset:     "他の条件で調整",
  hold:       "支払い保留・確認",
  keep:       "現状維持",
};

// ─── パーツ生成ヘルパー ────────────────────────────────────────────────────────

/** 誰が払うのが基本か（ユーザー向け） */
function describeBaseBurden(baseRule: string): string {
  if (baseRule === "landlord") {
    return "この費用は、あなたではなくオーナー（大家）が負担するのが基本と考えられるものです。";
  }
  if (baseRule === "tenant_optional") {
    return "この費用は、あなたが任意で選ぶサービスについてのもので、強制的に払う義務があるとは限りません。";
  }
  if (baseRule === "tenant_conditional") {
    return "この費用は、条件次第であなたが負担する場合もありますが、内容と根拠を確認する余地があります。";
  }
  // mixed
  return "この費用は、オーナー（大家）・あなた・不動産屋（仲介会社）のいずれが負担するか、契約内容によって変わる性質があります。";
}

/** 説明の質（ユーザー向け） */
function describeExplanationQuality(explanation: ExplanationType): string {
  switch (explanation) {
    case "substantial":
      return "内容を含めた実質的な説明を受けている場合、あなたが一定程度納得しているとみなされることがあります。";
    case "formal":
      return "重要事項説明書で読み上げられただけ、または書面に書いてあっただけの場合は、十分な説明を受けたとは言いにくい状況です。";
    case "weak_oral":
      return "口頭でさらっと触れられた程度では、あなたがその費用の意味や根拠を理解したとは言いにくいです。";
    case "none":
      return "この費用について何も説明を受けていない場合、そのまま支払う前に説明を求める余地があります。";
    case "pressure":
      return "急かされたり、断れない雰囲気を作られた状況での同意は、適切な説明に基づいた合意とは言えない可能性があります。";
  }
}

/** 便益の帰属（ユーザー向け） */
function describeBenefit(benefit: BenefitType): string {
  switch (benefit) {
    case "landlord":
      return "この費用の恩恵を主に受けるのはオーナー（大家）側です。物件の管理・維持・次の入居募集のためのものであれば、オーナー側の負担と考えられる余地が強くなります。実際に作業が行われていても、それだけであなたが全額負担すべきと決まるわけではありません。";
    case "tenant":
      return "この費用はあなた自身が利益を受けるものと考えられます。ただし金額や内容の妥当性は別途確認の余地があります。";
    case "mixed":
      return "この費用はオーナー（大家）・あなた双方に関係する性質があります。";
    case "unknown":
      return "この費用が誰のために発生しているか、現時点では確認できていない状況です。";
  }
}

/** outcome に応じた行動指針（ユーザー向け） */
function describeOutcomeAction(outcome: OutcomeType): string {
  switch (outcome) {
    case "remove":
      return "そのまま支払わず、削除または返金を求めることを検討できます。";
    case "half":
      return "現実的な落としどころとして一部だけ負担する形になることがあります。ただし、これは最終的な納得ではなく譲歩着地です。残りの部分は家賃・礼金・フリーレントなどの条件で調整（相殺）できる可能性があります。";
    case "difference":
      return "請求額が相場や根拠と比べて高すぎる場合、差額分を見直すことを検討できます。あとから値下げされた場合、最初の金額が「これ以上下げられない正しい金額」ではなかった可能性があります。その場合はさらに調整を考える余地があります。";
    case "offset":
      return "この費用を直接下げるのが難しい場合でも、家賃・礼金・フリーレントなど他の条件での調整を交渉できる可能性があります。";
    case "hold":
      return "現時点では支払いを止めて、内容・証拠・根拠を確認することをお勧めします。確認できるまで支払いを保留することは、あなたの権利の範囲で考えられる行動です。";
    case "keep":
      return "この費用については、現状のまま進むことが現実的と考えられます。";
  }
}

/**
 * あとから値下げされた費用についての補助説明
 * 将来的に「値下げ履歴あり」入力が追加された際は、ここで判定する
 */
export function buildNegotiatedDownNote(): string {
  return "もし最初の請求額があとから下げられた経緯がある場合、その金額は最初から絶対に正しい金額だったとは限りません。そのような費用は、さらに減額や調整を求める余地があります。";
}

function buildReason(input: FeeEvalInput, outcome: OutcomeType, baseRule: string): string {
  const parts: string[] = [];

  // 1. 誰が払うのが基本か
  parts.push(describeBaseBurden(baseRule));

  // 2. 今の請求のどこが弱いか（説明の質）
  parts.push(describeExplanationQuality(input.explanation));

  // 3. 便益の帰属
  parts.push(describeBenefit(input.benefit));

  // 4. どう考えられるか（outcome に応じた行動指針）
  parts.push(describeOutcomeAction(outcome));

  return parts.join(" ");
}

function buildIgnoreMessage(justification: SalesJustification): string | null {
  switch (justification) {
    case "company_rule":
      return "「当社のルールです」という説明だけでは、あなたが支払う理由にはなりません。社内の決め方と、あなたが負担すべき根拠は別の問題です。その費用が正当かどうかは、内容・実態・契約書の記載で確認する必要があります。";
    case "minimum_fee":
      return "「当社の最低料金です」という説明だけでは、あなたが支払う根拠にはなりません。最低料金の設定は会社側の都合であり、あなたが負担しなければならない理由とは別です。内容と根拠を確認することをお勧めします。";
    case "everyone_pays":
      return "「みなさん払っています」は、あなたが払う理由にはなりません。他の人が払っているかどうかと、あなたが払うべきかどうかは関係がありません。その費用が正当かどうかは、あなたの契約の内容と根拠で判断する必要があります。";
    case "industry_standard":
      return "「業界では一般的です」は、あなたが払う根拠にはなりません。業界でよくあることと、あなたが支払うべきかどうかは別の問題です。その費用に本当に根拠があるかは、契約内容・説明内容・実態で確認する必要があります。";
    default:
      return null;
  }
}

// ─── 統合評価関数 ─────────────────────────────────────────────────────────────

export function evaluateFee(input: FeeEvalInput): FeeEvalResult {
  const baseRule = getBaseRule(input.feeType);
  let outcome = getInitialOutcome(input.feeType);
  outcome = adjustByMandatory(outcome, input.mandatory);
  outcome = adjustByExplanation(outcome, input.explanation);
  outcome = adjustByEvidence(outcome, input.evidence, input.benefit);
  const ignore = ignoreSalesJustification(input.salesJustification);
  return {
    feeType: input.feeType,
    label: input.label,
    outcome,
    reason: buildReason(input, outcome, baseRule),
    ignore_message: ignore ? buildIgnoreMessage(input.salesJustification) : null,
  };
}

