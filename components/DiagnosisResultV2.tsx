"use client";

import { useState } from "react";
import type {
  DiagnosisResult2,
  ContractTiming,
  ContractStage,
  FeeEntry,
  IssueStrategy,
} from "@/lib/types_v2";

interface Props {
  result: DiagnosisResult2;
  timing: ContractTiming;
  stage: ContractStage;
  fees: FeeEntry[];
  onBack?: () => void;
}

// ─── 状況テキスト ─────────────────────────────────────────────────────────────

function getSituationText(timing: ContractTiming, stage: ContractStage): string {
  if (timing === "pre_contract" && stage === "pre_sign") return "契約前・署名前（見積もり段階）";
  if (timing === "pre_contract" && stage === "post_sign_pre_payment") return "署名済み・支払前";
  if (timing === "post_contract" && stage === "pre_payment") return "署名済み・支払前";
  if (timing === "post_contract" && stage === "post_payment") return "支払済み・入居中";
  return "契約前・署名前（見積もり段階）";
}

// ─── 金額フォーマット ─────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

// ─── バケット設定 ─────────────────────────────────────────────────────────────

type Bucket = {
  strategies: IssueStrategy[];
  label: string;
  containerClass: string;
  badgeClass: string;
  textClass: string;
};

const BUCKETS: Bucket[] = [
  {
    strategies: ["delete"],
    label: "不要の可能性が高い・削除を求める",
    containerClass: "bg-red-50 border-red-200",
    badgeClass: "bg-red-100 text-red-700",
    textClass: "text-red-800",
  },
  {
    strategies: ["free_rent"],
    label: "フリーレント転換を提案する",
    containerClass: "bg-orange-50 border-orange-200",
    badgeClass: "bg-orange-100 text-orange-700",
    textClass: "text-orange-800",
  },
  {
    strategies: ["confirm", "admin_check"],
    label: "根拠確認が必要",
    containerClass: "bg-amber-50 border-amber-200",
    badgeClass: "bg-amber-100 text-amber-700",
    textClass: "text-amber-800",
  },
  {
    strategies: ["record"],
    label: "払う根拠あり",
    containerClass: "bg-green-50 border-green-200",
    badgeClass: "bg-green-100 text-green-700",
    textClass: "text-green-800",
  },
];

// ─── 難易度 ───────────────────────────────────────────────────────────────────

const DIFFICULTY: Record<string, { stars: number; label: string; description: string }> = {
  delete: {
    stars: 3,
    label: "交渉しやすい",
    description: "任意費用のため削除を求めやすい",
  },
  free_rent: {
    stars: 2,
    label: "交渉できる",
    description: "フリーレントまたは総額調整の余地がある",
  },
  admin_check: {
    stars: 1,
    label: "根拠確認が先",
    description: "説明を求めた上で次の手を判断する",
  },
  confirm: {
    stars: 1,
    label: "根拠確認が先",
    description: "資料・説明の確認から始める",
  },
  record: {
    stars: 0,
    label: "払う根拠あり",
    description: "記録を保全する",
  },
};

// ─── severity 色 ──────────────────────────────────────────────────────────────

function severityClass(severity: "high" | "medium" | "low"): string {
  if (severity === "high") return "bg-red-50 border-red-200";
  if (severity === "medium") return "bg-amber-50 border-amber-200";
  return "bg-blue-50 border-blue-200";
}

function severityLabelClass(severity: "high" | "medium" | "low"): string {
  if (severity === "high") return "text-red-700 bg-red-100";
  if (severity === "medium") return "text-amber-700 bg-amber-100";
  return "text-blue-700 bg-blue-100";
}

function severityLabel(severity: "high" | "medium" | "low"): string {
  if (severity === "high") return "重大";
  if (severity === "medium") return "注意";
  return "確認";
}

// ─── コンポーネント ───────────────────────────────────────────────────────────

export default function DiagnosisResultV2({ result, timing, stage, fees, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosisResult: result, timing, stage }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "エラーが発生しました");
        setLoading(false);
      }
    } catch {
      setError("通信エラーが発生しました。再度お試しください。");
      setLoading(false);
    }
  }

  const amountMap = new Map(fees.map((f) => [f.feeId, f.amount]));

  const adjustAmount = result.feeStrategies
    .filter((s) => s.strategy === "delete" || s.strategy === "free_rent")
    .reduce((sum, s) => sum + (amountMap.get(s.feeId) ?? 0), 0);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

      {/* 1. 入力に戻るボタン */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          入力に戻る
        </button>
      )}

      {/* 2. 状況テキスト */}
      <div className="text-xs font-medium text-slate-500 tracking-wide">
        {getSituationText(timing, stage)}
      </div>

      {/* 3. 複合論点の件数 */}
      {result.compoundCount > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">
            {result.compoundCount} 件の重大な論点が重なっています
          </p>
        </div>
      )}

      {/* 4. 費目別の4バケット表示 */}
      <div className="space-y-3">
        {BUCKETS.map((bucket) => {
          const matched = result.feeStrategies.filter((s) =>
            (bucket.strategies as string[]).includes(s.strategy)
          );
          if (matched.length === 0) return null;

          return (
            <div
              key={bucket.label}
              className={`rounded-xl border px-4 py-3 space-y-2 ${bucket.containerClass}`}
            >
              <p className={`text-xs font-semibold ${bucket.textClass}`}>{bucket.label}</p>
              <div className="space-y-1.5">
                {matched.map((s) => {
                  const amount = amountMap.get(s.feeId);
                  const diff = DIFFICULTY[s.strategy];
                  return (
                    <div key={s.feeId} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-0.5 ${bucket.badgeClass}`}>
                          {s.label}
                        </span>
                        {diff && diff.stars > 0 && (
                          <div className="flex items-center gap-1 mt-0.5 mb-0.5">
                            <span className="text-xs text-slate-500">
                              {"★".repeat(diff.stars)}{"☆".repeat(3 - diff.stars)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {diff.label}
                            </span>
                          </div>
                        )}
                        <p className={`text-xs leading-relaxed ${bucket.textClass}`}>{s.reason}</p>
                      </div>
                      {amount != null && amount > 0 && (
                        <span className={`text-xs font-semibold shrink-0 ${bucket.textClass}`}>
                          {fmt(amount)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>


      {/* 6. 減額警告 */}
      {result.discountWarning && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-800 leading-relaxed">{result.discountWarning}</p>
        </div>
      )}

      {/* 7. 論点リスト（上位5件） */}
      {result.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">確認すべき論点</p>
          {result.issues.slice(0, 5).map((issue) => (
            <div
              key={issue.id}
              className={`rounded-xl border px-4 py-3 space-y-1 ${severityClass(issue.severity)}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityLabelClass(issue.severity)}`}>
                  {severityLabel(issue.severity)}
                </span>
                <span className="text-xs font-semibold text-slate-700">{issue.label}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{issue.axisAText}</p>
            </div>
          ))}
        </div>
      )}

      {/* 8. 課金CTA */}
      <div className="space-y-4">

        {adjustAmount > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4">
            <p className="text-xs text-slate-500 mb-1">確認・調整の余地がある費用</p>
            <p className="text-2xl font-bold text-slate-800">{fmt(adjustAmount)}</p>
            <p className="text-xs text-slate-500 mt-1">このまま払う前に、一度確認してください。</p>
          </div>
        )}

        <div className="space-y-2 px-1">
          <p className="text-xs font-medium text-slate-600">980円で手に入るもの</p>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li>・ 業者にそのまま送れる確認メールの全文</li>
            <li>・ 業者の返信を貼るだけで2通目・3通目を生成</li>
            <li>・ 解決しない場合の相談窓口と状況まとめの文章</li>
            <li>・ 行政窓口・消費者センターへの申告に使える経緯の整理</li>
            {timing === "pre_contract" && (
              <li>・ 契約前なら交渉の進め方と並行してできる選択肢</li>
            )}
          </ul>
          <p className="text-xs text-slate-400 mt-2">
            汎用AIチャットでは、あなたの診断結果に基づいた構造では生成できません。
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white py-4 rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? "処理中..." : "次に何をすればいいか、全部受け取る（980円）"}
        </button>

        <div className="space-y-1 text-center">
          <p className="text-xs text-slate-400">Stripeによる安全な決済</p>
          {timing === "pre_contract" && (
            <p className="text-xs text-slate-400">署名前なら、今日送ることができます。</p>
          )}
        </div>

      </div>

    </div>
  );
}
