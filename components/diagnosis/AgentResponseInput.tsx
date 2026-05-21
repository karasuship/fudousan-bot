"use client";

import type { AgentResponse, AgentResponseType, FeeId2 } from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";
import { CheckboxGroup, FieldBlock, HelpText, Label, RadioGroup } from "./ui";

const RESPONSE_TYPE_OPTIONS: { value: AgentResponseType; label: string }[] = [
  { value: "written_basis", label: "根拠を書面で示してもらえた" },
  { value: "conclusion_only", label: "「問題ありません」とだけ言われた" },
  { value: "dimension_switch", label: "「違法ではありません」とだけ言われた" },
  { value: "internal_rule", label: "「社内基準で開示できない」と言われた" },
  { value: "no_reply_needed", label: "「回答する必要はない」と言われた" },
  { value: "partial_answer", label: "一部だけ答えた" },
  { value: "ignored", label: "無視された" },
  { value: "partial_discount", label: "一部費用を減額してきた" },
];

const CONTACT_METHOD_OPTIONS: { value: "email" | "line" | "verbal" | "letter"; label: string }[] = [
  { value: "email", label: "メール" },
  { value: "line", label: "LINE" },
  { value: "verbal", label: "口頭" },
  { value: "letter", label: "書面・郵便" },
];

const UNPROVIDED_DOC_OPTIONS: { value: AgentResponse["unprovidedDocuments"][number]; label: string }[] = [
  { value: "calculation_basis", label: "費用の算定根拠" },
  { value: "work_evidence", label: "作業実施の証明資料" },
  { value: "label_change_reason", label: "費用名目の変遷理由" },
  { value: "doc_inconsistency", label: "書類間の不整合の理由" },
  { value: "entity_explanation", label: "受領・領収書発行者の説明" },
  { value: "juusetsu_timing", label: "重説と費用受領の前後関係" },
];

interface Props {
  value: AgentResponse | null;
  onChange: (v: AgentResponse | null) => void;
  activeFeeIds: FeeId2[];
}

const DEFAULT_AGENT_RESPONSE: AgentResponse = {
  contacted: true,
  contactMethod: [],
  contactCount: null,
  monthsElapsed: null,
  responseTypes: [],
  discountedFees: [],
  unprovidedDocuments: [],
};

export default function AgentResponseInput({ value, onChange, activeFeeIds }: Props) {
  const contacted = value?.contacted ?? false;

  function handleContactedChange(v: "yes" | "no") {
    if (v === "no") {
      onChange(null);
    } else {
      onChange(value ?? DEFAULT_AGENT_RESPONSE);
    }
  }

  function set<K extends keyof AgentResponse>(key: K, v: AgentResponse[K]) {
    if (!value) return;
    onChange({ ...value, [key]: v });
  }

  const discountable = activeFeeIds.filter((id) =>
    value?.responseTypes.includes("partial_discount")
  );

  return (
    <div className="space-y-4">
      <FieldBlock>
        <Label>業者への確認・連絡をしましたか？</Label>
        <RadioGroup
          value={contacted ? "yes" : "no"}
          onChange={handleContactedChange}
          options={[
            { value: "yes" as const, label: "はい" },
            { value: "no" as const, label: "いいえ（まだしていない）" },
          ]}
        />
      </FieldBlock>

      {value && (
        <>
          <FieldBlock>
            <Label>連絡方法（複数選択可）</Label>
            <CheckboxGroup
              values={value.contactMethod ?? []}
              onChange={(v) => set("contactMethod", v)}
              options={CONTACT_METHOD_OPTIONS}
            />
          </FieldBlock>

          <FieldBlock>
            <Label>連絡回数</Label>
            <input
              type="number"
              min={1}
              value={value.contactCount ?? ""}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                set("contactCount", isNaN(n) ? null : n);
              }}
              placeholder="例: 2"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 w-28"
            />
          </FieldBlock>

          <FieldBlock>
            <Label>最初の確認から何ヶ月経ちますか？</Label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={value.monthsElapsed ?? ""}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                set("monthsElapsed", isNaN(n) ? null : n);
              }}
              placeholder="例: 1"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 w-28"
            />
            <HelpText>おおよその月数で構いません</HelpText>
          </FieldBlock>

          <FieldBlock>
            <Label>業者の回答の種類（複数選択可）</Label>
            <CheckboxGroup
              values={value.responseTypes}
              onChange={(v) => set("responseTypes", v as AgentResponseType[])}
              options={RESPONSE_TYPE_OPTIONS}
            />
          </FieldBlock>

          {value.responseTypes.includes("partial_discount") && activeFeeIds.length > 0 && (
            <FieldBlock>
              <Label>減額された費目（複数選択可）</Label>
              <CheckboxGroup
                values={value.discountedFees}
                onChange={(v) => set("discountedFees", v as FeeId2[])}
                options={activeFeeIds.map((id) => ({ value: id, label: FEE_LABEL[id] }))}
              />
            </FieldBlock>
          )}

          <FieldBlock>
            <Label>提示を求めたが出なかった資料（複数選択可）</Label>
            <CheckboxGroup
              values={value.unprovidedDocuments}
              onChange={(v) => set("unprovidedDocuments", v as AgentResponse["unprovidedDocuments"])}
              options={UNPROVIDED_DOC_OPTIONS}
            />
          </FieldBlock>
        </>
      )}
    </div>
  );
}
