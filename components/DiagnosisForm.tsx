"use client";

import { useState } from "react";
import type {
  DiagnosisResult as DiagnosisResultType,
  DiagnosisMode,
  FeeType,
  ContractType,
  Phase,
  EmailTone,
} from "@/lib/types";
import { MODE_CONFIG } from "@/lib/modes";
import DiagnosisResult from "./DiagnosisResult";

// ─── 共通UIパーツ ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1.5">{children}</label>;
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400 mt-1.5">{children}</p>;
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
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
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
          value ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
        }`}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-2 rounded-lg text-sm border transition-all ${
          !value ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
        }`}
      >
        {falseLabel}
      </button>
    </div>
  );
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
  }

  function buildPayload() {
    if (!selectedMode) return null;

    switch (selectedMode) {
      case "initial_fees":
        return {
          mode: "initial_fees",
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
        <p className="text-sm font-semibold text-slate-700 mb-3">どの場面のご相談ですか？</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => selectMode(m.value)}
              className={`flex flex-col items-start gap-1 px-3 py-3 rounded-xl border text-left transition-all ${
                selectedMode === m.value
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
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
          {/* モードバッジ */}
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5">
            <span className="text-base">{MODE_CONFIG[selectedMode].icon}</span>
            <span className="text-sm font-semibold text-slate-700">
              {MODE_CONFIG[selectedMode].label}
            </span>
          </div>

          {/* ── Mode 1: 初期費用チェック ── */}
          {selectedMode === "initial_fees" && (
            <>
              <div>
                <Label>契約種別</Label>
                <RadioGroup
                  value={form.contractType}
                  onChange={(v) => set("contractType", v)}
                  options={[
                    { value: "ordinary", label: "普通借家" },
                    { value: "fixed_term", label: "定期借家" },
                    { value: "unknown", label: "不明" },
                  ]}
                />
                <HelpText>契約書の表紙や冒頭部分で確認できます</HelpText>
              </div>

              <div>
                <Label>請求されている費用（複数選択可）</Label>
                <div className="flex flex-wrap gap-2">
                  {FEE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleFee(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                        form.fees.includes(opt.value)
                          ? "bg-slate-800 text-white border-slate-800"
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
                    value={form.amountStr}
                    onChange={(e) => set("amountStr", e.target.value)}
                    placeholder="例: 150000"
                    min={0}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">円</span>
                </div>
              </div>

              <div>
                <Label>費用について契約書・重要事項説明書への記載</Label>
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
                <BoolButtons
                  value={form.managementIssues}
                  onChange={(v) => set("managementIssues", v)}
                  trueLabel="ある"
                  falseLabel="ない"
                />
              </div>
            </>
          )}

          {/* ── Mode 2: 契約書チェック ── */}
          {selectedMode === "contract_review" && (
            <>
              <div>
                <Label>契約種別</Label>
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
                <BoolButtons
                  value={form.hasRenewalClause}
                  onChange={(v) => set("hasRenewalClause", v)}
                  trueLabel="更新条項がある"
                  falseLabel="ない / 不明"
                />
                <HelpText>定期借家で更新条項がある場合は要確認です</HelpText>
              </div>

              <div>
                <Label>特約条項の有無</Label>
                <BoolButtons
                  value={form.hasSpecialClauses}
                  onChange={(v) => set("hasSpecialClauses", v)}
                  trueLabel="特約がある"
                  falseLabel="ない / 不明"
                />
              </div>

              <div>
                <Label>違約金・退去時費用に関する特約の有無</Label>
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
                <BoolButtons
                  value={form.hasCheckbox}
                  onChange={(v) => set("hasCheckbox", v)}
                  trueLabel="あった"
                  falseLabel="なかった / 不明"
                />
              </div>

              <div>
                <Label>重要事項説明での口頭説明</Label>
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
                <div className="flex flex-wrap gap-2">
                  {FEE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleFee(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                        form.fees.includes(opt.value)
                          ? "bg-slate-800 text-white border-slate-800"
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
                <BoolButtons
                  value={form.alreadyContacted}
                  onChange={(v) => set("alreadyContacted", v)}
                  trueLabel="すでに連絡した"
                  falseLabel="まだしていない"
                />
              </div>

              <div>
                <Label>写真・動画などの証拠記録</Label>
                <BoolButtons
                  value={form.hasEvidence}
                  onChange={(v) => set("hasEvidence", v)}
                  trueLabel="ある"
                  falseLabel="ない"
                />
              </div>

              <div>
                <Label>緊急性（居住継続・安全に関わる）</Label>
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
                <div className="flex flex-wrap gap-2">
                  {MOVE_OUT_FEE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleMoveOutFee(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                        form.moveOutFees.includes(opt.value)
                          ? "bg-slate-800 text-white border-slate-800"
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
                <BoolButtons
                  value={form.hasOwnerFault}
                  onChange={(v) => set("hasOwnerFault", v)}
                  trueLabel="故意・過失による損傷あり"
                  falseLabel="通常使用の範囲"
                />
              </div>

              <div>
                <Label>通常損耗・経年劣化への請求の可能性</Label>
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
                <BoolButtons
                  value={form.hasContractSpecialClause}
                  onChange={(v) => set("hasContractSpecialClause", v)}
                  trueLabel="特約がある"
                  falseLabel="ない / 不明"
                />
              </div>

              <div>
                <Label>入居時の室内写真・記録</Label>
                <BoolButtons
                  value={form.hasEntryPhotos}
                  onChange={(v) => set("hasEntryPhotos", v)}
                  trueLabel="ある"
                  falseLabel="ない"
                />
              </div>

              <div>
                <Label>退去立会いの実施</Label>
                <BoolButtons
                  value={form.hasInspection}
                  onChange={(v) => set("hasInspection", v)}
                  trueLabel="実施した"
                  falseLabel="していない / 不明"
                />
              </div>

              <div>
                <Label>費用の詳細な内訳明細の提供</Label>
                <BoolButtons
                  value={form.hasDetailedQuote}
                  onChange={(v) => set("hasDetailedQuote", v)}
                  trueLabel="受け取った"
                  falseLabel="受け取っていない"
                />
              </div>

              <div>
                <Label>費用について契約書への記載</Label>
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
                <div className="flex flex-wrap gap-2">
                  {DEDUCTION_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleDeduction(item)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                        form.deductionItems.includes(item)
                          ? "bg-slate-800 text-white border-slate-800"
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
                <BoolButtons
                  value={form.hasDetailedStatement}
                  onChange={(v) => set("hasDetailedStatement", v)}
                  trueLabel="提示されている"
                  falseLabel="提示されていない"
                />
              </div>

              <div>
                <Label>敷金返還予定日・返還方法の連絡</Label>
                <BoolButtons
                  value={form.hasReturnSchedule}
                  onChange={(v) => set("hasReturnSchedule", v)}
                  trueLabel="連絡がある"
                  falseLabel="連絡がない"
                />
              </div>
            </>
          )}

          {/* ── 共通: 状況の詳細・メールトーン ── */}
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
            className="w-full bg-slate-800 text-white py-3.5 rounded-xl text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <DiagnosisResult result={result} />
        </div>
      )}
    </div>
  );
}
