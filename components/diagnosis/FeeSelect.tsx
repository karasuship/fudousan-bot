"use client";

import type { FeeId2 } from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";

const ALL_FEE_IDS: FeeId2[] = [
  "agency_fee",
  "key_exchange",
  "cleaning",
  "disinfection",
  "support_24h",
  "admin_fee",
  "guarantor",
  "fire_insurance",
  "key_money",
  "unknown_label",
  "label_mismatch",
  "entity_mismatch",
  "special_clause",
];

interface Props {
  selected: FeeId2[];
  onAdd: (feeId: FeeId2) => void;
}

export default function FeeSelect({ selected, onAdd }: Props) {
  const available = ALL_FEE_IDS.filter((id) => !selected.includes(id));

  if (available.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((feeId) => (
        <button
          key={feeId}
          type="button"
          onClick={() => onAdd(feeId)}
          className="px-3 py-1.5 rounded-lg text-sm border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all whitespace-nowrap"
        >
          + {FEE_LABEL[feeId]}
        </button>
      ))}
    </div>
  );
}
