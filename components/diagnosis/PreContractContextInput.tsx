"use client";

import type { PreContractContext } from "@/lib/types_v2";
import { FieldBlock, HelpText, Label, RadioGroup, SectionCard } from "./ui";

interface Props {
  value: Partial<PreContractContext>;
  onChange: (v: Partial<PreContractContext>) => void;
}

export default function PreContractContextInput({ value, onChange }: Props) {
  return (
    <div className="space-y-6">

      {/* Q1：家賃 */}
      <SectionCard>
        <FieldBlock>
          <Label>物件の家賃（月額）</Label>
          <HelpText>相場レンジの基準として使います</HelpText>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              value={value.monthlyRent ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  monthlyRent: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              placeholder="例: 80000"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 w-40"
            />
            <span className="text-sm text-slate-500">円</span>
          </div>
        </FieldBlock>
      </SectionCard>

      {/* Q2：契約予定時期 */}
      <SectionCard>
        <FieldBlock>
          <Label>契約予定の時期</Label>
          <HelpText>繁忙期と閑散期で交渉戦略が変わります</HelpText>
          <RadioGroup
            value={value.contractMonth ?? null}
            onChange={(v) => onChange({ ...value, contractMonth: v })}
            options={[
              { value: "busy" as const,   label: "1〜3月（繁忙期）" },
              { value: "normal" as const, label: "9〜12月（通常期）" },
              { value: "off" as const,    label: "4〜8月（閑散期）" },
            ]}
          />
        </FieldBlock>
      </SectionCard>

      {/* Q3：申込状況 */}
      <SectionCard>
        <FieldBlock>
          <Label>物件への申込状況</Label>
          <HelpText>タイミングで交渉力が変わります</HelpText>
          <RadioGroup
            value={value.applicationStatus ?? null}
            onChange={(v) => onChange({ ...value, applicationStatus: v })}
            options={[
              { value: "before_apply"    as const, label: "まだ申込んでいない" },
              { value: "applied_waiting" as const, label: "申込済み・審査待ち" },
              { value: "approved"        as const, label: "審査通過・見積もり受領済み" },
            ]}
          />
        </FieldBlock>
      </SectionCard>

      {/* Q4：他社比較（任意） */}
      <SectionCard>
        <FieldBlock>
          <Label>他社で同じ条件を比較していますか？</Label>
          <HelpText>他社比較は交渉材料になります（任意）</HelpText>
          <RadioGroup
            value={value.otherCompanyComparison ?? null}
            onChange={(v) => onChange({ ...value, otherCompanyComparison: v })}
            options={[
              { value: "yes"      as const, label: "している" },
              { value: "planning" as const, label: "比較を予定している" },
              { value: "no"       as const, label: "していない" },
            ]}
          />
        </FieldBlock>
      </SectionCard>

    </div>
  );
}
