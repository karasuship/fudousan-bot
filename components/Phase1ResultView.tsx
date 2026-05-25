"use client";

import { useState } from "react";
import { Phase1Result, FeeId } from "@/lib/types";

const FEE_LABELS: Record<FeeId, string> = {
  cleaning: "消毒・消臭費",
  support24: "24時間サポート",
  key: "鍵交換代",
  adminFee: "契約事務手数料",
  guarantee: "保証会社利用料",
  insurance: "火災保険",
  brokerage: "仲介手数料",
  keyMoney: "礼金",
  other: "その他",
};

const OBJECTIONS = [
  {
    q: "「特約に書いてあるので有効です」",
    a: "書いてあることと、任意と説明したことは別問題です。",
  },
  {
    q: "「署名しているので同意済みです」",
    a: "署名は任意性の説明があった証明にはなりません。",
  },
  {
    q: "「業界の慣行です」",
    a: "慣行は支払義務の根拠になりません。",
  },
];

interface Props {
  result: Phase1Result;
  onPhase2: () => void;
  onReset: () => void;
}

export default function Phase1ResultView({ result, onPhase2, onReset }: Props) {
  const [objOpen, setObjOpen] = useState(false);

  const { verdict, userPhase, strongPoints, nextAction, estimatedAmount } = result;
  const feeNames = strongPoints.map((f) => FEE_LABELS[f]).join("・");

  return (
    <div className="space-y-6">
      {/* 結論バナー */}
      {verdict === "weak" ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            診断結果
          </p>
          <p className="text-xl font-bold text-slate-800">
            現時点では論点が弱い状態です
          </p>
        </div>
      ) : userPhase === "C" ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
            診断結果
          </p>
          <p className="text-xl font-bold text-green-900">
            {estimatedAmount > 0
              ? `約${estimatedAmount.toLocaleString()}円を取り戻せる可能性があります`
              : "費用を取り戻せる可能性があります"}
          </p>
          {feeNames && (
            <p className="text-sm text-green-800 mt-2">
              対象：{feeNames}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
            診断結果
          </p>
          <p className="text-xl font-bold text-amber-900">
            この費用は払わなくていい可能性が高いです
          </p>
          {feeNames && (
            <p className="text-sm text-amber-800 mt-2">
              対象：{feeNames}
            </p>
          )}
        </div>
      )}

      {/* 次の一手 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-500 mb-2">次の一手</p>
        <p className="text-sm text-slate-700 leading-relaxed">{nextAction}</p>
      </div>

      {/* 弱い場合の再診断 */}
      {verdict === "weak" && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            確認できたら再診断してください。論点が強くなる可能性があります。
          </p>
          <button
            type="button"
            onClick={onReset}
            className="w-full bg-slate-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-slate-600 transition-colors"
          >
            再診断する
          </button>
        </div>
      )}

      {/* strongまたはmoderate：不動産屋の反論 + CTA */}
      {verdict !== "weak" && (
        <>
          {/* 不動産屋はこう言うかもしれません */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setObjOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span>不動産屋はこう言うかもしれません</span>
              <span className="text-slate-400">{objOpen ? "▲" : "▼"}</span>
            </button>
            {objOpen && (
              <div className="px-4 py-3 space-y-3 bg-white">
                {OBJECTIONS.map((obj, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-slate-700">
                      → {obj.q}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5 pl-3">
                      {obj.a}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 有料CTA */}
          <div className="bg-blue-900 text-white rounded-2xl p-5 space-y-3">
            <p className="text-base font-bold">
              {userPhase === "C"
                ? "具体的な返金・相殺の文面を作る"
                : "具体的な文面を作る"}
            </p>
            <p className="text-sm text-blue-200 leading-relaxed">
              相手の出方に合わせた3ラリー分の文面を生成します。断定せず、相手が返しやすい形で出すことで合意率が上がります。
            </p>
            <button
              type="button"
              onClick={onPhase2}
              className="w-full bg-white text-blue-900 py-3 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              文面を生成する（¥980）
            </button>
          </div>
        </>
      )}
    </div>
  );
}
