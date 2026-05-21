"use client";

import type { GuarantorDetail2 } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "../ui";
import MismatchSection from "./MismatchSection";

type YNU = "yes" | "no" | "unknown";

interface Props {
  value: GuarantorDetail2;
  onChange: (v: GuarantorDetail2) => void;
}

export default function GuarantorDetailInput({ value, onChange }: Props) {
  function set<K extends keyof GuarantorDetail2>(key: K, v: GuarantorDetail2[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-5">
      {/* 背景説明 */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          保証会社の利用を義務とすること自体は認められています。問題は2つあります。1つ目：複数の保証会社から選べるのに選択機会を与えられていない可能性。2つ目：保証会社と管理会社・仲介会社がグループ会社の場合、業者側に手数料収入が入る構造があります。この利益相反関係には説明義務があります。
        </p>
      </div>

      {/* Q1: 複数社の選択説明 */}
      <FieldBlock>
        <Label>複数の保証会社から選べると説明されましたか？</Label>
        <RadioGroup
          value={value.companyChoiceExplained}
          onChange={(v) => set("companyChoiceExplained", v)}
          options={[
            { value: "yes" as YNU, label: "選択肢があると説明された" },
            { value: "no" as YNU, label: "受けていない" },
            { value: "unknown" as YNU, label: "選択肢があるとは思っていなかった" },
          ]}
        />
        {(value.companyChoiceExplained === "no" || value.companyChoiceExplained === "unknown") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              選択機会を与えられていない場合、指定会社しか選べない根拠の説明を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q2: グループ会社説明（前に背景説明） */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          グループ会社の場合、保証料の一部が仲介会社にバックされる構造があります。この利益相反関係は説明義務があります。
        </p>
      </div>

      <FieldBlock>
        <Label>保証会社と管理会社・仲介会社がグループ会社かどうかの説明がありましたか？</Label>
        <RadioGroup
          value={value.groupCompanyExplained}
          onChange={(v) => set("groupCompanyExplained", v)}
          options={[
            { value: "yes" as YNU, label: "説明された（グループ会社ではないと言われた）" },
            { value: "no" as YNU, label: "説明がなかった" },
            { value: "unknown" as YNU, label: "確認したらグループ会社だとわかった" },
          ]}
        />
        {value.groupCompanyExplained === "unknown" && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-red-700 font-medium leading-relaxed">
              ⚠ グループ会社であることを説明せずに指定した場合、利益相反の未開示として行政的観点から問題になり得ます。
            </p>
          </div>
        )}
        {value.groupCompanyExplained === "no" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              グループ関係の有無について説明を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q3: 継続更新料（前に背景説明） */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          保証会社費用は初回だけでなく毎年継続更新料が発生する場合があります。入居時に説明されていない場合、将来の費用負担について判断機会を奪われていたことになります。
        </p>
      </div>

      <FieldBlock>
        <Label>毎年発生する継続更新料について説明がありましたか？</Label>
        <RadioGroup
          value={value.renewalFeeExplained}
          onChange={(v) => set("renewalFeeExplained", v)}
          options={[
            { value: "yes" as YNU, label: "金額も含めて説明された" },
            { value: "no" as YNU, label: "説明がなかった" },
            { value: "unknown" as YNU, label: "更新料が発生するとは知らなかった" },
          ]}
        />
        {(value.renewalFeeExplained === "no" || value.renewalFeeExplained === "unknown") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              継続更新料の説明がない場合、将来コストを判断できなかったことになります。金額と根拠の説明を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      <MismatchSection />
    </div>
  );
}
