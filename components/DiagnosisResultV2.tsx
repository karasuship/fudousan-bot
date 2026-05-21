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
                  return (
                    <div key={s.feeId} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-0.5 ${bucket.badgeClass}`}>
                          {s.label}
                        </span>
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

      {/* 5. 確認・調整の対象合計金額 */}
      {result.freeRentEstimate != null && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-800">
            確認・調整の対象合計金額（目安）
            <span className="font-semibold ml-1">{fmt(result.freeRentEstimate)}</span>
          </p>
        </div>
      )}

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
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
        <p className="text-sm font-semibold text-slate-800">
          詳細な確認メール文案を取得する
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          今回の診断内容をもとにした個別文面を生成します。
          汎用テンプレートではなく、この状況に対応した構成です。
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-3.5 rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              処理中...
            </>
          ) : (
            "詳細な確認メールを作成する（980円）"
          )}
        </button>

        <p className="text-xs text-slate-400 text-center">
          ¥980 · Stripe による安全な決済
        </p>
      </div>

    </div>
  );
}
