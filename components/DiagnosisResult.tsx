"use client";

import { useState } from "react";
import type { DiagnosisResult, RiskLevel } from "@/lib/types";
import type { InitialFeesMeta } from "./DiagnosisForm";
import { MODE_CONFIG } from "@/lib/modes";
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

  // initial_fees: 書類チェックリスト・確認テンプレ
  const docChecklist = (result.mode === "initial_fees" && initialFeesMeta?.situation)
    ? (IF_DOCUMENTS_BY_SITUATION[initialFeesMeta.situation] ?? IF_DOCUMENTS_BY_SITUATION["pre_payment"])
    : null;
  const confirmTemplate = (result.mode === "initial_fees" && initialFeesMeta?.situation)
    ? getIfConfirmationTemplate(initialFeesMeta.situation)
    : null;

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
          </div>
        </div>
      </div>

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
          Section 2.5: initial_fees 現在地ブロック
      ══════════════════════════════════════════ */}
      {situationInfo && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            あなたのケースの現在地
          </p>
          <div className="flex items-start gap-3 flex-wrap">
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${situationInfo.statusColor}`}>
              {situationInfo.status}
            </span>
            <p className="text-sm text-slate-700 leading-relaxed">{situationInfo.desc}</p>
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
          Section 4: 今すぐやるべき3ステップ
      ══════════════════════════════════════════ */}
      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          {situationInfo ? "次に取るべき行動" : "今すぐやるべき3ステップ"}
        </h3>
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

      {/* ══════════════════════════════════════════
          Section 5: メール CTA③（EmailLockSection）
      ══════════════════════════════════════════ */}
      <EmailLockSection draftEmail={result.draftEmail} maxRefund={maxRefund} mode={result.mode} />

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
