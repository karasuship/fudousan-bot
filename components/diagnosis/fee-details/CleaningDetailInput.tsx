"use client";

import { useState } from "react";
import type { CleaningDetail } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "../ui";
import MismatchSection from "./MismatchSection";

type YNU = "yes" | "no" | "unknown";
const YNU_OPTIONS: { value: YNU; label: string }[] = [
  { value: "yes", label: "はい" },
  { value: "no", label: "いいえ" },
  { value: "unknown", label: "わからない" },
];

type SecurityDeposit = "yes" | "no";
type SecurityRelation = "yes" | "just_stated" | "no" | "didnt_think";
type PrevCleaning = "yes" | "no" | "asked_dont_know";

interface Props {
  value: CleaningDetail;
  onChange: (v: CleaningDetail) => void;
}

export default function CleaningDetailInput({ value, onChange }: Props) {
  const [hasSecurity, setHasSecurity] = useState<SecurityDeposit | "">("");
  const [securityRelation, setSecurityRelation] = useState<SecurityRelation | "">("");
  const [prevCleaning, setPrevCleaning] = useState<PrevCleaning | "">("");

  function set<K extends keyof CleaningDetail>(key: K, v: CleaningDetail[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-5">
      {/* 背景説明 */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          クリーニング費用は本来、大家さん（貸主）が負担するものが原則です。借主に負担させるには、誰の意向でなぜ借主負担なのかの説明が必要です。
        </p>
      </div>

      {/* Q0: 敷金（UI専用） */}
      <FieldBlock>
        <Label>敷金を預けていますか？</Label>
        <RadioGroup
          value={hasSecurity || null}
          onChange={(v) => { setHasSecurity(v); setSecurityRelation(""); }}
          options={[
            { value: "yes" as SecurityDeposit, label: "はい" },
            { value: "no" as SecurityDeposit, label: "いいえ" },
          ]}
        />
      </FieldBlock>

      {hasSecurity === "yes" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-700 leading-relaxed">
            敷金は退去時の清掃・修繕の担保です。入居時にもクリーニング代を取るなら、入居時と退去時それぞれの根拠説明が必要です。また礼金がある場合、なぜさらにクリーニング代が必要なのかも確認が必要です。
          </p>
        </div>
      )}

      {/* Q0-1: 敷金との関係（UI専用・敷金ありの場合のみ） */}
      {hasSecurity === "yes" && (
        <FieldBlock>
          <Label>入居時クリーニング代と退去時クリーニング代の関係について説明がありましたか？</Label>
          <RadioGroup
            value={securityRelation || null}
            onChange={setSecurityRelation}
            options={[
              { value: "yes" as SecurityRelation, label: "それぞれの根拠を説明された" },
              { value: "just_stated" as SecurityRelation, label: "「入居時は別です」とだけ言われた" },
              { value: "no" as SecurityRelation, label: "説明がなかった" },
              { value: "didnt_think" as SecurityRelation, label: "敷金との関係を考えたことがなかった" },
            ]}
          />
          {(securityRelation === "just_stated" || securityRelation === "no" || securityRelation === "didnt_think") && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
              <p className="text-xs text-amber-700 leading-relaxed">
                敷金を預けながら入居時にもクリーニング代を取るなら、その根拠の説明が必要です。
              </p>
            </div>
          )}
        </FieldBlock>
      )}

      {/* timingExplained: 入居前か退去時かのタイミング説明 */}
      <FieldBlock>
        <Label>入居前クリーニングか退去時クリーニングか、タイミングの説明がありましたか？</Label>
        <RadioGroup
          value={value.timingExplained}
          onChange={(v) => set("timingExplained", v)}
          options={YNU_OPTIONS}
        />
        {value.timingExplained === "no" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              入居前か退去時かがわからない場合、費用の性質と返還可能性を判断できません。説明を求める権利があります。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* amountBasisExplained: 金額根拠 */}
      <FieldBlock>
        <Label>金額の根拠・内訳の説明がありましたか？</Label>
        <RadioGroup
          value={value.amountBasisExplained}
          onChange={(v) => set("amountBasisExplained", v)}
          options={YNU_OPTIONS}
        />
        {value.amountBasisExplained === "no" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              金額の算定根拠が不明な場合、適正価格かどうかを判断できません。内訳の提示を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* vendorInfoProvided: 業者名・実施日（前に背景説明） */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          以下が揃っていない場合、外部に説明不可能な費用請求です：クリーニング業者名・実施日、クリーニングの範囲・内容、業者への支払い領収書（金額の根拠）。
        </p>
      </div>

      <FieldBlock>
        <Label>業者名・実施日の提示がありましたか？</Label>
        <RadioGroup
          value={value.vendorInfoProvided}
          onChange={(v) => set("vendorInfoProvided", v)}
          options={[
            { value: "yes" as YNU, label: "受け取った" },
            { value: "no" as YNU, label: "求めたが提示されなかった" },
            { value: "unknown" as YNU, label: "求めていない" },
          ]}
        />
        {value.vendorInfoProvided === "no" && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-red-700 font-medium leading-relaxed">
              ⚠ 資料の提示を求めたが断られた事実は重要な記録です。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q3: 前入居者のクリーニング（UI専用） */}
      <FieldBlock>
        <Label>前の入居者の退去時にクリーニングが実施されたか説明がありましたか？</Label>
        <RadioGroup
          value={prevCleaning || null}
          onChange={setPrevCleaning}
          options={[
            { value: "yes" as PrevCleaning, label: "実施済みと説明された" },
            { value: "no" as PrevCleaning, label: "説明がなかった" },
            { value: "asked_dont_know" as PrevCleaning, label: "確認したがわからないと言われた" },
          ]}
        />
        {(prevCleaning === "no" || prevCleaning === "asked_dont_know") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              前の入居者が退去時にクリーニング代を負担していれば、入居前はすでにきれいな状態のはずです。それでも入居時に取るなら追加の根拠が必要です。
            </p>
          </div>
        )}
      </FieldBlock>

      <MismatchSection />
    </div>
  );
}
