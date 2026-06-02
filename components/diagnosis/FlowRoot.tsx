"use client";

import { useState } from "react";
import type { DiagnosisInput2, DiagnosisResult2, FeeEntry } from "@/lib/types_v2";
import PreContractFlow from "./PreContractFlow";
import PostContractFlow from "./PostContractFlow";
import PostContractLiteFlow from "./PostContractLiteFlow";
import PostContractLiteResult from "../PostContractLiteResult";

type Stage1Choice = "pre" | "signed";
type Stage2Choice = "has_docs" | "no_docs";

interface Props {
  initialFees?: FeeEntry[];
  onChange: (input: DiagnosisInput2 | null) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
}

export default function FlowRoot({ initialFees, onChange, onSubmit = () => {}, isLoading = false }: Props) {
  const [stage1, setStage1] = useState<Stage1Choice | "">("");
  const [stage2, setStage2] = useState<Stage2Choice | "">("");

  // ライトフロー専用の内部状態
  const [liteInput, setLiteInput] = useState<DiagnosisInput2 | null>(null);
  const [liteResult, setLiteResult] = useState<DiagnosisResult2 | null>(null);
  const [liteLoading, setLiteLoading] = useState(false);
  const [liteError, setLiteError] = useState<string | null>(null);

  function resetAll() {
    setStage1("");
    setStage2("");
    onChange(null);
    setLiteInput(null);
    setLiteResult(null);
    setLiteError(null);
  }

  function selectStage1(choice: Stage1Choice) {
    setStage1(choice);
    setStage2("");
    onChange(null);
    setLiteInput(null);
    setLiteResult(null);
    setLiteError(null);
  }

  function selectStage2(choice: Stage2Choice) {
    setStage2(choice);
    onChange(null);
    setLiteInput(null);
    setLiteResult(null);
    setLiteError(null);
  }

  async function handleLiteSubmit() {
    if (!liteInput || liteInput.fees.length === 0) return;
    setLiteLoading(true);
    setLiteError(null);
    try {
      const res = await fetch("/api/diagnose-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(liteInput),
      });
      if (!res.ok) throw new Error("診断に失敗しました");
      const result: DiagnosisResult2 = await res.json();
      setLiteResult(result);
    } catch (e) {
      setLiteError(e instanceof Error ? e.message : "診断に失敗しました");
    } finally {
      setLiteLoading(false);
    }
  }

  const activeFlow =
    stage1 === "pre"                              ? "pre"      :
    stage1 === "signed" && stage2 === "has_docs"  ? "has_docs" :
    stage1 === "signed" && stage2 === "no_docs"   ? "no_docs"  :
    null;

  const summaryLabel =
    stage1 === "pre"                              ? "まだ署名していない"       :
    stage1 === "signed" && stage2 === "has_docs"  ? "署名した・書類あり"       :
    stage1 === "signed" && stage2 === "no_docs"   ? "署名した・書類なし"       :
    "";

  return (
    <div className="space-y-5">

      {/* ── 第1段階 ── */}
      {!stage1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">契約書に署名しましたか？</p>
          <div className="flex flex-col gap-2">
            {([
              { value: "pre"    as Stage1Choice, label: "まだしていない" },
              { value: "signed" as Stage1Choice, label: "署名した" },
            ]).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectStage1(value)}
                className="px-4 py-3 rounded-xl text-sm border text-left transition-all bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 第2段階（署名済みの場合のみ） ── */}
      {stage1 === "signed" && !stage2 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            重要事項説明書・契約書・請求書などの書類はありますか？
          </p>
          <div className="flex flex-col gap-2">
            {([
              { value: "has_docs" as Stage2Choice, label: "重説・契約書・請求書などが手元にある" },
              { value: "no_docs"  as Stage2Choice, label: "書類が手元にない・見当たらない" },
            ]).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectStage2(value)}
                className="px-4 py-3 rounded-xl text-sm border text-left transition-all bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { setStage1(""); onChange(null); }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← 戻る
          </button>
        </div>
      )}

      {/* 選択後：要約表示 */}
      {activeFlow && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <p className="text-xs text-slate-600">{summaryLabel}</p>
          <button
            type="button"
            onClick={resetAll}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            変更する
          </button>
        </div>
      )}

      {/* 契約前フロー */}
      {activeFlow === "pre" && (
        <PreContractFlow
          initialFees={initialFees}
          onChange={(input) => onChange(input)}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      )}

      {/* 契約後フロー（書類あり） */}
      {activeFlow === "has_docs" && (
        <PostContractFlow
          initialFees={initialFees}
          onChange={(input) => onChange(input)}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      )}

      {/* ライトフロー（書類なし・内部でAPI呼び出しと結果表示を完結） */}
      {activeFlow === "no_docs" && !liteResult && (
        <PostContractLiteFlow
          initialFees={initialFees}
          onChange={setLiteInput}
          onSubmit={handleLiteSubmit}
          isLoading={liteLoading}
        />
      )}

      {activeFlow === "no_docs" && liteError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{liteError}</p>
        </div>
      )}

      {activeFlow === "no_docs" && liteResult && liteInput && (
        <PostContractLiteResult
          result={liteResult}
          fees={liteInput.fees}
          onBack={() => setLiteResult(null)}
        />
      )}

    </div>
  );
}
