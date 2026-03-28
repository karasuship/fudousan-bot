"use client";

import Link from "next/link";
import { useState } from "react";

export default function CancelPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRepurchase() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "決済の準備に失敗しました");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("通信エラーが発生しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="text-xl font-semibold text-slate-800 mb-2">購入をキャンセルしました</h1>
      <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
        購入手続きを中断しました。診断結果は保持されています。
        メール文案が必要な場合は、再度購入を行ってください。
      </p>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600 mb-4 max-w-sm mx-auto">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
        <button
          onClick={handleRepurchase}
          disabled={loading}
          className="flex-1 bg-slate-800 text-white text-sm font-medium py-2.5 px-5 rounded-xl hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "準備中..." : "再度購入する（980円）"}
        </button>
        <Link
          href="/diagnosis"
          className="flex-1 text-center text-sm text-slate-600 border border-slate-200 py-2.5 px-5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          診断ページへ戻る
        </Link>
      </div>
    </div>
  );
}
