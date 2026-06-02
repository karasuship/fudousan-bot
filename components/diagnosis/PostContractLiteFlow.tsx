"use client";

import { useEffect } from "react";
import { useState } from "react";
import Link from "next/link";
import type {
  FeeEntry,
  FeeId2,
  DiagnosisInput2,
  PreContractContext,
} from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";
import { FieldBlock, HelpText, Label, RadioGroup, SectionCard } from "./ui";
import FeeSelect from "./FeeSelect";
import { getFeeContent } from "@/lib/feeContent";

type Step = "fees" | "submit";

const STEP_ORDER: Step[] = ["fees", "submit"];

const STEP_LABEL: Record<Step, string> = {
  fees:   "費用の入力",
  submit: "内容の確認",
};

function createPostContractLiteFeeEntry(feeId: FeeId2): FeeEntry {
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

export default function PostContractLiteFlow({
  initialFees,
  onChange,
  onSubmit = () => {},
  isLoading = false,
}: Props) {
  const [step, setStep] = useState<Step>("fees");
  const [fees, setFees] = useState<FeeEntry[]>(() => initialFees ?? []);
  const [monthlyRentStr, setMonthlyRentStr] = useState("");
  const [hasGuarantor, setHasGuarantor] = useState<"yes" | "no" | null>(null);

  const monthlyRent = monthlyRentStr ? parseInt(monthlyRentStr, 10) || null : null;

  function buildInput(): DiagnosisInput2 {
    const ctx: PreContractContext = {
      monthlyRent: monthlyRent ?? 0,
      contractMonth: "normal",
      applicationStatus: "applied_waiting",
      otherCompanyComparison: null,
      otherCompanyConfirmed: "not_checked",
      hasGuarantor: hasGuarantor,
    };
    return {
      timing: "pre_contract",
      stage: "pre_sign",
      monthlyRent,
      totalAmount: null,
      fees,
      timeline: [],
      agentResponse: null,
      preContractContext: ctx,
      emailTone: "polite",
    };
  }

  useEffect(() => {
    onChange(buildInput());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees, monthlyRentStr, hasGuarantor]);

  function addFee(feeId: FeeId2) {
    setFees((prev) =>
      prev.some((f) => f.feeId === feeId)
        ? prev
        : [...prev, createPostContractLiteFeeEntry(feeId)]
    );
  }

  function updateFeeAmount(feeId: FeeId2, amount: number | null) {
    setFees((prev) => prev.map((f) => f.feeId === feeId ? { ...f, amount } : f));
  }

  function removeFee(feeId: FeeId2) {
    setFees((prev) => prev.filter((f) => f.feeId !== feeId));
    if (feeId === "guarantor") setHasGuarantor(null);
  }

  const stepIdx = STEP_ORDER.indexOf(step);
  const progressPct = ((stepIdx + 1) / STEP_ORDER.length) * 100;

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

      {/* ── STEP: fees ── */}
      {step === "fees" && (
        <div className="space-y-4">
          <SectionCard>
            <FieldBlock>
              <Label>月額家賃（任意）</Label>
              <HelpText>確認対象の費目の計算に使います</HelpText>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={monthlyRentStr}
                  onChange={(e) => setMonthlyRentStr(e.target.value)}
                  placeholder="例: 80000"
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 w-40"
                />
                <span className="text-xs text-slate-400">円</span>
              </div>
            </FieldBlock>
          </SectionCard>

          <SectionCard>
            <FieldBlock>
              <Label>請求されている費用を選んでください</Label>
              <HelpText>複数選択できます</HelpText>
              <div className="mt-2">
                <FeeSelect selected={[]} onAdd={addFee} />
              </div>
            </FieldBlock>
          </SectionCard>

          {fees.length > 0 && (
            <SectionCard>
              <FieldBlock>
                <Label>各費目の金額（任意）</Label>
                <div className="space-y-4 mt-1">
                  {fees.map((fee) => {
                    const content = getFeeContent(fee.feeId);
                    return (
                      <div key={fee.feeId} className="rounded-lg border border-slate-200 p-3 space-y-2">
                        <p className="text-sm font-medium text-slate-700">
                          {FEE_LABEL[fee.feeId]}
                        </p>
                        {content && (
                          <>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {content.layer1}
                            </p>
                            <ul className="space-y-1">
                              {content.checkPoints.slice(0, 4).map((point, i) => (
                                <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                                  <span className="shrink-0 text-slate-400">・</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="text-right">
                              <Link
                                href={`/fees/${content.slug}`}
                                className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                              >
                                詳しく見る →
                              </Link>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-2 pt-1">
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
                      </div>
                    );
                  })}
                </div>
              </FieldBlock>
            </SectionCard>
          )}

          {fees.some((f) => f.feeId === "guarantor") && (
            <SectionCard>
              <FieldBlock>
                <Label>連帯保証人を立てる予定はありますか？</Label>
                <HelpText>保証会社費用の確認材料になります（任意）</HelpText>
                <RadioGroup
                  value={hasGuarantor}
                  onChange={setHasGuarantor}
                  options={[
                    { value: "yes" as const, label: "立てる予定がある" },
                    { value: "no"  as const, label: "立てない（保証会社のみ）" },
                  ]}
                />
              </FieldBlock>
            </SectionCard>
          )}

          <button
            type="button"
            onClick={() => setStep("submit")}
            disabled={fees.length === 0}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
              fees.length > 0
                ? "bg-blue-900 text-white hover:bg-blue-800"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {fees.length === 0 ? "費用を選択してください" : "確認する →"}
          </button>
        </div>
      )}

      {/* ── STEP: submit ── */}
      {step === "submit" && (
        <div className="space-y-4">
          <SectionCard>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">費用</p>
              <button
                type="button"
                onClick={() => setStep("fees")}
                className="text-xs text-blue-700 hover:underline"
              >
                変更する
              </button>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              {monthlyRent && (
                <p>家賃：{monthlyRent.toLocaleString("ja-JP")}円</p>
              )}
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
            onClick={() => setStep("fees")}
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
