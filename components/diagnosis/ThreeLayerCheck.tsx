"use client";

import type { ThreeLayerCheck as ThreeLayerCheckData } from "@/lib/types_v2";
import { FieldBlock, HelpText, Label, RadioGroup } from "./ui";

type YNU = "yes" | "no" | "unknown";
const YNU_OPTIONS: { value: YNU; label: string }[] = [
  { value: "yes", label: "はい" },
  { value: "no", label: "いいえ" },
  { value: "unknown", label: "わからない" },
];

interface Props {
  value: ThreeLayerCheckData;
  onChange: (v: ThreeLayerCheckData) => void;
}

export default function ThreeLayerCheck({ value, onChange }: Props) {
  function set<K extends keyof ThreeLayerCheckData>(key: K, v: ThreeLayerCheckData[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-4">
      <FieldBlock>
        <Label>任意か必須かの説明がありましたか？</Label>
        <HelpText>「加入しなくても契約できる」または「必ず必要」といった説明</HelpText>
        <RadioGroup
          value={value.voluntaryExplained}
          onChange={(v) => set("voluntaryExplained", v)}
          options={YNU_OPTIONS}
        />
      </FieldBlock>

      <FieldBlock>
        <Label>オーナーの条件か業者のサービスかの説明がありましたか？</Label>
        <HelpText>誰が求めている費用かの説明</HelpText>
        <RadioGroup
          value={value.ownerOrAgentExplained}
          onChange={(v) => set("ownerOrAgentExplained", v)}
          options={YNU_OPTIONS}
        />
      </FieldBlock>

      <FieldBlock>
        <Label>費用の実態・根拠・資料の提示がありましたか？</Label>
        <HelpText>見積書・業者名・算定根拠など</HelpText>
        <RadioGroup
          value={value.evidenceProvided}
          onChange={(v) => set("evidenceProvided", v)}
          options={YNU_OPTIONS}
        />
      </FieldBlock>
    </div>
  );
}
