"use client";

import type { KeyMoneyDetail } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "../ui";
import MismatchSection from "./MismatchSection";

interface Props {
  value: KeyMoneyDetail;
  onChange: (v: KeyMoneyDetail) => void;
}

export default function KeyMoneyDetailInput({ value, onChange }: Props) {
  function set<K extends keyof KeyMoneyDetail>(key: K, v: KeyMoneyDetail[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-5">
      {/* 背景説明 */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          礼金は法律上の根拠がない慣行です。返還されません。重要なのは誰が設定した条件かです。オーナーが設定した条件であれば交渉の余地はオーナー次第です。仲介会社が設定した条件であれば交渉・削除の余地があります。また礼金がある物件でクリーニング代も請求される場合、二重取りの根拠説明が必要です。
        </p>
      </div>

      {/* Q1: sourceExplained */}
      <FieldBlock>
        <Label>礼金がオーナーの条件か仲介会社の条件かの説明がありましたか？</Label>
        <RadioGroup
          value={value.sourceExplained}
          onChange={(v) => set("sourceExplained", v)}
          options={[
            { value: "owner" as const, label: "オーナーの条件と説明された" },
            { value: "agent" as const, label: "仲介会社の条件と説明された" },
            { value: "no_explanation" as const, label: "説明がなかった" },
            { value: "unknown" as const, label: "わからない" },
          ]}
        />
        {value.sourceExplained === "agent" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              仲介会社の条件であれば、削除またはフリーレント転換を交渉できます。
            </p>
          </div>
        )}
        {(value.sourceExplained === "no_explanation" || value.sourceExplained === "unknown") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              誰の意向かを確認することが交渉の第一歩です。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q2: negotiationAttempt */}
      <FieldBlock>
        <Label>礼金について交渉やフリーレントへの転換を試みましたか？</Label>
        <RadioGroup
          value={value.negotiationAttempt}
          onChange={(v) => set("negotiationAttempt", v)}
          options={[
            { value: "accepted" as const, label: "提案したら応じてもらえた" },
            { value: "rejected" as const, label: "提案したが断られた" },
            { value: "not_tried" as const, label: "まだ試みていない" },
            { value: "didnt_know" as const, label: "交渉できるとは思っていなかった" },
          ]}
        />
        {(value.negotiationAttempt === "not_tried" || value.negotiationAttempt === "didnt_know") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              礼金はフリーレント（家賃無料期間）への転換を提案できる場合があります。同額を家賃無料期間として調整することを提案できます。
            </p>
          </div>
        )}
        {value.negotiationAttempt === "rejected" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              断られた理由の説明があったか記録しておいてください。オーナーが応じないという説明があれば、交渉の限界が確認できた状態です。
            </p>
          </div>
        )}
      </FieldBlock>

      <MismatchSection />
    </div>
  );
}
