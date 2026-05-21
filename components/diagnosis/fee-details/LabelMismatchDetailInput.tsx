"use client";

import type { LabelMismatchDetail } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "../ui";

type MismatchType = LabelMismatchDetail["mismatchType"][number];

const MISMATCH_OPTIONS: { value: MismatchType; label: string }[] = [
  { value: "invoice_vs_receipt", label: "請求書と領収書で会社名が違う" },
  { value: "doc_name_differs", label: "書類によって費用の名前が違う" },
  { value: "verbal_vs_written", label: "口頭説明と書面が違う" },
  { value: "requester_vs_issuer", label: "請求者と領収書発行者が違う" },
];

interface Props {
  value: LabelMismatchDetail;
  onChange: (v: LabelMismatchDetail) => void;
}

export default function LabelMismatchDetailInput({ value, onChange }: Props) {
  function toggleMismatchType(t: MismatchType) {
    const next = value.mismatchType.includes(t)
      ? value.mismatchType.filter((x) => x !== t)
      : [...value.mismatchType, t];
    onChange({ ...value, mismatchType: next });
  }

  return (
    <div className="space-y-4">
      <FieldBlock>
        <Label>何が違いますか？（複数選択可）</Label>
        <div className="flex flex-col gap-2">
          {MISMATCH_OPTIONS.map(({ value: t, label }) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input
                type="checkbox"
                checked={value.mismatchType.includes(t)}
                onChange={() => toggleMismatchType(t)}
                className="rounded border-slate-300"
              />
              {label}
            </label>
          ))}
        </div>
      </FieldBlock>

      <FieldBlock>
        <Label>違いについて説明を受けましたか？</Label>
        <RadioGroup
          value={value.mismatchExplained}
          onChange={(v) => onChange({ ...value, mismatchExplained: v })}
          options={[
            { value: "yes" as const, label: "はい、説明を受けた" },
            { value: "no" as const, label: "いいえ" },
            { value: "problem_none_only" as const, label: "「問題ありません」とだけ言われた" },
            { value: "unknown" as const, label: "わからない" },
          ]}
        />
      </FieldBlock>
    </div>
  );
}
