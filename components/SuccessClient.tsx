"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DiagnosisResult } from "@/lib/types";
import { MODE_CONFIG } from "@/lib/modes";
import CopyButton from "./CopyButton";

// 本番ではDB保存＆ユーザー認証による管理を推奨
// 現状はlocalStorageによるMVP実装
const STORAGE_KEY = "rental_diagnosis_result_v1";

interface Props {
  paid: boolean;
}

export default function SuccessClient({ paid }: Props) {
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!paid) return;

    // localStorage から診断結果を復元
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setStorageError(true);
        return;
      }
      const parsed = JSON.parse(raw) as DiagnosisResult;
      // 最低限の型チェック
      if (!parsed.draftEmail || !parsed.overallRisk) {
        setStorageError(true);
        return;
      }
      setResult(parsed);
    } catch {
      setStorageError(true);
    }
  }, [paid]);

  // SSRとhydrationのミスマッチを避けるため、mount前は何も表示しない
  if (!mounted) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-400">確認中...</p>
      </div>
    );
  }

  // 支払い未確認
  if (!paid) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-800 mb-2">購入状態を確認できませんでした</h1>
        <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
          支払いが完了していないか、セッションの有効期限が切れている可能性があります。
          お手数ですが、診断ページから再度お試しください。
        </p>
        <Link
          href="/diagnosis"
          className="inline-flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          診断ページへ戻る
        </Link>
      </div>
    );
  }

  // 支払い済みだが診断データが見つからない
  if (storageError || !result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="font-semibold text-green-800">決済が完了しました</h1>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 mb-6">
          <p className="text-sm text-amber-700 leading-relaxed">
            <strong>メール文案の元データが見つかりませんでした。</strong><br />
            お手数ですが、もう一度診断を行ってください。診断後にメール文案が表示されます。
          </p>
          <p className="text-xs text-amber-500 mt-2">
            ブラウザのデータが消えた可能性があります。ご不便をおかけして申し訳ありません。
          </p>
        </div>

        <Link
          href="/diagnosis"
          className="block text-center bg-slate-800 text-white text-sm font-medium py-3 rounded-xl hover:bg-slate-700 transition-colors"
        >
          もう一度診断する
        </Link>
      </div>
    );
  }

  // 支払い済み＆データあり → 全文表示
  const modeCfg = result.mode ? MODE_CONFIG[result.mode] : null;
  const emailTitle = modeCfg ? `${modeCfg.icon} ${modeCfg.label}メール` : "確認メール全文";
  const emailDesc = modeCfg
    ? `${modeCfg.label}に対応したメール文案です。○○の部分をご自身の情報に書き換えてご使用ください。`
    : "今回の診断に対応した確認メール文案を表示しています。";

  return (
    <div className="space-y-6">
      {/* 成功バナー */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="font-semibold text-green-800">決済が完了しました</h1>
        </div>
        <p className="text-sm text-green-700">{emailDesc}</p>
      </div>

      {/* メール全文 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">{emailTitle}</h2>
          <CopyButton text={result.draftEmail} label="全文コピー" />
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
          <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
            {result.draftEmail}
          </pre>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          ※「○○」の部分はご自身の氏名・物件情報に書き換えてからご使用ください。
        </p>
      </div>

      {/* 診断結果サマリー（参考） */}
      <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
        <p className="text-xs text-slate-500 font-medium mb-1">診断サマリー（参考）</p>
        <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
      </div>

      {/* ナビゲーション */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/diagnosis"
          className="flex-1 text-center text-sm text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          もう一度診断する
        </Link>
        <Link
          href="/"
          className="flex-1 text-center text-sm text-slate-500 px-4 py-2.5 rounded-xl hover:text-slate-700 transition-colors"
        >
          トップに戻る
        </Link>
      </div>

      {/* 免責 */}
      <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
        <p className="text-xs text-slate-400 leading-relaxed">{result.disclaimer}</p>
      </div>
    </div>
  );
}
