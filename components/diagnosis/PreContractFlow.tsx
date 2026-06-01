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

type Step = "situation" | "other_company" | "timing" | "fees" | "submit";

const STEP_ORDER: Step[] = ["situation", "other_company", "timing", "fees", "submit"];

const STEP_LABEL: Record<Step, string> = {
  situation:     "状況を教えてください",
  other_company: "他社確認",
  timing:        "契約時期",
  fees:          "費用の入力",
  submit:        "内容の確認",
};

const TIMING_LABEL: Record<NonNullable<PreContractContext["contractMonth"]>, string> = {
  busy:   "1〜3月（繁忙期）",
  off:    "4〜8月（閑散期）",
  normal: "9〜12月（通常期）",
};

const OTHER_COMPANY_LABEL: Record<NonNullable<PreContractContext["otherCompanyConfirmed"]>, string> = {
  confirmed_same: "他社でも扱っていることを確認済み",
  not_checked:    "まだ確認していない",
  exclusive:      "専任物件・他社では扱っていない",
};

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

export default function PreContractFlow({
  initialFees,
  onChange,
  onSubmit = () => {},
  isLoading = false,
}: Props) {
  const [step, setStep] = useState<Step>("situation");
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  const [context, setContext] = useState<Partial<PreContractContext>>({});
  const [fees, setFees] = useState<FeeEntry[]>(() => initialFees ?? []);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<Step | null>(null);

  function goTo(next: Step) {
    setStepHistory((prev) => [...prev, step]);
    setStep(next);
  }

  function goBack() {
    setFeedback(null);
    setNextStep(null);
    const prev = stepHistory[stepHistory.length - 1];
    if (!prev) return;
    setStepHistory((h) => h.slice(0, -1));
    setStep(prev);
  }

  function selectWithFeedback(next: Step, update: () => void, feedbackText: string) {
    update();
    setFeedback(feedbackText);
    setNextStep(next);
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
    const ctx: PreContractContext | undefined =
      context.applicationStatus != null && context.contractMonth != null
        ? {
            monthlyRent: context.monthlyRent ?? 0,
            contractMonth: context.contractMonth,
            applicationStatus: context.applicationStatus,
            otherCompanyComparison: null,
            otherCompanyConfirmed: context.otherCompanyConfirmed,
            hasGuarantor: context.hasGuarantor ?? null,
          }
        : undefined;

    return {
      timing: "pre_contract",
      stage: "pre_sign",
      monthlyRent: context.monthlyRent ?? null,
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
  }, [context, fees]);

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

      {/* ── STEP: situation ── */}
      {step === "situation" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">物件との今の状況を教えてください</h2>
            <p className="text-sm text-slate-500 mt-1">一番近いものを選んでください</p>
          </div>

          {feedback ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 text-center">
                {feedback}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setNextStep(null);
                  if (nextStep) goTo(nextStep);
                }}
                className="w-full py-3 rounded-xl text-sm font-medium bg-blue-900 text-white hover:bg-blue-800 transition-colors"
              >
                次へ →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  value: "before_apply" as const,
                  label: "見積書を見て検討中（まだ申込んでいない）",
                  description: "内見後や問い合わせ段階で費用をもらった状態です",
                  feedback: "今が最も交渉しやすい状態です。費目の削除・変更を直接交渉できます",
                },
                {
                  value: "applied_waiting" as const,
                  label: "申込済み・審査中または審査通過（署名・入金はまだ）",
                  description: "申込書を提出し、審査結果を待っているまたは通過した状態です",
                  feedback: "署名前なら交渉できます。業者もあなたに入居してほしい状況です",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    selectWithFeedback(
                      "other_company",
                      () => setContext((prev) => ({ ...prev, applicationStatus: opt.value })),
                      opt.feedback
                    )
                  }
                  className="w-full text-left border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{opt.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP: other_company ── */}
      {step === "other_company" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">同じ物件を他の不動産会社でも扱っているか確認しましたか？</h2>
            <p className="text-sm text-slate-500 mt-1">
              同じ物件でも仲介する会社によって初期費用が変わることがあります。
              これが最も強力な交渉材料になります
            </p>
          </div>

          {feedback ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 text-center">
                {feedback}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setNextStep(null);
                  if (nextStep) goTo(nextStep);
                }}
                className="w-full py-3 rounded-xl text-sm font-medium bg-blue-900 text-white hover:bg-blue-800 transition-colors"
              >
                次へ →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  value: "confirmed_same" as const,
                  label: "他社でも扱っていることを確認済み",
                  feedback: "強力な交渉材料があります。メールに反映します",
                },
                {
                  value: "not_checked" as const,
                  label: "まだ確認していない",
                  feedback: "SUUMOやHOME'Sで同じ物件名を検索してみてください",
                },
                {
                  value: "exclusive" as const,
                  label: "専任物件・他社では扱っていない",
                  feedback: "費目ごとの根拠確認で対応します",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    selectWithFeedback(
                      "timing",
                      () => setContext((prev) => ({ ...prev, otherCompanyConfirmed: opt.value })),
                      opt.feedback
                    )
                  }
                  className="w-full text-left border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={goBack}
            className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            ← 戻る
          </button>
        </div>
      )}

      {/* ── STEP: timing ── */}
      {step === "timing" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">契約・入居の予定時期はいつですか</h2>
            <p className="text-sm text-slate-500 mt-1">時期によって交渉のしやすさが変わります</p>
          </div>

          {feedback ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 text-center">
                {feedback}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setNextStep(null);
                  if (nextStep) goTo(nextStep);
                }}
                className="w-full py-3 rounded-xl text-sm font-medium bg-blue-900 text-white hover:bg-blue-800 transition-colors"
              >
                次へ →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  value: "busy" as const,
                  label: "1〜3月（繁忙期）",
                  description: "引越しが集中する時期です",
                  feedback: "繁忙期は交渉が通りにくい時期です。削除より総額調整を狙いましょう",
                },
                {
                  value: "off" as const,
                  label: "4〜8月（閑散期）",
                  description: "引越しが少ない時期です",
                  feedback: "閑散期は最も交渉が通りやすい時期です。削除・フリーレントどちらも狙えます",
                },
                {
                  value: "normal" as const,
                  label: "9〜12月（通常期）",
                  description: null,
                  feedback: "標準的な交渉環境です",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    selectWithFeedback(
                      "fees",
                      () => setContext((prev) => ({ ...prev, contractMonth: opt.value })),
                      opt.feedback
                    )
                  }
                  className="w-full text-left border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                  {opt.description && (
                    <p className="text-xs text-slate-500 mt-1">{opt.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={goBack}
            className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            ← 戻る
          </button>
        </div>
      )}

      {/* ── STEP: fees ── */}
      {step === "fees" && (
        <div className="space-y-4">
          <SectionCard>
            <FieldBlock>
              <Label>月額家賃（任意）</Label>
              <HelpText>調整見込み額の計算に使います</HelpText>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={context.monthlyRent ?? ""}
                  onChange={(e) =>
                    setContext((prev) => ({
                      ...prev,
                      monthlyRent: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))
                  }
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

          <SectionCard>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">状況</p>
              <button
                type="button"
                onClick={() => goTo("situation")}
                className="text-xs text-blue-700 hover:underline"
              >
                変更する
              </button>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              {context.monthlyRent && (
                <p>家賃：{context.monthlyRent.toLocaleString("ja-JP")}円</p>
              )}
              <p>状況：{context.applicationStatus === "before_apply" ? "検討中（申込前）" : "申込済み・審査中/通過"}</p>
              <p>時期：{context.contractMonth != null ? TIMING_LABEL[context.contractMonth] : "—"}</p>
              {context.otherCompanyConfirmed != null && (
                <p>他社確認：{OTHER_COMPANY_LABEL[context.otherCompanyConfirmed]}</p>
              )}
              {context.hasGuarantor === "yes" && <p>連帯保証人：立てる予定がある</p>}
              {context.hasGuarantor === "no" && <p>連帯保証人：立てない（保証会社のみ）</p>}
            </div>
          </SectionCard>

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
