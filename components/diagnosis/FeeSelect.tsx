"use client";

import Link from "next/link";
import type { FeeId2 } from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";
import { getFeeContent } from "@/lib/feeContent";

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

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="space-y-2">
          {selected.map((feeId) => {
            const content = getFeeContent(feeId);
            return (
              <div
                key={feeId}
                className="rounded-lg border border-blue-200 bg-blue-50 p-3"
              >
                <p className="text-sm font-medium text-blue-700">
                  ☑ {FEE_LABEL[feeId]}
                </p>
                {content && (
                  <>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      {content.layer1}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {content.checkPoints.slice(0, 4).map((point, i) => (
                        <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                          <span className="shrink-0 text-slate-400">・</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 text-right">
                      <Link
                        href={`/fees/${content.slug}`}
                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                      >
                        詳しく見る →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {available.length > 0 && (
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
      )}
    </div>
  );
}
