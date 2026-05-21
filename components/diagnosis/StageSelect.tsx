"use client";

import type { ContractStage, ContractTiming } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "./ui";

interface Props {
  timing: ContractTiming | null;
  value: ContractStage | null;
  onChange: (v: ContractStage) => void;
}

const PRE_OPTIONS: { value: ContractStage; label: string }[] = [
  { value: "pre_sign", label: "署名前（見積もり段階）" },
  { value: "post_sign_pre_payment", label: "署名済み・支払前" },
];

const POST_OPTIONS: { value: ContractStage; label: string }[] = [
  { value: "pre_payment", label: "支払前" },
  { value: "post_payment", label: "支払済み" },
];

export default function StageSelect({ timing, value, onChange }: Props) {
  if (!timing) return null;
  const options = timing === "pre_contract" ? PRE_OPTIONS : POST_OPTIONS;
  return (
    <FieldBlock>
      <Label>詳細ステージ</Label>
      <RadioGroup value={value} onChange={onChange} options={options} />
    </FieldBlock>
  );
}
