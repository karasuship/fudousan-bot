"use client";

import { useState, useEffect } from "react";
import type { FeeEntry, FeeId2, AgentResponse, DiagnosisInput2 } from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";
import { createDefaultFeeEntry } from "./defaults";
import { FieldBlock, HelpText, Label, RadioGroup, SectionCard } from "./ui";
import FeeSelect from "./FeeSelect";
import FeeDetailCard from "./FeeDetailCard";
import AgentResponseInput from "./AgentResponseInput";

type Step = "situation" | "fees" | "fee_detail" | "agent" | "tone";
type PreSituation = "estimate" | "applied" | "approved";
type ExplainMethod = "individual" | "lump_sum" | "verbal";
type CanRefuse = "yes" | "no" | "unknown";

const STEP_LABEL: Record<Step, string> = {
  situation: "状況確定",
  fees: "費目と金額",
  fee_detail: "費目別詳細",
  agent: "業者対応",
  tone: "メールトーン",
};
const STEP_ORDER: Step[] = ["situation", "fees", "fee_detail", "agent", "tone"];

const TONE_OPTIONS: { value: "polite" | "firm" | "factual"; label: string }[] = [
  { value: "polite", label: "丁寧に確認する" },
  { value: "firm", label: "明確に根拠を求める" },
  { value: "factual", label: "事実のみを記録する" },
];

interface Props {
  onChange: (input: DiagnosisInput2) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
}

export default function PreContractFlow({ onChange, onSubmit = () => {}, isLoading = false }: Props) {
  const timing = "pre_contract" as const;
  const stage = "pre_sign" as const;

  const [step, setStep] = useState<Step>("situation");
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  const [currentFeeIndex, setCurrentFeeIndex] = useState(0);

  // STEP: 状況確定
  const [preSituation, setPreSituation] = useState<PreSituation | "">("");

  // STEP: 費目と金額
  const [fees, setFees] = useState<FeeEntry[]>([]);
  const [monthlyRentStr, setMonthlyRentStr] = useState("");
  const [totalAmountStr, setTotalAmountStr] = useState("");
  const [explainMethod, setExplainMethod] = useState<ExplainMethod | "">("");
  const [canRefuse, setCanRefuse] = useState<CanRefuse | "">("");

  // STEP: 業者対応
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);

  // STEP: メールトーン
  const [emailTone, setEmailTone] = useState<"polite" | "firm" | "factual">("polite");

  const monthlyRent = monthlyRentStr ? parseInt(monthlyRentStr, 10) || null : null;
  const totalAmount = totalAmountStr ? parseInt(totalAmountStr, 10) || null : null;

  // DiagnosisInput2を上位に通知
  useEffect(() => {
    onChange({ timing, stage, monthlyRent, totalAmount, fees, timeline: [], agentResponse, emailTone });
  // onChange は安定した setState なので deps から除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees, monthlyRent, totalAmount, agentResponse, emailTone]);

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
    setFees((prev) => [...prev, createDefaultFeeEntry(feeId)]);
  }

  function updateFee(idx: number, entry: FeeEntry) {
    setFees((prev) => prev.map((e, i) => (i === idx ? entry : e)));
  }

  function removeFeeAt(idx: number) {
    setFees((prev) => prev.filter((_, i) => i !== idx));
    setCurrentFeeIndex((n) => (n >= idx && n > 0 ? n - 1 : n));
  }

  function nextFee() {
    if (fees.length === 0 || currentFeeIndex >= fees.length - 1) {
      goTo("agent");
    } else {
      setCurrentFeeIndex((n) => n + 1);
    }
  }

  function prevFee() {
    if (currentFeeIndex > 0) {
      setCurrentFeeIndex((n) => n - 1);
    } else {
      goBack();
    }
  }

  const stepIdx = STEP_ORDER.indexOf(step);
  const progressPct = ((stepIdx + 1) / STEP_ORDER.length) * 100;
  const currentFee = fees[currentFeeIndex];

  return (
    <div className="space-y-5">
      {/* プログレス */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">{STEP_LABEL[step]}</span>
      </div>

      {/* ── STEP: 状況確定 ── */}
      {step === "situation" && (
        <div className="space-y-4">
          <SectionCard>
            <FieldBlock>
              <Label>今どの段階ですか？</Label>
              <RadioGroup
                value={preSituation}
                onChange={setPreSituation}
                options={[
                  { value: "estimate" as const, label: "見積もりが来た・検討中" },
                  { value: "applied" as const, label: "申込済み・審査中" },
                  { value: "approved" as const, label: "審査通過・契約日が決まっている" },
                ]}
              />
            </FieldBlock>
          </SectionCard>

          {preSituation && (
            <button
              type="button"
              onClick={() => goTo("fees")}
              className="w-full bg-blue-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              次へ
            </button>
          )}
        </div>
      )}

      {/* ── STEP: 費目と金額 ── */}
      {step === "fees" && (
        <div className="space-y-4">
          <SectionCard>
            <FieldBlock>
              <Label>請求されている費用をすべて選んでください</Label>
              <HelpText>複数選択できます</HelpText>
              <div className="mt-2">
                <FeeSelect selected={fees.map((e) => e.feeId)} onAdd={addFee} />
              </div>
            </FieldBlock>
          </SectionCard>

          {fees.length > 0 && (
            <>
              <SectionCard>
                <FieldBlock>
                  <Label>月額賃料（任意）</Label>
                  <input
                    type="number"
                    value={monthlyRentStr}
                    onChange={(e) => setMonthlyRentStr(e.target.value)}
                    placeholder="例: 70000"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 w-40"
                  />
                  <HelpText>円（不明な場合は空白）</HelpText>
                </FieldBlock>
                <FieldBlock>
                  <Label>費用総額（任意）</Label>
                  <input
                    type="number"
                    value={totalAmountStr}
                    onChange={(e) => setTotalAmountStr(e.target.value)}
                    placeholder="例: 300000"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 w-40"
                  />
                  <HelpText>円（不明な場合は空白）</HelpText>
                </FieldBlock>
              </SectionCard>

              <SectionCard>
                <FieldBlock>
                  <Label>費用は個別に説明されましたか？</Label>
                  <RadioGroup
                    value={explainMethod}
                    onChange={setExplainMethod}
                    options={[
                      { value: "individual" as const, label: "費目ごとに個別説明された" },
                      { value: "lump_sum" as const, label: "「初期費用○○円」として一括提示された" },
                      { value: "verbal" as const, label: "口頭でざっくり説明されただけ" },
                    ]}
                  />
                </FieldBlock>
                {(explainMethod === "lump_sum" || explainMethod === "verbal") && (
                  <FieldBlock>
                    <Label>個別費目を断れると説明されましたか？</Label>
                    <RadioGroup
                      value={canRefuse}
                      onChange={setCanRefuse}
                      options={[
                        { value: "yes" as const, label: "された" },
                        { value: "no" as const, label: "されなかった" },
                        { value: "unknown" as const, label: "断れるとは思っていなかった" },
                      ]}
                    />
                  </FieldBlock>
                )}
              </SectionCard>
            </>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={() => { setCurrentFeeIndex(0); goTo("fee_detail"); }}
              disabled={fees.length === 0}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                fees.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-900 text-white hover:bg-blue-800"
              }`}
            >
              {fees.length === 0 ? "費用を選択してください" : "費用の詳細を確認する →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: 費目別詳細（1費目ずつ） ── */}
      {step === "fee_detail" && (
        <div className="space-y-4">
          {fees.length === 0 ? (
            <p className="text-sm text-slate-500">費目がありません。</p>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                費目の確認 {currentFeeIndex + 1} / {fees.length}：
                <strong className="text-slate-700 ml-1">
                  {currentFee ? FEE_LABEL[currentFee.feeId] : ""}
                </strong>
              </p>
              {currentFee && (
                <FeeDetailCard
                  entry={currentFee}
                  onChange={(entry) => updateFee(currentFeeIndex, entry)}
                  onRemove={() => {
                    removeFeeAt(currentFeeIndex);
                    if (fees.length <= 1) goBack();
                  }}
                />
              )}
            </>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={prevFee}
              className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {currentFeeIndex === 0 ? "戻る" : "前の費目"}
            </button>
            <button
              type="button"
              onClick={nextFee}
              className="flex-1 bg-blue-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              {currentFeeIndex < fees.length - 1 ? "次の費目へ" : "業者対応を入力する →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: 業者対応 ── */}
      {step === "agent" && (
        <div className="space-y-4">
          <SectionCard>
            <AgentResponseInput
              value={agentResponse}
              onChange={setAgentResponse}
              activeFeeIds={fees.map((e) => e.feeId)}
            />
          </SectionCard>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={() => goTo("tone")}
              className="flex-1 bg-blue-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              次へ →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: メールトーン ── */}
      {step === "tone" && (
        <div className="space-y-4">
          <SectionCard>
            <FieldBlock>
              <Label>確認メールのトーンを選んでください</Label>
              <RadioGroup value={emailTone} onChange={setEmailTone} options={TONE_OPTIONS} />
            </FieldBlock>
          </SectionCard>
          <button
            type="button"
            onClick={goBack}
            className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            戻る
          </button>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-green-800">入力完了です。</p>
            <p className="text-xs text-green-700 mt-1">入力内容は自動的に記録されています。</p>
          </div>
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
