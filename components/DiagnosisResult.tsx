"use client";

import { useState, useEffect } from "react";
import type { DiagnosisResult, RiskLevel } from "@/lib/types";
import type { InitialFeesMeta } from "./DiagnosisForm";
import { MODE_CONFIG } from "@/lib/modes";
import { track } from "@/lib/analytics";
import EmailLockSection from "./EmailLockSection";
import PurchaseCTA from "./PurchaseCTA";

interface Props {
  result: DiagnosisResult;
  initialFeesMeta?: InitialFeesMeta | null;
}

// ─── initial_fees: 状況別テキスト ────────────────────────────────────────────
const IF_SITUATION_TEXT: Record<string, { status: string; desc: string; statusColor: string }> = {
  pre_estimate: {
    status: "見積もり確認中",
    desc: "まだ支払っておらず、費用の確認・調整がしやすい段階です。見積書の各項目を今すぐ確認しましょう。",
    statusColor: "bg-green-100 text-green-700",
  },
  pre_sign: {
    status: "申込中・契約直前",
    desc: "署名前の段階なので、疑問があれば今が最も確認しやすいタイミングです。署名前に書面で確認を。",
    statusColor: "bg-blue-100 text-blue-700",
  },
  pre_payment: {
    status: "契約済み・支払い前",
    desc: "支払い前なので、内訳の説明を求める余地があります。書面で確認してから支払いましょう。",
    statusColor: "bg-amber-100 text-amber-700",
  },
  paid: {
    status: "支払い済み",
    desc: "支払い済みの段階です。明細・領収書・契約書を整理しておくことが今後の判断に重要です。",
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
  if (situation === "paid") {
    return `件名：費用明細についての確認のお願い

お世話になっております。

先日お支払いした費用について、以下の点を確認させていただけますでしょうか。

・各費用の名目と根拠（契約書・重要事項説明書の記載箇所）
・費用の算出方法・内訳

お手数をおかけしますが、書面でご回答いただけますと幸いです。
どうぞよろしくお願いいたします。`;
  }
  return `件名：ご請求費用についての確認のお願い

お世話になっております。

入居手続きに際してご請求いただいた費用について、以下の点を確認させていただけますでしょうか。

・各費用の名目と根拠（契約書・重要事項説明書の記載箇所）
・必須か任意かの区別
・金額の算出方法

お手数をおかけしますが、書面でご回答いただけますと幸いです。
どうぞよろしくお願いいたします。`;
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
    subtext: "知らずに払い過ぎている可能性があります。内容を確認することで、見直しの余地が生まれるかもしれません。",
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
    subtext: "費用の根拠が不明確な項目が複数あります。このまま放置すると、確認できる機会を失う可能性があります。",
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

// ─── メイン ───────────────────────────────────────────────────────
export default function DiagnosisResult({ result, initialFeesMeta }: Props) {
  const cfg = RISK_CONFIG[result.overallRisk];
  const visibleBreakdown = result.estimatedBreakdown.filter((item) => item.max > 0);
  const hasRefund = result.estimatedRefundMax > 0;
  const maxRefund = hasRefund ? result.estimatedRefundMax : undefined;
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
    ? result.estimatedBreakdown
        .map((item) => IF_FEE_KNOWLEDGE[item.feeType])
        .filter((k): k is NonNullable<typeof k> => k != null)
    : [];

  // initial_fees: パーソナライズポイント
  const personalizedPoints = situationInfo
    ? getIfPersonalizedPoints(
        initialFeesMeta?.concernTheme ?? "",
        result.issues,
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
  const confirmTemplate = (result.mode === "initial_fees" && initialFeesMeta?.situation)
    ? getIfConfirmationTemplate(initialFeesMeta.situation)
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

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════
          Section 1: ヴァーディクトバナー
      ══════════════════════════════════════════ */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${cfg.badgeBg}`}>
                {cfg.badge}
              </span>
              {modeCfg && (
                <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-slate-300">
                  {modeCfg.icon} {modeCfg.label}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold leading-snug mb-2 text-white">
              {headline}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">{subtext}</p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1">
            <ScoreCircle score={result.score} ringColor={cfg.ringColor} />
            <span className="text-xs text-slate-500">確認スコア</span>
            {result.mode === "initial_fees" && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
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
        </div>
      </div>

      {/* ══════════════════════════════════════════
          Section 2.5: initial_fees あなたのケース（主役・verdict直後）
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

          {/* B-1: この結果の判断に使われた情報（脇役・折りたたみ） */}
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
                    agency_fee: "仲介手数料",
                    key_exchange: "鍵交換代",
                    cleaning: "清掃代",
                    guarantor: "保証会社費用",
                    renewal_fee: "更新料",
                    recontracting_fee: "再契約料",
                    other: "その他",
                  }[f] ?? f)).join("・")}
                </span>
              </div>
            </details>
          )}
        </div>
      )}

      {/* initial_fees: 今すぐやること（あなたのケース直後・主役） */}
      {situationInfo && (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">今すぐやること</h3>
          <div className="space-y-4">
            {actionSteps.map((step) => (
              <div key={step.num} className="flex gap-4 items-start">
                <div className="shrink-0 w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                  {step.num}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA① ── ヴァーディクト直下（review / caution のみ） */}
      {cfg.showTopCTA && (
        <PurchaseCTA placement="verdict" maxRefund={maxRefund} mode={result.mode} />
      )}

      {/* ══════════════════════════════════════════
          Section 2: 回収可能額ハイライト
      ══════════════════════════════════════════ */}
      {hasRefund && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            確認・見直しの可能性がある費用の目安
          </p>

          <div className="flex flex-wrap items-end gap-x-2 gap-y-1 mb-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {fmt(result.estimatedRefundMin)}
            </span>
            <span className="text-2xl font-bold text-slate-400 pb-0.5">〜</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {fmt(result.estimatedRefundMax)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            最大でこの範囲が確認・交渉対象になりうる可能性があります。返還を保証するものではありません。
          </p>

          {visibleBreakdown.length > 0 && (
            <div className="border-t border-slate-100 pt-3 space-y-2.5">
              {visibleBreakdown.map((item) => (
                <div key={item.feeType} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-700 tabular-nums">
                    {item.min > 0
                      ? `${fmt(item.min)} 〜 ${fmt(item.max)}`
                      : `〜 ${fmt(item.max)}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CTA② ── 回収可能額直下（ROI訴求） */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <PurchaseCTA placement="refund" maxRefund={maxRefund} mode={result.mode} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Section 3: 確認事項リスト
      ══════════════════════════════════════════ */}
      {result.issues.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            {situationInfo ? "気になるポイント" : "見つかった確認事項"}（{result.issues.length}件）
          </h3>
          <ul className="space-y-2.5">
            {result.issues.map((issue, i) => (
              <li key={i} className={`flex gap-3 rounded-xl border p-4 ${cfg.issueBg} ${cfg.issueBorder}`}>
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${cfg.issueIconBg}`}>
                  <svg className={`w-3.5 h-3.5 ${cfg.issueIconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{issue}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Section 3.5: 一般的な考え方（initial_fees のみ）
      ══════════════════════════════════════════ */}
      {knowledgeCards.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            一般的な考え方
          </p>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            ご参考情報として。個別事案の法的判断ではありません。
          </p>
          <div className="space-y-4">
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
      )}

      {/* ══════════════════════════════════════════
          Section 4: 今すぐやるべき3ステップ（initial_fees以外）
      ══════════════════════════════════════════ */}
      {!situationInfo && (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">今すぐやるべき3ステップ</h3>
          <div className="space-y-4">
            {actionSteps.map((step) => (
              <div key={step.num} className="flex gap-4 items-start">
                <div className="shrink-0 w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                  {step.num}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Section 4.5: 次に考えられる選択肢（initial_fees のみ）
      ══════════════════════════════════════════ */}
      {situationInfo && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            次に考えられる選択肢
          </p>
          <p className="text-xs text-slate-400 mb-4">状況に応じてご判断ください</p>
          <ul className="space-y-3.5">
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
        </div>
      )}

      {/* ══════════════════════════════════════════
          Section 4.6: 確認前に整理しておくとよいもの（initial_fees のみ）
      ══════════════════════════════════════════ */}
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
          Section 4.7: 確認用テンプレ（initial_fees のみ・無料・安全設計）
      ══════════════════════════════════════════ */}
      {confirmTemplate && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                確認用テンプレ
              </p>
              <p className="text-xs text-slate-400 mt-0.5">事実確認型 ・ そのままコピーして使えます</p>
            </div>
            <CopyButton text={confirmTemplate} />
          </div>
          <pre className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 whitespace-pre-wrap font-sans">
            {confirmTemplate}
          </pre>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            ※ このテンプレは事実確認を目的としたものです。送付の判断・文面の修正はご自身でご確認ください。
          </p>
        </div>
      )}

      {/* ── A-4: 無料診断 → 有料メールへの接続（initial_fees のみ）── */}
      {result.mode === "initial_fees" && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold text-slate-600 mb-1">ここまでの診断で確認ポイントが整理されました</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            有料版では今回の費用・状況・説明状況を反映した個別の確認メールを生成します。
            テンプレートではなく、あなたのケースに合わせた文面をそのまま送れる状態で提供します。
          </p>
        </div>
      )}

      {/* ── B-4: 失敗回避メッセージ（initial_fees・折りたたみ）── */}
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
          Section 5: メール CTA③（EmailLockSection）
      ══════════════════════════════════════════ */}
      <EmailLockSection draftEmail={result.draftEmail} maxRefund={maxRefund} mode={result.mode} />

      {/* ── B-5: メール送信後のガイダンス（initial_fees・折りたたみ）── */}
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
