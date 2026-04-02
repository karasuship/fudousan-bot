// ── 判定エンジン ──────────────────────────────────────────────────────────────
// 4軸（同意・説明・実態・名目）でズレを検出し、Result を構築する

import { ISSUE_DB } from "./issueDB";
import type { Issue } from "./issueDB";
import type { DiagnosisResult } from "./types";

// ── 型定義 ──────────────────────────────────────────────────────────────────

/** buildResult/detectIssues に渡す統合入力型 */
export type IssueCheckInput = {
  mode: string;
  overallRisk: string;
  score: number;
  fees: string[];
  explanation: string;
  contractMention: string;
  situation: string;
  concernTheme: string;
  issueCount: number;
};

/** buildResult の出力型 */
export type Result = {
  /** 状態を一文で断定的に説明 */
  summary: string;
  /** 構造ルール 3〜5 個 */
  rules: string[];
  /** 入力とルールの照合結果 */
  matches: string[];
  /** detectIssues の結果 */
  issues: Issue[];
  /** 行動を順序付きで 3〜5 個 */
  actions: string[];
};

// ── 4軸判定: detectIssues ────────────────────────────────────────────────────
/**
 * 4軸（同意の有無・説明の有無・実態の有無・名目との一致）で
 * 崩れている論点のみを ISSUE_DB から抽出する
 */
export function detectIssues(input: IssueCheckInput): Issue[] {
  // 4軸でいずれかが崩れている場合のみ抽出対象とする
  const axis1_consent = input.contractMention !== "yes" && input.fees.length > 0;
  const axis2_explanation = input.explanation === "no" || input.explanation === "insufficient";
  const axis3_reality =
    input.fees.includes("key_exchange") ||
    input.fees.includes("cleaning") ||
    input.mode === "maintenance" ||
    input.mode === "move_out" ||
    input.mode === "deposit_refund";
  const axis4_label =
    input.fees.includes("other") ||
    (input.fees.includes("agency_fee") && input.fees.includes("other")) ||
    input.concernTheme === "unknown";

  const anyAxisBroken =
    axis1_consent || axis2_explanation || axis3_reality || axis4_label ||
    input.mode === "contract_review" || input.mode === "maintenance" ||
    input.mode === "move_out" || input.mode === "deposit_refund";

  if (!anyAxisBroken) {
    return [];
  }

  return ISSUE_DB.filter((issue) => issue.condition(input));
}

// ── 照合結果生成 ─────────────────────────────────────────────────────────────
function buildMatches(input: IssueCheckInput, issues: Issue[]): string[] {
  const matches: string[] = [];

  // 軸1：同意の有無
  if (input.contractMention !== "yes" && input.fees.length > 0) {
    matches.push(
      "同意の有無：費用の契約書記載が未確認 → 同意の根拠条項を特定できていない状態"
    );
  } else if (input.contractMention === "yes") {
    matches.push("同意の有無：契約書への記載が確認済み → 同意構造は照合済み");
  }

  // 軸2：説明の有無
  if (input.explanation === "no") {
    matches.push(
      "説明の有無：費用の説明を受けていない → 宅建業法35条の説明義務との構造的不一致"
    );
  } else if (input.explanation === "insufficient") {
    matches.push(
      "説明の有無：説明が不十分 → 算出根拠・任意性の説明が欠如している状態"
    );
  } else if (input.explanation === "yes") {
    matches.push("説明の有無：説明を受けている → 説明軸は照合済み");
  }

  // 軸3：実態の有無
  if (input.fees.includes("key_exchange")) {
    matches.push(
      "実態の有無：鍵交換代 → 鍵交換の実施有無・実施証明が確認されていない"
    );
  }
  if (input.fees.includes("cleaning") && input.explanation !== "yes") {
    matches.push(
      "実態の有無：清掃費 → 実施内容・業者・費用内訳の裏付けが確認されていない"
    );
  }
  if (input.mode === "maintenance") {
    matches.push(
      "実態の有無：管理不備 → 修繕義務（民法606条）との照合が必要"
    );
  }
  if (input.mode === "move_out") {
    matches.push(
      "実態の有無：退去費用 → 通常損耗ガイドラインとの照合が必要"
    );
  }
  if (input.mode === "deposit_refund") {
    matches.push(
      "実態の有無：敷金差引 → 各差引項目の実施根拠と適正額の確認が必要"
    );
  }

  // 軸4：名目との一致
  if (input.fees.includes("other")) {
    matches.push(
      "名目との一致：名目不明費用 → 費用名称と実態サービスの対応が確認されていない"
    );
  }
  if (input.fees.includes("agency_fee") && input.explanation !== "yes") {
    matches.push(
      "名目との一致：仲介手数料 → 宅建業法上限・両手仲介構造との照合が未実施"
    );
  }
  if (input.fees.includes("renewal_fee") || input.fees.includes("recontracting_fee")) {
    matches.push(
      "名目との一致：更新料/再契約料 → 契約種別（普通借家/定期借家）との照合が必要"
    );
  }

  // モード別補足
  if (input.mode === "contract_review") {
    matches.push(
      "名目との一致：特約内容 → ペナルティ特約の3要件（明記・説明・同意）の照合が必要"
    );
  }

  return matches.slice(0, 6);
}

// ── サマリー生成 ─────────────────────────────────────────────────────────────
function buildSummary(input: IssueCheckInput, issues: Issue[]): string {
  if (issues.length === 0) {
    return "入力内容を照合した結果、重大な構造的問題は検出されなかった。念のため費用の記録を保持すること。";
  }

  const categories = [...new Set(issues.map((i) => i.category))];
  const categoryStr = categories.slice(0, 3).join("・");

  if (input.overallRisk === "caution") {
    return `${issues.length}件の構造的問題を検出した——${categoryStr}の各論点で同意・説明・実態・名目のいずれかが崩れている。照合結果に基づき、以下のルールと行動を確認すること。`;
  }
  if (input.overallRisk === "review") {
    return `${issues.length}件の確認事項を検出した——${categoryStr}の論点で説明または同意の構造に確認が必要な点がある。書面による確認で根拠を固めることが次のステップ。`;
  }
  return `${issues.length}件の確認推奨事項を検出した——大きな問題は見当たらないが、${categoryStr}について記録を残しておくことが推奨される。`;
}

// ── ルール抽出 ───────────────────────────────────────────────────────────────
function buildRules(issues: Issue[]): string[] {
  const seen = new Set<string>();
  const rules: string[] = [];

  for (const issue of issues) {
    if (!seen.has(issue.rule)) {
      seen.add(issue.rule);
      rules.push(issue.rule);
    }
    if (rules.length >= 5) break;
  }

  // 常に最低3つ含める（不足時の補完）
  const fallbacks = [
    "宅建業法46条：仲介手数料の上限は賃料1ヶ月分＋消費税。",
    "民法606条：賃貸人は貸室を使用収益に適した状態に維持する義務を負う。",
    "国土交通省原状回復ガイドライン：通常損耗・経年劣化は賃貸人負担が原則。",
  ];
  for (const f of fallbacks) {
    if (rules.length >= 3) break;
    if (!seen.has(f)) {
      seen.add(f);
      rules.push(f);
    }
  }

  return rules.slice(0, 5);
}

// ── アクション抽出 ───────────────────────────────────────────────────────────
function buildActions(issues: Issue[]): string[] {
  const seen = new Set<string>();
  const actions: string[] = [];

  for (const issue of issues) {
    for (const action of issue.nextAction) {
      if (!seen.has(action)) {
        seen.add(action);
        actions.push(action);
      }
      if (actions.length >= 5) return actions;
    }
  }

  // フォールバック
  if (actions.length === 0) {
    return [
      "契約書・重要事項説明書を手元に用意する",
      "各費用の記載箇所を特定する",
      "疑問点をメールで管理会社に送り書面回答を求める",
    ];
  }

  return actions.slice(0, 5);
}

// ── メイン: buildResult ──────────────────────────────────────────────────────
/**
 * DiagnosisResult と InitialFeesMeta（任意）から Result を構築する
 */
export function buildResult(params: {
  result: DiagnosisResult;
  meta?: {
    situation?: string;
    concernTheme?: string;
    fees?: string[];
    explanation?: string;
    contractMention?: string;
  } | null;
}): Result {
  const { result, meta } = params;

  const input: IssueCheckInput = {
    mode: result.mode ?? "",
    overallRisk: result.overallRisk,
    score: result.score,
    fees: meta?.fees ?? [],
    explanation: meta?.explanation ?? "",
    contractMention: meta?.contractMention ?? "",
    situation: meta?.situation ?? "",
    concernTheme: meta?.concernTheme ?? "",
    issueCount: result.issues.length,
  };

  const issues = detectIssues(input);
  const summary = buildSummary(input, issues);
  const rules = buildRules(issues);
  const matches = buildMatches(input, issues);
  const actions = buildActions(issues);

  return { summary, rules, matches, issues, actions };
}
