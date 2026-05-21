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
    badge: "要注意（支払い前に確認推奨）", // ② ステータス文言の具体化
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

// 層①：任意費用（主戦場）
const LAYER1_FEES = ["disinfection", "support_24h", "key_exchange", "cleaning"];

// 層②：調整・相殺候補
const LAYER2_FEES = ["agency_combined", "guarantee_base", "key_money"];

function InitialFeesActionSummary({
  refundCandidateFees,
  totalOnlyFees,
  needsClassificationFees,
  itemizedReviewBreakdown: _itemizedReviewBreakdown,
  maxRefund: _maxRefund,
  situation,
  negotiationLines,
}: {
  refundCandidateFees: string[];
  totalOnlyFees: string[];
  needsClassificationFees: string[];
  itemizedReviewBreakdown?: Array<{ feeType: string; inputAmount: number }>;
  maxRefund: number;
  situation?: string;
  negotiationLines?: import("@/lib/types").NegotiationLines;
}) {
  const userPhase = situation === "paid" ? "C" : "A";

  const layer1Items = (negotiationLines?.realistic.items ?? [])
    .filter(i => LAYER1_FEES.includes(i.feeType));
  const layer2Items = (negotiationLines?.realistic.items ?? [])
    .filter(i => LAYER2_FEES.includes(i.feeType));

  const hasFireInsurance = [
    ...refundCandidateFees,
    ...totalOnlyFees,
    ...needsClassificationFees,
  ].includes("fire_insurance");

  const PSEUDO_DEPOSIT_KEYS = ["repair_share"];
  const PSEUDO_DEPOSIT_KEYWORDS = ["修理分担金", "負担金", "補修費", "補修", "修繕"];
  const allSelectedFees = [...refundCandidateFees, ...totalOnlyFees, ...needsClassificationFees];
  const pseudoDepositFees = allSelectedFees.filter((f) =>
    PSEUDO_DEPOSIT_KEYS.includes(f) ||
    PSEUDO_DEPOSIT_KEYWORDS.some((kw) => (FEE_LABEL_MAP[f] ?? f).includes(kw))
  );

  const hasAnything = layer1Items.length > 0 || layer2Items.length > 0 || hasFireInsurance || pseudoDepositFees.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="space-y-3">

      {/* ── 合計金額（インパクト表示）── */}
      {(() => {
        const allItems = (negotiationLines?.realistic.items ?? []);
        if (allItems.length === 0) return null;
        const total = allItems.reduce((s, i) => s + i.amount, 0);
        const totalRounded = Math.round(total / 1000) * 1000;

        const l1Items = allItems.filter(i => LAYER1_FEES.includes(i.feeType));
        const l2Items = allItems.filter(i => LAYER2_FEES.includes(i.feeType));
        const l1Total = l1Items.reduce((s, i) => s + i.amount, 0);
        const l2Total = l2Items.reduce((s, i) => s + i.amount, 0);

        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-5 space-y-4">
            {/* 合計金額 */}
            <div>
              <p className="text-xs font-semibold text-red-700">
                見直し余地のある金額
              </p>
              <p className="text-4xl font-extrabold text-red-800 tabular-nums mt-1">
                約¥{totalRounded.toLocaleString("ja-JP")}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {userPhase === "C"
                  ? "返金・相殺・フリーレントでの調整を求めることができます。"
                  : "この費用は払わない・削減できる可能性があります。"
                }
              </p>
            </div>

            {/* 内訳（折りたたみ） */}
            <details className="rounded-xl border border-red-200 bg-white overflow-hidden">
              <summary className="px-4 py-3 text-xs font-semibold text-red-700 cursor-pointer select-none list-none flex items-center justify-between hover:bg-red-50">
                内訳を見る
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-2 space-y-3">
                {/* 層①：払わなくていい可能性 */}
                {l1Items.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1">
                      払わなくていい可能性がある費用：¥{l1Total.toLocaleString("ja-JP")}
                    </p>
                    <ul className="space-y-0.5">
                      {l1Items.map(item => (
                        <li key={item.feeType}
                          className="flex items-center justify-between text-xs text-red-600">
                          <span>{item.label}</span>
                          <span className="tabular-nums font-medium">
                            ¥{item.amount.toLocaleString("ja-JP")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* 層②：調整・相殺候補 */}
                {(l2Items.length > 0 || hasFireInsurance) && (
                  <div className="border-t border-red-100 pt-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">
                      調整・相殺の候補：¥{l2Total.toLocaleString("ja-JP")}
                    </p>
                    <ul className="space-y-1">
                      {l2Items.map(item => (
                        <li key={item.feeType} className="text-xs text-amber-700">
                          <div className="flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.amount > 0 && (
                              <span className="tabular-nums font-medium">
                                ¥{item.amount.toLocaleString("ja-JP")}
                              </span>
                            )}
                          </div>
                          <p className="text-amber-500 mt-0.5 text-[11px]">{item.basis}</p>
                        </li>
                      ))}
                      {hasFireInsurance && (
                        <li className="text-xs text-amber-800">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">火災保険</span>
                          </div>
                          <p className="text-amber-600 mt-0.5">
                            自分で選べる場合は同等内容の保険に切り替え可能。
                            指定された場合は礼金・フリーレントとの相殺候補になります。
                            相場の目安は2年で6,000〜10,000円程度です。
                          </p>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          </div>
        );
      })()}

      {/* 擬似敷金警告 */}
      {pseudoDepositFees.length > 0 && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-orange-700">⚠ 擬似敷金の可能性</p>
          <div className="flex flex-wrap gap-1.5">
            {pseudoDepositFees.map((f) => (
              <span key={f} className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-0.5 rounded-full">
                {FEE_LABEL_MAP[f] ?? f}
              </span>
            ))}
          </div>
          <p className="text-xs text-orange-600 leading-relaxed">
            「修理分担金」「負担金」など敷金に類似した名目の費用は、契約終了時に返還されない可能性があります。契約書での位置づけを必ず確認してください。
          </p>
        </div>
      )}

      {/* ── 次の一手 ── */}
      {(layer1Items.length > 0 || layer2Items.length > 0) && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">次の一手</p>
          <p className="text-sm text-slate-700">
            {userPhase === "C"
              ? "「任意であることの説明を受けていなかったため、返金または翌月家賃との相殺でのご対応をお願いします」と伝えてください。"
              : "「これらの費用が任意であることの説明を受けていないため、根拠を書面で示してください」と伝えるだけで構いません。"
            }
          </p>
        </div>
      )}
    </div>
  );
}

// ─── 費目キー → 日本語ラベル マッピング ─────────────────────────────────────
const FEE_LABEL_MAP: Record<string, string> = {
  agency_fee:           "仲介手数料",
  key_exchange:         "鍵交換代",
  cleaning:             "清掃代",
  guarantor:            "保証会社費用",
  guarantor_delegation: "保証会社委託費用",
  disinfection:         "消毒・除菌代",
  fire_extinguisher:    "消火剤・防災グッズ",
  fire_insurance:       "火災保険料",
  support_24h:          "24時間サポートプラン",
  admin_fee:            "事務手数料・書類作成費",
  management_fee:       "管理費",
  common_fee:           "共益費",
  daily_rent:           "日割り家賃",
  first_month_rent:     "初月賃料",
  security_deposit:     "敷金",
  repair_share:         "修理分担金",
  disinfection_spray:   "消毒スプレー",
  other:                "その他費用",
};

// ─── 費目キー → 理由文 マッピング（完全網羅） ───────────────────────────────
const FEE_REASON_MAP: Record<string, string> = {
  agency_fee:   "仲介手数料の見直し余地があります",
  guarantor:    "保証会社費用に確認余地があります",
  cleaning:     "清掃費用の内容確認が必要です",
  key_exchange: "鍵交換費用は必須とは限りません",
  disinfection: "消毒・除菌費用は任意のサービスです",
  support_24h:  "24時間サポートプランは任意加入です",
  admin_fee:       "事務手数料・書類作成費に確認余地があります",
  fire_insurance:  "火災保険は保険会社を自由に選べます。指定業者への強制加入は確認が必要です",
  other:           "任意費用（消毒・24時間サポート・事務手数料等）が含まれています",
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

  // バケット分類: initialFeesMeta から直接読む（業務判断はサーバー側で完結済み）
  const refundCandidateFees: string[]     = (initialFeesMeta?.refundCandidateFees ?? []).filter(f => f !== "fire_insurance");
  const totalOnlyFees: string[]           = initialFeesMeta?.totalOnlyFees ?? [];
  const needsClassificationFees: string[] = initialFeesMeta?.needsClassificationFees ?? [];


  // 適用ルール: result.issues の rule フィールドから重複除去（表示用変換のみ）
  const displayRules: string[] = (() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const issue of result.issues) {
      if (!seen.has(issue.rule)) { seen.add(issue.rule); out.push(issue.rule); }
      if (out.length >= 5) break;
    }
    const fallbacks = [
      "宅建業法46条：仲介手数料の上限は賃料1ヶ月分＋消費税。",
      "民法606条：賃貸人は貸室を使用収益に適した状態に維持する義務を負う。",
      "国土交通省原状回復ガイドライン：通常損耗・経年劣化は賃貸人負担が原則。",
    ];
    for (const f of fallbacks) {
      if (out.length >= 3) break;
      if (!seen.has(f)) { seen.add(f); out.push(f); }
    }
    return out.slice(0, 5);
  })();

  // 照合軸サマリー: InitialFeesMeta の説明状況 + result.issues の category から生成（表示用変換のみ）
  const displayMatches: string[] = (() => {
    const out: string[] = [];
    const explanation = initialFeesMeta?.explanation ?? "";
    if (explanation === "no") {
      out.push("説明の有無：費用の説明を受けていない → 説明義務との構造的不一致");
    } else if (explanation === "insufficient") {
      out.push("説明の有無：説明が不十分 → 書面による根拠確認が必要");
    } else if (explanation === "yes") {
      out.push("説明の有無：説明あり → 説明軸は照合済み");
    }
    const categories = [...new Set(result.issues.map((i) => i.category))];
    for (const cat of categories.slice(0, 3)) {
      const catCount = result.issues.filter((i) => i.category === cat).length;
      out.push(`${cat}：${catCount}件の論点を検出`);
    }
    return out.slice(0, 6);
  })();

  // ─── initial_fees: 強い結論ブロック用データ ────────────────────
  const isInitialFees = result.mode === "initial_fees";
  // マッピング方式: 選択費目 → 理由文（1対1完全対応・抜け漏れなし）
  // 修正①: 最大3件に制限
  const conclusionReasons: string[] = isInitialFees && initialFeesMeta?.fees
    ? initialFeesMeta.fees
        .map((fee) => FEE_REASON_MAP[fee])
        .filter((r): r is string => Boolean(r))
        .slice(0, 3)
    : [];
  // ─── 主役金額（negotiationLines.realistic.total を第1優先）
  const primaryAmount: number | undefined = isInitialFees
    ? result.negotiationLines?.realistic.total
    : (result.estimatedRefundMax > 0 ? result.estimatedRefundMax : undefined);

  const roundK = (n: number) => Math.round(n / 1000) * 1000;

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════
          LAYER 1-A: Hero Summary Card
      ══════════════════════════════════════════ */}
      <div className="rounded-2xl bg-slate-900 p-6 text-white space-y-4">
        {/* Top row: amount */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {primaryAmount !== undefined && primaryAmount > 0 && (
              <>
                {initialFeesMeta?.claimedTotalAmount && initialFeesMeta.claimedTotalAmount > 0 && (
                  <p className="text-xs text-slate-400 mb-0.5">
                    請求総額¥{initialFeesMeta.claimedTotalAmount.toLocaleString("ja-JP")}のうち
                  </p>
                )}
                <p className="text-3xl font-extrabold tabular-nums tracking-tight text-white leading-none mb-1">
                  確認・交渉の対象金額：約{fmt(primaryAmount)}
                </p>
              </>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${cfg.badgeBg}`}>
                {cfg.badge}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-2 leading-snug">{headline}</p>
          </div>
        </div>

        {/* バナー内の論点箇条書き：negotiationLinesから動的生成 */}
        {result.negotiationLines && (() => {
          const items = result.negotiationLines.realistic.items.slice(0, 3);
          if (items.length === 0) return null;
          return (
            <ul className="space-y-1 mt-2">
              {items.map(item => (
                <li key={item.feeType} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">・</span>
                  <span>{item.label}：{item.basis}</span>
                </li>
              ))}
            </ul>
          );
        })()}


      </div>

      {/* ══════════════════════════════════════════
          LAYER 2-E2: 初期費用 アクションサマリー（initial_fees のみ）
      ══════════════════════════════════════════ */}
      {isInitialFees && (
        <InitialFeesActionSummary
          refundCandidateFees={refundCandidateFees}
          totalOnlyFees={totalOnlyFees}
          needsClassificationFees={needsClassificationFees}
          itemizedReviewBreakdown={result.itemizedReviewBreakdown}
          maxRefund={result.negotiationLines?.realistic.total ?? result.estimatedRefundMax ?? 0}
          situation={initialFeesMeta?.situation}
          negotiationLines={result.negotiationLines}
        />
      )}

      {/* ══════════════════════════════════════════
          LAYER 4-K: Paid kit benefits card — 修正③④
      ══════════════════════════════════════════ */}
      {confirmTemplate && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-2.5">
          <p className="text-sm font-semibold text-amber-800">¥980 初動キット — 今回の診断内容をもとにした個別文面</p>
          <ul className="space-y-1">
            {[
              "今回の診断内容を反映した個別文面",
              "確認すべき論点の抜け漏れを防ぐ構成",
              "返答パターン別の次の動き付き",
            ].map((t) => (
              <li key={t} className="flex items-start gap-1.5 text-xs text-amber-800">
                <svg className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
          {/* ④ CTA直前テキストの強化 */}
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            このまま支払うと、後から返金を求めるのは難しくなる場合があります
          </p>
          <PurchaseCTA placement="refund" mode={result.mode} />
        </div>
      )}


      <p className="text-xs text-slate-400 text-center leading-relaxed mt-2">
        宅建業法・消費者契約法・国土交通省原状回復ガイドラインに基づく一般的な情報提供です。
        本診断結果は法的助言ではありません。
      </p>
    </div>
  );
}
