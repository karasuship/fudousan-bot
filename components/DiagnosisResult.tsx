import type { DiagnosisResult, RiskLevel } from "@/lib/types";
import { MODE_CONFIG } from "@/lib/modes";
import EmailLockSection from "./EmailLockSection";
import PurchaseCTA from "./PurchaseCTA";

interface Props {
  result: DiagnosisResult;
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
export default function DiagnosisResult({ result }: Props) {
  const cfg = RISK_CONFIG[result.overallRisk];
  const visibleBreakdown = result.estimatedBreakdown.filter((item) => item.max > 0);
  const hasRefund = result.estimatedRefundMax > 0;
  const maxRefund = hasRefund ? result.estimatedRefundMax : undefined;
  const modeCfg = result.mode ? MODE_CONFIG[result.mode] : null;
  const headline = modeCfg
    ? modeCfg.verdictHeadline(result.overallRisk)
    : cfg.headline;
  const subtext = modeCfg?.subtext ?? cfg.subtext;
  const actionSteps = modeCfg ? modeCfg.actionSteps : DEFAULT_ACTION_STEPS;

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
          Section 3: 確認事項リスト
      ══════════════════════════════════════════ */}
      {result.issues.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            見つかった確認事項（{result.issues.length}件）
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
          Section 4: 今すぐやるべき3ステップ
      ══════════════════════════════════════════ */}
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
