"use client";

import { useState } from "react";
import type { KeyExchangeDetail } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "../ui";
import MismatchSection from "./MismatchSection";

type Q1Choice = "yes" | "mandatory_stated" | "no_explanation" | "didnt_know_optional";
type MandatoryReason = "owner" | "company_rule" | "everyone_does" | "no_explanation";
type EvidenceChoice = "yes" | "requested_but_refused" | "not_requested";
type TimingChoice = "after" | "before" | "same_day" | "unknown";

interface Props {
  value: KeyExchangeDetail;
  onChange: (v: KeyExchangeDetail) => void;
}

export default function KeyExchangeDetailInput({ value, onChange }: Props) {
  const [q1, setQ1] = useState<Q1Choice | "">("");
  const [mandatoryReason, setMandatoryReason] = useState<MandatoryReason | "">("");
  const [evidenceChoice, setEvidenceChoice] = useState<EvidenceChoice | "">("");
  const [timingChoice, setTimingChoice] = useState<TimingChoice | "">("");

  function setEvidence(v: EvidenceChoice) {
    setEvidenceChoice(v);
    const mapped = v === "yes" ? "yes" : v === "requested_but_refused" ? "no" : "unknown";
    onChange({ ...value, hasEvidenceDocument: mapped });
  }

  function setTiming(v: TimingChoice) {
    setTimingChoice(v);
    if (v === "before") {
      onChange({ ...value, receivedDate: "2020-01-01", executedDate: "2020-01-02" });
    } else if (v === "after") {
      onChange({ ...value, receivedDate: "2020-01-02", executedDate: "2020-01-01" });
    } else if (v === "same_day") {
      onChange({ ...value, receivedDate: "2020-01-01", executedDate: "2020-01-01" });
    } else {
      onChange({ ...value, receivedDate: null, executedDate: null });
    }
  }

  return (
    <div className="space-y-5">
      {/* 背景説明 */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          鍵交換代は本来、大家さんが次の入居者のために行うべき費用です。前の入居者が退去したら鍵を変えるのは貸主の責任とされています。そのため借主に請求するには、誰の意向で・なぜ借主負担なのかの説明が必要です。
        </p>
      </div>

      {/* Q1: 任意説明（UI専用） */}
      <FieldBlock>
        <Label>鍵交換が任意であること（断れること）を説明されましたか？</Label>
        <RadioGroup
          value={q1 || null}
          onChange={(v) => { setQ1(v); setMandatoryReason(""); }}
          options={[
            { value: "yes" as Q1Choice, label: "断れると説明された" },
            { value: "mandatory_stated" as Q1Choice, label: "必須と言われた" },
            { value: "no_explanation" as Q1Choice, label: "説明がなかった" },
            { value: "didnt_know_optional" as Q1Choice, label: "断れるとは思っていなかった" },
          ]}
        />
        {(q1 === "no_explanation" || q1 === "didnt_know_optional") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              説明なしに請求することは、あなたの判断機会を奪っていた可能性があります。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q1-補足: 必須と言われた理由（UI専用） */}
      {q1 === "mandatory_stated" && (
        <FieldBlock>
          <Label>なぜ必須なのか説明されましたか？</Label>
          <RadioGroup
            value={mandatoryReason || null}
            onChange={(v) => setMandatoryReason(v)}
            options={[
              { value: "owner" as MandatoryReason, label: "オーナーの契約条件と説明された" },
              { value: "company_rule" as MandatoryReason, label: "弊社の規定ですと言われた" },
              { value: "everyone_does" as MandatoryReason, label: "みなさんそうしていますと言われた" },
              { value: "no_explanation" as MandatoryReason, label: "説明がなかった" },
            ]}
          />
          {(mandatoryReason === "company_rule" || mandatoryReason === "everyone_does") && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
              <p className="text-xs text-amber-700 leading-relaxed">
                社内規定や慣行は、借主が支払う根拠になりません。オーナーの契約条件でなければ、削除またはフリーレント転換を求めることができます。
              </p>
            </div>
          )}
        </FieldBlock>
      )}

      {/* Q2: 実施証明（前に背景説明） */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          外部に説明できない費用請求かどうかは以下の資料が揃っているかで判断できます：鍵交換の作業報告書、交換した鍵のメーカー・型番、シリンダーが新品であることの確認、業者への支払い領収書。これらを提示できない場合、外部に説明不可能な費用請求をしている状態です。
        </p>
      </div>

      <FieldBlock>
        <Label>鍵交換の実施を確認できる資料を受け取りましたか？</Label>
        <RadioGroup
          value={evidenceChoice || null}
          onChange={setEvidence}
          options={[
            { value: "yes" as EvidenceChoice, label: "受け取った" },
            { value: "requested_but_refused" as EvidenceChoice, label: "求めたが提示されなかった" },
            { value: "not_requested" as EvidenceChoice, label: "求めていない" },
          ]}
        />
        {evidenceChoice === "requested_but_refused" && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-red-700 font-medium leading-relaxed">
              ⚠ 資料の提示を求めたが断られた事実は重要な記録です。外部に説明できない費用請求の根拠として使えます。
            </p>
          </div>
        )}
        {evidenceChoice === "not_requested" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              資料の開示を求める権利があります。1通目のメールで開示を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q3: 支払いと実施の前後 */}
      <FieldBlock>
        <Label>費用を支払ったのと鍵交換が実施されたのはどちらが先ですか？</Label>
        <RadioGroup
          value={timingChoice || null}
          onChange={setTiming}
          options={[
            { value: "after" as TimingChoice, label: "実施後に支払った" },
            { value: "before" as TimingChoice, label: "支払後に実施された" },
            { value: "same_day" as TimingChoice, label: "同じ日" },
            { value: "unknown" as TimingChoice, label: "わからない" },
          ]}
        />
        {timingChoice === "before" && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-red-700 font-medium leading-relaxed">
              ⚠ 実施前に費用を受領しています。役務が完了する前に対価を受領することは、費用の正当性を確認する機会を奪っていることになります。
            </p>
          </div>
        )}
        {timingChoice === "unknown" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              支払時点で鍵交換は完了していましたか？入居時に新しい鍵を渡されたか確認してみてください。
            </p>
          </div>
        )}
      </FieldBlock>

      <MismatchSection />
    </div>
  );
}
