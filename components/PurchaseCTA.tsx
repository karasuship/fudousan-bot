"use client";

import { useState, useEffect } from "react";
import type { DiagnosisMode } from "@/lib/types";
import { MODE_CONFIG } from "@/lib/modes";
import { track } from "@/lib/analytics";

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
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    track("result_cta_viewed", { mode: mode ?? "unknown", placement });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_dRm3co7HebRIewr9Hm7kc00";

  async function handlePurchase() {
    if (loading) return;
    track("result_cta_clicked", { mode: mode ?? "unknown", placement });
    track("purchase_started", { mode: mode ?? "unknown", placement });
    window.open(STRIPE_PAYMENT_LINK, "_blank");
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
        {/* タイトル */}
        <p className="text-sm font-semibold text-amber-800">
          {maxRefund
            ? `最大${fmt(maxRefund)}に相当する確認ポイントが見つかりました`
            : modeCfg?.ctaUrgency ?? "確認すべき費用が見つかりました"}
        </p>

        {/* 有料の価値3点 */}
        <ul className="space-y-1">
          {[
            "この診断内容を反映した個別文面 — 汎用テンプレではありません",
            "確認すべき論点の抜け漏れを防ぐ構成",
            "そのまま送れる状態で取得できます",
          ].map((v) => (
            <li key={v} className="flex items-start gap-1.5 text-xs text-amber-700">
              <svg className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {v}
            </li>
          ))}
        </ul>

        {/* B: 数字→意味変換 */}
        <p className="text-xs text-amber-700 leading-relaxed">
          {maxRefund
            ? "この範囲の費用について、一度整理して確認しておくと安心です。"
            : "いくつか確認しておきたい論点がある状態です。"}
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button label={modeCfg ? modeCfg.ctaLabel : "そのまま送れる確認メールを取得する（¥980）"} />

        <p className="text-xs text-amber-600 text-center font-medium">
          ¥980 で、今回の診断結果をもとにした確認メール全文を取得
        </p>
        {/* A: タイミング訴求 */}
        <p className="text-xs text-amber-600/70 text-center leading-relaxed">
          ※ 書面での確認は、タイミングによって回答を得にくくなることがあります
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

      <Button label={modeCfg ? modeCfg.ctaLabel : "そのまま送れる確認メールを取得する（¥980）"} />

      <p className="text-xs text-slate-400 text-center">
        診断結果をもとに、そのまま送れる個別の確認メールを生成します
      </p>
      {/* A: タイミング訴求 */}
      <p className="text-xs text-slate-400/70 text-center leading-relaxed">
        ※ 契約・支払い前後など、早い段階での確認が有効です
      </p>
    </div>
  );
}
