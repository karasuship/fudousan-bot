"use client";

import { useState, useEffect } from "react";
import type { DiagnosisMode } from "@/lib/types";
import { MODE_CONFIG } from "@/lib/modes";
import CopyButton from "./CopyButton";
import { track } from "@/lib/analytics";

interface Props {
  draftEmail: string;
  maxRefund?: number;
  mode?: DiagnosisMode;
}

function fmt(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

function extractPreview(text: string): { preview: string; rest: string } {
  const lines = text.split("\n");
  const nonEmpty: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "") nonEmpty.push(i);
    if (nonEmpty.length === 3) break;
  }
  const cutLine = nonEmpty.length > 0 ? nonEmpty[nonEmpty.length - 1] + 1 : 3;
  return {
    preview: lines.slice(0, cutLine).join("\n"),
    rest: lines.slice(cutLine).join("\n"),
  };
}

const DEFAULT_VALUE_PROPS = [
  "診断内容を反映した個別文面 — 汎用文書ではありません",
  "確認すべき論点の抜け漏れを防ぐ構成",
  "丁寧・低姿勢で、管理会社に送れる表現",
  "「確認・情報収集」を目的とした安全な文章",
];

export default function EmailLockSection({ draftEmail, maxRefund, mode }: Props) {
  const [loading] = useState(false);
  const { preview, rest } = extractPreview(draftEmail);
  const modeCfg = mode ? MODE_CONFIG[mode] : null;
  const valueProps = modeCfg ? modeCfg.emailValueProps : DEFAULT_VALUE_PROPS;
  const ctaLabel = modeCfg ? modeCfg.ctaLabel : "そのまま送れる確認メールを取得する（¥980）";

  useEffect(() => {
    track("email_lock_viewed", { mode: mode ?? "unknown" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_dRm3co7HebRIewr9Hm7kc00";

  function handlePurchase() {
    if (loading) return;
    track("purchase_started", { mode: mode ?? "unknown", source: "email_lock" });
    window.open(STRIPE_PAYMENT_LINK, "_blank");
  }

  return (
    <div className="rounded-2xl border-2 border-slate-800 overflow-hidden">

      {/* ── ヘッダー：初動キット内容説明 ── */}
      <div className="bg-slate-900 px-5 pt-5 pb-4">
        <div className="flex items-start gap-2 mb-1">
          <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-xs text-amber-400 font-medium mb-0.5">確認初動キット</p>
            <h3 className="text-sm font-bold text-white leading-snug">
              書面で確認する。それが根拠を固める唯一の初動です
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3 ml-6">
          管理会社へ書面で確認することで、費用の根拠・算出方法の説明を求めることができます。
          今回の診断内容をもとに、すぐ送れる確認文面を生成します。
        </p>

        {/* 初動キットの構成内容 */}
        <div className="ml-6 mb-3 pb-3 border-b border-white/10">
          <p className="text-xs text-slate-500 mb-2">初動キットに含まれるもの</p>
          <ul className="space-y-1.5">
            {[
              { icon: "①", label: "状況整理", desc: "今回の診断で検出された論点一覧" },
              { icon: "②", label: "確認順序", desc: "何を先に確認すべきか、優先順位付き" },
              { icon: "③", label: "Yes/No分岐", desc: "返答パターン別の次の行動フロー" },
              { icon: "④", label: "実際の送信文面", desc: "このまま送れる確認文（診断内容反映済み）" },
              { icon: "⑤", label: "返信後の行動", desc: "回答を受け取った後にやること" },
            ].map((item) => (
              <li key={item.icon} className="flex items-start gap-2">
                <span className="text-xs text-amber-400 font-semibold shrink-0 mt-0.5">{item.icon}</span>
                <span className="text-xs text-slate-300">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-slate-500"> — {item.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 価値リスト */}
        <ul className="space-y-1.5">
          {valueProps.map((v, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <svg className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {v}
            </li>
          ))}
        </ul>

        {/* 確認後の流れ */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-slate-500 mb-2">初動キットを使った確認フロー</p>
          <div className="flex items-start gap-2">
            {[
              { step: "1", label: "文面を送る", sub: "①〜④を使って初動" },
              { step: "2", label: "返信を記録する", sub: "③のフローで対応" },
              { step: "3", label: "次の行動を決める", sub: "⑤で判断を固める" },
            ].map((s, i) => (
              <div key={s.step} className="flex-1 flex items-start gap-1.5">
                {i > 0 && <span className="text-slate-600 text-xs mt-1 shrink-0">→</span>}
                <div>
                  <p className="text-xs text-slate-300 font-medium leading-tight">{s.label}</p>
                  <p className="text-xs text-slate-500 leading-tight">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 送信文面のイメージ */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
          <p className="text-xs text-slate-400">▼ 送信文面（④）のイメージ</p>
          <div className="bg-white/5 rounded-lg px-3 py-2.5 text-xs text-slate-300 leading-relaxed space-y-0.5">
            <p>○○費用について、以下の点を確認させてください。</p>
            <p>・この費用の算出根拠と、契約書上の記載箇所</p>
            <p>・必須か任意かの区分、およびその根拠</p>
            <p>・算出方法についてのご説明</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            ※ あなたの費用・状況・説明状況に合わせて整理されます。
            何を聞くか迷わずに送れる状態で提供します。
          </p>
        </div>
      </div>

      {/* ── メールプレビュー ── */}
      <div className="bg-slate-50">
        {/* 無料で見える冒頭 */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">送信文面④（プレビュー）</span>
            <CopyButton
            text={preview}
            label="冒頭をコピー"
            onCopy={() => track("email_preview_copied", { mode: mode ?? "unknown" })}
          />
          </div>
          <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
            {preview}
          </pre>
        </div>

        {/* ロック部分 */}
        <div className="relative px-5 pb-5 min-h-[200px]">
          {/* ぼかし装飾 */}
          <pre
            className="text-sm text-slate-400 whitespace-pre-wrap font-sans leading-relaxed blur-sm select-none pointer-events-none pt-3"
            aria-hidden="true"
          >
            {rest}
          </pre>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 via-slate-50/80 to-slate-50" />

          {/* CTAカード */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5">
            <div className="flex items-center gap-1.5 text-slate-500 bg-white/90 rounded-full px-3 py-1.5 shadow-sm">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-medium">初動キット全文は有料版で確認できます</span>
            </div>

            {/* ROI バッジ（maxRefund がある場合） */}
            {maxRefund && (
              <div className="text-xs text-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                <span className="text-amber-700 font-semibold">¥980</span>
                <span className="text-amber-600"> の確認で、最大 </span>
                <span className="text-amber-700 font-semibold">{fmt(maxRefund)}</span>
                <span className="text-amber-600"> の差が生まれる可能性</span>
              </div>
            )}

            {/* メインCTAボタン */}
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full max-w-xs bg-slate-900 text-white text-sm font-bold py-4 px-6 rounded-xl
                hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-150 active:scale-[0.97]
                shadow-lg shadow-slate-900/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  準備中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {ctaLabel}
                  <span className="bg-white/20 text-white text-xs font-normal px-2 py-0.5 rounded-full">
                    ¥980
                  </span>
                </span>
              )}
            </button>

            <p className="text-xs text-slate-400 text-center">
              一度の購入で今回の診断に対応した初動キット全文を取得
            </p>
          </div>
        </div>
      </div>

      {/* ── フッター免責 ── */}
      <div className="bg-slate-100 px-5 py-3 border-t border-slate-200">
        <p className="text-xs text-slate-400 leading-relaxed text-center">
          この初動キットは「確認・情報収集」が目的です。法的請求・交渉の代行ではありません。
          ※ 個別の法律問題は弁護士等にご相談ください。
        </p>
      </div>
    </div>
  );
}
