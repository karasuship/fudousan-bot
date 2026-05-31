"use client";

import { useState } from "react";
import type { DiagnosisInput2, FeeEntry } from "@/lib/types_v2";
import PreContractFlow from "./PreContractFlow";
import PostContractFlow from "./PostContractFlow";

type RootChoice = "pre" | "pre_payment" | "post";

const CHOICE_LABEL: Record<RootChoice, string> = {
  pre: "はい（まだ署名していない）",
  pre_payment: "署名した・まだ支払っていない",
  post: "いいえ（署名・支払い済み）",
};

interface Props {
  initialFees?: FeeEntry[];
  onChange: (input: DiagnosisInput2 | null) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
}

export default function FlowRoot({ initialFees, onChange, onSubmit = () => {}, isLoading = false }: Props) {
  const [choice, setChoice] = useState<RootChoice | "">("");

  function selectChoice(next: RootChoice) {
    setChoice(next);
    onChange(null);
  }

  function resetChoice() {
    setChoice("");
    onChange(null);
  }

  return (
    <div className="space-y-5">
      {/* 最上位分岐：未選択時のみ表示 */}
      {!choice && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">契約書にまだ署名していない状態ですか？</p>
          <div className="flex flex-col gap-2">
            {([
              { value: "pre" as const, label: "はい（まだ署名していない）" },
              { value: "pre_payment" as const, label: "署名した・まだ支払っていない" },
              { value: "post" as const, label: "いいえ（署名・支払い済み）" },
            ] as { value: RootChoice; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectChoice(value)}
                className="px-4 py-3 rounded-xl text-sm border text-left transition-all bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 選択後：要約表示 */}
      {choice && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <p className="text-xs text-slate-600">{CHOICE_LABEL[choice]}</p>
          <button
            type="button"
            onClick={resetChoice}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            変更する
          </button>
        </div>
      )}

      {/* 契約前フロー */}
      {choice === "pre" && (
        <PreContractFlow initialFees={initialFees} onChange={(input) => onChange(input)} onSubmit={onSubmit} isLoading={isLoading} />
      )}

      {/* 契約後フロー（署名済み・支払前：stage固定） */}
      {choice === "pre_payment" && (
        <PostContractFlow
          initialStage="pre_payment"
          initialFees={initialFees}
          onChange={(input) => onChange(input)}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      )}

      {/* 契約後フロー（署名・支払い済み：stage内部決定） */}
      {choice === "post" && (
        <PostContractFlow initialFees={initialFees} onChange={(input) => onChange(input)} onSubmit={onSubmit} isLoading={isLoading} />
      )}
    </div>
  );
}
