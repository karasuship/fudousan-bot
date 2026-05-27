// lib/types_v2.ts

// ─── タイミング・ステージ ────────────────────────────────────────────────────

/** サービスの最上位分岐 */
export type ContractTiming = "pre_contract" | "post_contract";

/** 契約前の詳細ステージ */
export type PreContractStage =
  | "pre_sign"               // 署名前（見積もり段階）
  | "post_sign_pre_payment"; // 署名済み・支払前

/** 契約後の詳細ステージ */
export type PostContractStage =
  | "pre_payment"   // 支払前
  | "post_payment"; // 支払済み

export type ContractStage = PreContractStage | PostContractStage;

// ─── 費目ID（統一版） ────────────────────────────────────────────────────────
// 既存の FeeType / FeeId とは別物。今後はこちらへ段階的に移行する。

export type FeeId2 =
  | "agency_fee"      // 仲介手数料
  | "key_exchange"    // 鍵交換代
  | "cleaning"        // クリーニング費
  | "disinfection"    // 消毒・抗菌処理費
  | "support_24h"     // 24時間サポート
  | "admin_fee"       // 書類作成費・事務手数料
  | "guarantor"       // 保証会社費用
  | "fire_insurance"  // 火災保険料
  | "key_money"       // 礼金
  | "unknown_label"   // 名前がよくわからない費用
  | "label_mismatch"  // 書類によって費用の名前が違う
  | "entity_mismatch" // 請求した会社と領収書の会社が違う
  | "special_clause"; // 特約・特記事項

export const FEE_LABEL: Record<FeeId2, string> = {
  agency_fee: "仲介手数料",
  key_exchange: "鍵交換代",
  cleaning: "クリーニング費",
  disinfection: "消毒・抗菌処理費",
  support_24h: "24時間サポート",
  admin_fee: "書類作成費・事務手数料",
  guarantor: "保証会社費用",
  fire_insurance: "火災保険料",
  key_money: "礼金",
  unknown_label: "名前がよくわからない費用",
  label_mismatch: "書類によって費用の名前が違う",
  entity_mismatch: "請求した会社と領収書の会社が違う",
  special_clause: "特約・特記事項",
};

// ─── 説明の3層チェック ───────────────────────────────────────────────────────
// 全費目共通で持つ「借主の判断可能性」チェック

export interface ThreeLayerCheck {
  /** 第1層：任意か必須かの説明があったか */
  voluntaryExplained: "yes" | "no" | "unknown";

  /** 第2層：オーナーの条件か業者のサービスかの説明があったか */
  ownerOrAgentExplained: "yes" | "no" | "unknown";

  /** 第3層：費用の実態・根拠・資料の提示があったか */
  evidenceProvided: "yes" | "no" | "unknown";
}

// ─── 費目別の詳細（費目固有の追加情報） ─────────────────────────────────────

export interface AgencyFeeDetail {
  feeId: "agency_fee";

  /** 賃料の何ヶ月分か */
  amountMonths: "half" | "one" | "over" | "unknown";

  /** 原則0.5ヶ月分の説明を受けたか */
  principleExplained: "yes" | "no" | "unknown";

  /** 1ヶ月分の書面承諾を求められたか */
  writtenConsentRequested: "yes" | "no" | "unknown";

  /** 貸主側報酬・ADの説明を受けたか */
  landlordFeeExplained: "yes" | "no" | "unknown";

  /** 同一物件への再契約か */
  isRenewal: boolean;

  /** 再契約の場合：新たな仲介行為があったか */
  newBrokerageActExists: "yes" | "no" | "unknown" | null;
}

export interface KeyExchangeDetail {
  feeId: "key_exchange";

  /** 費用受領日（領収書の日付） */
  receivedDate: string | null;

  /** 鍵交換の実施日 */
  executedDate: string | null;

  /** 実施を証明する資料を受け取ったか */
  hasEvidenceDocument: "yes" | "no" | "unknown";

  /** 重説の前後どちらで請求されたか */
  requestedBeforeJuusetsu: "before" | "after" | "same_day" | "unknown";
}

export interface CleaningDetail {
  feeId: "cleaning";

  /** 入居前クリーニングか退去時クリーニングかの説明があったか */
  timingExplained: "yes" | "no" | "unknown";

  /** 金額の根拠・内訳の説明があったか */
  amountBasisExplained: "yes" | "no" | "unknown";

  /** 業者名・実施日の提示があったか */
  vendorInfoProvided: "yes" | "no" | "unknown";
}

export interface OptionalServiceDetail {
  feeId: "disinfection" | "support_24h" | "admin_fee";

  /** 断ったら契約できないと言われたか */
  deniedIfRefused: "yes" | "no" | "nuance" | "unknown";
}

export interface GuarantorDetail2 {
  feeId: "guarantor";

  /** 利用義務の説明があったか */
  mandatoryExplained: "yes" | "no" | "unknown";

  /** 複数社から選べるかの説明があったか */
  companyChoiceExplained: "yes" | "no" | "unknown";

  /** 保証料の算定根拠の説明があったか */
  amountBasisExplained: "yes" | "no" | "unknown";

  /** 継続更新料の説明があったか */
  renewalFeeExplained: "yes" | "no" | "unknown";

  /** 保証会社と管理会社・仲介会社がグループ会社かどうかの説明があったか */
  groupCompanyExplained: "yes" | "no" | "unknown";
}

export interface FireInsuranceDetail {
  feeId: "fire_insurance";

  /** 加入義務の説明があったか */
  mandatoryExplained: "yes" | "no" | "unknown";

  /** 他社プランを選べるかの説明があったか */
  otherPlanChoiceExplained: "yes" | "no" | "unknown";

  /** 指定プランの保険料根拠の説明があったか */
  amountBasisExplained: "yes" | "no" | "unknown";

  /** 保険会社と仲介会社・管理会社が代理店関係にあるかどうかの説明があったか */
  agentRelationshipExplained: "yes" | "no" | "unknown";
}

export interface LabelMismatchDetail {
  feeId: "label_mismatch" | "entity_mismatch" | "unknown_label";

  /** 何が違うか */
  mismatchType: Array<
    | "invoice_vs_receipt"   // 請求書と領収書で会社名が違う
    | "doc_name_differs"     // 書類によって費用の名前が違う
    | "verbal_vs_written"    // 口頭説明と書面が違う
    | "requester_vs_issuer"  // 請求者と領収書発行者が違う
  >;

  /** 違いについて説明を受けたか */
  mismatchExplained: "yes" | "no" | "problem_none_only" | "unknown";
}

export interface SpecialClauseDetail {
  feeId: "special_clause";

  /** 特約の存在を読み上げられたか */
  clauseReadAloud: "yes" | "no" | "unknown";

  /** 借主に不利な内容であることを説明されたか */
  disadvantageExplained: "yes" | "no" | "unknown";

  /** オーナーの条件か業者の条件かを説明されたか */
  sourceExplained: "yes" | "no" | "unknown";

  /** 断った場合どうなるかを説明されたか */
  refusalConsequenceExplained: "yes" | "no" | "unknown";
}

export interface KeyMoneyDetail {
  feeId: "key_money";
  /** 礼金の設定者（オーナー条件か仲介会社条件か） */
  sourceExplained: "owner" | "agent" | "no_explanation" | "unknown";
  /** 交渉・フリーレント転換を試みたか */
  negotiationAttempt: "accepted" | "rejected" | "not_tried" | "didnt_know" | null;
}

// ─── 契約前専用 detail ──────────────────────────────────────────────────────
// 契約前（見積もり段階）の質問の答えを保存する。
// 各費目1〜2問のシンプルな構造。契約後用とは完全に分離。
export interface PreContractDetail {
  kind: "pre_contract";  // 契約前用であることの識別子
  feeId: string;
}

export type FeeDetail =
  | AgencyFeeDetail
  | KeyExchangeDetail
  | CleaningDetail
  | OptionalServiceDetail
  | GuarantorDetail2
  | FireInsuranceDetail
  | LabelMismatchDetail
  | SpecialClauseDetail
  | KeyMoneyDetail
  | PreContractDetail;

// ─── 費目エントリ ────────────────────────────────────────────────────────────

export interface FeeEntry {
  feeId: FeeId2;
  amount: number | null;
  threeLayer: ThreeLayerCheck;
  detail: FeeDetail | null;
}

// ─── 時系列エントリ ──────────────────────────────────────────────────────────

export interface TimelineEntry {
  event:
    | "fee_payment"           // 費用支払い
    | "juusetsu"              // 重要事項説明
    | "contract_sign"         // 契約署名
    | "key_exchange_execute"  // 鍵交換実施
    | "cleaning_execute";     // クリーニング実施

  /** fee_payment など、特定費目に紐づく場合に使用 */
  feeId?: FeeId2 | null;

  date: string | null;
  certainty: "certain" | "approximate" | "unknown";
}

// ─── 業者の対応状況 ──────────────────────────────────────────────────────────

export type AgentResponseType =
  | "written_basis"      // 根拠を書面で示してもらえた
  | "conclusion_only"    // 「問題ありません」とだけ言われた
  | "dimension_switch"   // 「違法ではありません」とだけ言われた
  | "internal_rule"      // 「社内基準で開示できない」と言われた
  | "no_reply_needed"    // 「回答する必要はない」と言われた
  | "partial_answer"     // 一部だけ答えた
  | "ignored"            // 無視された
  | "partial_discount";  // 一部費用を減額してきた

export interface AgentResponse {
  contacted: boolean;
  contactMethod: Array<"email" | "line" | "verbal" | "letter"> | null;
  contactCount: number | null;

  /** 最初の確認から何ヶ月経つか */
  monthsElapsed: number | null;

  responseTypes: AgentResponseType[];

  /** 減額された費目（partial_discountの場合） */
  discountedFees: FeeId2[];

  /** 提示を求めたが出なかった資料 */
  unprovidedDocuments: Array<
    | "calculation_basis"    // 費用の算定根拠
    | "work_evidence"        // 作業実施の証明資料
    | "label_change_reason"  // 費用名目の変遷理由
    | "doc_inconsistency"    // 書類間の不整合の理由
    | "entity_explanation"   // 受領・領収書発行者の説明
    | "juusetsu_timing"      // 重説と費用受領の前後関係
  >;
}

// ─── 契約前のコンテキスト ────────────────────────────────────────────────────
// 契約前フローで取得するユーザーの状況。
// 費目ごとではなくフォーム全体で1セット。
export interface PreContractContext {
  monthlyRent: number;
  contractMonth: "busy" | "off" | "normal";
  // busy: 1〜3月（繁忙期）
  // off:  4〜8月（閑散期）
  // normal: 9〜12月（通常期）
  applicationStatus: "before_apply" | "applied_waiting" | "approved";
  // before_apply: まだ申込んでいない
  // applied_waiting: 申込済み・審査待ち
  // approved: 審査通過済み・見積もり受領済み
  otherCompanyComparison: "yes" | "no" | "planning" | null;
}

// ─── 診断入力（メイン） ──────────────────────────────────────────────────────

export interface DiagnosisInput2 {
  /** 最上位分岐 */
  timing: ContractTiming;

  /** 詳細ステージ */
  stage: ContractStage;

  /** 賃料（任意） */
  monthlyRent: number | null;

  /** 費用合計（任意） */
  totalAmount: number | null;

  /** 選択した費目エントリ */
  fees: FeeEntry[];

  /** 時系列 */
  timeline: TimelineEntry[];

  /** 業者対応状況（確認済みの場合） */
  agentResponse: AgentResponse | null;

  /** 契約前フローのコンテキスト（契約前のみ） */
  preContractContext?: PreContractContext;

  /** メールトーン */
  emailTone: "polite" | "firm" | "factual";
}

// ─── 論点（Issue） ───────────────────────────────────────────────────────────

/** 論点の軸 */
export type IssueAxis =
  | "A" // 説明義務・判断可能性（宅建業者として）
  | "B"; // 法的一般論・制度上の一般論

/** 論点の層・種類 */
export type IssueLayer =
  | "voluntary"             // 任意か必須かの説明
  | "source"                // オーナー条件か業者サービスか
  | "evidence"              // 実態・根拠・資料
  | "timeline"              // 支払・重説・署名・実施日の順序
  | "response"              // 業者回答の質
  | "document_consistency";  // 書類・名目・主体の整合性

/** 対応戦略 */
export type IssueStrategy =
  | "delete"       // 削除を求める
  | "free_rent"    // フリーレント転換を提案
  | "admin_check"  // 行政・消費者センターへの言及
  | "record"       // 記録固定
  | "confirm";     // 根拠確認

export interface Issue2 {
  id: string;
  feeId: FeeId2 | null;
  axis: IssueAxis;
  layer: IssueLayer;
  severity: "high" | "medium" | "low";

  /** 無料診断で表示するラベル */
  label: string;

  /** 軸A：宅建業者としての説明義務・判断可能性の観点 */
  axisAText: string;

  /** 軸B：制度上・法的一般論 */
  axisBText: string | null;

  /** 推奨戦略 */
  strategy: IssueStrategy;

  /** 1通目メールのYes/No質問文（有料メール生成用） */
  yesNoQuestion: string | null;

  /** 1通目メールの資料提示要求文（有料メール生成用） */
  evidenceRequest: string | null;

  /** 1通目メールの説明要求文（有料メール生成用） */
  explanationRequest: string | null;
}

// ─── 診断結果（新版） ────────────────────────────────────────────────────────

export interface DiagnosisResult2 {
  timing: ContractTiming;
  stage: ContractStage;

  /** 検出された論点リスト（重要度順） */
  issues: Issue2[];

  /** 費目別の推奨戦略 */
  feeStrategies: Array<{
    feeId: FeeId2;
    label: string;
    strategy: IssueStrategy;
    reason: string;
  }>;

  /** 複合問題の数（重なりが多いほど優先度が高い） */
  compoundCount: number;

  /** 業者の減額提案があった場合の注意事項 */
  discountWarning: string | null;

  /** フリーレント転換の目安金額 */
  freeRentEstimate: number | null;

  /** 1通目メールの構造（有料課金後に使用） */
  emailStructure: {
    yesNoQuestions: string[];
    evidenceRequests: string[];
    explanationRequests: string[];
  };
}
