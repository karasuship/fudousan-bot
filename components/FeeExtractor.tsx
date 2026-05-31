"use client";

import { useRef, useState } from "react";
import type { FeeEntry } from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";

interface RawLabel {
  feeId: string;
  rawLabel: string;
  amount: number | null;
}

interface Props {
  onExtract: (fees: FeeEntry[]) => void;
}

export default function FeeExtractor({ onExtract }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawLabels, setRawLabels] = useState<RawLabel[] | null>(null);
  const [pendingFees, setPendingFees] = useState<FeeEntry[] | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setRawLabels(null);
    setPendingFees(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract-fees", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "抽出に失敗しました");
        return;
      }
      setRawLabels(data.rawLabels);
      setPendingFees(data.fees);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleApply() {
    if (!pendingFees) return;
    onExtract(pendingFees);
    setRawLabels(null);
    setPendingFees(null);
    setOpen(false);
  }

  function handleClose() {
    setRawLabels(null);
    setPendingFees(null);
    setError(null);
    setOpen(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <span className="font-medium">見積書から自動入力（任意）</span>
        <span className="text-slate-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-500">
            見積書の画像またはPDFをアップロードすると、費目と金額を自動で読み取ります。
          </p>

          {!loading && !rawLabels && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                ファイルを選択
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                className="hidden"
                onChange={handleInputChange}
              />
              <p className="text-xs text-slate-400">JPEG / PNG / PDF に対応</p>
            </>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              読み取り中...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-xs text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => { setError(null); inputRef.current?.click(); }}
                className="text-xs text-red-600 hover:underline mt-1"
              >
                再試行する
              </button>
            </div>
          )}

          {rawLabels && pendingFees && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-700">読み取り結果：</p>
              <ul className="space-y-1.5">
                {rawLabels.map((r, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-slate-600 bg-white rounded-lg border border-slate-200 px-3 py-2">
                    <span>
                      <span className="text-slate-400 mr-1.5">{r.rawLabel}</span>
                      <span className="text-slate-700 font-medium">
                        {(FEE_LABEL as Record<string, string>)[r.feeId] ?? r.feeId}
                      </span>
                    </span>
                    <span className="font-mono text-slate-800 shrink-0 ml-3">
                      {r.amount != null ? `¥${r.amount.toLocaleString()}` : "金額不明"}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  フォームに反映する
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  閉じる
                </button>
              </div>
              <p className="text-xs text-slate-400">
                反映後、各費目の金額を確認・修正できます。フォームの選択肢はリセットされます。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
