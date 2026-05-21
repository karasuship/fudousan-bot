"use client";

import type { TimelineEntry, FeeId2 } from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";
import { FieldBlock, HelpText, Label, RadioGroup, SectionCard } from "./ui";

const EVENT_LABELS: Record<TimelineEntry["event"], string> = {
  fee_payment: "費用支払い",
  juusetsu: "重要事項説明",
  contract_sign: "契約署名",
  key_exchange_execute: "鍵交換実施",
  cleaning_execute: "クリーニング実施",
};

type Certainty = TimelineEntry["certainty"];
const CERTAINTY_OPTIONS: { value: Certainty; label: string }[] = [
  { value: "certain", label: "確実" },
  { value: "approximate", label: "おおよそ" },
  { value: "unknown", label: "不明" },
];

const PRESET_EVENTS: Array<{ event: TimelineEntry["event"]; feeId?: FeeId2 }> = [
  { event: "juusetsu" },
  { event: "contract_sign" },
  { event: "fee_payment" },
  { event: "key_exchange_execute" },
  { event: "cleaning_execute" },
];

interface Props {
  value: TimelineEntry[];
  onChange: (v: TimelineEntry[]) => void;
  activeFeeIds: FeeId2[];
}

export default function TimelineInput({ value, onChange, activeFeeIds }: Props) {
  function updateEntry(index: number, patch: Partial<TimelineEntry>) {
    const next = value.map((e, i) => (i === index ? { ...e, ...patch } : e));
    onChange(next);
  }

  function addEntry(event: TimelineEntry["event"], feeId?: FeeId2) {
    const entry: TimelineEntry = {
      event,
      feeId: feeId ?? null,
      date: null,
      certainty: "unknown",
    };
    onChange([...value, entry]);
  }

  function removeEntry(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const addableFeePayments = activeFeeIds.filter(
    (id) => !value.some((e) => e.event === "fee_payment" && e.feeId === id)
  );

  const addablePresets = PRESET_EVENTS.filter(
    (p) => !p.feeId && !value.some((e) => e.event === p.event && !e.feeId)
  );

  return (
    <div className="space-y-3">
      {value.map((entry, i) => {
        const label =
          entry.event === "fee_payment" && entry.feeId
            ? `${EVENT_LABELS[entry.event]}（${FEE_LABEL[entry.feeId]}）`
            : EVENT_LABELS[entry.event];

        return (
          <SectionCard key={i}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <button
                type="button"
                onClick={() => removeEntry(i)}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
              >
                削除
              </button>
            </div>

            <FieldBlock>
              <Label>日付</Label>
              <input
                type="date"
                value={entry.date ?? ""}
                onChange={(e) => updateEntry(i, { date: e.target.value || null })}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
              <HelpText>不明な場合は空白のままで構いません</HelpText>
            </FieldBlock>

            <FieldBlock>
              <Label>確実度</Label>
              <RadioGroup
                value={entry.certainty}
                onChange={(v) => updateEntry(i, { certainty: v })}
                options={CERTAINTY_OPTIONS}
              />
            </FieldBlock>
          </SectionCard>
        );
      })}

      <div className="flex flex-wrap gap-2 pt-1">
        {addablePresets.map((p) => (
          <button
            key={p.event}
            type="button"
            onClick={() => addEntry(p.event)}
            className="px-3 py-1.5 rounded-lg text-sm border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all whitespace-nowrap"
          >
            + {EVENT_LABELS[p.event]}
          </button>
        ))}
        {addableFeePayments.map((feeId) => (
          <button
            key={`fee_${feeId}`}
            type="button"
            onClick={() => addEntry("fee_payment", feeId)}
            className="px-3 py-1.5 rounded-lg text-sm border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all whitespace-nowrap"
          >
            + {EVENT_LABELS["fee_payment"]}（{FEE_LABEL[feeId]}）
          </button>
        ))}
      </div>
    </div>
  );
}
