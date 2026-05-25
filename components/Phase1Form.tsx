"use client";

import { useState } from "react";
import { Phase1Answers, Phase1Result, FeeId } from "@/lib/types";
import { diagnosePhase1 } from "@/lib/scoring";

interface Props {
  onResult: (result: Phase1Result, answers: Phase1Answers) => void;
}

const FEE_OPTIONS: { value: FeeId; label: string }[] = [
  { value: "cleaning", label: "消毒・消臭費" },
  { value: "support24", label: "24時間サポート" },
  { value: "key", label: "鍵交換代" },
  { value: "adminFee", label: "契約事務手数料" },
  { value: "guarantee", label: "保証会社利用料" },
  { value: "insurance", label: "火災保険" },
  { value: "brokerage", label: "仲介手数料" },
  { value: "keyMoney", label: "礼金" },
  { value: "other", label: "その他" },
];

type Step =
  | "q1_signed"
  | "q2_paid"
  | "q3_fees"
  | "q4_explained"
  | "q5_denied"
  | "q6_documented";

const STEP_ORDER: Step[] = [
  "q1_signed",
  "q2_paid",
  "q3_fees",
  "q4_explained",
  "q5_denied",
  "q6_documented",
];

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

export default function Phase1Form({ onResult }: Props) {
  const [step, setStep] = useState<Step>("q1_signed");
  const [history, setHistory] = useState<Step[]>([]);

  const [hasSigned, setHasSigned] = useState<boolean | null>(null);
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const [selectedFees, setSelectedFees] = useState<FeeId[]>([]);
  const [voluntaryExplained, setVoluntaryExplained] = useState<
    Phase1Answers["voluntaryExplained"] | null
  >(null);
  const [deniedIfRefused, setDeniedIfRefused] = useState<
    Phase1Answers["deniedIfRefused"] | null
  >(null);
  const [documentedIn, setDocumentedIn] = useState<
    Phase1Answers["documentedIn"] | null
  >(null);

  const stepIndex = STEP_ORDER.indexOf(step) + 1;
  // q2 is skipped when hasSigned=false, so total steps varies
  const totalSteps = hasSigned === false ? 5 : 6;

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

  function toggleFee(fee: FeeId) {
    setSelectedFees((prev) =>
      prev.includes(fee) ? prev.filter((f) => f !== fee) : [...prev, fee]
    );
  }

  function submit() {
    const answers: Phase1Answers = {
      hasSigned: hasSigned ?? false,
      hasPaid: hasPaid ?? false,
      selectedFees,
      voluntaryExplained: voluntaryExplained ?? "unclear",
      deniedIfRefused: deniedIfRefused ?? "unknown",
      documentedIn: documentedIn ?? "unknown",
    };
    onResult(diagnosePhase1(answers), answers);
  }

  return (
    <div className="space-y-4">
      <ProgressBar current={stepIndex} total={totalSteps} />

      {/* Q1 */}
      {step === "q1_signed" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            契約書にサインしましたか？
          </h3>
          <Intent>
            サインの有無で、費用を断れる可能性の強さが変わります。
          </Intent>
          <div className="space-y-2">
            <ChoiceButton
              selected={hasSigned === false}
              onClick={() => {
                setHasSigned(false);
                goTo("q3_fees");
              }}
            >
              まだしていない
            </ChoiceButton>
            <ChoiceButton
              selected={hasSigned === true}
              onClick={() => {
                setHasSigned(true);
                goTo("q2_paid");
              }}
            >
              した
            </ChoiceButton>
          </div>
        </div>
      )}

      {/* Q2 */}
      {step === "q2_paid" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            請求された費用を払いましたか？
          </h3>
          <Intent>
            払済みかどうかで、取れる手段（払わない／返金・相殺）が決まります。
          </Intent>
          <div className="space-y-2">
            <ChoiceButton
              selected={hasPaid === false}
              onClick={() => {
                setHasPaid(false);
                goTo("q3_fees");
              }}
            >
              まだ払っていない
            </ChoiceButton>
            <ChoiceButton
              selected={hasPaid === true}
              onClick={() => {
                setHasPaid(true);
                goTo("q3_fees");
              }}
            >
              払った
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

      {/* Q3 */}
      {step === "q3_fees" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            問題だと思う費用を選んでください（複数選択可）
          </h3>
          <Intent>
            選んだ費用の種類によって、論点の強さが変わります。
          </Intent>
          <div className="space-y-2">
            {FEE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleFee(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  selectedFees.includes(opt.value)
                    ? "bg-blue-800 text-white border-blue-800 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
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
              onClick={() => selectedFees.length > 0 && goTo("q4_explained")}
              disabled={selectedFees.length === 0}
              className="px-5 py-2 bg-blue-800 text-white text-sm rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Q4 */}
      {step === "q4_explained" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            それらの費用について「断れます」「任意です」と説明を受けましたか？
          </h3>
          <Intent>
            任意性の説明があったかどうかが、論点の核心です。
          </Intent>
          <div className="space-y-2">
            <ChoiceButton
              selected={voluntaryExplained === "yes"}
              onClick={() => {
                setVoluntaryExplained("yes");
                goTo("q5_denied");
              }}
            >
              説明された
            </ChoiceButton>
            <ChoiceButton
              selected={voluntaryExplained === "no"}
              onClick={() => {
                setVoluntaryExplained("no");
                goTo("q5_denied");
              }}
            >
              説明されなかった
            </ChoiceButton>
            <ChoiceButton
              selected={voluntaryExplained === "unclear"}
              onClick={() => {
                setVoluntaryExplained("unclear");
                goTo("q5_denied");
              }}
            >
              曖昧だった
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

      {/* Q5 */}
      {step === "q5_denied" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            断ったら「契約できない」と言われましたか？
          </h3>
          <Intent>
            圧力をかけられた事実は、論点を強くする重要な要素です。
          </Intent>
          <div className="space-y-2">
            <ChoiceButton
              selected={deniedIfRefused === "yes"}
              onClick={() => {
                setDeniedIfRefused("yes");
                goTo("q6_documented");
              }}
            >
              言われた
            </ChoiceButton>
            <ChoiceButton
              selected={deniedIfRefused === "no"}
              onClick={() => {
                setDeniedIfRefused("no");
                goTo("q6_documented");
              }}
            >
              言われなかった
            </ChoiceButton>
            <ChoiceButton
              selected={deniedIfRefused === "unknown"}
              onClick={() => {
                setDeniedIfRefused("unknown");
                goTo("q6_documented");
              }}
            >
              聞かなかった
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

      {/* Q6 */}
      {step === "q6_documented" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-800">
            その費用はどこに書いてありましたか？
          </h3>
          <Intent>
            書面の有無と場所が、手続き違反の根拠になります。
          </Intent>
          <div className="space-y-2">
            <ChoiceButton
              selected={documentedIn === "estimate_only"}
              onClick={() => setDocumentedIn("estimate_only")}
            >
              見積もりにしか載っていない
            </ChoiceButton>
            <ChoiceButton
              selected={documentedIn === "contract_or_juusetsu"}
              onClick={() => setDocumentedIn("contract_or_juusetsu")}
            >
              契約書または重要事項説明書に載っている
            </ChoiceButton>
            <ChoiceButton
              selected={documentedIn === "nowhere"}
              onClick={() => setDocumentedIn("nowhere")}
            >
              どこにも書いていない
            </ChoiceButton>
            <ChoiceButton
              selected={documentedIn === "unknown"}
              onClick={() => setDocumentedIn("unknown")}
            >
              分からない
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
              disabled={documentedIn === null}
              className="px-5 py-2 bg-blue-800 text-white text-sm rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              診断する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
