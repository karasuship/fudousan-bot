"use client";

import { useState } from "react";
import type { DiagnosisMode } from "@/lib/types";
import { MODE_CONFIG } from "@/lib/modes";

interface Props {
  maxRefund?: number;
  /**
   * "verdict"  … ヴァーディクトバナー直下（緊急性重視）
   * "refund"   … 回収可能額カード直下（ROI重視・コンパクト）
   */
  placement: "verdict" | "refund";
  mode?: DiagnosisMode;
}

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export default function PurchaseCTA({ maxRefund, placement, mode }: Props) {
  const modeCfg = mode ? MODE_CONFIG[mode] : null;
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
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "決済の準備に失敗しました。再度お試しください。");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("通信エラーが発生しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  const Button = ({ label }: { label: string }) => (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-2
        font-semibold text-sm rounded-xl
        transition-all duration-150
        active:scale-[0.97]
        disabled:opacity-60 disabled:cursor-not-allowed
        ${placement === "verdict"
          ? "bg-amber-500 hover:bg-amber-400 text-white py-4 shadow-lg shadow-amber-500/25"
          : "bg-slate-900 hover:bg-slate-800 text-white py-3.5 shadow-sm"}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          準備中...
        </>
      ) : (
        label
      )}
    </button>
  );

  /* ── placement: verdict（ヴァーディクト直下・緊急性メッセージ付き） ── */
  if (placement === "verdict") {
    return (
      <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5 space-y-3">
        {/* 緊急性コピー */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-800">
            {maxRefund
              ? `このまま支払うと、最大${fmt(maxRefund)}を失う可能性があります`
              : modeCfg?.ctaUrgency ?? "確認せずに手続きを進めてしまう方が多数います"}
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            時間が経つほど証拠の収集や根拠の確認が難しくなります。
            まず書面で確認することが重要です。
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button label={maxRefund ? `${fmt(maxRefund)}を守るための確認メールを取得する（¥980）` : modeCfg ? modeCfg.ctaLabel : "今すぐ確認メールを作成する（¥980）"} />

        <p className="text-xs text-amber-600 text-center">
          一度の購入でこの診断に対応した確認メール全文を取得できます
        </p>
        <p className="text-sm text-gray-500 mt-2">
          ※このメールを送るだけで、対応が変わるケースがあります
        </p>
      </div>
    );
  }

  /* ── placement: refund（回収可能額直下・ROI訴求） ── */
  return (
    <div className="space-y-2.5 pt-1">
      {maxRefund && (
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>
            <strong className="font-semibold text-slate-800">¥980</strong>
            <span className="text-slate-500">で、最大</span>
            <strong className="font-semibold text-slate-800">{fmt(maxRefund)}</strong>
            <span className="text-slate-500">の損失を防げる可能性があります</span>
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button label={modeCfg ? modeCfg.ctaLabel : "確認メールを作成する（¥980）"} />

      <p className="text-xs text-slate-400 text-center">
        多くの方が費用の根拠を確認しないまま支払っています
      </p>
    </div>
  );
}
