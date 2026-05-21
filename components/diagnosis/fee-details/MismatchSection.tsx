"use client";

import { useState } from "react";
import { FieldBlock, Label, HelpText, RadioGroup } from "../ui";

type MismatchKey = "invoice_vs_receipt" | "doc_name_differs" | "verbal_vs_written";
type MismatchExplained = "yes" | "no" | "problem_none_only";

const MISMATCH_OPTIONS: { key: MismatchKey; label: string }[] = [
  { key: "invoice_vs_receipt", label: "請求書と領収書で会社名が違う" },
  { key: "doc_name_differs", label: "書類によって費用の名前が違う" },
  { key: "verbal_vs_written", label: "口頭説明と書面の内容が違う" },
];

export default function MismatchSection() {
  const [checked, setChecked] = useState<Set<MismatchKey>>(new Set());
  const [explained, setExplained] = useState<MismatchExplained | "">("");

  function toggle(key: MismatchKey) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const hasAny = checked.size > 0;

  return (
    <div className="border-t border-slate-100 pt-4 space-y-3">
      <FieldBlock>
        <Label>この費用について書類間で不一致はありますか？</Label>
        <HelpText>見積書・重説・請求書・領収書の間で名目・金額・発行者に違いがある場合</HelpText>
        <div className="flex flex-col gap-2 mt-2">
          {MISMATCH_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 accent-blue-800"
                checked={checked.has(key)}
                onChange={() => toggle(key)}
              />
              <span className="text-sm text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </FieldBlock>

      {hasAny && (
        <FieldBlock>
          <Label>その不一致について説明がありましたか？</Label>
          <RadioGroup
            value={explained || null}
            onChange={(v) => setExplained(v)}
            options={[
              { value: "yes" as MismatchExplained, label: "説明を受けた" },
              { value: "no" as MismatchExplained, label: "説明がなかった" },
              { value: "problem_none_only" as MismatchExplained, label: "「問題ありません」とだけ言われた" },
            ]}
          />
          {explained === "problem_none_only" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
              <p className="text-xs text-amber-700 leading-relaxed">
                「問題ありません」という回答は不一致の理由への答えになっていません。書面での説明を求めることができます。
              </p>
            </div>
          )}
        </FieldBlock>
      )}
    </div>
  );
}
