"use client";

import { useState, useEffect } from "react";
import type {
  FeeEntry,
  FeeId2,
  DiagnosisInput2,
  PreContractContext,
} from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";
import { FieldBlock, HelpText, Label, RadioGroup, SectionCard } from "./ui";
import FeeSelect from "./FeeSelect";
import PreContractContextInput from "./PreContractContextInput";

type Step = "context" | "fees" | "submit";

const STEP_LABEL: Record<Step, string> = {
  context: "状況を教えてください",
  fees:    "費用の項目と金額",
  submit:  "内容の確認",
};
const STEP_ORDER: Step[] = ["context", "fees", "submit"];

const CONTRACT_MONTH_LABEL: Record<PreContractContext["contractMonth"], string> = {
  busy:   "1〜3月（繁忙期）",
  normal: "9〜12月（通常期）",
  off:    "4〜8月（閑散期）",
};
const APPLICATION_STATUS_LABEL: Record<PreContractContext["applicationStatus"], string> = {
  before_apply:    "まだ申込んでいない",
  applied_waiting: "申込済み・審査待ち",
  approved:        "審査通過・見積もり受領済み",
};
const COMPARISON_LABEL: Record<NonNullable<PreContractContext["otherCompanyComparison"]>, string> = {
  yes:      "している",
  planning: "比較を予定している",
  no:       "していない",
};

function isContextComplete(ctx: Partial<PreContractContext>): boolean {
  return ctx.monthlyRent != null && ctx.contractMonth != null && ctx.applicationStatus != null;
}

function toContext(ctx: Partial<PreContractContext>): PreContractContext {
  return {
    monthlyRent: ctx.monthlyRent!,
    contractMonth: ctx.contractMonth!,
    applicationStatus: ctx.applicationStatus!,
    otherCompanyComparison: ctx.otherCompanyComparison ?? null,
    hasGuarantor: ctx.hasGuarantor ?? null,
  };
}

function createPreContractFeeEntry(feeId: FeeId2): FeeEntry {
  return {
    feeId,
    amount: null,
    threeLayer: {
      voluntaryExplained: "unknown",
      ownerOrAgentExplained: "unknown",
      evidenceProvided: "unknown",
    },
    detail: { kind: "pre_contract", feeId },
  };
}

interface Props {
  initialFees?: FeeEntry[];
  onChange: (input: DiagnosisInput2) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
}

export default function PreContractFlow({ initialFees, onChange, onSubmit = () => {}, isLoading = false }: Props) {
  const [step, setStep] = useState<Step>("context");
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  const [context, setContext] = useState<Partial<PreContractContext>>({});
  const [fees, setFees] = useState<FeeEntry[]>(() => initialFees ?? []);

  function goTo(next: Step) {
    setStepHistory((prev) => [...prev, step]);
    setStep(next);
  }

  function goBack() {
    const prev = stepHistory[stepHistory.length - 1];
    if (!prev) return;
    setStepHistory((h) => h.slice(0, -1));
    setStep(prev);
  }

  function addFee(feeId: FeeId2) {
    setFees((prev) => [...prev, createPreContractFeeEntry(feeId)]);
  }

  function updateFeeAmount(feeId: FeeId2, amount: number | null) {
    setFees((prev) => prev.map((f) => f.feeId === feeId ? { ...f, amount } : f));
  }

  function removeFee(feeId: FeeId2) {
    setFees((prev) => prev.filter((f) => f.feeId !== feeId));
    if (feeId === "guarantor") {
      setContext((prev) => ({ ...prev, hasGuarantor: undefined }));
    }
  }

  function buildInput(): DiagnosisInput2 {
    return {
      timing: "pre_contract",
      stage: "pre_sign",
      monthlyRent: context.monthlyRent ?? null,
      totalAmount: null,
      fees,
      timeline: [],
      agentResponse: null,
      preContractContext: isContextComplete(context) ? toContext(context) : undefined,
      emailTone: "polite",
    };
  }

  useEffect(() => {
    onChange(buildInput());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, fees]);

  const stepIdx = STEP_ORDER.indexOf(step);
  const progressPct = ((stepIdx + 1) / STEP_ORDER.length) * 100;
  const contextComplete = isContextComplete(context);

  return (
    <div className="space-y-5">

      {/* 進捗バー */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">{STEP_LABEL[step]}</span>
      </div>

      {/* ── STEP: context ── */}
      {step === "context" && (
        <div className="space-y-4">
          <PreContractContextInput value={context} onChange={setContext} />
          <button
            type="button"
            onClick={() => goTo("fees")}
            disabled={!contextComplete}
            title={!contextComplete ? "家賃・契約予定時期・申込状況を選択してください" : undefined}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
              contextComplete
                ? "bg-blue-900 text-white hover:bg-blue-800"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            次へ →
          </button>
        </div>
      )}

      {/* ── STEP: fees ── */}
      {step === "fees" && (
        <div className="space-y-4">
          <SectionCard>
            <FieldBlock>
              <Label>請求されている費用を選んでください</Label>
              <HelpText>複数選択できます</HelpText>
              <div className="mt-2">
                <FeeSelect selected={fees.map((f) => f.feeId)} onAdd={addFee} />
              </div>
            </FieldBlock>
          </SectionCard>

          {fees.length > 0 && (
            <SectionCard>
              <FieldBlock>
                <Label>各費目の金額（任意）</Label>
                <div className="space-y-2 mt-1">
                  {fees.map((fee) => (
                    <div key={fee.feeId} className="flex items-center gap-2">
                      <span className="text-sm text-slate-700 w-32 shrink-0">
                        {FEE_LABEL[fee.feeId]}
                      </span>
                      <input
                        type="number"
                        value={fee.amount ?? ""}
                        onChange={(e) =>
                          updateFeeAmount(
                            fee.feeId,
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        placeholder="例: 55000"
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 w-32"
                      />
                      <span className="text-xs text-slate-400">円</span>
                      <button
                        type="button"
                        onClick={() => removeFee(fee.feeId)}
                        className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </FieldBlock>
            </SectionCard>
          )}

          {/* Q5：連帯保証人（保証会社費用が含まれる場合のみ・任意） */}
          {fees.some((f) => f.feeId === "guarantor") && (
            <SectionCard>
              <FieldBlock>
                <Label>連帯保証人を立てる予定はありますか？</Label>
                <HelpText>保証会社費用の交渉材料になります（任意）</HelpText>
                <RadioGroup
                  value={context.hasGuarantor ?? null}
                  onChange={(v) => setContext({ ...context, hasGuarantor: v })}
                  options={[
                    { value: "yes" as const, label: "立てる予定がある" },
                    { value: "no"  as const, label: "立てない（保証会社のみ）" },
                  ]}
                />
              </FieldBlock>
            </SectionCard>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              ← 戻る
            </button>
            <button
              type="button"
              onClick={() => goTo("submit")}
              disabled={fees.length === 0}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                fees.length > 0
                  ? "bg-blue-900 text-white hover:bg-blue-800"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {fees.length === 0 ? "費用を選択してください" : "確認する →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: submit ── */}
      {step === "submit" && (
        <div className="space-y-4">

          {/* サマリー：コンテキスト */}
          <SectionCard>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">状況</p>
              <button
                type="button"
                onClick={() => goTo("context")}
                className="text-xs text-blue-700 hover:underline"
              >
                変更する
              </button>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p>家賃：{context.monthlyRent?.toLocaleString("ja-JP")}円</p>
              <p>時期：{context.contractMonth ? CONTRACT_MONTH_LABEL[context.contractMonth] : "—"}</p>
              <p>申込：{context.applicationStatus ? APPLICATION_STATUS_LABEL[context.applicationStatus] : "—"}</p>
              {context.otherCompanyComparison && (
                <p>他社比較：{COMPARISON_LABEL[context.otherCompanyComparison]}</p>
              )}
              {context.hasGuarantor === "yes" && <p>連帯保証人：立てる予定がある</p>}
              {context.hasGuarantor === "no"  && <p>連帯保証人：立てない（保証会社のみ）</p>}
            </div>
          </SectionCard>

          {/* サマリー：費目 */}
          <SectionCard>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">費用</p>
              <button
                type="button"
                onClick={() => goTo("fees")}
                className="text-xs text-blue-700 hover:underline"
              >
                変更する
              </button>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              {fees.map((fee) => (
                <p key={fee.feeId}>
                  {FEE_LABEL[fee.feeId]}
                  {fee.amount != null && fee.amount > 0
                    ? `：${fee.amount.toLocaleString("ja-JP")}円`
                    : "（金額未入力）"}
                </p>
              ))}
            </div>
          </SectionCard>

          <button
            type="button"
            onClick={goBack}
            className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            ← 戻る
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {isLoading ? "診断中..." : "診断する"}
          </button>

        </div>
      )}

    </div>
  );
}
