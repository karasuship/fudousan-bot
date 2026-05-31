"use client";

import { useState, useEffect } from "react";
import type {
  FeeEntry,
  FeeId2,
  AgentResponse,
  DiagnosisInput2,
  PostContractStage,
  TimelineEntry,
} from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";
import { createDefaultFeeEntry } from "./defaults";
import { FieldBlock, HelpText, Label, RadioGroup, SectionCard } from "./ui";
import FeeSelect from "./FeeSelect";
import FeeDetailCard from "./FeeDetailCard";
import TimelineInput from "./TimelineInput";
import AgentResponseInput from "./AgentResponseInput";

type Step = "situation" | "fees" | "fee_detail" | "timeline" | "agent";
type ExplainOrder =
  | "juusetsu_sign_payment"
  | "sign_juusetsu_payment"
  | "payment_juusetsu_sign"
  | "other"
  | "unknown";
type ExplainMethod = "individual" | "lump_sum" | "verbal";
type DocBeforePayment = "yes" | "no" | "unknown";

const STEP_LABEL: Record<Step, string> = {
  situation: "状況確定",
  fees: "費目と金額",
  fee_detail: "費目別詳細",
  timeline: "時系列",
  agent: "業者対応",
};
const STEP_ORDER: Step[] = ["situation", "fees", "fee_detail", "timeline", "agent"];

interface Props {
  /** FlowRootで「署名した・まだ支払っていない」を選んだ場合に渡す */
  initialStage?: PostContractStage;
  initialFees?: FeeEntry[];
  onChange: (input: DiagnosisInput2) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
}

export default function PostContractFlow({ initialStage, initialFees, onChange, onSubmit = () => {}, isLoading = false }: Props) {
  const timing = "post_contract" as const;

  const [step, setStep] = useState<Step>("situation");
  const [stepHistory, setStepHistory] = useState<Step[]>([]);
  const [currentFeeIndex, setCurrentFeeIndex] = useState(0);

  // STEP: 状況確定
  const [stage, setStage] = useState<PostContractStage | "">(initialStage ?? "");
  const [explainMethod, setExplainMethod] = useState<ExplainMethod | "">("");
  const [explainOrder, setExplainOrder] = useState<ExplainOrder | "">("");
  const [docBeforePayment, setDocBeforePayment] = useState<DocBeforePayment | "">("");

  // STEP: 費目と金額
  const [fees, setFees] = useState<FeeEntry[]>(() => initialFees ?? []);
  const [monthlyRentStr, setMonthlyRentStr] = useState("");
  const [totalAmountStr, setTotalAmountStr] = useState("");

  // STEP: 時系列
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  // STEP: 業者対応
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);

  const emailTone = "polite" as const;

  const monthlyRent = monthlyRentStr ? parseInt(monthlyRentStr, 10) || null : null;
  const totalAmount = totalAmountStr ? parseInt(totalAmountStr, 10) || null : null;

  // DiagnosisInput2を上位に通知（stage確定後のみ）
  useEffect(() => {
    if (!stage) return;
    onChange({ timing, stage, monthlyRent, totalAmount, fees, timeline, agentResponse, emailTone });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, fees, monthlyRent, totalAmount, timeline, agentResponse]);

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
      goTo("timeline");
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
          {/* 支払い状況（initialStageが渡された場合はスキップ） */}
          {!initialStage && (
            <SectionCard>
              <FieldBlock>
                <Label>費用の支払い状況は？</Label>
                <RadioGroup
                  value={stage}
                  onChange={(v) => setStage(v)}
                  options={[
                    { value: "post_payment" as const, label: "支払った" },
                    { value: "pre_payment" as const, label: "署名はしたがまだ支払っていない" },
                  ]}
                />
              </FieldBlock>
              {stage === "post_payment" && (
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  支払済みの状況ですね。記録を固定しながら根拠確認を進めることが重要です。
                </p>
              )}
              {stage === "pre_payment" && (
                <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-3 py-2">
                  署名済みで支払前の状況ですね。根拠が不明確な費用については支払いを保留しながら確認を求めることができます。
                </p>
              )}
            </SectionCard>
          )}

          {stage && (
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
            </SectionCard>
          )}

          {stage && (
            <SectionCard>
              <FieldBlock>
                <Label>重説・署名・支払いの順番を教えてください</Label>
                <RadioGroup
                  value={explainOrder}
                  onChange={setExplainOrder}
                  options={[
                    { value: "juusetsu_sign_payment" as const, label: "重説 → 署名 → 支払い" },
                    { value: "sign_juusetsu_payment" as const, label: "署名 → 重説 → 支払い" },
                    { value: "payment_juusetsu_sign" as const, label: "支払い → 重説 → 署名" },
                    { value: "other" as const, label: "その他の順番" },
                    { value: "unknown" as const, label: "わからない" },
                  ]}
                />
              </FieldBlock>
              {explainOrder === "unknown" && (
                <FieldBlock>
                  <Label>支払いを求められたとき、重説の書類はすでに手元にありましたか？</Label>
                  <RadioGroup
                    value={docBeforePayment}
                    onChange={setDocBeforePayment}
                    options={[
                      { value: "yes" as const, label: "あった" },
                      { value: "no" as const, label: "なかった" },
                      { value: "unknown" as const, label: "わからない" },
                    ]}
                  />
                </FieldBlock>
              )}
              {(explainOrder === "sign_juusetsu_payment" || explainOrder === "payment_juusetsu_sign") && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  重説の前に署名・支払いが行われている場合、宅建業法上の手続き上の問題が論点になる可能性があります。
                </p>
              )}
            </SectionCard>
          )}

          {stage && (
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
              {currentFeeIndex < fees.length - 1 ? "次の費目へ" : "時系列を入力する →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: 時系列 ── */}
      {step === "timeline" && (
        <div className="space-y-4">
          <SectionCard>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">時系列（任意）</p>
            <HelpText>
              いつ何が起きたかを入力すると診断精度が上がります。日付が不明な場合は空白のままで構いません。
            </HelpText>
            <div className="mt-3">
              <TimelineInput
                value={timeline}
                onChange={setTimeline}
                activeFeeIds={fees.map((e) => e.feeId)}
              />
            </div>
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
              onClick={() => goTo("agent")}
              className="flex-1 bg-blue-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              業者対応を入力する →
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
              onClick={onSubmit}
              disabled={isLoading}
              className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              {isLoading ? "診断中..." : "診断する"}
            </button>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-green-800">入力完了です。</p>
            <p className="text-xs text-green-700 mt-1">入力内容は自動的に記録されています。</p>
          </div>
        </div>
      )}
    </div>
  );
}
