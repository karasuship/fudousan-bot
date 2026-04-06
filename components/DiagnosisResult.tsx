"use client";

import { useState, useEffect } from "react";
import type { DiagnosisResult, RiskLevel } from "@/lib/types";
import type { InitialFeesMeta } from "./DiagnosisForm";
import { MODE_CONFIG } from "@/lib/modes";
import { track } from "@/lib/analytics";
import EmailLockSection from "./EmailLockSection";
import PurchaseCTA from "./PurchaseCTA";
import { buildResult } from "@/lib/buildResult";

interface Props {
  result: DiagnosisResult;
  initialFeesMeta?: InitialFeesMeta | null;
}

// ─── initial_fees: 状況別テキスト ────────────────────────────────────────────
const IF_SITUATION_TEXT: Record<string, { status: string; desc: string; statusColor: string }> = {
  pre_estimate: {
    status: "見積もり確認中",
    desc: "この段階ではまだ支払い義務はありません。鍵交換・クリーニングなどの費用は見積書から削除を求めることができます。名目と金額を今すぐ確認しましょう。",
    statusColor: "bg-green-100 text-green-700",
  },
  pre_sign: {
    status: "申込中・契約直前",
    desc: "署名前であれば支払い義務はなく、費用の削除・修正を求めることができます。特約・特記事項に書かれていても有効要件を満たさない場合があります。署名前が最後の機会です。",
    statusColor: "bg-blue-100 text-blue-700",
  },
  pre_payment: {
    status: "契約済み・支払い前",
    desc: "支払い前であれば、根拠の開示を求めたうえで支払いを保留することができます。内訳・実施記録・契約書の記載箇所を書面で確認してから支払いましょう。",
    statusColor: "bg-amber-100 text-amber-700",
  },
  paid: {
    status: "支払い済み",
    desc: "支払い済みでも、根拠が存在しない費用については返還請求が可能な場合があります。まず明細・領収書・契約書を照合して根拠の有無を確認しましょう。",
    statusColor: "bg-slate-100 text-slate-600",
  },
};

// ─── initial_fees: 状況別アクションステップ ─────────────────────────────────
const IF_SITUATION_ACTIONS: Record<string, { num: string; title: string; desc: string }[]> = {
  pre_estimate: [
    { num: "1", title: "各費用が「必須」か「任意」か確認する", desc: "鍵交換・クリーニングなど、任意の費用は断れる場合があります。見積書を1項目ずつ確認しましょう。" },
    { num: "2", title: "見積書の全費用の根拠を把握する", desc: "名目と金額の根拠を確認し、不明な費用は書面で説明を求めましょう。" },
    { num: "3", title: "疑問は口頭でなくメールで記録する", desc: "書面でやり取りすることで、確認した内容が記録として残ります。" },
  ],
  pre_sign: [
    { num: "1", title: "署名前に費用の根拠を契約書で確認する", desc: "署名後は条件変更が難しくなります。疑問点は今すぐ確認しましょう。" },
    { num: "2", title: "任意費用は断れるか確認する", desc: "オプション費用は断れる場合があります。必須と任意の区別を書面で確認を。" },
    { num: "3", title: "疑問点をメールで質問してから署名する", desc: "確認事項をメールで質問し、回答を得てから署名するのが安全です。" },
  ],
  pre_payment: [
    { num: "1", title: "支払い前に内訳の説明を求める", desc: "各費用の名目・金額・根拠を書面で提示してもらいましょう。" },
    { num: "2", title: "契約書・重要事項説明書と照合する", desc: "費用の記載箇所を確認し、請求の根拠が契約書にあるか照合します。" },
    { num: "3", title: "疑問点はメールで確認してから支払う", desc: "回答を記録として残してから支払うことが重要です。" },
  ],
  paid: [
    { num: "1", title: "明細書・領収書を保存・整理する", desc: "全費用の明細と領収書を手元に揃えておきましょう。" },
    { num: "2", title: "契約書・重要事項説明書と照合する", desc: "請求された費用が契約書に記載されているか確認します。" },
    { num: "3", title: "疑問があれば書面で確認記録を残す", desc: "不明点はメールで問い合わせ、回答を保存しておきましょう。" },
  ],
};

// ─── initial_fees: 費用別・一般的な考え方 ─────────────────────────────────────
// 表示はあくまで一般的な参考情報。個別事案の法的判断ではありません。
const IF_FEE_KNOWLEDGE: Record<string, { title: string; body: string }> = {
  agency_fee: {
    title: "仲介手数料",
    body: "宅建業法では仲介手数料に上限の考え方があり、重要事項説明書への記載・借主への説明が求められています。請求額の根拠や算出方法を書面で確認することが実務上よく行われます。",
  },
  key_exchange: {
    title: "鍵交換代",
    body: "費用負担の根拠・時期・実施主体については、契約書・重要事項説明書への記載と説明内容が確認ポイントです。任意費用の場合、断れる可能性も確認に値します。",
  },
  cleaning: {
    title: "入居前クリーニング費",
    body: "根拠の記載・金額の算出方法・任意か必須かの説明有無が確認ポイントです。費用の水準については他社見積もりと比較することが参考になる場合があります。",
  },
  guarantor: {
    title: "保証会社費用",
    body: "加入条件・費用内訳・更新時の費用発生根拠については、契約書・重要事項説明書への記載内容が確認ポイントとなります。",
  },
  renewal_fee: {
    title: "更新料",
    body: "契約書・重要事項説明書に根拠が明記されているかどうかが重要な確認ポイントです。定期借家契約では「更新」という仕組みがなく、再契約とは性質が異なります。",
  },
  recontracting_fee: {
    title: "再契約料",
    body: "法律上の必須費用ではなく、契約書への記載と説明の有無が重要な確認ポイントです。金額の算出根拠が契約書に明記されているか確認することが実務上重要です。",
  },
  other: {
    title: "名目不明・オプション費用",
    body: "消毒・サポート保険等のオプションは任意の場合があります。任意か必須かの説明・費用根拠の確認が特に重要です。名目が不明な費用は個別に根拠を確認することをお勧めします。",
  },
};

// ─── initial_fees: 確認前に整理しておくとよいもの ────────────────────────────
const IF_DOCUMENTS_BY_SITUATION: Record<string, string[]> = {
  pre_estimate: [
    "見積書（費用の一覧・金額）",
    "案内・説明資料",
    "口頭説明で気になった点のメモ",
  ],
  pre_sign: [
    "見積書・初期費用一覧",
    "契約書（案）または重要事項説明書（案）",
    "口頭説明で気になった点のメモ",
  ],
  pre_payment: [
    "見積書・請求書",
    "契約書",
    "重要事項説明書",
    "口頭説明で気になった点のメモ",
  ],
  paid: [
    "明細書・請求書",
    "領収書",
    "契約書",
    "重要事項説明書",
    "口頭説明で気になった点のメモ",
  ],
};

// ─── initial_fees: 確認用テンプレ（安全設計・事実確認型）───────────────────
function getIfConfirmationTemplate(situation: string): string {
  if (situation === "pre_estimate") {
    return `件名：見積書の費用項目についての確認のお願い

お世話になっております。

ご提示いただいた見積書の費用について、以下の点を確認させていただけますでしょうか。

・各費用が必須か任意かの区別
・各費用の根拠となる法令・契約条項
・任意費用については、加入しない場合の取り扱い

お手数をおかけしますが、書面でご回答いただけますと幸いです。
どうぞよろしくお願いいたします。`;
  }

  if (situation === "pre_sign") {
    return `件名：契約書の費用項目についての確認のお願い

お世話になっております。

署名に先立ち、契約書・重要事項説明書に記載されている費用について確認させていただけますでしょうか。

・各費用の根拠となる条項と算出方法
・特約・特記事項に記載されている費用の必須・任意の区別
・任意費用については、加入しない場合の取り扱い

内容を確認したうえで署名の判断をしたいと考えております。
お手数ですが、書面でご回答いただけますと幸いです。
どうぞよろしくお願いいたします。`;
  }

  if (situation === "pre_payment") {
    return `件名：ご請求費用の根拠についての確認のお願い

お世話になっております。

ご請求いただいた費用について、支払い前に以下の点を書面で確認させていただけますでしょうか。

・各費用の名目と根拠（契約書・重要事項説明書の記載箇所）
・実施が伴う費用については実施記録・領収書
・金額の算出方法・内訳

内容を確認したうえで対応を検討いたします。
お手数をおかけしますが、書面でご回答いただけますと幸いです。
どうぞよろしくお願いいたします。`;
  }

  // paid
  return `件名：お支払い済み費用の明細についての確認のお願い

お世話になっております。

先日お支払いした費用について、以下の点を確認させていただけますでしょうか。

・各費用の名目と根拠（契約書・重要事項説明書の記載箇所）
・実施が伴う費用については実施記録・領収書
・費用の算出方法・内訳

お手数をおかけしますが、書面でご回答いただけますと幸いです。
内容を確認のうえ、対応を検討いたします。
どうぞよろしくお願いいたします。`;
}

// ─── initial_fees: 状況別の権利サマリー ─────────────────────────────────────
function getSituationPrefix(situation?: string): string | null {
  if (situation === "pre_estimate") return "この費用はそもそも支払い義務がありません。見積書からの削除を求めることができます。";
  if (situation === "pre_sign") return "署名前であれば支払い義務はなく、契約書からの削除・修正を求めることができます。署名前が最後の機会です。";
  if (situation === "pre_payment") return "支払い前であれば、根拠の開示を求めたうえで支払いを保留することができます。";
  if (situation === "paid") return "支払い済みでも、根拠が存在しない場合は返還請求が可能な場合があります。";
  return null;
}

// ─── コピーボタン ────────────────────────────────────────────────
function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
        copied
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
      } ${className}`}
    >
      {copied ? "コピーしました ✓" : "コピーする"}
    </button>
  );
}

// ─── initial_fees: パーソナライズポイント生成（理由+行動フォーマット）────────
function getIfPersonalizedPoints(
  concernTheme: string,
  issues: string[],
  overallRisk: RiskLevel,
  meta?: { fees?: string[]; explanation?: string; contractMention?: string; situation?: string }
): string[] {
  const fees = meta?.fees ?? [];
  const explanation = meta?.explanation ?? "yes";
  const contractMention = meta?.contractMention ?? "unknown";
  const situation = meta?.situation ?? "";
  const points: string[] = [];

  // 費用ごと・説明状況を組み合わせた個別ポイント
  if (fees.includes("agency_fee")) {
    if (explanation === "no") {
      points.push("仲介手数料について説明を受けていないため、請求根拠・算出方法を書面で確認することが重要です");
    } else if (explanation === "insufficient") {
      points.push("仲介手数料の説明が不十分なため、根拠となる条項と算出方法を書面で確認しましょう");
    } else if (contractMention === "unknown") {
      points.push("仲介手数料が契約書に記載されているか未確認のため、記載箇所と算出根拠の確認が必要です");
    } else {
      points.push("仲介手数料の算出方法・根拠を書面で記録として残しておくことが有効です");
    }
  }

  if ((fees.includes("key_exchange") || fees.includes("cleaning")) && points.length < 3) {
    if (explanation === "no" || explanation === "insufficient") {
      points.push("鍵交換代・クリーニング費は任意の場合があるため、必須か任意かの説明を書面で確認することが重要です");
    } else {
      points.push("鍵交換代・クリーニング費の費用負担根拠が契約書に記載されているか確認しましょう");
    }
  }

  if (fees.includes("guarantor") && points.length < 3) {
    points.push("保証会社費用の加入条件・費用内訳については、契約書記載の根拠を書面で確認することが重要です");
  }

  // 状況×契約書未確認の組み合わせ
  if (points.length < 3 && contractMention === "unknown") {
    if (situation === "pre_estimate" || situation === "pre_sign") {
      points.push("署名前の段階のため、今すぐ契約書・重要事項説明書で各費用の記載を確認することが最優先です");
    } else if (situation === "pre_payment") {
      points.push("支払い前の段階のため、内訳・根拠を書面で確認してから支払うことが重要です");
    }
  }

  // フォールバック（費用が上記に当てはまらない場合）
  if (points.length === 0) {
    const themePoints: Record<string, string> = {
      agency: "仲介手数料について契約書への記載確認・算出方法の把握が最初のステップです",
      optional: "任意費用については断れる可能性があるため、必須か任意かを書面で確認することが先決です",
      key: "鍵交換代は任意の場合があるため、費用負担の根拠と任意性を書面で確認しましょう",
      cleaning: "クリーニング費については根拠の契約書記載と算出方法の確認が重要です",
      guarantor: "保証会社費用については加入条件と費用内訳を書面で確認することが重要です",
      overall: "各費用の根拠を個別に書面で確認することが最初のステップです",
      unknown: "費用の名目と根拠を一つずつ整理して、不明な項目から確認を始めましょう",
    };
    if (concernTheme && themePoints[concernTheme]) points.push(themePoints[concernTheme]);
  }

  if (overallRisk === "caution" && points.length < 3) {
    points.push("複数の費用で根拠・説明が不明確なため、各項目を個別に書面で確認することが重要です");
  }

  return points.slice(0, 3);
}

function getIfSituationConclusion(situation: string, overallRisk: RiskLevel): string {
  if (overallRisk === "safe") {
    return "現時点では大きな懸念は見当たりません。念のため費用の根拠を書面で確認しておくと安心です。";
  }
  if (situation === "paid") {
    return "このため、まず明細・領収書・契約書を手元に揃えて照合することが確認の出発点です。";
  }
  if (situation === "pre_estimate" || situation === "pre_sign") {
    return "このため、署名や支払いの前に書面で費用の根拠を確認することが優先度の高いアクションです。";
  }
  return "このため、支払いの前に書面で費用の内訳・根拠を確認することが優先度の高いアクションです。";
}

// ─── スコア円グラフ ──────────────────────────────────────────────
function ScoreCircle({ score, ringColor }: { score: number; ringColor: string }) {
  const r = 36;
  const cx = 46;
  const cy = 46;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <svg width="92" height="92" viewBox="0 0 92 92" aria-label={`確認スコア ${score}点`} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={ringColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x={cx} y={cy - 5} textAnchor="middle" fill="white"
        style={{ fontSize: "21px", fontWeight: 700, fontFamily: "inherit" }}>
        {score}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.5)"
        style={{ fontSize: "9px", fontFamily: "inherit" }}>
        / 100
      </text>
    </svg>
  );
}

// ─── リスクレベル設定 ────────────────────────────────────────────
const RISK_CONFIG: Record<RiskLevel, {
  badge: string;
  badgeBg: string;
  ringColor: string;
  headline: string;
  subtext: string;
  issueBg: string;
  issueBorder: string;
  issueIconBg: string;
  issueIconColor: string;
  showTopCTA: boolean;
}> = {
  safe: {
    badge: "問題少",
    badgeBg: "bg-green-400/20 text-green-300",
    ringColor: "#4ade80",
    headline: "現時点での大きな懸念は見当たりませんでした",
    subtext: "念のため契約書の内容を確認しておくと安心です。疑問点は書面で記録に残しましょう。",
    issueBg: "bg-green-50",
    issueBorder: "border-green-100",
    issueIconBg: "bg-green-100",
    issueIconColor: "text-green-600",
    showTopCTA: false,
  },
  review: {
    badge: "要確認",
    badgeBg: "bg-amber-400/20 text-amber-300",
    ringColor: "#fbbf24",
    headline: "確認が必要な費用が見つかりました",
    subtext: "入力内容と一般的な確認基準を照合した結果、根拠の説明・契約書への記載を確認すべき項目があります。",
    issueBg: "bg-amber-50",
    issueBorder: "border-amber-100",
    issueIconBg: "bg-amber-100",
    issueIconColor: "text-amber-600",
    showTopCTA: true,
  },
  caution: {
    badge: "要注意",
    badgeBg: "bg-red-400/20 text-red-300",
    ringColor: "#f87171",
    headline: "複数の重要な確認事項が見つかりました",
    subtext: "入力内容と照合した結果、費用の根拠・算出方法・契約書記載について複数の確認ポイントがあります。",
    issueBg: "bg-red-50",
    issueBorder: "border-red-100",
    issueIconBg: "bg-red-100",
    issueIconColor: "text-red-500",
    showTopCTA: true,
  },
};

// ─── デフォルト 3ステップ（モード未指定時） ──────────────────────────
const DEFAULT_ACTION_STEPS = [
  {
    num: "1",
    title: "契約書・重要事項説明書を手元に用意する",
    desc: "費用の記載箇所を確認し、根拠となる条項を特定する。",
  },
  {
    num: "2",
    title: "各費用の根拠・算出方法を把握する",
    desc: "請求された費用がどの条項に基づくか、金額の計算方法が妥当かを確認する。",
  },
  {
    num: "3",
    title: "書面（メール）で管理会社に確認する",
    desc: "疑問点をメールで送り、回答を記録として残す。口頭ではなく書面が重要。",
  },
];

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

// ─── 費目キー → 理由文 マッピング（完全網羅） ───────────────────────────────
const FEE_REASON_MAP: Record<string, string> = {
  agency_fee:   "仲介手数料の見直し余地があります",
  guarantor:    "保証会社費用に確認余地があります",
  cleaning:     "清掃費用の内容確認が必要です",
  key_exchange: "鍵交換費用は必須とは限りません",
  disinfection: "消毒・除菌費用は任意のサービスです",
  support_24h:  "24時間サポートプランは任意加入です",
  admin_fee:    "事務手数料・書類作成費に確認余地があります",
  other:        "任意費用（消毒・24時間サポート・事務手数料等）が含まれています",
};

// ─── メイン ───────────────────────────────────────────────────────
export default function DiagnosisResult({ result, initialFeesMeta }: Props) {
  const cfg = RISK_CONFIG[result.overallRisk];
  const modeCfg = result.mode ? MODE_CONFIG[result.mode] : null;
  const headline = modeCfg
    ? modeCfg.verdictHeadline(result.overallRisk)
    : cfg.headline;
  const subtext = modeCfg?.subtext ?? cfg.subtext;

  // initial_fees: 状況別アクションステップを使用
  const situationInfo = (result.mode === "initial_fees" && initialFeesMeta?.situation)
    ? IF_SITUATION_TEXT[initialFeesMeta.situation] ?? null
    : null;
  const situationActions = (result.mode === "initial_fees" && initialFeesMeta?.situation)
    ? IF_SITUATION_ACTIONS[initialFeesMeta.situation] ?? null
    : null;
  const actionSteps = situationActions ?? (modeCfg ? modeCfg.actionSteps : DEFAULT_ACTION_STEPS);

  // initial_fees: 一般的な考え方（費用別知識カード）
  const knowledgeCards = result.mode === "initial_fees"
    ? (result.estimatedBreakdown ?? [])
        .map((item) => IF_FEE_KNOWLEDGE[item.feeType])
        .filter((k): k is NonNullable<typeof k> => k != null)
    : [];

  // initial_fees: パーソナライズポイント
  const personalizedPoints = situationInfo
    ? getIfPersonalizedPoints(
        initialFeesMeta?.concernTheme ?? "",
        result.issues.map((i) => i.explanation),
        result.overallRisk,
        {
          fees: initialFeesMeta?.fees,
          explanation: initialFeesMeta?.explanation,
          contractMention: initialFeesMeta?.contractMention,
          situation: initialFeesMeta?.situation,
        }
      )
    : [];
  const situationConclusion = situationInfo
    ? getIfSituationConclusion(initialFeesMeta?.situation ?? "", result.overallRisk)
    : "";

  // initial_fees: 書類チェックリスト・確認テンプレ
  const docChecklist = (result.mode === "initial_fees" && initialFeesMeta?.situation)
    ? (IF_DOCUMENTS_BY_SITUATION[initialFeesMeta.situation] ?? IF_DOCUMENTS_BY_SITUATION["pre_payment"])
    : null;
  const confirmTemplate = result.mode === "initial_fees"
    ? getIfConfirmationTemplate(initialFeesMeta?.situation ?? "pre_payment")
    : null;

  // analytics: fire once on result mount
  useEffect(() => {
    track("diagnosis_completed", {
      mode: result.mode ?? "unknown",
      overallRisk: result.overallRisk,
      score: result.score,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const structuredResult = buildResult({ result, meta: initialFeesMeta });

  // ─── initial_fees: 強い結論ブロック用データ ────────────────────
  const isInitialFees = result.mode === "initial_fees";
  const conclusionGap = result.guidelineReferenceGap;
  // マッピング方式: 選択費目 → 理由文（1対1完全対応・抜け漏れなし）
  const conclusionReasons: string[] = isInitialFees && initialFeesMeta?.fees
    ? initialFeesMeta.fees
        .map((fee) => FEE_REASON_MAP[fee])
        .filter((r): r is string => Boolean(r))
    : [];
  // ─── 主役金額（negotiationLines.realistic.total を第1優先、なければ guidelineReferenceGap）
  const primaryAmount: number | undefined = isInitialFees
    ? (result.negotiationLines?.realistic.total ?? (conclusionGap !== undefined && conclusionGap > 0 ? conclusionGap : undefined))
    : (result.estimatedRefundMax > 0 ? result.estimatedRefundMax : undefined);

  const roundK = (n: number) => Math.round(n / 1000) * 1000;

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════
          LAYER 1-A: Hero Summary Card
      ══════════════════════════════════════════ */}
      <div className="rounded-2xl bg-slate-900 p-6 text-white space-y-4">
        {/* Top row: score circle + amount */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 flex flex-col items-center gap-1">
            <ScoreCircle score={result.score} ringColor={cfg.ringColor} />
            <span className="text-xs text-slate-500">確認スコア</span>
          </div>
          <div className="flex-1 min-w-0">
            {primaryAmount !== undefined && primaryAmount > 0 && (
              <>
                <p className="text-3xl font-extrabold tabular-nums tracking-tight text-white leading-none mb-1">
                  約{fmt(primaryAmount)}
                </p>
              </>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${cfg.badgeBg}`}>
                {cfg.badge}
              </span>
              {primaryAmount !== undefined && primaryAmount > 0 && (
                <span className="text-xs text-slate-400">確認・交渉の余地あり</span>
              )}
              {modeCfg && (
                <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-slate-300">
                  {modeCfg.icon} {modeCfg.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3 bullet reasons */}
        {conclusionReasons.length > 0 && (
          <ul className="space-y-1">
            {conclusionReasons.map((r) => (
              <li key={r} className="flex items-start gap-1.5 text-xs text-slate-300">
                <span className="text-slate-500 shrink-0 mt-0.5">・</span>
                {r}
              </li>
            ))}
          </ul>
        )}

        {/* 3 negotiation line mini badges */}
        {result.negotiationLines && (() => {
          const nl = result.negotiationLines!;
          return (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs bg-white/10 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full">
                最低ライン {fmt(roundK(nl.minimum.total))}
              </span>
              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                現実ライン {fmt(roundK(nl.realistic.total))}
              </span>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                強気ライン {fmt(roundK(nl.aggressive.total))}
              </span>
            </div>
          );
        })()}

        {/* CTA #1 */}
        {cfg.showTopCTA && (
          <div className="pt-2 space-y-2">
            <PurchaseCTA placement="verdict" maxRefund={primaryAmount} mode={result.mode} />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          LAYER 1-B: Action Steps Card
      ══════════════════════════════════════════ */}
      {actionSteps.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">次の行動</p>
          <div className="space-y-3">
            {actionSteps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {"num" in step ? step.num : String(i + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  {"title" in step ? (
                    <>
                      <p className="text-sm font-semibold text-slate-700 leading-snug">{step.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{step as unknown as string}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          LAYER 1-C: Compact Verdict Strip
      ══════════════════════════════════════════ */}
      <div className="rounded-xl bg-slate-900 px-4 py-3 flex flex-wrap items-center gap-3">
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${cfg.badgeBg}`}>
          {cfg.badge}
        </span>
        <span className="text-sm font-semibold text-white flex-1 min-w-0 leading-snug">{headline}</span>
        <span className="text-xs text-slate-400 tabular-nums shrink-0">{result.score} / 100</span>
        {result.mode === "initial_fees" && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            result.overallRisk === "caution"
              ? "bg-red-400/20 text-red-300"
              : result.overallRisk === "review"
              ? "bg-amber-400/20 text-amber-300"
              : "bg-green-400/20 text-green-300"
          }`}>
            優先度：{result.overallRisk === "caution" ? "高" : result.overallRisk === "review" ? "中" : "低"}
          </span>
        )}
      </div>

      {/* ══════════════════════════════════════════
          LAYER 2-D: "Why this result" summary card
          (merges NEW-1 summary + NEW-2 rules + NEW-3 matches + NEW-4 issues)
      ══════════════════════════════════════════ */}
      <details className="rounded-2xl border border-blue-100 bg-blue-50 overflow-hidden" open>
        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-blue-100/60 transition-colors list-none">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">この診断結果の根拠</p>
            <p className="text-sm text-blue-900 leading-snug font-medium line-clamp-2">{structuredResult.summary}</p>
          </div>
          <svg className="w-4 h-4 text-blue-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-5 pb-5 border-t border-blue-100 bg-white">
          {/* Summary full */}
          <div className="pt-4 pb-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">結論</p>
            <p className="text-sm text-slate-700 leading-relaxed">{structuredResult.summary}</p>
          </div>

          {/* Rules count + list */}
          {structuredResult.rules.length > 0 && (
            <div className="pt-3 pb-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                適用ルール{" "}
                <span className="inline-block bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-xs font-semibold ml-1">
                  {structuredResult.rules.length}件
                </span>
              </p>
              <ul className="space-y-2">
                {structuredResult.rules.map((rule, i) => (
                  <li key={i} className="flex gap-2 items-start text-xs text-slate-700">
                    <span className="shrink-0 text-blue-500 font-bold mt-0.5">§{i + 1}</span>
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Matches one-liner per axis */}
          {structuredResult.matches.length > 0 && (
            <div className="pt-3 pb-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                照合結果（{structuredResult.matches.length}軸）
              </p>
              <ul className="space-y-1.5">
                {structuredResult.matches.map((match, i) => {
                  const [axis, result_] = match.split(" → ");
                  return (
                    <li key={i} className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-500">{axis}</span>
                      {result_ && <span className="text-slate-500"> → {result_}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Issues: count badge + titles */}
          {structuredResult.issues.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                問題点{" "}
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ml-1 ${cfg.issueBg} ${cfg.issueIconColor}`}>
                  {structuredResult.issues.length}件
                </span>
              </p>
              <ul className="space-y-3">
                {structuredResult.issues.map((issue) => (
                  <li
                    key={issue.id}
                    className={`rounded-xl border p-4 ${cfg.issueBg} ${cfg.issueBorder}`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${cfg.issueIconBg}`}>
                        <svg className={`w-3.5 h-3.5 ${cfg.issueIconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                            {issue.category}
                          </span>
                          <p className="text-sm font-semibold text-slate-800 leading-snug">{issue.title}</p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2">{issue.explanation}</p>
                        <details className="text-xs">
                          <summary className="text-slate-400 cursor-pointer hover:text-slate-600 list-none flex items-center gap-1 select-none">
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            確認ポイントを見る
                          </summary>
                          <ul className="mt-2 space-y-1 pl-1">
                            {issue.checkPoints.map((cp, ci) => (
                              <li key={ci} className="flex items-start gap-1.5 text-slate-600">
                                <span className="text-slate-300 shrink-0 font-bold">{ci + 1}.</span>
                                <span>{cp}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>

      {/* ══════════════════════════════════════════
          LAYER 2-E: "Your case" card (あなたのケース)
      ══════════════════════════════════════════ */}
      {situationInfo && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            あなたのケース
          </p>
          <div className="flex items-start gap-3 flex-wrap mb-3">
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${situationInfo.statusColor}`}>
              {situationInfo.status}
            </span>
            <p className="text-sm text-slate-700 leading-relaxed">{situationInfo.desc}</p>
          </div>

          {(() => {
            const prefix = getSituationPrefix(initialFeesMeta?.situation);
            return prefix ? (
              <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                <p className="text-xs font-semibold text-blue-700 leading-relaxed">{prefix}</p>
              </div>
            ) : null;
          })()}

          {personalizedPoints.length > 0 && (
            <div className="border-t border-slate-100 pt-3 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500">今回の入力をふまえた確認ポイント</p>
              <ul className="space-y-2">
                {personalizedPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-amber-500 shrink-0 font-bold text-xs mt-0.5">▸</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                <p className="text-xs text-slate-600 leading-relaxed">{situationConclusion}</p>
              </div>
            </div>
          )}

          {/* この結果の判断に使われた情報（折りたたみ・closed by default） */}
          {initialFeesMeta && (
            <details className="mt-3 border-t border-slate-100 pt-3">
              <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-500 list-none flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                この結果の判断に使われた情報
              </summary>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-2 pl-1">
                <span className="text-slate-400">状況</span>
                <span className="text-slate-600">{situationInfo.status}</span>
                <span className="text-slate-400">説明状況</span>
                <span className={
                  initialFeesMeta.explanation === "no" ? "text-red-500" :
                  initialFeesMeta.explanation === "insufficient" ? "text-amber-600" :
                  "text-slate-600"
                }>
                  {initialFeesMeta.explanation === "no" ? "説明なし" :
                   initialFeesMeta.explanation === "insufficient" ? "不十分" : "説明あり"}
                </span>
                <span className="text-slate-400">契約書記載</span>
                <span className={initialFeesMeta.contractMention === "unknown" ? "text-amber-600" : "text-slate-600"}>
                  {initialFeesMeta.contractMention === "yes" ? "確認済み" : "未確認・不明"}
                </span>
                <span className="text-slate-400">選択された費用</span>
                <span className="text-slate-600 leading-relaxed">
                  {initialFeesMeta.fees.map((f) => ({
                    agency_fee:        "仲介手数料",
                    key_exchange:      "鍵交換代",
                    cleaning:          "清掃代",
                    guarantor:         "保証会社費用（条件次第）",
                    disinfection:      "消毒・除菌代",
                    support_24h:       "24時間サポート",
                    admin_fee:         "事務手数料・書類作成費",
                    renewal_fee:       "更新料",
                    recontracting_fee: "再契約料",
                    other:             "その他任意費用",
                  } as Record<string, string>)[f] ?? f).join("・")}
                </span>
              </div>
            </details>
          )}

          {/* 長い補足テキスト（折りたたみ） */}
          {situationInfo && (
            <details className="mt-3 border-t border-slate-100 pt-3">
              <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-500 list-none flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                次に考えられる選択肢
              </summary>
              <ul className="space-y-3 mt-3">
                {[
                  {
                    icon: "✉️",
                    title: "管理会社・仲介会社に書面で確認する",
                    desc: "費用の根拠・算出方法・任意性について書面でやり取りすることで、確認記録が残ります。",
                  },
                  {
                    icon: "🔍",
                    title: "他社の見積もりや条件と比較する",
                    desc: "同条件の他社見積もりと比較することで、費用の水準や内容を確認する参考になる場合があります。",
                  },
                  {
                    icon: "🏛️",
                    title: "公的な相談窓口への相談を検討する",
                    desc: "消費生活センター・宅建協会の相談窓口など、無料で相談できる公的機関があります。",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3 items-start">
                    <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-700 leading-snug">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* ── ガイドライン目安との差額（initial_fees 以外のみ） ── */}
      {result.guidelineReferenceGap !== undefined && !isInitialFees && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            ガイドライン目安との差額
          </p>
          <p className="text-xs text-amber-700 mb-3">確認・交渉の余地がある金額の目安</p>
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1 mb-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-700 tabular-nums tracking-tight">
              +{fmt(result.guidelineReferenceGap)}
            </span>
          </div>
          <p className="text-xs text-amber-600 leading-relaxed">
            目安額（約{fmt(result.guidelineReferenceAmount ?? 0)}）を超えている分です。この差額がそのまま返金・値引き額になるわけではありませんが、確認・交渉を始める根拠になります。
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════
          LAYER 3-F: Fee detail accordion
      ══════════════════════════════════════════ */}
      {result.itemizedReviewBreakdown && result.itemizedReviewBreakdown.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
            <div>
              <p className="text-xs font-semibold text-slate-600">費目別の確認対象と着地点候補</p>
              <p className="text-xs text-slate-400 mt-0.5">費目ごとに交渉しやすさと現実的な着地候補を整理</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
            {/* 保証会社費用内訳（guaranteeBreakdown がある場合） */}
            {result.guaranteeBreakdown && (result.guaranteeBreakdown.baseFee !== undefined || result.guaranteeBreakdown.adminFee !== undefined) && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-blue-800">保証会社費用の内訳分析</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {result.guaranteeBreakdown.baseFee !== undefined && (
                    <>
                      <span className="text-blue-600">保証料本体</span>
                      <span className="text-blue-800 font-medium tabular-nums">{fmt(result.guaranteeBreakdown.baseFee)}</span>
                    </>
                  )}
                  {result.guaranteeBreakdown.adminFee !== undefined && (
                    <>
                      <span className="text-blue-600">委託保証料</span>
                      <span className="text-blue-800 font-medium tabular-nums">{fmt(result.guaranteeBreakdown.adminFee)}</span>
                    </>
                  )}
                  {result.guaranteeBreakdown.baseExcess > 0 && (
                    <>
                      <span className="text-amber-600 font-semibold">保証料本体・相場超過分</span>
                      <span className="text-amber-800 font-bold tabular-nums">{fmt(result.guaranteeBreakdown.baseExcess)}</span>
                    </>
                  )}
                </div>
                {result.guaranteeBreakdown.baseExcess > 0 && (
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {result.guaranteeBreakdown.guarantorStatus === "has"
                      ? "連帯保証人あり：保証料本体の相場目安は賃料の約30%です。"
                      : "連帯保証人なし：保証料本体の相場目安は賃料の約50%です。"}
                    相場超過分（{fmt(result.guaranteeBreakdown.baseExcess)}）について、根拠の確認・見直しを求めることができます。
                  </p>
                )}
                {result.guaranteeBreakdown.adminFee !== undefined && result.guaranteeBreakdown.adminFee > 0 && (
                  <p className="text-xs text-blue-700 leading-relaxed">
                    委託保証料は不動産屋への手数料です。直接保証会社と契約すれば省ける場合があります。
                  </p>
                )}
              </div>
            )}

            {/* Compact summary rows + nested details per fee */}
            <div className="space-y-3">
              {result.itemizedReviewBreakdown.map((item) => {
                const negotiabilityConfig = {
                  high: { label: "折れやすさ：高", color: "bg-red-100 text-red-700" },
                  medium: { label: "折れやすさ：中", color: "bg-amber-100 text-amber-700" },
                  low: { label: "折れやすさ：低", color: "bg-slate-100 text-slate-500" },
                };
                const neg = negotiabilityConfig[item.negotiability];
                return (
                  <details key={item.feeType} className="border border-slate-100 rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 list-none">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{item.label}</p>
                        <span className="text-xs font-semibold text-slate-600 tabular-nums shrink-0">{fmt(item.inputAmount)}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-3 shrink-0 ${neg.color}`}>
                        {neg.label}
                      </span>
                    </summary>
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                          請求額: <span className="font-semibold text-slate-700">{fmt(item.inputAmount)}</span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-medium">着地点候補</p>
                        <ul className="space-y-0.5">
                          {item.landingOptions.slice(0, 2).map((opt) => (
                            <li key={opt} className="flex items-start gap-1.5 text-xs text-slate-600">
                              <span className="text-slate-300 shrink-0 mt-0.5">›</span>
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-100">
              ※ 各費目の請求額・交渉しやすさ・着地候補を整理した参考情報です。削減を保証するものではありません。
            </p>
          </div>
        </details>
      )}

      {/* ══════════════════════════════════════════
          LAYER 3-G: Negotiation lines accordion
      ══════════════════════════════════════════ */}
      {result.negotiationLines ? (() => {
        const { minimum, realistic, aggressive } = result.negotiationLines!;
        const freeRentMonths = result.estimatedOutcome?.freeRentMonths;
        return (
          <details className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
              <div>
                <p className="text-xs font-semibold text-slate-600">現実的に狙える交渉ライン</p>
                <p className="text-xs text-slate-400 mt-0.5">最低・現実・強気の3段階</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
              {/* 最低ライン (closed) */}
              <details className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-100 list-none">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">最低ライン</p>
                    <p className="text-xs text-slate-400">確実に根拠を問える費目のみ</p>
                  </div>
                  <p className="text-lg font-bold text-slate-800 tabular-nums">約{fmt(roundK(minimum.total))}</p>
                </summary>
                {minimum.items.length > 0 && (
                  <div className="px-4 pb-3 border-t border-slate-200 pt-2">
                    <ul className="space-y-0.5">
                      {minimum.items.map((item) => (
                        <li key={item.feeType} className="flex items-center justify-between text-xs text-slate-500">
                          <span>{item.label} <span className="text-slate-400">({item.basis})</span></span>
                          <span className="tabular-nums font-medium">{fmt(item.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </details>

              {/* 現実ライン (open by default) */}
              {realistic.total > minimum.total && (
                <details className="rounded-xl bg-blue-50 border border-blue-200 overflow-hidden" open>
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-blue-100 list-none">
                    <div>
                      <p className="text-xs font-semibold text-blue-700">現実ライン</p>
                      <p className="text-xs text-blue-500">条件次第で追加できる費目込み</p>
                    </div>
                    <p className="text-lg font-bold text-blue-800 tabular-nums">約{fmt(roundK(realistic.total))}</p>
                  </summary>
                  {realistic.items.filter((i) => !minimum.items.find((m) => m.feeType === i.feeType)).length > 0 && (
                    <div className="px-4 pb-3 border-t border-blue-200 pt-2">
                      <ul className="space-y-0.5">
                        {realistic.items
                          .filter((i) => !minimum.items.find((m) => m.feeType === i.feeType))
                          .map((item) => (
                            <li key={item.feeType} className="flex items-center justify-between text-xs text-blue-600">
                              <span>+ {item.label} <span className="text-blue-400">({item.basis})</span></span>
                              <span className="tabular-nums font-medium">{fmt(item.amount)}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </details>
              )}

              {/* 強気ライン (closed) */}
              {aggressive.total > realistic.total && (
                <details className="rounded-xl bg-amber-50 border border-amber-200 overflow-hidden">
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-amber-100 list-none">
                    <div>
                      <p className="text-xs font-semibold text-amber-700">強気ライン</p>
                      <p className="text-xs text-amber-600">最大値（強い交渉前提）</p>
                    </div>
                    <p className="text-lg font-bold text-amber-800 tabular-nums">約{fmt(roundK(aggressive.total))}</p>
                  </summary>
                  {aggressive.items.filter((i) => !realistic.items.find((r) => r.feeType === i.feeType)).length > 0 && (
                    <div className="px-4 pb-3 border-t border-amber-200 pt-2">
                      <ul className="space-y-0.5">
                        {aggressive.items
                          .filter((i) => !realistic.items.find((r) => r.feeType === i.feeType))
                          .map((item) => (
                            <li key={item.feeType} className="flex items-center justify-between text-xs text-amber-700">
                              <span>+ {item.label} <span className="text-amber-500">({item.basis})</span></span>
                              <span className="tabular-nums font-medium">{fmt(item.amount)}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </details>
              )}

              {/* 換算 */}
              {freeRentMonths !== undefined && freeRentMonths > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-xs text-slate-400 font-medium">この金額は以下のようにも換算できます</p>
                  <p className="text-xs text-slate-500">・フリーレント換算：約{freeRentMonths}ヶ月分</p>
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed">
                ※ 入力された費目金額から試算した参考値です。削減を保証するものではありません。
              </p>
            </div>
          </details>
        );
      })() : result.estimatedOutcome && result.estimatedOutcome.reducibleMax > 0 && (() => {
        const { reducibleMin, reducibleMax, freeRentMonths } = result.estimatedOutcome!;
        const monthlyImpact = Math.floor(reducibleMax / 24);
        return (
          <details className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
              <div>
                <p className="text-xs font-semibold text-slate-600">現実的に狙える交渉ライン</p>
                <p className="text-xs text-slate-400 mt-0.5">最低・強気の2段階</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-slate-500">最低ライン</p>
                  <p className="text-xs text-slate-400">まず狙いやすい削減額</p>
                </div>
                <p className="text-lg font-bold text-slate-800 tabular-nums">約{fmt(roundK(reducibleMin))}の削減</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-amber-700">強気ライン</p>
                  <p className="text-xs text-amber-600">条件が揃えば狙える削減額</p>
                </div>
                <p className="text-lg font-bold text-amber-800 tabular-nums">約{fmt(roundK(reducibleMax))}の削減</p>
              </div>
              {(freeRentMonths !== undefined && freeRentMonths > 0) || monthlyImpact > 0 ? (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-xs text-slate-400 font-medium">この金額は以下のようにも換算できます</p>
                  {freeRentMonths !== undefined && freeRentMonths > 0 && (
                    <p className="text-xs text-slate-500">・フリーレント換算：約{freeRentMonths}ヶ月分</p>
                  )}
                  {monthlyImpact > 0 && (
                    <p className="text-xs text-slate-500">・2年換算：毎月約{fmt(monthlyImpact)}相当</p>
                  )}
                </div>
              ) : null}
              <p className="text-xs text-slate-400 leading-relaxed">
                ※ 入力された費目金額から試算した参考値です。削減を保証するものではありません。
              </p>
            </div>
          </details>
        );
      })()}

      {/* ══════════════════════════════════════════
          LAYER 3-H: Fee evaluations accordion
      ══════════════════════════════════════════ */}
      {result.feeEvaluations && result.feeEvaluations.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
            <div>
              <p className="text-xs font-semibold text-slate-600">費目別・実態ベース判定</p>
              <p className="text-xs text-slate-400 mt-0.5">あなたが本当にそのまま払うべきかを、費用ごとに整理しています</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              オーナー（大家）負担が基本と考えられる費用は、一部負担になってもそれで終わりではありません。残りは家賃・礼金・フリーレントなど他の条件で調整できる可能性があります。
            </p>
            {result.feeEvaluations.map((ev) => {
              const outcomeConfig: Record<string, { label: string; color: string }> = {
                remove:     { label: "削除を求める",       color: "bg-red-100 text-red-700" },
                half:       { label: "一部負担＋残りは調整", color: "bg-amber-100 text-amber-700" },
                difference: { label: "差額の見直し",       color: "bg-amber-100 text-amber-700" },
                offset:     { label: "他の条件で調整",     color: "bg-blue-100 text-blue-700" },
                hold:       { label: "支払い保留・確認",   color: "bg-orange-100 text-orange-700" },
                keep:       { label: "現状維持",           color: "bg-slate-100 text-slate-500" },
              };
              const evCfg = outcomeConfig[ev.outcome] ?? { label: ev.outcome, color: "bg-slate-100 text-slate-500" };
              return (
                <div key={`${ev.feeType}-${ev.label}`} className="border border-slate-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{ev.label}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${evCfg.color}`}>
                      {evCfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{ev.reason}</p>
                  {ev.ignore_message && (
                    <div className="bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-sky-700 leading-relaxed">
                        <span className="font-semibold">気にしすぎなくていい説明について：</span>{" "}
                        {ev.ignore_message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-100">
              ※ 上記は一般的な考え方に基づく参考整理です。個別の法的判断は弁護士等の専門家にご相談ください。
            </p>
          </div>
        </details>
      )}

      {/* ══════════════════════════════════════════
          LAYER 3-I: Knowledge cards accordion
      ══════════════════════════════════════════ */}
      {knowledgeCards.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
            <div>
              <p className="text-xs font-semibold text-slate-600">各費用についての一般的な考え方</p>
              <p className="text-xs text-slate-400 mt-0.5">参考情報（個別事案の法的判断ではありません）</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-5 pb-5 border-t border-slate-100">
            <div className="space-y-4 pt-4">
              {knowledgeCards.map((card) => (
                <div key={card.title} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">{card.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100 leading-relaxed">
              詳細は契約書・重要事項説明書・見積書の記載と照らし合わせてご確認ください。
            </p>
          </div>
        </details>
      )}

      {/* ══════════════════════════════════════════
          LAYER 4-J: Template section
      ══════════════════════════════════════════ */}
      {confirmTemplate && (() => {
        const lines = confirmTemplate.split("\n");
        const nonEmpty: number[] = [];
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() !== "") nonEmpty.push(i);
          if (nonEmpty.length === 3) break;
        }
        const cutLine = nonEmpty.length > 0 ? nonEmpty[nonEmpty.length - 1] + 1 : 3;
        const previewText = lines.slice(0, cutLine).join("\n");
        const restText = lines.slice(cutLine).join("\n");
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  確認用テンプレ
                </p>
                <p className="text-xs text-slate-400 mt-0.5">汎用テンプレ — 診断内容によらず同じ文面</p>
              </div>
              <CopyButton text={confirmTemplate} />
            </div>
            <pre className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 whitespace-pre-wrap font-sans">
              {previewText}
            </pre>
            {restText.trim() && (
              <details className="mt-2">
                <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-600 list-none flex items-center gap-1 px-1 py-1">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  全文を見る
                </summary>
                <pre className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 whitespace-pre-wrap font-sans mt-2">
                  {restText}
                </pre>
              </details>
            )}
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              ※ このテンプレは事実確認を目的としたものです。送付の判断・文面の修正はご自身でご確認ください。
            </p>
          </div>
        );
      })()}

      {/* 確認前に整理しておくとよいもの */}
      {docChecklist && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            確認前に整理しておくとよいもの
          </p>
          <ul className="space-y-2">
            {docChecklist.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ══════════════════════════════════════════
          LAYER 4-K: Free vs Paid comparison card
      ══════════════════════════════════════════ */}
      {confirmTemplate && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">無料テンプレ vs 有料初動キット</p>
          <div className="space-y-3">
            <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">無料テンプレ</span>
              </div>
              <ul className="space-y-1">
                {[
                  "汎用文面 — どの案件でも同じ内容",
                  "確認ポイントの網羅性は限定的",
                  "返答パターン別の対応フローなし",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5 text-xs text-slate-500">
                    <span className="text-slate-300 shrink-0 mt-0.5">–</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">¥980 初動キット</span>
              </div>
              <ul className="space-y-1">
                {[
                  "今回の診断内容を反映した個別文面",
                  "確認順序を優先度つきで整理済み",
                  "返答パターン別の次の動き付き",
                  "そのまま送れる状態で提供",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5 text-xs text-amber-800">
                    <svg className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── 不安解消ブロック ── */}
      {result.mode === "initial_fees" && (
        <details className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
            <p className="text-xs font-semibold text-slate-600">メールを送る前の不安に答えます</p>
            <svg className="w-4 h-4 text-slate-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
            {[
              {
                q: "不動産屋に嫌われませんか？",
                a: "生成されるのは事実確認を求めるメールです。感情的な表現・返金要求・法的断定は一切含みません。「根拠を教えてください」という質問は借主の正当な権利であり、これを理由に入居を断ることはできません。",
              },
              {
                q: "自動生成の文面で本当に通用しますか？",
                a: "文面は国土交通省ガイドライン・宅建業法・消費者契約法に基づく論点を反映して生成されます。あなたの状況（支払い前後・説明の有無・費用の種類）を入力データから読み取り、汎用テンプレートではなく個別の状況に合わせた文面を生成します。",
              },
              {
                q: "特約に書いてあっても意味がありますか？",
                a: "特約には有効要件があります。①金額・条件が具体的に明記、②口頭で説明を受けた、③明示的に同意した、この3要件を欠く特約は有効性の確認対象です。「書いてあるから払わなければならない」とは限りません。確認メールで根拠の説明を求めることができます。",
              },
            ].map((item) => (
              <div key={item.q} className="border-l-2 border-slate-200 pl-3 space-y-1">
                <p className="text-xs font-semibold text-slate-700">Q. {item.q}</p>
                <p className="text-xs text-slate-500 leading-relaxed">A. {item.a}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── B-4: 失敗回避メッセージ（initial_fees・折りたたみ） ── */}
      {result.mode === "initial_fees" && result.overallRisk !== "safe" && (
        <details className="rounded-xl border border-slate-100 bg-white px-4 py-3">
          <summary className="text-xs text-slate-500 cursor-pointer select-none hover:text-slate-700 font-medium list-none flex items-center gap-1.5">
            <svg className="w-3 h-3 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            確認メールで避けられる2つの失敗
          </summary>
          <ul className="space-y-1.5 mt-2.5">
            <li className="flex items-start gap-2 text-xs text-slate-500">
              <span className="text-slate-300 shrink-0 mt-0.5">①</span>
              <span><strong className="text-slate-600">論点の抜け漏れ</strong>：確認すべきポイントを網羅した文面で、重要な点を見落とすリスクを下げます</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-500">
              <span className="text-slate-300 shrink-0 mt-0.5">②</span>
              <span><strong className="text-slate-600">伝え方の問題</strong>：強い表現や感情的な文面は逆効果になることがあります。丁寧で的確な表現に整えます</span>
            </li>
          </ul>
        </details>
      )}

      {/* ══════════════════════════════════════════
          LAYER 4-L: PurchaseCTA (CTA #2)
      ══════════════════════════════════════════ */}
      {cfg.showTopCTA && (
        <PurchaseCTA placement="refund" maxRefund={primaryAmount} mode={result.mode} />
      )}

      {/* ══════════════════════════════════════════
          LAYER 4-M: EmailLockSection (CTA #3)
      ══════════════════════════════════════════ */}
      <EmailLockSection draftEmail={result.draftEmail} maxRefund={primaryAmount} mode={result.mode} />

      {/* ══════════════════════════════════════════
          LAYER 4-N/O: FAQ + Response guide accordion
      ══════════════════════════════════════════ */}
      {result.mode === "initial_fees" && (
        <details className="rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="text-xs font-medium text-slate-500 cursor-pointer select-none hover:text-slate-700 list-none flex items-center gap-1.5">
            <svg className="w-3 h-3 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            メール送信後の対応ガイド（返答パターン別）
          </summary>
          <p className="text-xs text-slate-400 mt-3 mb-3 leading-relaxed">
            管理会社・仲介業者からの返答パターン別に、次の対応を整理しています。
          </p>
          <div className="space-y-4">
            {[
              {
                label: "返答がない・無視された場合",
                color: "border-red-200 bg-red-50",
                labelColor: "text-red-700 bg-red-100",
                steps: [
                  "送信から1週間を目安に、同じ内容でリマインドのメールを送る",
                  "2回送っても返答がない場合は、消費生活センターや宅建協会の相談窓口に経緯を相談することも選択肢のひとつ",
                ],
              },
              {
                label: "一部しか回答されなかった場合",
                color: "border-amber-200 bg-amber-50",
                labelColor: "text-amber-700 bg-amber-100",
                steps: [
                  "回答された内容を記録として保存しておく",
                  "未回答の項目を明示して、改めて確認のメールを送る（箇条書きで「〇〇について未回答です」と明記）",
                ],
              },
              {
                label: "電話で回答しようとされた場合",
                color: "border-blue-200 bg-blue-50",
                labelColor: "text-blue-700 bg-blue-100",
                steps: [
                  "「記録として残したいため、書面（メール）でご回答いただけますか」と伝える",
                  "口頭で説明を受けた場合でも、内容を自分でメモし、確認メールで「〇〇とのことでした。認識相違がなければご確認ください」と送っておく",
                ],
              },
            ].map((scenario) => (
              <div key={scenario.label} className={`rounded-xl border ${scenario.color} px-4 py-3`}>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${scenario.labelColor}`}>
                  {scenario.label}
                </span>
                <ul className="space-y-1.5">
                  {scenario.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                      <span className="shrink-0 font-bold text-slate-300 mt-0.5">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100 leading-relaxed">
            ※ このガイドは一般的な参考情報です。個別の状況に応じて判断してください。法的な対応については弁護士等にご相談ください。
          </p>
        </details>
      )}

      {/* ══════════════════════════════════════════
          Section 6: 信頼性フッター
      ══════════════════════════════════════════ */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-xs font-medium">
            宅建業法・消費者契約法・国土交通省原状回復ガイドラインに基づく一般的な情報提供
          </p>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{result.disclaimer}</p>
      </div>
    </div>
  );
}
