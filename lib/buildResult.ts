// ── 判定エンジン ──────────────────────────────────────────────────────────────
// 4軸（同意・説明・実態・名目）でズレを検出し、Result を構築する

import { ISSUE_DB } from "./issueDB";
import type { Issue } from "./issueDB";

export type IssueCheckInput = {
  mode: string;
  overallRisk: string;
  score: number;
  facts: any[];
  explanation: string;
  couldRefuse: string;
  hasDocuments: string;
  situation: string;
  issueCount: number;
};

export type Result = {
  summary: string;
  rules: string[];
  matches: string[];
  issues: Issue[];
  actions: string[];
};

export function detectIssues(input: IssueCheckInput): Issue[] {
  return ISSUE_DB.filter((issue) => {
    try {
      return issue.condition(input);
    } catch {
      return false;
    }
  });
}

function buildMatches(input: IssueCheckInput, issues: Issue[]): string[] {
  const matches: string[] = [];

  if (input.explanation === "none" || input.explanation === "pressured" || input.explanation === "rushed") {
    matches.push("説明の有無：費用の説明が不十分または未実施 → 説明義務との構造的不一致");
  } else if (input.explanation === "written") {
    matches.push("説明の有無：書面による説明あり → 説明軸は照合済み");
  } else {
    matches.push("説明の有無：口頭説明のみ → 書面による根拠確認が必要");
  }

  if (input.couldRefuse === "refused_and_pressured" || input.couldRefuse === "told_no_contract") {
    matches.push("同意の有無：任意費用を断ろうとして圧力を受けた → 同意の強制性に問題の可能性");
  } else if (input.couldRefuse === "no") {
    matches.push("同意の有無：断れると思わなかった → 任意費用の説明が不十分な可能性");
  }

  if (input.hasDocuments === "no") {
    matches.push("書面の有無：費用根拠となる書面がない → 根拠の特定が困難な状態");
  }

  const categories = [...new Set(issues.map((i) => i.category))];
  for (const cat of categories.slice(0, 3)) {
    const catIssues = issues.filter((i) => i.category === cat);
    matches.push(`${cat}：${catIssues.length}件の論点を検出`);
  }

  return matches.slice(0, 6);
}

function buildSummary(input: IssueCheckInput, issues: Issue[]): string {
  if (issues.length === 0) {
    return "入力内容を照合した結果、重大な構造的問題は検出されなかった。念のため費用の記録を保持すること。";
  }
  const highCount = issues.filter((i) => i.severity === "high").length;
  const categories = [...new Set(issues.map((i) => i.category))].slice(0, 3).join("・");

  if (highCount >= 2) {
    return `${issues.length}件の構造的問題を検出（うち重大${highCount}件）——${categories}の各論点で同意・説明・実態・名目のいずれかが崩れている。以下のルールと行動を確認すること。`;
  }
  if (issues.length >= 2) {
    return `${issues.length}件の確認事項を検出——${categories}の論点で説明または同意の構造に確認が必要な点がある。書面による確認で根拠を固めることが次のステップ。`;
  }
  return `${issues.length}件の確認推奨事項を検出——${categories}について記録を残しておくことが推奨される。`;
}

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
  const fallbacks = [
    "宅建業法46条：仲介手数料の上限は賃料1ヶ月分＋消費税。",
    "民法606条：賃貸人は貸室を使用収益に適した状態に維持する義務を負う。",
    "国土交通省原状回復ガイドライン：通常損耗・経年劣化は賃貸人負担が原則。",
  ];
  for (const f of fallbacks) {
    if (rules.length >= 3) break;
    if (!seen.has(f)) { seen.add(f); rules.push(f); }
  }
  return rules.slice(0, 5);
}

function buildActions(issues: Issue[]): string[] {
  const seen = new Set<string>();
  const actions: string[] = [];
  for (const issue of issues) {
    for (const action of issue.nextAction) {
      if (!seen.has(action)) { seen.add(action); actions.push(action); }
      if (actions.length >= 5) return actions;
    }
  }
  if (actions.length === 0) {
    return [
      "契約書・重要事項説明書を手元に用意する",
      "各費用の記載箇所を特定する",
      "疑問点をメールで管理会社に送り書面回答を求める",
    ];
  }
  return actions.slice(0, 5);
}

export function buildResult(params: {
  result: any;
  meta?: any;
}): Result {
  const { result, meta } = params;
  const input: IssueCheckInput = {
    mode: result.mode ?? "",
    overallRisk: result.overallRisk,
    score: result.score,
    facts: meta?.facts ?? [],
    explanation: meta?.explanation ?? "",
    couldRefuse: meta?.couldRefuse ?? "",
    hasDocuments: meta?.hasDocuments ?? "",
    situation: meta?.situation ?? "",
    issueCount: result.issues?.length ?? 0,
  };
  const issues = detectIssues(input);
  const summary = buildSummary(input, issues);
  const rules = buildRules(issues);
  const matches = buildMatches(input, issues);
  const actions = buildActions(issues);
  return { summary, rules, matches, issues, actions };
}
