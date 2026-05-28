"use client";

import { useState } from "react";
import type {
  DiagnosisResult2,
  FeeEntry,
  PreContractContext,
  PreContractEstimate,
  IssueStrategy,
} from "@/lib/types_v2";

interface Props {
  result: DiagnosisResult2;
  fees: FeeEntry[];
  preContractContext: PreContractContext | undefined;
  onBack?: () => void;
}

function fmt(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

const DIFFICULTY: Record<string, { stars: number; label: string }> = {
  delete:      { stars: 3, label: "交渉しやすい" },
  free_rent:   { stars: 2, label: "交渉できる" },
  admin_check: { stars: 1, label: "確認" },
  confirm:     { stars: 1, label: "確認" },
  record:      { stars: 0, label: "" },
};

const GROUPS: {
  strategies: IssueStrategy[];
  label: string;
  container: string;
  badge: string;
  header: string;
}[] = [
  {
    strategies: ["delete"],
    label: "S  外せる",
    container: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
    header: "text-green-800",
  },
  {
    strategies: ["free_rent"],
    label: "A  調整できる",
    container: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    header: "text-blue-800",
  },
  {
    strategies: ["confirm", "admin_check"],
    label: "B  確認する",
    container: "bg-slate-50 border-slate-200",
    badge: "bg-slate-100 text-slate-600",
    header: "text-slate-700",
  },
];

const STATUS_TEXT: Record<PreContractContext["applicationStatus"], string> = {
  before_apply:    "申込前なので、交渉が最も通りやすい状況です",
  applied_waiting: "申込済みですが、署名前なら交渉の余地があります",
  approved:        "契約直前ですが、署名前に確認しておく価値があります",
};

export default function PreContractResult({ result, fees, preContractContext, onBack }: Props) {
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
        body: JSON.stringify({ diagnosisResult: result, timing: "pre_contract", stage: "pre_sign" }),
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
  const estimate: PreContractEstimate | null | undefined = result.preContractEstimate;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

      {/* 1. ヘッダー */}
      <div className="flex items-center justify-between">
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
        <span className="text-xs font-medium text-slate-500 tracking-wide">
          契約前・署名前（見積もり段階）
        </span>
      </div>

      {/* 2. 総額ブロック */}
      {estimate && (estimate.totalMin > 0 || estimate.totalMax > 0) ? (
        <div className="rounded-2xl bg-blue-900 text-white px-5 py-5 space-y-2">
          <p className="text-sm font-medium text-blue-200">この見積もりには</p>
          <p className="text-4xl font-bold tracking-tight">{fmt(estimate.totalMin)}</p>
          <p className="text-sm text-blue-100">見直せます</p>

          {estimate.totalMax > estimate.totalMin && (
            <p className="text-xs text-blue-200 pt-1">
              交渉次第でさらに {fmt(estimate.totalMax - estimate.totalMin)}
              　（最大 {fmt(estimate.totalMax)}）
            </p>
          )}

          {preContractContext?.applicationStatus && (
            <p className="text-xs text-blue-100 border-t border-blue-700 pt-2 mt-1">
              {STATUS_TEXT[preContractContext.applicationStatus]}
            </p>
          )}

          <p className="text-xs text-blue-200">
            上限分も、フリーレント転換・他社プラン・礼金との総額調整で狙えます
          </p>
        </div>
      ) : estimate ? (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-600">費用の内訳を確認しましょう</p>
        </div>
      ) : null}

      {/* 3. 費目リスト（3グループ） */}
      <div className="space-y-3">
        {GROUPS.map((group) => {
          const matched = result.feeStrategies.filter((s) =>
            (group.strategies as string[]).includes(s.strategy)
          );
          if (matched.length === 0) return null;

          return (
            <div
              key={group.label}
              className={`rounded-xl border px-4 py-3 space-y-2 ${group.container}`}
            >
              <p className={`text-xs font-semibold ${group.header}`}>{group.label}</p>
              <div className="space-y-1.5">
                {matched.map((s) => {
                  const amount = amountMap.get(s.feeId);
                  const diff = DIFFICULTY[s.strategy];
                  return (
                    <div key={s.feeId} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-0.5 ${group.badge}`}>
                          {s.label}
                        </span>
                        {diff && diff.stars > 0 && (
                          <div className="flex items-center gap-1 mt-0.5 mb-0.5">
                            <span className="text-xs text-slate-500">
                              {"★".repeat(diff.stars)}{"☆".repeat(3 - diff.stars)}
                            </span>
                            <span className="text-xs text-slate-500">{diff.label}</span>
                          </div>
                        )}
                        <p className={`text-xs leading-relaxed ${group.header}`}>{s.reason}</p>
                      </div>
                      {amount != null && amount > 0 && (
                        <span className={`text-xs font-semibold shrink-0 ${group.header}`}>
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

      {/* 4. 課金CTA */}
      <div className="space-y-4">

        {estimate && estimate.totalMax > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4">
            <p className="text-xs text-slate-500 mb-1">調整余地がある費用</p>
            <p className="text-2xl font-bold text-slate-800">{fmt(estimate.totalMax)}</p>
            <p className="text-xs text-slate-500 mt-1">このまま払う前に、一度確認してください。</p>
          </div>
        )}

        <div className="space-y-2 px-1">
          <p className="text-xs font-medium text-slate-600">980円で手に入るもの</p>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li>・ 業者にそのまま送れる交渉メールの全文</li>
            <li>・ 各費用について「なぜこの聞き方をするか」の解説</li>
            <li>・ 業者の返答を貼るだけで2通目・3通目を生成</li>
            <li>・ 契約前の交渉の進め方と並行してできる選択肢</li>
            <li>・ 解決しない場合の相談窓口と状況まとめの文書</li>
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
          {loading ? "処理中..." : "交渉メールと進め方を全部受け取る（980円）"}
        </button>

        <div className="text-center space-y-1">
          <p className="text-xs text-slate-400">Stripeによる安全な決済</p>
          <p className="text-xs text-slate-400">署名前なら、今日送ることができます。</p>
        </div>

      </div>

    </div>
  );
}
