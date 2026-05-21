"use client";

import type { FireInsuranceDetail } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "../ui";
import MismatchSection from "./MismatchSection";

type YNU = "yes" | "no" | "unknown";

interface Props {
  value: FireInsuranceDetail;
  onChange: (v: FireInsuranceDetail) => void;
}

export default function FireInsuranceDetailInput({ value, onChange }: Props) {
  function set<K extends keyof FireInsuranceDetail>(key: K, v: FireInsuranceDetail[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-5">
      {/* 背景説明 */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          火災保険への加入を義務とすること自体は認められています。問題は指定プランしか選べないという説明です。借主が自分で選んだ保険会社のプランに加入することは本来認められています。また保険会社と仲介会社が代理店関係にある場合、業者側に手数料収入（コミッション）が入る構造があります。
        </p>
      </div>

      {/* Q1: 他社プランの選択説明 */}
      <FieldBlock>
        <Label>自分で選んだ他社の保険プランに加入できると説明されましたか？</Label>
        <RadioGroup
          value={value.otherPlanChoiceExplained}
          onChange={(v) => set("otherPlanChoiceExplained", v)}
          options={[
            { value: "yes" as YNU, label: "他社でも可と説明された" },
            { value: "no" as YNU, label: "受けていない" },
            { value: "unknown" as YNU, label: "他社を選べるとは思っていなかった" },
          ]}
        />
        {(value.otherPlanChoiceExplained === "no" || value.otherPlanChoiceExplained === "unknown") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              他社プランを選べることは説明義務があります。必要な補償内容を確認した上で、他社プランへの変更を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q2: 代理店関係の説明 */}
      <FieldBlock>
        <Label>保険会社と仲介会社・管理会社が代理店関係にあるかどうかの説明がありましたか？</Label>
        <RadioGroup
          value={value.agentRelationshipExplained}
          onChange={(v) => set("agentRelationshipExplained", v)}
          options={[
            { value: "yes" as YNU, label: "説明された（代理店ではないと言われた）" },
            { value: "no" as YNU, label: "説明がなかった" },
            { value: "unknown" as YNU, label: "確認したら代理店だとわかった" },
          ]}
        />
        {value.agentRelationshipExplained === "unknown" && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-red-700 font-medium leading-relaxed">
              ⚠ 代理店関係を説明せずに指定した場合、利益相反の未開示として問題になり得ます。
            </p>
          </div>
        )}
        {value.agentRelationshipExplained === "no" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              代理店関係の有無について説明を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q3: 最低補償内容の説明 */}
      <FieldBlock>
        <Label>貸主が求める最低限の補償内容（借家人賠償責任・家財等）について説明がありましたか？</Label>
        <RadioGroup
          value={value.amountBasisExplained}
          onChange={(v) => set("amountBasisExplained", v)}
          options={[
            { value: "yes" as YNU, label: "必要な補償内容を具体的に説明された" },
            { value: "no" as YNU, label: "「このプランで大丈夫です」とだけ言われた" },
            { value: "unknown" as YNU, label: "説明がなかった" },
          ]}
        />
        {(value.amountBasisExplained === "no" || value.amountBasisExplained === "unknown") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              必要な補償内容がわかれば自分で保険会社を探せます。補償内容の明示を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      <MismatchSection />
    </div>
  );
}
