"use client";

import type { FeeEntry, FeeId2, FeeDetail } from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";
import { FieldBlock, HelpText, Label, SectionCard } from "./ui";
import AgencyFeeDetailInput from "./fee-details/AgencyFeeDetailInput";
import KeyExchangeDetailInput from "./fee-details/KeyExchangeDetailInput";
import CleaningDetailInput from "./fee-details/CleaningDetailInput";
import OptionalServiceDetailInput from "./fee-details/OptionalServiceDetailInput";
import GuarantorDetailInput from "./fee-details/GuarantorDetailInput";
import FireInsuranceDetailInput from "./fee-details/FireInsuranceDetailInput";
import LabelMismatchDetailInput from "./fee-details/LabelMismatchDetailInput";
import SpecialClauseDetailInput from "./fee-details/SpecialClauseDetailInput";
import type { AgencyFeeDetail, KeyExchangeDetail, CleaningDetail, OptionalServiceDetail, GuarantorDetail2, FireInsuranceDetail, LabelMismatchDetail, SpecialClauseDetail, KeyMoneyDetail } from "@/lib/types_v2";
import KeyMoneyDetailInput from "./fee-details/KeyMoneyDetailInput";

interface Props {
  entry: FeeEntry;
  onChange: (entry: FeeEntry) => void;
  onRemove: () => void;
}

function renderDetailInput(feeId: FeeId2, detail: FeeDetail | null, onChange: (d: FeeDetail) => void) {
  if (feeId === "agency_fee" && detail?.feeId === "agency_fee") {
    return <AgencyFeeDetailInput value={detail as AgencyFeeDetail} onChange={(v) => onChange(v)} />;
  }
  if (feeId === "key_exchange" && detail?.feeId === "key_exchange") {
    return <KeyExchangeDetailInput value={detail as KeyExchangeDetail} onChange={(v) => onChange(v)} />;
  }
  if (feeId === "cleaning" && detail?.feeId === "cleaning") {
    return <CleaningDetailInput value={detail as CleaningDetail} onChange={(v) => onChange(v)} />;
  }
  if (
    (feeId === "disinfection" || feeId === "support_24h" || feeId === "admin_fee") &&
    detail !== null &&
    (detail.feeId === "disinfection" || detail.feeId === "support_24h" || detail.feeId === "admin_fee")
  ) {
    return <OptionalServiceDetailInput value={detail as OptionalServiceDetail} onChange={(v) => onChange(v)} />;
  }
  if (feeId === "guarantor" && detail?.feeId === "guarantor") {
    return <GuarantorDetailInput value={detail as GuarantorDetail2} onChange={(v) => onChange(v)} />;
  }
  if (feeId === "fire_insurance" && detail?.feeId === "fire_insurance") {
    return <FireInsuranceDetailInput value={detail as FireInsuranceDetail} onChange={(v) => onChange(v)} />;
  }
  if (
    (feeId === "label_mismatch" || feeId === "entity_mismatch" || feeId === "unknown_label") &&
    detail !== null &&
    (detail.feeId === "label_mismatch" || detail.feeId === "entity_mismatch" || detail.feeId === "unknown_label")
  ) {
    return <LabelMismatchDetailInput value={detail as LabelMismatchDetail} onChange={(v) => onChange(v)} />;
  }
  if (feeId === "special_clause" && detail?.feeId === "special_clause") {
    return <SpecialClauseDetailInput value={detail as SpecialClauseDetail} onChange={(v) => onChange(v)} />;
  }
  if (feeId === "key_money" && detail?.feeId === "key_money") {
    return <KeyMoneyDetailInput value={detail as KeyMoneyDetail} onChange={(v) => onChange(v)} />;
  }
  return null;
}

export default function FeeDetailCard({ entry, onChange, onRemove }: Props) {
  function setAmount(raw: string) {
    const n = parseInt(raw.replace(/,/g, ""), 10);
    onChange({ ...entry, amount: isNaN(n) ? null : n });
  }

  function setDetail(d: FeeDetail) {
    onChange({ ...entry, detail: d });
  }

  const detailNode = renderDetailInput(entry.feeId, entry.detail, setDetail);

  return (
    <SectionCard>
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-800">{FEE_LABEL[entry.feeId]}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
        >
          削除
        </button>
      </div>

      <FieldBlock>
        <Label>金額（円）</Label>
        <input
          type="number"
          min={0}
          value={entry.amount ?? ""}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="例: 30000"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 w-40"
        />
        <HelpText>不明な場合は空白のままで構いません</HelpText>
      </FieldBlock>

      {detailNode && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">費目別の詳細</p>
          {detailNode}
        </div>
      )}
    </SectionCard>
  );
}
