"use client";

import type { ContractTiming } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "./ui";

interface Props {
  value: ContractTiming | null;
  onChange: (v: ContractTiming) => void;
}

export default function TimingSelect({ value, onChange }: Props) {
  return (
    <FieldBlock>
      <Label>契約のタイミング</Label>
      <RadioGroup
        value={value}
        onChange={onChange}
        options={[
          { value: "pre_contract" as const, label: "契約前" },
          { value: "post_contract" as const, label: "契約後" },
        ]}
      />
    </FieldBlock>
  );
}
