"use client";

import type { SpecialClauseDetail } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "../ui";

type YNU = "yes" | "no" | "unknown";
const YNU_OPTIONS: { value: YNU; label: string }[] = [
  { value: "yes", label: "はい" },
  { value: "no", label: "いいえ" },
  { value: "unknown", label: "わからない" },
];

interface Props {
  value: SpecialClauseDetail;
  onChange: (v: SpecialClauseDetail) => void;
}

export default function SpecialClauseDetailInput({ value, onChange }: Props) {
  function set<K extends keyof SpecialClauseDetail>(key: K, v: SpecialClauseDetail[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-4">
      <FieldBlock>
        <Label>特約の内容を読み上げられましたか？</Label>
        <RadioGroup
          value={value.clauseReadAloud}
          onChange={(v) => set("clauseReadAloud", v)}
          options={YNU_OPTIONS}
        />
      </FieldBlock>

      <FieldBlock>
        <Label>借主に不利な内容であることを説明されましたか？</Label>
        <RadioGroup
          value={value.disadvantageExplained}
          onChange={(v) => set("disadvantageExplained", v)}
          options={YNU_OPTIONS}
        />
      </FieldBlock>

      <FieldBlock>
        <Label>オーナーの条件か業者の条件かを説明されましたか？</Label>
        <RadioGroup
          value={value.sourceExplained}
          onChange={(v) => set("sourceExplained", v)}
          options={YNU_OPTIONS}
        />
      </FieldBlock>

      <FieldBlock>
        <Label>断った場合どうなるかを説明されましたか？</Label>
        <RadioGroup
          value={value.refusalConsequenceExplained}
          onChange={(v) => set("refusalConsequenceExplained", v)}
          options={YNU_OPTIONS}
        />
      </FieldBlock>
    </div>
  );
}
