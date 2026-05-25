"use client";

import { useState } from "react";
import { Phase1Result, Phase2Answers, FeeId } from "@/lib/types";

const FEE_LABELS: Record<FeeId, string> = {
  cleaning: "消毒・消臭費",
  support24: "24時間サポート",
  key: "鍵交換代",
  adminFee: "契約事務手数料",
  guarantee: "保証会社利用料",
  insurance: "火災保険",
  brokerage: "仲介手数料",
  keyMoney: "礼金",
  other: "その他",
};

interface Props {
  phase1Result: Phase1Result;
  onResult: (answers: Phase2Answers) => void;
}

type Step = "q1_amounts" | "q2_opponent" | "q3_evidence" | "q4_settlement";
const STEP_ORDER: Step[] = ["q1_amounts", "q2_opponent", "q3_evidence", "q4_settlement"];

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6">
      <div
        className="bg-blue-600 h-1.5 rounded-full transition-all"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  );
}

function Intent({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 mb-3 leading-relaxed">
      {children}
    </p>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
        selected
          ? "bg-blue-800 text-white border-blue-800 shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function Phase2Form({ phase1Result, onResult }: Props) {
  const [step, setStep] = useState<Step>("q1_amounts");
  const [history, setHistory] = useState<Step[]>([]);

  const targetFees = phase1Result.strongPoints;

  const [feeAmounts, setFeeAmounts] = useState<Partial<Record<FeeId, number>>>(
    {}
  );
  const [opponentResponse, setOpponentResponse] =
    useState<Phase2Answers["opponentResponse"] | null>(null);
  const [hasEvidence, setHasEvidence] =
    useState<Phase2Answers["hasEvidence"] | null>(null);
  const [preferredSettlement, setPreferredSettlement] =
    useState<Phase2Answers["preferredSettlement"] | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step) + 1;

  function goTo(next: Step) {
    setHistory((h) => [...h, step]);
    setStep(next);
  }

  function goBack() {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setStep(prev);
    }
  }

  function submit() {
    if (!opponentResponse || !hasEvidence || !preferredSettlement) return;
    onResult({
      feeAmounts,
      opponentResponse,
      hasEvidence,
      preferredSettlement,
    });
  }

  return (
    <div className="space-y-4">
      <ProgressBar current={stepIndex} total={STEP_ORDER.length} />

      {/* Q1: 金額入力 */}
      {step === "q1_amounts" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            対象費用の金額を入力してください
          </h3>
          <Intent>金額が分かると、返金・相殺の目安額を文面に含められます。</Intent>
          <div className="space-y-3">
            {targetFees.map((fee) => (
              <div key={fee}>
                <label className="block text-sm text-slate-600 mb-1">
                  {FEE_LABELS[fee]}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={feeAmounts[fee] ?? ""}
                    onChange={(e) =>
                      setFeeAmounts((prev) => ({
                        ...prev,
                        [fee]: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-sm text-slate-500 whitespace-nowrap">円</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => goTo("q2_opponent")}
              className="px-5 py-2 bg-blue-800 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
            >
              次へ（金額は空欄でも可）
            </button>
          </div>
        </div>
      )}

      {/* Q2: 相手の状況 */}
      {step === "q2_opponent" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            相手（不動産屋）は今何と言っていますか？
          </h3>
          <Intent>相手の反応に合わせた文面を生成します。</Intent>
          <div className="space-y-2">
            <ChoiceButton
              selected={opponentResponse === "nothing"}
              onClick={() => {
                setOpponentResponse("nothing");
                goTo("q3_evidence");
              }}
            >
              まだ何も言っていない
            </ChoiceButton>
            <ChoiceButton
              selected={opponentResponse === "insisting"}
              onClick={() => {
                setOpponentResponse("insisting");
                goTo("q3_evidence");
              }}
            >
              「必須です」「全員払うものです」と言っている
            </ChoiceButton>
            <ChoiceButton
              selected={opponentResponse === "internal_rule"}
              onClick={() => {
                setOpponentResponse("internal_rule");
                goTo("q3_evidence");
              }}
            >
              「社内の規定です」と言っている
            </ChoiceButton>
            <ChoiceButton
              selected={opponentResponse === "contract_based"}
              onClick={() => {
                setOpponentResponse("contract_based");
                goTo("q3_evidence");
              }}
            >
              「契約書に書いてあります」と言っている
            </ChoiceButton>
            <ChoiceButton
              selected={opponentResponse === "ignoring"}
              onClick={() => {
                setOpponentResponse("ignoring");
                goTo("q3_evidence");
              }}
            >
              無視している・返答がない
            </ChoiceButton>
          </div>
          <button
            type="button"
            onClick={goBack}
            className="text-xs text-slate-400 hover:text-slate-600 mt-2"
          >
            ← 戻る
          </button>
        </div>
      )}

      {/* Q3: 証拠 */}
      {step === "q3_evidence" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            証拠はありますか？
          </h3>
          <Intent>証拠があると文面の根拠として引用でき、相手が返しにくくなります。</Intent>
          <div className="space-y-2">
            <ChoiceButton
              selected={hasEvidence === "email_or_line"}
              onClick={() => {
                setHasEvidence("email_or_line");
                goTo("q4_settlement");
              }}
            >
              メール・LINEが残っている
            </ChoiceButton>
            <ChoiceButton
              selected={hasEvidence === "recording"}
              onClick={() => {
                setHasEvidence("recording");
                goTo("q4_settlement");
              }}
            >
              録音がある
            </ChoiceButton>
            <ChoiceButton
              selected={hasEvidence === "none"}
              onClick={() => {
                setHasEvidence("none");
                goTo("q4_settlement");
              }}
            >
              何もない
            </ChoiceButton>
          </div>
          <button
            type="button"
            onClick={goBack}
            className="text-xs text-slate-400 hover:text-slate-600 mt-2"
          >
            ← 戻る
          </button>
        </div>
      )}

      {/* Q4: 希望着地 */}
      {step === "q4_settlement" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            希望する着地を選んでください
          </h3>
          <Intent>希望に合わせた3通目の文面を生成します。</Intent>
          <div className="space-y-2">
            {phase1Result.userPhase !== "C" && (
              <ChoiceButton
                selected={preferredSettlement === "withhold"}
                onClick={() => setPreferredSettlement("withhold")}
              >
                払わずに済ませたい
              </ChoiceButton>
            )}
            <ChoiceButton
              selected={preferredSettlement === "refund"}
              onClick={() => setPreferredSettlement("refund")}
            >
              返金してほしい
            </ChoiceButton>
            <ChoiceButton
              selected={preferredSettlement === "offset"}
              onClick={() => setPreferredSettlement("offset")}
            >
              翌月家賃と相殺でいい
            </ChoiceButton>
            <ChoiceButton
              selected={preferredSettlement === "free_rent"}
              onClick={() => setPreferredSettlement("free_rent")}
            >
              フリーレント（無料期間）でいい
            </ChoiceButton>
          </div>
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={goBack}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ← 戻る
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={preferredSettlement === null}
              className="px-5 py-2 bg-blue-800 text-white text-sm rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              文面を生成する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
