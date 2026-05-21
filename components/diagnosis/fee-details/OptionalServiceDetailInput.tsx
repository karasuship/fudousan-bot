"use client";

import { useState } from "react";
import type { OptionalServiceDetail } from "@/lib/types_v2";
import { FieldBlock, Label, RadioGroup } from "../ui";
import MismatchSection from "./MismatchSection";

const BACKGROUND: Record<string, string> = {
  disinfection:
    "消毒・抗菌処理は不動産会社が提供するオプションサービスです。法律上、借主がこれを契約する義務はありません。断っても入居を断られることはありません。",
  support_24h:
    "24時間サポートとして請求される水漏れ・鍵トラブルの緊急対応は、加入予定の火災保険の付帯サービスと重複している場合があります。同じサービスに二重に払っている可能性があります。また法律上、断っても入居を断られることはありません。",
  admin_fee:
    "書類作成費・事務手数料という名目の費用について確認します。仲介業者が受け取れる報酬は原則として仲介手数料のみです。書類作成費として別途請求することは、仲介手数料の上限規制を実質的に回避している可能性があります。また法律上、断っても入居を断られることはありません。",
};

type Q1Choice = "yes" | "no" | "didnt_know_optional";
type Q2Choice = "accepted" | "rejected" | "assumed_mandatory";
type AdminJustification = "yes_with_detail" | "just_stated" | "no" | "assumed_included";
type MandatoryReason = "owner" | "company_rule" | "no_explanation";

interface Props {
  value: OptionalServiceDetail;
  onChange: (v: OptionalServiceDetail) => void;
}

export default function OptionalServiceDetailInput({ value, onChange }: Props) {
  const [q1, setQ1] = useState<Q1Choice | "">("");
  const [q2, setQ2] = useState<Q2Choice | "">("");
  const [adminJustification, setAdminJustification] = useState<AdminJustification | "">("");
  const [mandatoryReason, setMandatoryReason] = useState<MandatoryReason | "">("");

  const feeId = value.feeId;
  const bgText = BACKGROUND[feeId] ?? "";

  function handleQ1(v: Q1Choice) {
    setQ1(v);
    setQ2("");
    setMandatoryReason("");
    onChange({ ...value, deniedIfRefused: v === "yes" ? "no" : "unknown" });
  }

  function handleQ2(v: Q2Choice) {
    setQ2(v);
    const mapped =
      v === "rejected" ? "yes" : v === "assumed_mandatory" ? "nuance" : "no";
    onChange({ ...value, deniedIfRefused: mapped });
  }

  return (
    <div className="space-y-5">
      {/* 背景説明（費目別） */}
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">{bgText}</p>
      </div>

      {/* Q1: 断れることの説明 */}
      <FieldBlock>
        <Label>この費用を断れることの説明を受けましたか？</Label>
        <RadioGroup
          value={q1 || null}
          onChange={handleQ1}
          options={[
            { value: "yes" as Q1Choice, label: "断れると説明された" },
            { value: "no" as Q1Choice, label: "受けていない" },
            { value: "didnt_know_optional" as Q1Choice, label: "断れるとは思っていなかった" },
          ]}
        />
        {q1 === "yes" && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              自分で選んだ費用です。払う根拠があります。
            </p>
          </div>
        )}
        {(q1 === "no" || q1 === "didnt_know_optional") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              断れることを知らなかった場合、選択の機会が与えられていなかったことになります。これは宅建業者として借主への説明義務の観点から問題になり得ます。
            </p>
          </div>
        )}
      </FieldBlock>

      {/* Q2: 断ろうとしたか（Q1が"yes"以外の場合） */}
      {(q1 === "no" || q1 === "didnt_know_optional") && (
        <FieldBlock>
          <Label>断ろうとしたことがありますか？</Label>
          <RadioGroup
            value={q2 || null}
            onChange={handleQ2}
            options={[
              { value: "accepted" as Q2Choice, label: "断ったら認められた" },
              { value: "rejected" as Q2Choice, label: "断ったら認められなかった" },
              { value: "assumed_mandatory" as Q2Choice, label: "断れないと思って試していない" },
            ]}
          />
          {q2 === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
              <p className="text-xs text-red-700 font-medium leading-relaxed">
                ⚠ 任意費用を断ることを理由に契約を拒否することは、消費者の選択権を損なう可能性があります。
              </p>
            </div>
          )}
        </FieldBlock>
      )}

      {/* Q3: admin_fee 専用・仲介手数料との関係 */}
      {feeId === "admin_fee" && (q1 === "no" || q1 === "didnt_know_optional") && (
        <>
          <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-lg px-4 py-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              仲介手数料と書類作成費を合算すると賃料の何ヶ月分になりますか？1ヶ月分を超える場合、仲介報酬の上限規制との関係が問われます。
            </p>
          </div>
          <FieldBlock>
            <Label>仲介手数料とは別に書類作成費が請求される理由の説明を受けましたか？</Label>
            <RadioGroup
              value={adminJustification || null}
              onChange={setAdminJustification}
              options={[
                { value: "yes_with_detail" as AdminJustification, label: "具体的な業務内容の説明があった" },
                { value: "just_stated" as AdminJustification, label: "「事務手数料として必要です」とだけ言われた" },
                { value: "no" as AdminJustification, label: "説明がなかった" },
                { value: "assumed_included" as AdminJustification, label: "仲介手数料に含まれると思っていた" },
              ]}
            />
            {(adminJustification === "just_stated" ||
              adminJustification === "no" ||
              adminJustification === "assumed_included") && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                <p className="text-xs text-amber-700 leading-relaxed">
                  仲介手数料とは別に請求できる具体的な業務の根拠が必要です。根拠の説明を求めることができます。
                </p>
              </div>
            )}
          </FieldBlock>
        </>
      )}

      {/* Q4: 外せないと言われた場合の理由（Q2="rejected"のみ） */}
      {q2 === "rejected" && (
        <FieldBlock>
          <Label>なぜ外せないか説明されましたか？</Label>
          <RadioGroup
            value={mandatoryReason || null}
            onChange={setMandatoryReason}
            options={[
              { value: "owner" as MandatoryReason, label: "オーナーの契約条件と説明された" },
              { value: "company_rule" as MandatoryReason, label: "弊社の規定ですと言われた" },
              { value: "no_explanation" as MandatoryReason, label: "説明がなかった" },
            ]}
          />
          {mandatoryReason === "company_rule" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
              <p className="text-xs text-amber-700 leading-relaxed">
                社内規定は借主負担の根拠になりません。フリーレントでの調整を求めることができます。
              </p>
            </div>
          )}
        </FieldBlock>
      )}

      <MismatchSection />
    </div>
  );
}
