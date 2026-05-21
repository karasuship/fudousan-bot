"use client";

import type { AgencyFeeDetail } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "../ui";
import MismatchSection from "./MismatchSection";

type YNU = "yes" | "no" | "unknown";
const YNU_OPTIONS: { value: YNU; label: string }[] = [
  { value: "yes", label: "はい" },
  { value: "no", label: "いいえ" },
  { value: "unknown", label: "わからない" },
];

interface Props {
  value: AgencyFeeDetail;
  onChange: (v: AgencyFeeDetail) => void;
}

export default function AgencyFeeDetailInput({ value, onChange }: Props) {
  function set<K extends keyof AgencyFeeDetail>(key: K, v: AgencyFeeDetail[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-5">
      {/* 背景説明 */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          不動産屋はあなた（借主）と大家さん（貸主）の両方から手数料をもらえる仕組みになっています。あなたから0.5ヶ月分、大家さんからも0.5ヶ月分。合計で1ヶ月分の収入が成立します。つまり、あなたから1ヶ月分もらわなくても不動産屋の収入は十分に成り立っています。それでも1ヶ月分を請求するにはあなたが書面で承諾した記録が必要です。「みなさんそうしています」は理由になりません。
        </p>
      </div>

      {/* Q1: 請求額 */}
      <FieldBlock>
        <Label>請求額は賃料の何ヶ月分ですか？</Label>
        <RadioGroup
          value={value.amountMonths}
          onChange={(v) => set("amountMonths", v)}
          options={[
            { value: "half" as const, label: "0.5ヶ月分以下" },
            { value: "one" as const, label: "1ヶ月分まで（税込1.1ヶ月以下）" },
            { value: "over" as const, label: "1ヶ月分を超えている（税込1.1ヶ月超）" },
            { value: "unknown" as const, label: "わからない" },
          ]}
        />
        {value.amountMonths === "over" && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-red-700 font-medium leading-relaxed">
              ⚠ 1ヶ月分を超える請求は原則として認められません。まずその根拠の説明を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q2: 原則説明 */}
      <FieldBlock>
        <Label>仲介手数料の原則が0.5ヶ月分であることを説明されましたか？</Label>
        <RadioGroup
          value={value.principleExplained}
          onChange={(v) => set("principleExplained", v)}
          options={YNU_OPTIONS}
        />
        {value.principleExplained === "no" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              この説明がなければ、1ヶ月分への承諾があっても何に同意したかわからないままサインしていることになります。承諾の有効性が問われる状態です。
            </p>
          </div>
        )}
        {value.principleExplained === "yes" && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              説明があったことは重要です。次に、承諾の手続きを確認します。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q3: 書面承諾 */}
      <FieldBlock>
        <Label>0.5ヶ月分を超える場合、書面による承諾を求められましたか？</Label>
        <RadioGroup
          value={value.writtenConsentRequested}
          onChange={(v) => set("writtenConsentRequested", v)}
          options={[
            { value: "yes" as YNU, label: "書面への署名を求められた" },
            { value: "no" as YNU, label: "求められていない" },
            { value: "unknown" as YNU, label: "書類が多くて気づかなかったかもしれない" },
          ]}
        />
        {(value.writtenConsentRequested === "no" || value.writtenConsentRequested === "unknown") &&
          value.principleExplained === "no" && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
              <p className="text-xs text-red-700 font-medium leading-relaxed">
                ⚠ 原則の説明もなく書面承諾もない状態での1ヶ月分請求は、宅建業者として説明義務を果たしていない可能性があります。
              </p>
            </div>
          )}
      </FieldBlock>

      {/* Q4: 貸主側報酬（前に背景説明） */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          仲介業者は借主・貸主の両方から仲介手数料を受け取ることができます。ただし合算で賃料1ヶ月分が上限です。あなたから1ヶ月分を受け取っている場合、貸主からは受け取っていないはずです。貸主からも仲介手数料を受け取っていれば合計が上限を超える可能性があります。
        </p>
      </div>

      <FieldBlock>
        <Label>大家さん（貸主）からも手数料や広告料（AD）を受け取っていると説明されましたか？</Label>
        <RadioGroup
          value={value.landlordFeeExplained}
          onChange={(v) => set("landlordFeeExplained", v)}
          options={[
            { value: "yes" as YNU, label: "受け取っていないと説明された" },
            { value: "no" as YNU, label: "説明がなかった・確認していない" },
            { value: "unknown" as YNU, label: "わからない" },
          ]}
        />
        {value.landlordFeeExplained === "no" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              貸主側報酬の有無は説明義務があります。確認を求めることができます。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q5: 再契約 */}
      <FieldBlock>
        <Label>今回は同じ物件への再契約ですか？</Label>
        <div className="flex gap-2">
          {([{ v: true, label: "はい" }, { v: false, label: "いいえ" }] as const).map(({ v, label }) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => set("isRenewal", v)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all whitespace-nowrap ${
                value.isRenewal === v
                  ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </FieldBlock>

      {/* Q5-1: 仲介行為（isRenewal=true のみ） */}
      {value.isRenewal && (
        <>
          <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              同じ物件に住み続けているだけなのに新たに仲介手数料を請求されている場合、新たな仲介行為（物件案内・条件交渉等）がなければ手数料の根拠が問われます。
            </p>
          </div>
          <FieldBlock>
            <Label>今回、新たな物件案内・条件交渉等の仲介行為がありましたか？</Label>
            <RadioGroup
              value={value.newBrokerageActExists ?? null}
              onChange={(v) => set("newBrokerageActExists", v)}
              options={[
                { value: "yes" as YNU, label: "あった" },
                { value: "no" as YNU, label: "なかった（同じ部屋に住み続けるだけ）" },
                { value: "unknown" as YNU, label: "わからない" },
              ]}
            />
            {value.newBrokerageActExists === "no" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                <p className="text-xs text-amber-700 leading-relaxed">
                  新たな仲介行為がない場合、仲介手数料の役務の実体が問われる状態です。
                </p>
              </div>
            )}
          </FieldBlock>
        </>
      )}

      <MismatchSection />
    </div>
  );
}
