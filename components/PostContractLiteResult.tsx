"use client";

import Link from "next/link";
import type {
  DiagnosisResult2,
  FeeEntry,
  IssueStrategy,
} from "@/lib/types_v2";
import { getFeeContent } from "@/lib/feeContent";

interface Props {
  result: DiagnosisResult2;
  fees: FeeEntry[];
  onBack?: () => void;
}

const GROUPS: {
  strategies: IssueStrategy[];
  label: string;
  container: string;
  badge: string;
  header: string;
}[] = [
  {
    strategies: ["delete", "free_rent"],
    label: "確認余地あり",
    container: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    header: "text-blue-800",
  },
  {
    strategies: ["confirm", "admin_check"],
    label: "要確認",
    container: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    header: "text-amber-800",
  },
  {
    strategies: ["record"],
    label: "記録推奨",
    container: "bg-slate-50 border-slate-200",
    badge: "bg-slate-100 text-slate-600",
    header: "text-slate-700",
  },
];

export default function PostContractLiteResult({ result, fees, onBack }: Props) {
  const amountMap = new Map(fees.map((f) => [f.feeId, f.amount]));

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
          契約後（かんたん確認）
        </span>
      </div>

      {/* 2. 費目リスト（3グループ） */}
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
                  const content = getFeeContent(s.feeId);
                  return (
                    <div key={s.feeId} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-0.5 ${group.badge}`}>
                          {s.label}
                        </span>
                        <p className={`text-xs leading-relaxed ${group.header}`}>{s.reason}</p>
                        {content && (
                          <Link
                            href={`/fees/${content.slug}`}
                            className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                          >
                            詳しく見る →
                          </Link>
                        )}
                      </div>
                      {amount != null && amount > 0 && (
                        <span className={`text-xs font-semibold shrink-0 ${group.header}`}>
                          ¥{amount.toLocaleString("ja-JP")}
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

      {/* 3. 書類取り寄せ案内 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-1">
        <p className="text-sm text-slate-700 leading-relaxed">
          より詳しく確認するには契約書類が必要です。<br />
          業者に書類を請求できます。
        </p>
        <p className="text-sm text-slate-500">
          → 書類取り寄せメール文例を見る（無料）
        </p>
      </div>

    </div>
  );
}
