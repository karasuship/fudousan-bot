"use client";

import { useState } from "react";
import type {
  DiagnosisResult as DiagnosisResultType,
  DiagnosisMode,
  FeeType,
  ContractType,
  Phase,
  EmailTone,
  InitialFeesInput,
} from "@/lib/types";
import { MODE_CONFIG } from "@/lib/modes";
import DiagnosisResult from "./DiagnosisResult";
import FeeEstimate from "./FeeEstimate";
import { track } from "@/lib/analytics";

// ─── initial_fees ウィザード 型定義 ──────────────────────────────────────────

type IfSituation = "" | "pre_estimate" | "pre_sign" | "pre_payment" | "paid";
type IfConcernTheme =
  | ""
  | "overall"
  | "agency"
  | "optional"
  | "key"
  | "cleaning"
  | "guarantor"
  | "unknown"
  | "hopeless";

type IfFeeDetail = {
  agencyFeeMonths: "" | "half" | "one" | "over";
  agencyFeeConsent: "" | "written" | "oral" | "none";
  agencyFeeBothSides: "" | "yes" | "no" | "unknown";
  agencyFeeLandlord: "" | "none" | "yes" | "unknown";
  keyExchangeDone: "" | "confirmed" | "unconfirmed" | "unknown";
  keyExchangeNew: "" | "new" | "existing" | "unknown";
  cleaningMandatory: "" | "mandatory" | "optional" | "no_explanation";
  cleaningContract: "" | "yes" | "no" | "unknown";
};

export interface InitialFeesMeta {
  situation: IfSituation;
  concernTheme: IfConcernTheme;
  fees: string[];
  explanation: "yes" | "insufficient" | "no";
  contractMention: "yes" | "unknown";
}

function getIfFeedback2(explanation: string, concernTheme: string, fees: string[]): string {
  const prefix = "ここまでの入力をふまえると、";
  if (explanation === "no") {
    if (fees.includes("agency_fee")) return `${prefix}仲介手数料について説明を受けていない点が特に重要な確認ポイントです。`;
    if (fees.includes("cleaning") || fees.includes("key_exchange")) return `${prefix}オプション費用の説明がなかった点が重要なポイントです。`;
    return `${prefix}説明を受けていない費用については、根拠の確認が特に重要です。`;
  }
  if (explanation === "insufficient") {
    if (concernTheme === "optional" || fees.includes("cleaning") || fees.includes("key_exchange")) {
      return `${prefix}任意オプションの説明が不十分だった点が重要なポイントになります。`;
    }
    return `${prefix}費用の根拠・算出方法の確認が次のステップになります。`;
  }
  return `${prefix}書面での確認記録を残しておくと、後から参照できて安心です。`;
}

// 関心テーマ別・Feedback1補足テキスト
const IF_CONCERN_FEEDBACK: Partial<Record<IfConcernTheme, string>> = {
  agency: "仲介手数料については、請求根拠と算出方法が特に確認優先度の高いポイントです。",
  optional: "任意費用の説明有無が重要です。断れる可能性がある費用があれば、説明内容の確認が先決です。",
  key: "鍵交換代については、費用負担の根拠と任意性が確認ポイントです。",
  cleaning: "クリーニング費については、根拠の記載と算出方法が確認ポイントです。",
  guarantor: "保証会社費用については、加入条件と費用内訳が確認優先度の高いポイントです。",
  overall: "各費用の根拠を個別に確認することから始めるとよさそうです。",
  unknown: "費用を名目ごとに一つずつ確認することから始めると整理しやすいです。",
  hopeless: "書面で確認を求めるだけで管理会社の対応が変わるケースがあります。弁護士に頼まなくても、確認メール1本で動いた事例は多くあります。まず確認することにリスクはありません。",
};

// ─── 共通UIパーツ ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1.5">{children}</label>;
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400 mt-1.5">{children}</p>;
}

// 質問意図：なぜこの質問をするのかを短く示す（青系インフォボックス）
function Intent({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 mt-1 mb-2 leading-relaxed">
      {children}
    </p>
  );
}

function RadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm border transition-all ${
            value === opt.value
              ? "bg-blue-800 text-white border-blue-800 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function BoolButtons({
  value,
  onChange,
  trueLabel = "はい",
  falseLabel = "いいえ",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-2 rounded-lg text-sm border transition-all ${
          value ? "bg-blue-800 text-white border-blue-800 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-2 rounded-lg text-sm border transition-all ${
          !value ? "bg-blue-800 text-white border-blue-800 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {falseLabel}
      </button>
    </div>
  );
}

function getRiskButtonClass(
  risk: "red" | "yellow" | "green" | "neutral",
  isSelected: boolean
): string {
  if (!isSelected) {
    return "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50";
  }
  if (risk === "red") return "bg-red-600 text-white border-red-600";
  if (risk === "yellow") return "bg-amber-500 text-white border-amber-500";
  if (risk === "green") return "bg-green-600 text-white border-green-600";
  return "bg-blue-800 text-white border-blue-800";
}

const FEE_OPTIONS: { value: FeeType; label: string }[] = [
  { value: "renewal_fee", label: "更新料" },
  { value: "recontracting_fee", label: "再契約料" },
  { value: "agency_fee", label: "仲介手数料" },
  { value: "key_exchange", label: "鍵交換代" },
  { value: "cleaning", label: "清掃代（クリーニング代）" },
  { value: "guarantor", label: "保証会社費用" },
  { value: "other", label: "その他・名目不明の費用" },
];

const MOVE_OUT_FEE_OPTIONS: { value: FeeType; label: string }[] = [
  { value: "cleaning", label: "クリーニング代" },
  { value: "key_exchange", label: "鍵交換代" },
  { value: "other", label: "その他・名目不明の費用" },
  { value: "agency_fee", label: "仲介手数料" },
  { value: "guarantor", label: "保証会社費用" },
];

const MODES: { value: DiagnosisMode; label: string; icon: string; desc: string }[] = [
  { value: "initial_fees", label: "初期費用チェック", icon: "🏠", desc: "入居前の見積書・請求書を確認" },
  { value: "contract_review", label: "契約書チェック", icon: "📋", desc: "契約書・重要事項の条項を確認" },
  { value: "renewal", label: "更新・再契約チェック", icon: "🔄", desc: "更新料・再契約料を確認" },
  { value: "maintenance", label: "管理不備・修繕相談", icon: "🔧", desc: "設備不具合・害虫などの連絡補助" },
  { value: "move_out", label: "退去費用チェック", icon: "📦", desc: "原状回復・クリーニング費用を確認" },
  { value: "deposit_refund", label: "敷金精算チェック", icon: "💴", desc: "敷金の返還額・差引内訳を確認" },
];

// ─── フォーム状態 ────────────────────────────────────────────────────────

interface AllModesForm {
  emailTone: EmailTone;
  freeText: string;
  // modes 1 & 3
  contractType: ContractType;
  phase: Phase;
  fees: FeeType[];
  amountStr: string;
  contractMention: "yes" | "unknown";
  explanation: "yes" | "insufficient" | "no";
  consentStructure: "yes" | "unknown";
  managementIssues: boolean;
  // mode 2
  hasRenewalClause: boolean;
  hasSpecialClauses: boolean;
  hasPenaltyClauses: boolean;
  hasCheckbox: boolean;
  hasOralExplanation: boolean;
  // mode 4
  issueType: string;
  issueDuration: string;
  lifeImpact: string;
  alreadyContacted: boolean;
  hasEvidence: boolean;
  isUrgent: boolean;
  // mode 5 (additional)
  moveOutFees: FeeType[];
  moveOutAmountStr: string;
  hasOwnerFault: boolean;
  isNormalWear: boolean;
  hasContractSpecialClause: boolean;
  hasEntryPhotos: boolean;
  hasInspection: boolean;
  hasDetailedQuote: boolean;
  moveOutContractMention: "yes" | "unknown";
  // mode 6
  depositAmountStr: string;
  expectedRefundStr: string;
  deductionItems: string[];
  hasDetailedStatement: boolean;
  hasReturnSchedule: boolean;
}

const DEDUCTION_OPTIONS = [
  "ハウスクリーニング代",
  "鍵交換代",
  "修繕費",
  "設備修理・交換費",
  "その他費用",
];

const INITIAL_FORM: AllModesForm = {
  emailTone: "polite",
  freeText: "",
  contractType: "unknown",
  phase: "move_in",
  fees: [],
  amountStr: "",
  contractMention: "unknown",
  explanation: "yes",
  consentStructure: "yes",
  managementIssues: false,
  hasRenewalClause: false,
  hasSpecialClauses: false,
  hasPenaltyClauses: false,
  hasCheckbox: false,
  hasOralExplanation: true,
  issueType: "",
  issueDuration: "few_days",
  lifeImpact: "moderate",
  alreadyContacted: false,
  hasEvidence: false,
  isUrgent: false,
  moveOutFees: [],
  moveOutAmountStr: "",
  hasOwnerFault: false,
  isNormalWear: false,
  hasContractSpecialClause: false,
  hasEntryPhotos: false,
  hasInspection: false,
  hasDetailedQuote: false,
  moveOutContractMention: "unknown",
  depositAmountStr: "",
  expectedRefundStr: "",
  deductionItems: [],
  hasDetailedStatement: false,
  hasReturnSchedule: false,
};

// ─── メインコンポーネント ────────────────────────────────────────────────

export default function DiagnosisForm() {
  const [selectedMode, setSelectedMode] = useState<DiagnosisMode | null>(null);
  const [form, setForm] = useState<AllModesForm>(INITIAL_FORM);
  const [result, setResult] = useState<DiagnosisResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feeError, setFeeError] = useState(false);

  // ─── initial_fees ウィザード状態 ─────────────────────────────────────────
  const [ifStep, setIfStep] = useState(1);
  const [ifFeeDetail, setIfFeeDetail] = useState<IfFeeDetail>({
    agencyFeeMonths: "",
    agencyFeeConsent: "",
    agencyFeeBothSides: "",
    agencyFeeLandlord: "",
    keyExchangeDone: "",
    keyExchangeNew: "",
    cleaningMandatory: "",
    cleaningContract: "",
  });
  const [ifSituation, setIfSituation] = useState<IfSituation>("");
  const [ifConcernTheme, setIfConcernTheme] = useState<IfConcernTheme>("");
  const [submittedIfMeta, setSubmittedIfMeta] = useState<InitialFeesMeta | null>(null);
  const [feeQueue, setFeeQueue] = useState<string[]>([]);
  const [step4Comment, setStep4Comment] = useState("");
  const [rentStr, setRentStr] = useState("");
  const [expandedFee, setExpandedFee] = useState<string | null>(null);
  const [estimateRegion, setEstimateRegion] = useState<"metro" | "local">("metro");
  const [estimateSeason, setEstimateSeason] = useState<"peak" | "off">("peak");
  const [estimateBuilding, setEstimateBuilding] = useState<"new" | "old">("old");

  function set<K extends keyof AllModesForm>(key: K, value: AllModesForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFee(fee: FeeType) {
    setFeeError(false);
    set("fees", form.fees.includes(fee) ? form.fees.filter((f) => f !== fee) : [...form.fees, fee]);
  }

  function toggleMoveOutFee(fee: FeeType) {
    setFeeError(false);
    set(
      "moveOutFees",
      form.moveOutFees.includes(fee)
        ? form.moveOutFees.filter((f) => f !== fee)
        : [...form.moveOutFees, fee]
    );
  }

  function toggleDeduction(item: string) {
    set(
      "deductionItems",
      form.deductionItems.includes(item)
        ? form.deductionItems.filter((d) => d !== item)
        : [...form.deductionItems, item]
    );
  }

  function selectMode(mode: DiagnosisMode) {
    setSelectedMode(mode);
    setForm({ ...INITIAL_FORM, emailTone: form.emailTone });
    setResult(null);
    setError(null);
    setFeeError(false);
    // Reset initial_fees wizard
    setIfStep(1);
    setIfSituation("");
    setIfConcernTheme("");
    setSubmittedIfMeta(null);
    setIfFeeDetail({
      agencyFeeMonths: "",
      agencyFeeConsent: "",
      agencyFeeBothSides: "",
      agencyFeeLandlord: "",
      keyExchangeDone: "",
      keyExchangeNew: "",
      cleaningMandatory: "",
      cleaningContract: "",
    });
    setFeeQueue([]);
    setRentStr("");
  }

  function goBack() {
    if (ifStep <= 1) return;
    if (ifStep === 7 && ifSituation === "paid") {
      setIfStep(4);
    } else if ((ifStep === 7 || ifStep === 4 || ifStep === 6) &&
      (ifFeeDetail.agencyFeeMonths || ifFeeDetail.keyExchangeDone || ifFeeDetail.cleaningMandatory)) {
      if (form.fees.includes("agency_fee")) setIfStep(8);
      else if (form.fees.includes("key_exchange")) setIfStep(9);
      else setIfStep(10);
    } else {
      setIfStep(ifStep - 1);
    }
  }

  function proceedFromFeeDetail() {
    if (feeQueue.length > 0) {
      const next = feeQueue[0];
      setFeeQueue(feeQueue.slice(1));
      if (next === "agency_fee") setIfStep(8);
      else if (next === "key_exchange") setIfStep(9);
      else setIfStep(10);
    } else {
      setIfStep(7);
    }
  }

  function buildPayload() {
    if (!selectedMode) return null;

    switch (selectedMode) {
      case "initial_fees": {
        // explanation のマッピング
        const explanationMap: Record<string, InitialFeesInput["explanation"]> = {
          yes: "written",
          insufficient: "oral",
          no: "none",
        };

        // couldRefuse は Step5 削除により常に "unknown" とする
        const couldRefuse: InitialFeesInput["couldRefuse"] = "unknown";

        // hasDocuments のマッピング
        const hasDocuments: InitialFeesInput["hasDocuments"] =
          form.contractMention === "yes" ? "yes" :
          form.contractMention === "unknown" ? "unknown" : "no";

        // facts の組み立て
        const facts: import("@/lib/types").FactItem[] = [];

        if (form.fees.includes("agency_fee")) {
          facts.push({
            perceivedLabel: "仲介手数料",
            realityCategory: "agency",
            amount: form.amountStr ? Number(form.amountStr) : undefined,
            detail: {
              type: "agency",
              amountMonths: ifFeeDetail.agencyFeeMonths || "unknown",
              hasWrittenConsent: ifFeeDetail.agencyFeeConsent === "written",
              bothSidesCharged:
                ifFeeDetail.agencyFeeLandlord === "yes" ? "yes" :
                ifFeeDetail.agencyFeeLandlord === "none" ? "no" : "unknown",
            },
          });
        }

        if (form.fees.includes("key_exchange")) {
          facts.push({
            perceivedLabel: "鍵交換代",
            realityCategory: "key_exchange",
            detail: {
              type: "key_exchange",
              exchangeConfirmed:
                ifFeeDetail.keyExchangeDone === "confirmed" ? "confirmed" :
                ifFeeDetail.keyExchangeDone === "unconfirmed" ? "unconfirmed" : "not_done",
              isNewBuilding: ifFeeDetail.keyExchangeNew === "new",
              hasReceipt: false,
            },
          });
        }

        if (form.fees.includes("cleaning")) {
          facts.push({
            perceivedLabel: "清掃代",
            realityCategory: "cleaning",
            detail: {
              type: "cleaning",
              wasExplainedAsMandatory: ifFeeDetail.cleaningMandatory === "mandatory",
              hasContractBasis:
                ifFeeDetail.cleaningContract === "yes" ? "yes" :
                ifFeeDetail.cleaningContract === "no" ? "no" : "unknown",
              hasInvoice: false,
              includesDisinfection: false,
            },
          });
        }

        // その他の費用（guarantor, other）は unknown として追加
        const otherFees = form.fees.filter(
          (f) => !["agency_fee", "key_exchange", "cleaning"].includes(f)
        );
        for (const fee of otherFees) {
          facts.push({
            perceivedLabel: fee === "guarantor" ? "保証会社費用" : "その他費用",
            realityCategory: fee === "guarantor" ? "guarantor" : "unknown",
            detail:
              fee === "guarantor"
                ? {
                    type: "guarantor",
                    wasMandatory: true,
                    hadChoiceOfCompany: false,
                    hasRenewalFee: false,
                  }
                : { type: "unknown", labelOnInvoice: "その他" },
          });
        }

        return {
          mode: "initial_fees" as const,
          situation: ifSituation || "pre_estimate",
          explanation: explanationMap[form.explanation] ?? "oral",
          couldRefuse,
          hasDocuments,
          facts,
          emailTone: form.emailTone,
        };
      }
      case "renewal":
        return {
          mode: "renewal",
          contractType: form.contractType,
          phase: form.phase,
          fees: form.fees,
          ...(form.amountStr ? { amount: Number(form.amountStr) } : {}),
          contractMention: form.contractMention,
          explanation: form.explanation,
          consentStructure: form.consentStructure,
          managementIssues: form.managementIssues,
          freeText: form.freeText,
          emailTone: form.emailTone,
        };
      case "contract_review":
        return {
          mode: "contract_review",
          contractType: form.contractType,
          hasRenewalClause: form.hasRenewalClause,
          hasSpecialClauses: form.hasSpecialClauses,
          hasPenaltyClauses: form.hasPenaltyClauses,
          hasCheckbox: form.hasCheckbox,
          hasOralExplanation: form.hasOralExplanation,
          emailTone: form.emailTone,
          freeText: form.freeText,
        };
      case "maintenance":
        return {
          mode: "maintenance",
          issueType: form.issueType,
          issueDuration: form.issueDuration,
          lifeImpact: form.lifeImpact,
          alreadyContacted: form.alreadyContacted,
          hasEvidence: form.hasEvidence,
          isUrgent: form.isUrgent,
          emailTone: form.emailTone,
          freeText: form.freeText,
        };
      case "move_out":
        return {
          mode: "move_out",
          fees: form.moveOutFees,
          ...(form.moveOutAmountStr ? { amount: Number(form.moveOutAmountStr) } : {}),
          hasOwnerFault: form.hasOwnerFault,
          isNormalWear: form.isNormalWear,
          hasContractSpecialClause: form.hasContractSpecialClause,
          hasEntryPhotos: form.hasEntryPhotos,
          hasInspection: form.hasInspection,
          hasDetailedQuote: form.hasDetailedQuote,
          contractMention: form.moveOutContractMention,
          emailTone: form.emailTone,
          freeText: form.freeText,
        };
      case "deposit_refund":
        return {
          mode: "deposit_refund",
          ...(form.depositAmountStr ? { depositAmount: Number(form.depositAmountStr) } : {}),
          ...(form.expectedRefundStr ? { expectedRefund: Number(form.expectedRefundStr) } : {}),
          deductionItems: form.deductionItems,
          hasDetailedStatement: form.hasDetailedStatement,
          hasReturnSchedule: form.hasReturnSchedule,
          emailTone: form.emailTone,
          freeText: form.freeText,
        };
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Fee validation for modes that require fees
    if (
      (selectedMode === "initial_fees" || selectedMode === "renewal") &&
      form.fees.length === 0
    ) {
      setFeeError(true);
      return;
    }
    if (selectedMode === "move_out" && form.moveOutFees.length === 0) {
      setFeeError(true);
      return;
    }
    if (selectedMode === "maintenance" && !form.issueType) {
      setError("不具合の種類を選択してください");
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    track("diagnosis_started", { mode: selectedMode ?? undefined });

    setLoading(true);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }
      setResult(data);
      if (selectedMode === "initial_fees") {
        setSubmittedIfMeta({
          situation: ifSituation,
          concernTheme: ifConcernTheme,
          fees: form.fees,
          explanation: form.explanation,
          contractMention: form.contractMention,
        });
      }
      try {
        localStorage.setItem("rental_diagnosis_result_v1", JSON.stringify(data));
      } catch {
        // SSR safety
      }
      setTimeout(() => {
        document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      setError("通信エラーが発生しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSelectedMode(null);
    setForm(INITIAL_FORM);
    setResult(null);
    setError(null);
    setFeeError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-8">
      {/* ── Step 1: モード選択 ── */}
      <div>
        <p className="text-sm font-bold text-slate-800 mb-1">どの場面のご相談ですか？</p>
        <p className="text-xs text-slate-500 mb-3">選んだ場面に応じて、確認すべき費用・条項・論点を絞り込みます</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => selectMode(m.value)}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-xl border text-left transition-all ${
                selectedMode === m.value
                  ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <span className="text-lg leading-none">{m.icon}</span>
              <span className="text-xs font-semibold leading-tight">{m.label}</span>
              <span
                className={`text-xs leading-tight ${
                  selectedMode === m.value ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {m.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 2: フォーム ── */}
      {selectedMode && (
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* モードバッジ + 変更 */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{MODE_CONFIG[selectedMode].icon}</span>
              <span className="text-sm font-semibold text-slate-700">
                {MODE_CONFIG[selectedMode].label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMode(null);
                setForm({ ...INITIAL_FORM, emailTone: form.emailTone });
                setResult(null);
                setError(null);
                setFeeError(false);
                setIfStep(1);
                setIfSituation("");
                setIfConcernTheme("");
                setSubmittedIfMeta(null);
                setIfFeeDetail({
                  agencyFeeMonths: "",
                  agencyFeeConsent: "",
                  agencyFeeBothSides: "",
                  agencyFeeLandlord: "",
                  keyExchangeDone: "",
                  keyExchangeNew: "",
                  cleaningMandatory: "",
                  cleaningContract: "",
                });
                setFeeQueue([]);
                setRentStr("");
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              変更
            </button>
          </div>

          {selectedMode !== "initial_fees" && (
            <p className="text-xs text-slate-400 -mt-3">
              入力内容をもとに、確認すべきポイントを絞り込みます
            </p>
          )}

          {/* ── Mode 1: 初期費用チェック（ウィザード形式）── */}
          {selectedMode === "initial_fees" && (
            <div className="space-y-5">
              {/* プログレス */}
              {(() => {
                const hasFeeDetail = form.fees.includes("agency_fee") || form.fees.includes("key_exchange") || form.fees.includes("cleaning");
                const totalSteps = ifSituation === "paid" ? (hasFeeDetail ? 8 : 6) : (hasFeeDetail ? 9 : 7);
                let displayStep: number;
                if (ifStep === 8 || ifStep === 9 || ifStep === 10) {
                  const deepQ1Answered =
                    (ifStep === 8 && ifFeeDetail.agencyFeeMonths !== "") ||
                    (ifStep === 9 && ifFeeDetail.keyExchangeDone !== "") ||
                    (ifStep === 10 && ifFeeDetail.cleaningMandatory !== "");
                  displayStep = deepQ1Answered ? 5 : 4;
                } else if (hasFeeDetail && ifStep >= 4) {
                  if (ifStep > 5 && ifSituation === "paid") {
                    displayStep = ifStep + 1;
                  } else {
                    displayStep = ifStep + 2;
                  }
                } else {
                  displayStep = ifStep > 5 && ifSituation === "paid" ? ifStep - 1 : ifStep;
                }
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 flex-1">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i < displayStep ? "bg-blue-600" : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 tabular-nums">
                        {displayStep} / {totalSteps}
                      </span>
                    </div>
                    {ifStep > 1 && (
                      <button
                        type="button"
                        onClick={goBack}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        前の質問に戻る
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Step 1: 状況 */}
              {ifStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">今のご状況を教えてください</p>
                    <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 mt-1.5 leading-relaxed">
                      どの段階かによって確認できること・確認できる範囲が変わります。現在の状況から絞り込みます。
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { value: "pre_estimate" as IfSituation, label: "見積書を確認している段階", sub: "まだ支払っていない" },
                      { value: "pre_sign" as IfSituation, label: "申込中・契約直前", sub: "署名前、まだ支払っていない" },
                      { value: "pre_payment" as IfSituation, label: "契約済みで、請求が来ている", sub: "まだ支払っていない" },
                      { value: "paid" as IfSituation, label: "もう支払い済み", sub: "領収書・明細を確認したい" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setIfSituation(opt.value); setIfStep(2); }}
                        className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 transition-all"
                      >
                        <span className="block text-sm font-medium text-slate-700">{opt.label}</span>
                        <span className="block text-xs text-slate-400 mt-0.5">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: 気になる点 */}
              {ifStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">一番気になることを教えてください</p>
                    <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 mt-1.5 leading-relaxed">
                      最も気になる点から確認ポイントを絞り込みます。費用の名目によって確認すべき根拠・論点が異なります。
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { value: "overall" as IfConcernTheme, label: "全体的に高い・何に払っているかわからない", fees: [] as FeeType[] },
                      { value: "agency" as IfConcernTheme, label: "仲介手数料が1ヶ月分請求されている", fees: ["agency_fee"] as FeeType[] },
                      { value: "optional" as IfConcernTheme, label: "断れると思わなかった費用がある（消毒・サポートプランなど）", fees: ["other"] as FeeType[] },
                      { value: "key" as IfConcernTheme, label: "鍵交換代を請求されている", fees: ["key_exchange"] as FeeType[] },
                      { value: "cleaning" as IfConcernTheme, label: "清掃代・クリーニング代を請求されている", fees: ["cleaning"] as FeeType[] },
                      { value: "guarantor" as IfConcernTheme, label: "保証会社費用の内訳がわからない", fees: ["guarantor"] as FeeType[] },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setIfConcernTheme(opt.value);
                          if (opt.fees.length > 0) set("fees", opt.fees);
                          setIfStep(3);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: 費用選択 + フィードバック1 */}
              {ifStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 space-y-1.5">
                    <p className="text-sm text-sky-800 leading-relaxed font-medium">
                      {ifSituation === "paid"
                        ? "支払済みの場合でも、説明義務違反・根拠のない費用については確認・返金請求できるケースがあります。賃貸契約にクーリングオフはありませんが、費用の根拠を確認することから始めることができます。"
                        : ifSituation === "pre_estimate"
                        ? "まだ見積もり段階なので、費用の確認・調整がしやすい状況です。"
                        : "まだ支払い前なので、確認・調整の余地があります。"}
                    </p>
                    {ifConcernTheme && IF_CONCERN_FEEDBACK[ifConcernTheme] && (
                      <p className="text-xs text-sky-700 leading-relaxed">
                        {IF_CONCERN_FEEDBACK[ifConcernTheme]}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-1">請求されている費用（複数選択可）</p>
                    <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 mb-2 leading-relaxed">
                      費用の名目によって確認すべき契約条項・負担根拠が異なります。消毒費・24時間サポート・書類作成費などは「その他」として選択してください。
                    </p>
                    <div className="space-y-2">
                      {(() => {
                        const NEW_FEE_OPTIONS: { value: FeeType; label: string; detail: string }[] = [
                          {
                            value: "agency_fee",
                            label: "仲介手数料（1ヶ月分？　書面で承諾しましたか？）",
                            detail: "法律上、あなた（借主）から取れる上限は原則0.5ヶ月分です。不動産屋は大家さん（貸主）からも手数料をもらえるため、あなたから1ヶ月分もらわなくても収入は成立します。1ヶ月分を請求するには、あなたが書面で承諾した記録が必要です。口頭の説明や重説の読み上げだけでは承諾になりません。",
                          },
                          {
                            value: "key_exchange",
                            label: "鍵交換代（本来は大家さん負担・交換されましたか？）",
                            detail: "鍵交換は大家さん（貸主）が次の入居者のために行う管理業務です。費用も大家さんが負担するのが原則で、あなた（借主）が払う理由は本来ありません。さらに、実際に交換されたかどうかの確認も必要です。業者名・実施日・領収書・シリンダー交換の確認・鍵の本数が揃っていない請求は根拠がありません。",
                          },
                          {
                            value: "cleaning",
                            label: "清掃代（誰の退去後の清掃ですか？　二重払いになっていませんか？）",
                            detail: "前の住人が退去した後の清掃は大家さん（貸主）の負担が原則です。あなた（借主）が入居する前の話なので、払う理由がありません。退去時清掃の前払いとして請求されている場合、退去時にさらに請求されると二重払いになります。敷金とも別なら三重になる場合もあります。何のための清掃か説明を受けていなければ、まずそれを確認する権利があります。",
                          },
                          {
                            value: "guarantor",
                            label: "保証会社費用（自分で申し込むと安くなる場合があります）",
                            detail: "保証会社は大家さん（貸主）のために家賃未払いリスクに備える会社です。本来は大家さん側のコストです。ただし契約条件として加入を求められる場合、会社を自分で選べることがあります。不動産屋経由だと委託手数料が上乗せされるため、直接申し込めば安くなる場合があります。更新時にも費用が発生するかどうかも事前に確認が必要です。",
                          },
                          {
                            value: "other",
                            label: "消毒・除菌代／サポートプラン／書類作成費など（断れる・根拠を確認できる）",
                            detail: "消毒・除菌は任意のサービスです。「必須」「全員やっています」は事実ではなく、断っても契約できます。24時間サポートプランも任意で、すでに加入している火災保険と内容が重複する場合があります。書類作成費・事務手数料は仲介手数料に含まれる業務であり、別途請求するには具体的な根拠の説明が必要です。仲介手数料と合計して家賃の1.1ヶ月分を超えていないかも確認してください。",
                          },
                        ];
                        return NEW_FEE_OPTIONS.map((opt) => (
                          <div key={opt.value}>
                            <button
                              type="button"
                              onClick={() => {
                                toggleFee(opt.value);
                                setExpandedFee(expandedFee === opt.value ? null : opt.value);
                              }}
                              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                                form.fees.includes(opt.value)
                                  ? "bg-blue-900 text-white border-blue-900"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                              }`}
                            >
                              {opt.label}
                            </button>
                            {expandedFee === opt.value && (
                              <div className="mt-1 mb-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                                {opt.detail}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                    {feeError && <p className="text-red-500 text-xs mt-2">費用を1つ以上選択してください</p>}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1.5">
                      月額賃料を入れると相場と比較できます
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      入力するとStep7で「業界相場 vs 適正水準」の詳細比較が表示されます
                    </p>
                    <div className="relative w-44">
                      <input
                        type="number"
                        value={rentStr}
                        onChange={(e) => setRentStr(e.target.value)}
                        placeholder="例: 70000"
                        min={0}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-slate-400">円</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1.5">
                      請求総額（入れると過不足がわかります）
                    </p>
                    <div className="relative w-44">
                      <input
                        type="number"
                        value={form.amountStr}
                        onChange={(e) => set("amountStr", e.target.value)}
                        placeholder="例: 150000"
                        min={0}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-slate-400">円</span>
                    </div>
                    {(() => {
                      const fmt = (n: number) => n.toLocaleString("ja-JP") + "円";
                      const rent = Number(rentStr);
                      const amount = Number(form.amountStr);
                      const ratio = rent > 0 && amount > 0 ? amount / rent : null;
                      if (ratio === null) return null;

                      // 業界相場判定
                      const industryComment =
                        ratio <= 4 ? "業界相場の範囲内です。" :
                        ratio <= 6 ? "業界相場よりやや高めです。" :
                        "業界相場を大きく上回っています。";

                      // ガイドライン水準（敷金1ヶ月+仲介0.5ヶ月+火災保険0.8万 の目安）
                      const guidelineMonths = 1 + 0.55 + 0.08;
                      const guidelineAmount = Math.round(rent * guidelineMonths);
                      const gap = amount - guidelineAmount;

                      const bgClass =
                        ratio <= 4 ? "bg-slate-50 border-slate-200" :
                        ratio <= 6 ? "bg-amber-50 border-amber-200" :
                        "bg-red-50 border-red-200";

                      const textClass =
                        ratio <= 4 ? "text-slate-700" :
                        ratio <= 6 ? "text-amber-700" :
                        "text-red-700";

                      return (
                        <div className={`rounded-xl px-4 py-3 text-xs border mt-2 space-y-1.5 ${bgClass}`}>
                          <p className={`font-semibold ${textClass}`}>
                            賃料の約{ratio.toFixed(1)}ヶ月分 ― {industryComment}
                          </p>
                          {gap > 0 && (
                            <p className="text-slate-600">
                              適正水準の目安は約{fmt(guidelineAmount)}円（賃料の約{guidelineMonths.toFixed(1)}ヶ月分）です。
                              <span className="font-semibold text-red-600"> 差額{fmt(gap)}円</span>が確認・交渉の余地になります。
                            </p>
                          )}
                          {gap <= 0 && (
                            <p className="text-slate-600">
                              適正水準（約{fmt(guidelineAmount)}円）に近い金額です。ただし科目ごとの根拠確認は別途必要です。
                            </p>
                          )}
                          <p className="text-slate-400">
                            ※ 適正水準＝敷金1ヶ月＋仲介手数料0.5ヶ月＋火災保険の目安。Step7で科目別の詳細を確認できます。
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.fees.length === 0) { setFeeError(true); return; }
                      setFeeError(false);
                      const queue: string[] = [];
                      if (form.fees.includes("agency_fee")) queue.push("agency_fee");
                      if (form.fees.includes("key_exchange")) queue.push("key_exchange");
                      if (form.fees.includes("cleaning")) queue.push("cleaning");
                      if (queue.length > 0) {
                        setFeeQueue(queue.slice(1));
                        if (queue[0] === "agency_fee") setIfStep(8);
                        else if (queue[0] === "key_exchange") setIfStep(9);
                        else setIfStep(10);
                      } else {
                        setIfStep(7);
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
                  >
                    次へ →
                  </button>
                </div>
              )}

              {/* Step 4: 状況別の深掘り質問 */}
              {ifStep === 4 && (
                <div className="space-y-3">
                  {ifSituation === "paid" ? (
                    <>
                      <div>
                        <p className="text-sm font-bold text-slate-800">明細書・領収書・契約書はお手元にありますか？</p>
                        <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 mt-1.5 leading-relaxed">
                          費用内訳の照合・確認には書類が出発点になります。あるかどうかで次のステップが変わります。
                        </p>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: "ある（または手に入れられる）", mention: "yes" as const },
                          { label: "ない / わからない", mention: "unknown" as const },
                        ].map((opt) => (
                          <button
                            key={opt.mention}
                            type="button"
                            onClick={() => { set("contractMention", opt.mention); setIfStep(7); }}
                            className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-bold text-slate-800">費用の説明はどのように受けましたか？</p>
                        <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 mt-1.5 leading-relaxed">
                          説明の方法と内容によって、確認できる論点が変わります。
                        </p>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: "書面（重要事項説明書など）で説明された", explanation: "yes" as const, pressured: false, risk: "green" as const, comment: "" },
                          { label: "口頭で説明された", explanation: "insufficient" as const, pressured: false, risk: "yellow" as const, comment: "" },
                          { label: "説明はなく見積書に載っていただけ", explanation: "no" as const, pressured: false, risk: "red" as const, comment: "" },
                          { label: "説明を求めたらはぐらかされた", explanation: "no" as const, pressured: true, risk: "red" as const, comment: "" },
                          { label: "急かされて確認する時間がなかった", explanation: "insufficient" as const, pressured: true, risk: "red" as const, comment: "" },
                          { label: "重要事項説明はあったが費用の詳細には触れなかった", explanation: "insufficient" as const, pressured: false, risk: "yellow" as const, comment: "形式的な説明があっても費用の根拠・任意性・算出方法に触れていない場合、説明義務を果たしていないとされる可能性があります" },
                          { label: "説明はあったが内容が理解できなかった", explanation: "insufficient" as const, pressured: false, risk: "yellow" as const, comment: "理解できる説明を行うことが説明義務の趣旨です。形式的な説明だけでは不十分とされるケースがあります" },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => {
                              set("explanation", opt.explanation);
                              if (opt.pressured) set("managementIssues", true);
                              setStep4Comment(opt.comment ?? "");
                              setIfStep(6);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, false)}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                        {step4Comment && (
                          <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mt-1">{step4Comment}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 6: 契約書記載確認 + フィードバック2（non-paid のみ）*/}
              {ifStep === 6 && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-amber-800 leading-relaxed">
                      {getIfFeedback2(form.explanation, ifConcernTheme, form.fees)}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">費用の根拠として何か書面がありますか？</p>
                      <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 mt-1.5 leading-relaxed">
                        書面の有無と種類によって、根拠の確認方法が変わります。
                      </p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { value: "yes" as const, label: "契約書・重要事項説明書に記載がある", risk: "green" as const },
                        { value: "unknown" as const, label: "見積書には載っているが契約書は不明", risk: "yellow" as const },
                        { value: "unknown" as const, label: "口頭のみで書面がない", risk: "red" as const },
                        { value: "unknown" as const, label: "書類をもらっていない", risk: "red" as const },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            set("contractMention", opt.value);
                            if (opt.value !== "yes") setIfStep(7);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, form.contractMention === opt.value && opt.value === "yes")}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {/* 特約対抗ロジック：「契約書・重要事項説明書に記載がある」選択後に展開 */}
                    {form.contractMention === "yes" && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
                        <p className="text-xs font-semibold text-amber-800">契約書・特約に記載がある場合</p>
                        {(ifSituation === "pre_estimate" || ifSituation === "pre_sign") ? (
                          <div className="space-y-2">
                            <p className="text-xs text-amber-700 leading-relaxed font-semibold">
                              署名前であれば特約の削除・修正を求めることができます。
                            </p>
                            <p className="text-xs text-amber-600 leading-relaxed">
                              特約は署名した時点で効力を持ちます。署名前であれば「この特約を削除してほしい」と書面で求めることが可能です。断られた場合でも、理由の説明を求める権利があります。署名前が最後の機会です。
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-amber-700 leading-relaxed">
                              署名済みでも、特約の有効性には3つの要件があります。1つでも欠ける場合、有効性の確認を求めることができます。
                            </p>
                            <ul className="space-y-1.5">
                              {[
                                "① 金額・条件が契約書に具体的に明記されている",
                                "② 口頭で内容の説明を受けた",
                                "③ 明示的に同意した（署名・チェックボックス等）",
                              ].map((item) => (
                                <li key={item} className="flex items-start gap-2 text-xs text-amber-700">
                                  <span className="shrink-0 font-bold mt-0.5">✓</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-amber-600 leading-relaxed">
                              「書いてあるから有効」とは限りません。3要件を満たしているか確認を求めることができます。
                            </p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setIfStep(7)}
                          className="w-full py-2.5 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
                        >
                          次へ →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 8: 仲介手数料深掘り */}
              {ifStep === 8 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">仲介手数料について確認します</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-2 text-xs text-slate-700 leading-relaxed">
                      <p>不動産屋はあなた（借主）と大家さん（貸主）の両方から手数料をもらえる仕組みになっています。</p>
                      <p>あなたから0.5ヶ月分、大家さんからも0.5ヶ月分。合計で1ヶ月分の収入が成立します。</p>
                      <p>つまり、あなたから1ヶ月分もらわなくても不動産屋の収入は十分に成り立っています。</p>
                      <p>それでも1ヶ月分を請求するには、あなたが<span className="font-semibold">書面で承諾した記録</span>が必要です。</p>
                      <p className="text-slate-400">「みなさんそうしています」は理由になりません。感じよく説明されたことも、承諾の証拠にはなりません。</p>
                    </div>
                  </div>
                  {/* 質問1 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">請求額は賃料の何ヶ月分ですか？</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      0.5ヶ月分でも、大家さん（貸主）から別途手数料を受け取っている場合はアウトになる可能性があります。金額だけでセーフとは言えません。
                    </p>
                    {[
                      { label: "0.5ヶ月分以下", value: "half" as const, risk: "yellow" as const },
                      { label: "1ヶ月分", value: "one" as const, risk: "red" as const },
                      { label: "1ヶ月分超", value: "over" as const, risk: "red" as const },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setIfFeeDetail((prev) => ({ ...prev, agencyFeeMonths: opt.value }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, ifFeeDetail.agencyFeeMonths === opt.value)}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {ifFeeDetail.agencyFeeMonths === "over" && (
                      <p className="text-xs text-red-600 mt-1">⚠️ 1ヶ月分超は法律上の上限を超えています。金額だけで違反が確定します。</p>
                    )}
                    {ifFeeDetail.agencyFeeMonths === "one" && (
                      <p className="text-xs text-red-600 mt-1">⚠️ 1ヶ月分請求には書面による承諾が必要です。さらに大家さんからも受け取っている場合は0.5ヶ月分が上限になります。</p>
                    )}
                    {ifFeeDetail.agencyFeeMonths === "half" && (
                      <p className="text-xs text-amber-600 mt-1">大家さん（貸主）からも手数料を受け取っているかどうかで判断が変わります。次の質問で確認します。</p>
                    )}
                  </div>
                  {/* 質問2（質問1回答後に表示） */}
                  {ifFeeDetail.agencyFeeMonths !== "" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-700">説明の内容を教えてください</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        「説明された」からといって払う義務が生じるわけではありません。何を・どのように説明されたかが重要です。読み上げただけでは説明を受けたことにはなりません。
                      </p>
                      {[
                        {
                          label: "算出根拠・両手仲介かどうか・承諾書類への署名まで説明された",
                          value: "written" as const,
                          risk: "neutral" as const,
                          comment: null as string | null,
                        },
                        {
                          label: "金額と名目だけ口頭で言われた",
                          value: "oral" as const,
                          risk: "yellow" as const,
                          comment: "金額を伝えられただけでは説明義務を果たしたことにはなりません。根拠・両手仲介の有無・承諾の記録が必要です。" as string | null,
                        },
                        {
                          label: "重要事項説明書を読み上げられただけ",
                          value: "oral" as const,
                          risk: "yellow" as const,
                          comment: "読み上げだけでは理解できる説明とは言えません。算出根拠・任意性・両手仲介の有無について説明を受ける権利があります。" as string | null,
                        },
                        {
                          label: "説明はなかった・名目だけ見積書に載っていた",
                          value: "none" as const,
                          risk: "red" as const,
                          comment: "⚠️ 説明のない費用は根拠の確認を求めることができます。" as string | null,
                        },
                      ].map((opt) => (
                        <div key={opt.label}>
                          <button
                            type="button"
                            onClick={() => setIfFeeDetail((prev) => ({ ...prev, agencyFeeConsent: opt.value }))}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, ifFeeDetail.agencyFeeConsent === opt.value && opt.value !== "oral")}`}
                          >
                            {opt.label}
                          </button>
                          {opt.comment && ifFeeDetail.agencyFeeConsent === opt.value && (
                            <p className={`text-xs mt-1 ${opt.risk === "red" ? "text-red-600" : "text-amber-600"}`}>
                              {opt.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 質問3（質問2回答後に表示） */}
                  {ifFeeDetail.agencyFeeConsent !== "" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600">貸主からも手数料を取っていると説明されましたか？</p>
                      {[
                        { label: "説明された", value: "yes" as const, risk: "yellow" as const },
                        { label: "説明されていない", value: "no" as const, risk: "red" as const },
                        { label: "わからない", value: "unknown" as const, risk: "red" as const },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setIfFeeDetail((prev) => ({ ...prev, agencyFeeBothSides: opt.value }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, ifFeeDetail.agencyFeeBothSides === opt.value)}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* 質問4（質問3回答後に表示） */}
                  {ifFeeDetail.agencyFeeBothSides !== "" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600">貸主側への手数料を含めた合計はいくらか確認できますか？</p>
                      <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 leading-relaxed">
                        宅建業法の上限は借主・貸主合計で1ヶ月分です。貸主からも受け取っている場合、借主への請求は0.5ヶ月分が上限になります。
                      </p>
                      {[
                        { label: "貸主からは受け取っていないと説明された", value: "none" as const, risk: "green" as const },
                        { label: "貸主からも受け取っていると言われた", value: "yes" as const, risk: "red" as const },
                        { label: "教えてもらえなかった・わからない", value: "unknown" as const, risk: "red" as const },
                      ].map((opt) => (
                        <div key={opt.value}>
                          <button
                            type="button"
                            onClick={() => {
                              setIfFeeDetail((prev) => ({ ...prev, agencyFeeLandlord: opt.value }));
                              proceedFromFeeDetail();
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, false)}`}
                          >
                            {opt.label}
                          </button>
                          {opt.value === "yes" && ifFeeDetail.agencyFeeLandlord === "yes" && (
                            <p className="text-xs text-red-600 mt-2">⚠️ 両手仲介の場合、借主から受け取れる手数料は原則0.5ヶ月分が上限です</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 9: 鍵交換代深掘り */}
              {ifStep === 9 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">鍵交換代について確認します</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-2 text-xs text-slate-700 leading-relaxed">
                      <p>鍵交換は本来、<span className="font-semibold">大家さん（貸主）がすべき作業</span>です。前の住人が使った鍵のまま次の人に貸すわけにいかないので、大家さんが自分のために行う管理業務です。</p>
                      <p>あなたが払う理由は本来ありません。</p>
                      <p>それでも請求されている場合、以下が揃っていないと払う根拠がありません：実施日・業者名・領収書・シリンダーごとの交換・鍵の本数の一致・契約書への借主負担の明記。</p>
                      <p className="text-slate-400">一つでも欠けていれば、払う前に確認を求めて当然です。</p>
                    </div>
                  </div>
                  {/* 質問1 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">鍵交換は実際に行われましたか？</p>
                    {[
                      { label: "業者が来て交換した", value: "confirmed" as const, risk: "green" as const, comment: null },
                      { label: "確認できていない", value: "unconfirmed" as const, risk: "yellow" as const, comment: "⚠️ 鍵交換の実施確認ができない場合、実態のない請求の可能性として確認できます" },
                      { label: "入居時に鍵が変わっていなかった気がする", value: "unknown" as const, risk: "red" as const, comment: "⚠️ 交換が行われていない可能性がある場合、名目と実態の不一致として確認すべき状態です" },
                    ].map((opt) => (
                      <div key={opt.value}>
                        <button
                          type="button"
                          onClick={() => setIfFeeDetail((prev) => ({ ...prev, keyExchangeDone: opt.value }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, ifFeeDetail.keyExchangeDone === opt.value)}`}
                        >
                          {opt.label}
                        </button>
                        {opt.comment && ifFeeDetail.keyExchangeDone === opt.value && (
                          <p className={`text-xs mt-1 ${opt.risk === "red" ? "text-red-600" : "text-amber-600"}`}>{opt.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* 質問2（質問1回答後に表示） */}
                  {ifFeeDetail.keyExchangeDone !== "" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600">物件は新築ですか？</p>
                      {[
                        { label: "新築", value: "new" as const, risk: "red" as const, comment: "⚠️ 新築物件で前の入居者がいない場合、鍵交換の必要性自体の根拠確認が重要です" },
                        { label: "既存物件（前の入居者がいた）", value: "existing" as const, risk: "neutral" as const, comment: null },
                        { label: "わからない", value: "unknown" as const, risk: "yellow" as const, comment: null },
                      ].map((opt) => (
                        <div key={opt.value}>
                          <button
                            type="button"
                            onClick={() => {
                              setIfFeeDetail((prev) => ({ ...prev, keyExchangeNew: opt.value }));
                              proceedFromFeeDetail();
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, false)}`}
                          >
                            {opt.label}
                          </button>
                          {opt.comment && ifFeeDetail.keyExchangeNew === opt.value && (
                            <p className="text-xs text-red-600 mt-1">{opt.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 10: 消毒・クリーニング深掘り */}
              {ifStep === 10 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">清掃代・消毒代について確認します</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-2 text-xs text-slate-700 leading-relaxed">
                      <p>清掃代には種類があります。何のための費用かで話が変わります。</p>
                      <p><span className="font-semibold">前の住人が退去した後の清掃</span>：大家さん（貸主）の負担が原則です。あなたが入居する前の話なので、あなたが払う理由がありません。</p>
                      <p><span className="font-semibold">退去時清掃の前払い</span>：まだ退去もしていないのに退去後の清掃代を今払う構造です。退去時にさらに請求された場合、二重払いになります。敷金とも別なら三重になる場合もあります。</p>
                      <p><span className="font-semibold">消毒・除菌</span>：任意のサービスです。「必須です」「全員やっています」は事実ではありません。断っても契約できます。</p>
                      <p className="text-slate-400">「みなさん払っています」は理由になりません。契約書への明記と実施の証明が最低限必要です。</p>
                    </div>
                  </div>

                  {/* 質問0：何のための清掃か */}
                  {ifFeeDetail.cleaningMandatory === "" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-700">この清掃代は何のための費用ですか？</p>
                      <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 leading-relaxed">
                        何のための清掃かによって、そもそも払う義務があるかどうかが変わります。
                      </p>
                      {[
                        {
                          label: "前の入居者が退去した後の清掃（入居前清掃）",
                          value: "prev_tenant" as const,
                          risk: "red" as const,
                        },
                        {
                          label: "退去時の清掃の前払い",
                          value: "mandatory" as const,
                          risk: "yellow" as const,
                        },
                        {
                          label: "消毒・除菌",
                          value: "optional" as const,
                          risk: "yellow" as const,
                        },
                        {
                          label: "説明されなかった・わからない",
                          value: "no_explanation" as const,
                          risk: "red" as const,
                        },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (opt.value === "prev_tenant") {
                              setIfFeeDetail((prev) => ({ ...prev, cleaningMandatory: "mandatory" }));
                              setIfFeeDetail((prev) => ({ ...prev, cleaningContract: "no" }));
                              proceedFromFeeDetail();
                            } else {
                              setIfFeeDetail((prev) => ({ ...prev, cleaningMandatory: opt.value === "optional" ? "optional" : opt.value === "mandatory" ? "mandatory" : "no_explanation" }));
                            }
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, false)}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 前入居者清掃の場合：即終了メッセージ */}
                  {ifFeeDetail.cleaningMandatory === "mandatory" && ifFeeDetail.cleaningContract === "no" && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 space-y-2">
                      <p className="text-sm font-semibold text-red-700">大家さん（貸主）負担が原則です</p>
                      <p className="text-xs text-red-600 leading-relaxed">
                        前の入居者が退去した後の清掃はあなたが入居する前の話です。大家さんが自分の物件を次の入居者に貸すために行う作業であり、あなたが払う理由はありません。払う前に根拠の説明を求めることができます。
                      </p>
                    </div>
                  )}

                  {/* 質問1：どのように説明されましたか（前入居者清掃以外） */}
                  {ifFeeDetail.cleaningMandatory !== "" && ifFeeDetail.cleaningContract !== "no" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600">どのように説明されましたか？</p>
                      {[
                        { label: "必須と言われた", value: "mandatory" as const, risk: "red" as const, comment: "⚠️ 入居前クリーニング・消毒は原則貸主負担です。借主に必須として請求する根拠の説明を求めることができます" },
                        { label: "任意と言われた", value: "optional" as const, risk: "green" as const, comment: "任意費用として説明されている場合、断ることができます" },
                        { label: "説明がなかった", value: "no_explanation" as const, risk: "red" as const, comment: "⚠️ 説明なしに請求されている場合、費用の根拠と任意性の確認が必要です" },
                      ].map((opt) => (
                        <div key={opt.value}>
                          <button
                            type="button"
                            onClick={() => setIfFeeDetail((prev) => ({ ...prev, cleaningMandatory: opt.value }))}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, ifFeeDetail.cleaningMandatory === opt.value)}`}
                          >
                            {opt.label}
                          </button>
                          {ifFeeDetail.cleaningMandatory === opt.value && (
                            <p className={`text-xs mt-1 ${opt.risk === "red" ? "text-red-600" : "text-green-700"}`}>{opt.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 質問2：契約書記載（前入居者清掃以外・質問1回答後） */}
                  {ifFeeDetail.cleaningMandatory !== "" && ifFeeDetail.cleaningContract !== "no" && ifFeeDetail.cleaningMandatory !== "no_explanation" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600">契約書に記載がありますか？</p>
                      {[
                        { label: "記載がある", value: "yes" as const, risk: "neutral" as const, comment: null },
                        { label: "記載がない", value: "no" as const, risk: "red" as const, comment: "⚠️ 契約書への記載がない費用の請求は根拠の確認が必要です" },
                        { label: "確認していない", value: "unknown" as const, risk: "yellow" as const, comment: null },
                      ].map((opt) => (
                        <div key={opt.value}>
                          <button
                            type="button"
                            onClick={() => {
                              setIfFeeDetail((prev) => ({ ...prev, cleaningContract: opt.value }));
                              proceedFromFeeDetail();
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${getRiskButtonClass(opt.risk, false)}`}
                          >
                            {opt.label}
                          </button>
                          {opt.comment && ifFeeDetail.cleaningContract === opt.value && (
                            <p className="text-xs text-red-600 mt-1">{opt.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 説明なしの場合も即proceedボタン */}
                  {ifFeeDetail.cleaningMandatory === "no_explanation" && ifFeeDetail.cleaningContract === "" && (
                    <button
                      type="button"
                      onClick={() => {
                        setIfFeeDetail((prev) => ({ ...prev, cleaningContract: "unknown" }));
                        proceedFromFeeDetail();
                      }}
                      className="w-full py-3 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
                    >
                      次へ →
                    </button>
                  )}
                </div>
              )}

              {/* Step 7: メールトーン + 送信ボタン */}
              {ifStep === 7 && (
                <div className="space-y-4">
                  {/* 相場表示 */}
                  {Number(rentStr) > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-600">あなたの条件での費用目安</p>
                      </div>
                      {/* 地域・時期・物件の簡易入力 */}
                      <div className="flex flex-wrap gap-2">
                        {(["metro", "local"] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setEstimateRegion(v)}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                              estimateRegion === v
                                ? "bg-blue-800 text-white border-blue-800"
                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            {v === "metro" ? "首都圏" : "地方"}
                          </button>
                        ))}
                        {(["peak", "off"] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setEstimateSeason(v)}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                              estimateSeason === v
                                ? "bg-blue-800 text-white border-blue-800"
                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            {v === "peak" ? "繁忙期（1〜3月）" : "閑散期（それ以外）"}
                          </button>
                        ))}
                        {(["new", "old"] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setEstimateBuilding(v)}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                              estimateBuilding === v
                                ? "bg-blue-800 text-white border-blue-800"
                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            {v === "new" ? "新築" : "既存物件"}
                          </button>
                        ))}
                      </div>
                      <FeeEstimate
                        rent={Number(rentStr)}
                        region={estimateRegion}
                        season={estimateSeason}
                        building={estimateBuilding}
                      />
                    </div>
                  )}
                  {ifSituation === "paid" && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {getIfFeedback2(form.explanation, ifConcernTheme, form.fees)}
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">管理会社への確認メールのトーン</p>
                      <p className="text-xs text-slate-500 mt-1">診断結果をもとに、今回の状況に合わせた確認メールを生成します</p>
                    </div>
                    <RadioGroup
                      value={form.emailTone}
                      onChange={(v) => set("emailTone", v)}
                      options={[
                        { value: "polite", label: "丁寧" },
                        { value: "firm", label: "やや強め" },
                        { value: "factual", label: "事実確認" },
                      ]}
                    />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700">診断について</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">無料</span>
                          <p className="text-xs text-slate-600">診断・確認ポイントの提示</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">¥980</span>
                          <p className="text-xs text-slate-600">今回の状況を反映した個別の確認メール文案</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      メール文案は診断後に生成されます。診断は無料で、文案が必要な場合のみ980円です。
                    </p>
                  </div>
                  {/* ── よくある不安 ── */}
                  <details className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
                      <p className="text-xs font-semibold text-slate-600">このサービスについてよくある不安</p>
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-4">
                      {[
                        {
                          q: "「安くなる」って怪しくないですか？",
                          a: "法律・ガイドラインに基づいた情報提供です。国土交通省の原状回復ガイドライン・宅建業法46条・消費者契約法など、公的根拠のある情報のみを使用しています。「安くなる」のではなく「根拠のない費用を払わない」という整理です。",
                        },
                        {
                          q: "不動産屋に嫌われて入居を断られませんか？",
                          a: "このサービスが生成するのは「確認メール」であり「クレームメール」ではありません。「根拠を教えてください」という質問は法律上正当な権利行使です。申込前の段階であれば費用の確認は通常の交渉です。入居を断る理由にはなりません。",
                        },
                        {
                          q: "特約に書いてあったら全部払わないといけないですか？",
                          a: "特約は万能ではありません。①金額・条件が具体的に明記されている、②説明を受けている、③明示的に同意している、この3要件を満たさない特約は有効性の確認対象になります。「書いてあるから有効」とは限りません。",
                        },
                      ].map((item) => (
                        <div key={item.q} className="space-y-1">
                          <p className="text-xs font-semibold text-slate-700">Q. {item.q}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">A. {item.a}</p>
                        </div>
                      ))}
                      <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 leading-relaxed">
                        このサービスは法的助言ではありません。情報整理・判断材料の提示を目的としています。
                      </p>
                    </div>
                  </details>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-600">送る前に確認</p>
                    <ul className="space-y-1.5">
                      {[
                        "生成されるのは「確認メール」です。クレームでも交渉でもありません",
                        "「根拠を教えてください」は法律上正当な権利行使です",
                        "送っても入居を断られる理由にはなりません",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-slate-500">
                          <span className="text-green-500 shrink-0 font-bold mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-800 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        診断中...
                      </span>
                    ) : "診断する →"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Mode 2: 契約書チェック ── */}
          {selectedMode === "contract_review" && (
            <>
              <div>
                <Label>契約種別</Label>
                <Intent>普通借家と定期借家では更新料・更新の仕組みが異なります。種別が確認の出発点です。</Intent>
                <RadioGroup
                  value={form.contractType}
                  onChange={(v) => set("contractType", v)}
                  options={[
                    { value: "ordinary", label: "普通借家" },
                    { value: "fixed_term", label: "定期借家" },
                    { value: "unknown", label: "不明" },
                  ]}
                />
              </div>

              <div>
                <Label>更新条項の記載</Label>
                <Intent>定期借家に更新条項がある場合、契約条件の矛盾の可能性を確認します。普通借家では更新条項の内容が費用根拠になります。</Intent>
                <BoolButtons
                  value={form.hasRenewalClause}
                  onChange={(v) => set("hasRenewalClause", v)}
                  trueLabel="更新条項がある"
                  falseLabel="ない / 不明"
                />
              </div>

              <div>
                <Label>特約条項の有無</Label>
                <Intent>借主の費用負担を広げる特約は、内容・説明・同意の有無が確認ポイントです。特約の有効性は記載内容と同意の経緯に左右されます。</Intent>
                <BoolButtons
                  value={form.hasSpecialClauses}
                  onChange={(v) => set("hasSpecialClauses", v)}
                  trueLabel="特約がある"
                  falseLabel="ない / 不明"
                />
              </div>

              <div>
                <Label>違約金・退去時費用に関する特約の有無</Label>
                <Intent>退去時費用・早期退去ペナルティの特約は、書面への記載・説明・同意の有無が確認の核心です。</Intent>
                <BoolButtons
                  value={form.hasPenaltyClauses}
                  onChange={(v) => set("hasPenaltyClauses", v)}
                  trueLabel="ある"
                  falseLabel="ない / 不明"
                />
                <HelpText>早期退去ペナルティ・クリーニング特約なども含みます</HelpText>
              </div>

              <div>
                <Label>特約へのチェックボックス等での明示的な同意</Label>
                <Intent>特約への明示的な同意がない場合、その有効性が照合ポイントになります。同意の方法・経緯を確認します。</Intent>
                <BoolButtons
                  value={form.hasCheckbox}
                  onChange={(v) => set("hasCheckbox", v)}
                  trueLabel="あった"
                  falseLabel="なかった / 不明"
                />
              </div>

              <div>
                <Label>重要事項説明での口頭説明</Label>
                <Intent>重要事項説明での口頭説明は宅建業法上の義務とされています。説明の有無・内容の記録を確認します。</Intent>
                <BoolButtons
                  value={form.hasOralExplanation}
                  onChange={(v) => set("hasOralExplanation", v)}
                  trueLabel="受けた"
                  falseLabel="受けていない / 不明"
                />
              </div>
            </>
          )}

          {/* ── Mode 3: 更新・再契約チェック ── */}
          {selectedMode === "renewal" && (
            <>
              <div>
                <Label>契約種別</Label>
                <Intent>普通借家の「更新」と定期借家の「再契約」では費用の性質・根拠が異なります。種別が確認の出発点です。</Intent>
                <RadioGroup
                  value={form.contractType}
                  onChange={(v) => set("contractType", v)}
                  options={[
                    { value: "ordinary", label: "普通借家" },
                    { value: "fixed_term", label: "定期借家" },
                    { value: "unknown", label: "不明" },
                  ]}
                />
              </div>

              <div>
                <Label>手続きの種類</Label>
                <Intent>普通借家の「更新料」と定期借家の「再契約料」は法的根拠が異なります。種類が確認すべき条項を決めます。</Intent>
                <RadioGroup
                  value={form.phase}
                  onChange={(v) => set("phase", v)}
                  options={[
                    { value: "renewal", label: "更新" },
                    { value: "recontracting", label: "再契約" },
                    { value: "other", label: "不明" },
                  ]}
                />
              </div>

              <div>
                <Label>請求されている費用（複数選択可）</Label>
                <Intent>費用の名目によって確認すべき契約条項・根拠が変わります。更新事務手数料なども「その他」として選択できます。</Intent>
                <div className="flex flex-wrap gap-2">
                  {FEE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleFee(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                        form.fees.includes(opt.value)
                          ? "bg-blue-800 text-white border-blue-800 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {feeError && (
                  <p className="text-red-500 text-xs mt-2">費用を1つ以上選択してください</p>
                )}
              </div>

              <div>
                <Label>請求総額（任意）</Label>
                <div className="relative w-48">
                  <input
                    type="number"
                    value={form.amountStr}
                    onChange={(e) => set("amountStr", e.target.value)}
                    placeholder="例: 50000"
                    min={0}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">円</span>
                </div>
              </div>

              <div>
                <Label>費用について契約書への記載</Label>
                <Intent>費用の根拠が契約書に明記されているかどうかが、請求確認の基本的な出発点です。</Intent>
                <RadioGroup
                  value={form.contractMention}
                  onChange={(v) => set("contractMention", v)}
                  options={[
                    { value: "yes", label: "記載がある" },
                    { value: "unknown", label: "確認できていない / 不明" },
                  ]}
                />
              </div>

              <div>
                <Label>費用についての説明</Label>
                <Intent>費用の算出方法・根拠の説明は、請求内容の適切さを確認する基準になります。</Intent>
                <RadioGroup
                  value={form.explanation}
                  onChange={(v) => set("explanation", v)}
                  options={[
                    { value: "yes", label: "十分な説明を受けた" },
                    { value: "insufficient", label: "説明が不十分" },
                    { value: "no", label: "説明を受けていない" },
                  ]}
                />
              </div>

              <div>
                <Label>費用への同意の経緯</Label>
                <Intent>どのような経緯で同意したかが、費用の性質確認・照合に関係します。</Intent>
                <RadioGroup
                  value={form.consentStructure}
                  onChange={(v) => set("consentStructure", v)}
                  options={[
                    { value: "yes", label: "明確に同意した" },
                    { value: "unknown", label: "不明・記憶にない" },
                  ]}
                />
              </div>

              <div>
                <Label>管理上の問題（害虫・設備不備など）の有無</Label>
                <Intent>管理状態に問題がある場合、更新時の費用請求との関係を確認します。</Intent>
                <BoolButtons
                  value={form.managementIssues}
                  onChange={(v) => set("managementIssues", v)}
                  trueLabel="ある"
                  falseLabel="ない"
                />
              </div>
            </>
          )}

          {/* ── Mode 4: 管理不備・修繕相談 ── */}
          {selectedMode === "maintenance" && (
            <>
              <div>
                <Label>不具合の種類</Label>
                <Intent>不具合の種類によって、修繕義務の性質・対応の優先度が異なります。</Intent>
                <RadioGroup
                  value={form.issueType}
                  onChange={(v) => set("issueType", v)}
                  options={[
                    { value: "water_leak", label: "水漏れ・雨漏り" },
                    { value: "equipment", label: "設備不具合" },
                    { value: "pest", label: "害虫・害獣" },
                    { value: "noise", label: "騒音・振動" },
                    { value: "common_area", label: "共用部の不備" },
                    { value: "mold", label: "カビ・湿気" },
                    { value: "other", label: "その他" },
                  ]}
                />
              </div>

              <div>
                <Label>発生・継続期間</Label>
                <Intent>発生・継続期間は、対応を求める根拠として書面で記録する情報です。</Intent>
                <RadioGroup
                  value={form.issueDuration}
                  onChange={(v) => set("issueDuration", v)}
                  options={[
                    { value: "today", label: "本日" },
                    { value: "few_days", label: "数日前から" },
                    { value: "week_plus", label: "1週間以上前から" },
                    { value: "month_plus", label: "1ヶ月以上前から" },
                  ]}
                />
              </div>

              <div>
                <Label>日常生活への影響</Label>
                <Intent>影響度は対応の緊急性・優先度を伝える根拠として使用します。</Intent>
                <RadioGroup
                  value={form.lifeImpact}
                  onChange={(v) => set("lifeImpact", v)}
                  options={[
                    { value: "none", label: "支障なし" },
                    { value: "moderate", label: "一部支障あり" },
                    { value: "severe", label: "重大な支障あり" },
                  ]}
                />
              </div>

              <div>
                <Label>管理会社・貸主への連絡</Label>
                <Intent>口頭のみでは記録が残りません。書面での連絡が対応確認の証拠になります。</Intent>
                <BoolButtons
                  value={form.alreadyContacted}
                  onChange={(v) => set("alreadyContacted", v)}
                  trueLabel="すでに連絡した"
                  falseLabel="まだしていない"
                />
              </div>

              <div>
                <Label>写真・動画などの証拠記録</Label>
                <Intent>状況の記録は、後の対応・確認で事実の根拠として機能します。</Intent>
                <BoolButtons
                  value={form.hasEvidence}
                  onChange={(v) => set("hasEvidence", v)}
                  trueLabel="ある"
                  falseLabel="ない"
                />
              </div>

              <div>
                <Label>緊急性（居住継続・安全に関わる）</Label>
                <Intent>居住に影響する状況は、緊急対応の依頼根拠として明示します。</Intent>
                <BoolButtons
                  value={form.isUrgent}
                  onChange={(v) => set("isUrgent", v)}
                  trueLabel="緊急性が高い"
                  falseLabel="緊急ではない"
                />
              </div>
            </>
          )}

          {/* ── Mode 5: 退去費用チェック ── */}
          {selectedMode === "move_out" && (
            <>
              <div>
                <Label>請求されている費用（複数選択可）</Label>
                <Intent>費用の名目によって確認すべき根拠・契約条項が異なります。消毒費・ハウスクリーニングなど名目が不明な場合は「その他」として選択してください。</Intent>
                <div className="flex flex-wrap gap-2">
                  {MOVE_OUT_FEE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleMoveOutFee(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                        form.moveOutFees.includes(opt.value)
                          ? "bg-blue-800 text-white border-blue-800"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {feeError && (
                  <p className="text-red-500 text-xs mt-2">費用を1つ以上選択してください</p>
                )}
              </div>

              <div>
                <Label>請求総額（任意）</Label>
                <div className="relative w-48">
                  <input
                    type="number"
                    value={form.moveOutAmountStr}
                    onChange={(e) => set("moveOutAmountStr", e.target.value)}
                    placeholder="例: 80000"
                    min={0}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">円</span>
                </div>
              </div>

              <div>
                <Label>損傷の原因</Label>
                <Intent>故意・過失による損傷と通常使用による損耗は、費用負担者が異なります。</Intent>
                <BoolButtons
                  value={form.hasOwnerFault}
                  onChange={(v) => set("hasOwnerFault", v)}
                  trueLabel="故意・過失による損傷あり"
                  falseLabel="通常使用の範囲"
                />
              </div>

              <div>
                <Label>通常損耗・経年劣化への請求の可能性</Label>
                <Intent>通常使用による自然な劣化は原則として貸主負担とされています。</Intent>
                <BoolButtons
                  value={form.isNormalWear}
                  onChange={(v) => set("isNormalWear", v)}
                  trueLabel="通常損耗に対して請求されている可能性がある"
                  falseLabel="不明"
                />
                <HelpText>通常使用による自然な劣化は原則として貸主負担です</HelpText>
              </div>

              <div>
                <Label>退去時費用に関する特約の有無</Label>
                <Intent>特約の内容・有効性は、費用負担の根拠として確認すべき契約事項です。</Intent>
                <BoolButtons
                  value={form.hasContractSpecialClause}
                  onChange={(v) => set("hasContractSpecialClause", v)}
                  trueLabel="特約がある"
                  falseLabel="ない / 不明"
                />
              </div>

              <div>
                <Label>入居時の室内写真・記録</Label>
                <Intent>入居時の記録は、退去時の状況比較・原状回復の範囲確認の根拠になります。</Intent>
                <BoolButtons
                  value={form.hasEntryPhotos}
                  onChange={(v) => set("hasEntryPhotos", v)}
                  trueLabel="ある"
                  falseLabel="ない"
                />
              </div>

              <div>
                <Label>退去立会いの実施</Label>
                <Intent>立会いの有無は、退去時の状況を双方で確認する機会を持ったかどうかを判断します。</Intent>
                <BoolButtons
                  value={form.hasInspection}
                  onChange={(v) => set("hasInspection", v)}
                  trueLabel="実施した"
                  falseLabel="していない / 不明"
                />
              </div>

              <div>
                <Label>費用の詳細な内訳明細の提供</Label>
                <Intent>明細の提示は、費用の根拠・算出方法の説明として確認する項目です。</Intent>
                <BoolButtons
                  value={form.hasDetailedQuote}
                  onChange={(v) => set("hasDetailedQuote", v)}
                  trueLabel="受け取った"
                  falseLabel="受け取っていない"
                />
              </div>

              <div>
                <Label>費用について契約書への記載</Label>
                <Intent>費用の契約書への記載は、負担根拠として確認する基本情報です。</Intent>
                <RadioGroup
                  value={form.moveOutContractMention}
                  onChange={(v) => set("moveOutContractMention", v)}
                  options={[
                    { value: "yes", label: "記載がある" },
                    { value: "unknown", label: "確認できていない / 不明" },
                  ]}
                />
              </div>
            </>
          )}

          {/* ── Mode 6: 敷金精算チェック ── */}
          {selectedMode === "deposit_refund" && (
            <>
              <div>
                <Label>敷金額（任意）</Label>
                <div className="relative w-48">
                  <input
                    type="number"
                    value={form.depositAmountStr}
                    onChange={(e) => set("depositAmountStr", e.target.value)}
                    placeholder="例: 100000"
                    min={0}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">円</span>
                </div>
              </div>

              <div>
                <Label>返還予定額（任意）</Label>
                <div className="relative w-48">
                  <input
                    type="number"
                    value={form.expectedRefundStr}
                    onChange={(e) => set("expectedRefundStr", e.target.value)}
                    placeholder="例: 30000"
                    min={0}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">円</span>
                </div>
              </div>

              <div>
                <Label>差引項目（複数選択可）</Label>
                <Intent>差引名目によって確認すべき根拠・算出方法が異なります。</Intent>
                <div className="flex flex-wrap gap-2">
                  {DEDUCTION_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleDeduction(item)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                        form.deductionItems.includes(item)
                          ? "bg-blue-800 text-white border-blue-800"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>差引明細（費目・金額・算出根拠）の提示</Label>
                <Intent>差引の費目・金額・算出根拠の明示は、精算の透明性を確認する基本です。</Intent>
                <BoolButtons
                  value={form.hasDetailedStatement}
                  onChange={(v) => set("hasDetailedStatement", v)}
                  trueLabel="提示されている"
                  falseLabel="提示されていない"
                />
              </div>

              <div>
                <Label>敷金返還予定日・返還方法の連絡</Label>
                <Intent>返還スケジュールの連絡は、精算の手続き状況を確認する情報です。</Intent>
                <BoolButtons
                  value={form.hasReturnSchedule}
                  onChange={(v) => set("hasReturnSchedule", v)}
                  trueLabel="連絡がある"
                  falseLabel="連絡がない"
                />
              </div>
            </>
          )}

          {/* ── 共通: 状況の詳細・メールトーン（initial_fees はウィザード内で完結） ── */}
          {selectedMode !== "initial_fees" && (
            <>
              <div>
                <Label>状況の詳細（任意）</Label>
                <textarea
                  value={form.freeText}
                  onChange={(e) => set("freeText", e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="気になること、経緯など自由にご記入ください"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-300">{form.freeText.length}/1000</span>
                </div>
              </div>

              <div>
                <Label>確認メールのトーン</Label>
                <RadioGroup
                  value={form.emailTone}
                  onChange={(v) => set("emailTone", v)}
                  options={[
                    { value: "polite", label: "丁寧" },
                    { value: "firm", label: "やや強め" },
                    { value: "factual", label: "事実確認" },
                  ]}
                />
                <HelpText>診断結果と一緒に確認メールの文案を生成します</HelpText>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-800 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    診断中...
                  </span>
                ) : (
                  "診断する"
                )}
              </button>
            </>
          )}
        </form>
      )}

      {/* ── 診断結果 ── */}
      {result && (
        <div id="result-section" className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">診断結果</h2>
            <button
              onClick={handleReset}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              もう一度診断する
            </button>
          </div>
          <DiagnosisResult result={result} initialFeesMeta={submittedIfMeta} />
        </div>
      )}
    </div>
  );
}
