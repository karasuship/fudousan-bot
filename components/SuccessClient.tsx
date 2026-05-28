"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DiagnosisResult } from "@/lib/types";
import type { DiagnosisResult2, ContractTiming, FeeEntry, PreContractContext } from "@/lib/types_v2";
import CopyButton from "./CopyButton";

const V2_STORAGE_KEY = "rental_diagnosis_v2";
const V1_STORAGE_KEY = "rental_diagnosis_result_v1";

interface V2StoredData {
  result: DiagnosisResult2;
  timing: ContractTiming;
  stage: string;
  fees: FeeEntry[];
  preContractContext?: PreContractContext;
  savedAt: string;
}

interface Props {
  paid: boolean;
  timing?: string;
  stage?: string;
}

// ─── 業者返答パターン ─────────────────────────────────────────────────────────

const RESPONSE_PATTERNS = [
  { response: "「問題ありません」", action: "何が問題ないかの根拠を書面で求める" },
  { response: "「弊社の規定です」", action: "規定の文書開示を求める" },
  { response: "「一般的な費用です」", action: "算定根拠を書面で求める" },
  { response: "「特約に書いてあります」", action: "借主負担にする根拠を求める" },
  { response: "返信なし・無視", action: "送信記録を保存する。行政窓口への相談材料になる" },
];

const PRE_CONTRACT_RESPONSE_PATTERNS = [
  { response: "「問題ありません」",       action: "何が問題ないかの根拠を書面で求める" },
  { response: "「弊社の規定です」",       action: "規定の文書開示を求める" },
  { response: "「一般的な費用です」",     action: "算定根拠を書面で求める" },
  { response: "「特約に書いてあります」", action: "借主負担にする根拠を求める" },
  { response: "「貸主の意向です」",       action: "貸主に直接確認したい旨を伝える" },
  { response: "返信なし・無視",           action: "送信記録を保存する。行政窓口への相談材料になる" },
];

// ─── コンポーネント ───────────────────────────────────────────────────────────

export default function SuccessClient({ paid, timing: propTiming, stage: propStage }: Props) {
  const [v2Data, setV2Data] = useState<V2StoredData | null>(null);
  const [v1Result, setV1Result] = useState<DiagnosisResult | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailText, setEmailText] = useState<string>("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [agentReply, setAgentReply] = useState<string>("");
  const [followupType, setFollowupType] = useState<"competitive" | "evidence" | null>(null);
  const [followupEmail, setFollowupEmail] = useState<string>("");
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupError, setFollowupError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!paid) return;

    // V2データを優先して読み込む
    try {
      const raw = localStorage.getItem(V2_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as V2StoredData;
        if (parsed.result && parsed.timing) {
          setV2Data(parsed);
          return;
        }
      }
    } catch {
      // V2読み込み失敗 → V1にフォールバック
    }

    // V1フォールバック
    try {
      const raw = localStorage.getItem(V1_STORAGE_KEY);
      if (!raw) { setStorageError(true); return; }
      const parsed = JSON.parse(raw) as DiagnosisResult;
      if (!parsed.draftEmail || !parsed.overallRisk) { setStorageError(true); return; }
      setV1Result(parsed);
      setEmailText(parsed.draftEmail ?? "");
    } catch {
      setStorageError(true);
    }
  }, [paid]);

  useEffect(() => {
    if (!v2Data) return;
    setEmailLoading(true);
    fetch("/api/generate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result: v2Data.result,
        timing: v2Data.timing,
        stage: v2Data.stage,
        fees: v2Data.fees,
        emailTone: "polite",
        preContractContext: v2Data.preContractContext,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.draftEmail) setEmailText(data.draftEmail);
        else setEmailError("メールの生成に失敗しました");
        if (data.explanation) setExplanation(data.explanation);
      })
      .catch(() => setEmailError("メールの生成に失敗しました"))
      .finally(() => setEmailLoading(false));
  }, [v2Data]);

  // timing/stage: props（Stripe metadata）→ localStorage → "unknown"
  const resolvedTiming: string =
    propTiming || v2Data?.timing || "unknown";
  const isPreContract = resolvedTiming === "pre_contract";

  async function handleGenerateFollowup(type: "competitive" | "evidence") {
    if (!agentReply.trim() || !emailText) return;
    setFollowupType(type);
    setFollowupLoading(true);
    setFollowupError(null);
    setFollowupEmail("");
    try {
      const res = await fetch("/api/generate-email-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timing: resolvedTiming,
          previousEmail: emailText,
          agentReply: agentReply.trim(),
          followupType: type,
          fees: v2Data?.fees ?? [],
        }),
      });
      const data = await res.json();
      if (data.draftEmail) {
        setFollowupEmail(data.draftEmail);
      } else {
        setFollowupError("2通目の生成に失敗しました");
      }
    } catch {
      setFollowupError("2通目の生成に失敗しました");
    } finally {
      setFollowupLoading(false);
    }
  }

  // SSR hydrationミスマッチ防止
  if (!mounted) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-400">確認中...</p>
      </div>
    );
  }

  // 支払い未確認
  if (!paid) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-800 mb-2">購入状態を確認できませんでした</h1>
        <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
          支払いが完了していないか、セッションの有効期限が切れている可能性があります。
          お手数ですが、診断ページから再度お試しください。
        </p>
        <Link
          href="/diagnosis"
          className="inline-flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          診断ページへ戻る
        </Link>
      </div>
    );
  }

  // 支払い済みだがデータなし
  if (storageError || (!v2Data && !v1Result)) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="font-semibold text-green-800">決済が完了しました</h1>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <p className="text-sm text-amber-700 leading-relaxed">
            <strong>メール文案の元データが見つかりませんでした。</strong><br />
            お手数ですが、もう一度診断を行ってください。
          </p>
          <p className="text-xs text-amber-500 mt-2">
            ブラウザのデータが消えた可能性があります。ご不便をおかけして申し訳ありません。
          </p>
        </div>
        <Link
          href="/diagnosis"
          className="block text-center bg-slate-800 text-white text-sm font-medium py-3 rounded-xl hover:bg-slate-700 transition-colors"
        >
          もう一度診断する
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ブロック1：決済完了 */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="font-semibold text-green-800">決済が完了しました</h1>
        </div>
      </div>

      {/* ブロック2：メール文面 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">確認メール全文</h2>
          <CopyButton text={emailText} label="全文コピー" />
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 min-h-[80px] flex items-start">
          {emailLoading ? (
            <p className="text-sm text-slate-500">メールを生成中...</p>
          ) : emailError ? (
            <p className="text-sm text-red-500">{emailError}</p>
          ) : (
            <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
              {emailText}
            </pre>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          ※「（お名前）」「（物件情報）」の部分をご自身の情報に書き換えてからご使用ください。
        </p>
      </div>

      {/* 解説ブロック（契約前・explanationがある場合） */}
      {explanation && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setExplanationOpen((o) => !o)}
            className="w-full px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 select-none text-left flex items-center justify-between"
          >
            <span>このメールの解説を読む</span>
            <span className="text-slate-400 text-xs">{explanationOpen ? "▲" : "▼"}</span>
          </button>
          {explanationOpen && (
            <div className="px-4 pb-4 pt-2">
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                {explanation}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ブロック3：送る前に知っておくこと（契約前のみ） */}
      {isPreContract && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-800 leading-relaxed">
            このメールは費用の根拠確認を目的としています。<br />
            送ることで記録が始まります。<br />
            相手の返答がどうであれ、それ自体が記録になります。
          </p>
        </div>
      )}

      {/* ブロック4：業者の返答パターン（折りたたみ） */}
      <details className="rounded-xl border border-slate-200 overflow-hidden">
        <summary className="px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 select-none">
          業者がこう返してきたら？
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-2">
          {(isPreContract ? PRE_CONTRACT_RESPONSE_PATTERNS : RESPONSE_PATTERNS).map((p) => (
            <div key={p.response} className="text-xs text-slate-600 leading-relaxed">
              <span className="font-medium text-slate-700">{p.response}</span>
              <span className="text-slate-400"> → </span>
              {p.action}
            </div>
          ))}
        </div>
      </details>

      {/* 2通目メール生成 */}
      {emailText && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-700">業者から返信が来たら</p>
            <p className="text-xs text-slate-500 mt-0.5">返信内容を貼り付けて、次のメールを生成します</p>
          </div>
          <div className="px-4 py-4 space-y-4">
            <textarea
              value={agentReply}
              onChange={(e) => setAgentReply(e.target.value)}
              placeholder="業者からの返信をここに貼り付けてください"
              className="w-full h-32 text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-700"
            />
            {agentReply.trim() && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-blue-800">他社でも同じ物件を取れますか？</p>
                <p className="text-xs text-blue-700">
                  SUUMO・HOMES・athomeで物件名または住所を検索して、
                  複数の業者が掲載していれば他社でも申し込めます。
                  1社しか掲載されていなければ専任の可能性が高いです。
                </p>
              </div>
            )}
            {agentReply.trim() && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleGenerateFollowup("competitive")}
                  disabled={followupLoading}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    !followupLoading
                      ? "bg-blue-900 text-white hover:bg-blue-800"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {followupLoading && followupType === "competitive"
                    ? "生成中..."
                    : "他社でも掲載されていた → 競合メールを作る"}
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateFollowup("evidence")}
                  disabled={followupLoading}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    !followupLoading
                      ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                      : "border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {followupLoading && followupType === "evidence"
                    ? "生成中..."
                    : "1社のみだった → 根拠・条件改善を求めるメールを作る"}
                </button>
              </div>
            )}
            {followupError && (
              <p className="text-xs text-red-500">{followupError}</p>
            )}
          </div>
        </div>
      )}

      {/* 2通目メール表示 */}
      {followupEmail && (
        <div className="rounded-xl border border-blue-200 overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-800">2通目のメール</p>
            <CopyButton text={followupEmail} />
          </div>
          <pre className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-white">
            {followupEmail}
          </pre>
        </div>
      )}

      {/* ブロック5：並行してできること（契約前のみ・折りたたみ） */}
      {isPreContract && (
        <details className="rounded-xl border border-slate-200 overflow-hidden">
          <summary className="px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 select-none">
            並行してできること
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">1. 他社経由で同じ物件を探す</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                同じ物件でも、別の仲介業者から申し込める場合があります。
                仲介手数料は業者によって異なり、0ヶ月分の業者も存在します。
                SUUMOやHOMESで同じ物件番号を別業者が掲載していないか確認しましょう。
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">2. 火災保険を自分で選ぶ</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                貸主が求める最低補償を満たせば、他社プランで加入できます。
                業者指定プランより安いことが多く、2年で5,000〜10,000円節約できる場合があります。
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">3. 費目を引きやすい順に交渉する</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                引きやすい順：消毒代 → 書類作成費 → 24時間サポート → 仲介手数料 → 鍵交換・クリーニング → 礼金
              </p>
              <p className="text-xs text-slate-500 mt-1">
                最初に外しやすいものから交渉すると、業者が「融通を利かせた」感を出せます。
              </p>
            </div>
          </div>
        </details>
      )}

      {/* ブロック6：解決しない場合（折りたたみ・契約後のみ） */}
      {!isPreContract && <details className="rounded-xl border border-slate-200 overflow-hidden">
        <summary className="px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 select-none">
          解決しない場合の相談窓口
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-1.5">
          <p className="text-xs text-slate-600">
            <span className="font-medium">消費者ホットライン：</span>188（いやや）
          </p>
          <p className="text-xs text-slate-600">
            <span className="font-medium">国土交通省 不動産相談窓口：</span>国土交通省の不動産業に関する相談窓口
          </p>
          <p className="text-xs text-slate-600">
            <span className="font-medium">宅地建物取引業協会：</span>各都道府県の協会窓口（宅建協会）
          </p>
        </div>
      </details>}

      {/* 入居前チェックリスト（契約前のみ・折りたたみ） */}
      {isPreContract && (
        <details className="rounded-xl border border-slate-200 overflow-hidden">
          <summary className="px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 select-none">
            入居前・入居時にやっておくこと
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-4">
            <p className="text-xs text-slate-500">退去時のトラブルを防ぐための記録リスト</p>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">入居前に業者に確認すること</p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <span className="font-medium">・壁紙の張り替え時期（いつ張り替えたか）</span>
                  <p className="text-slate-500 mt-0.5 ml-2">→ 張り替えから6年で借主の原状回復負担はほぼゼロになります</p>
                </li>
                <li>
                  <span className="font-medium">・前入居者の退去日と空室期間</span>
                  <p className="text-slate-500 mt-0.5 ml-2">→ 長期空室なら設備の劣化は貸主負担と言いやすくなります</p>
                </li>
                <li>・鍵交換の実施日と新品への交換かどうか</li>
                <li>・入居前清掃の実施日と業者名</li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">入居時にやること（鍵をもらった日）</p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <span className="font-medium">・全室の傷・汚れ・設備の状態を写真で記録する</span>
                  <p className="text-slate-500 mt-0.5 ml-2">→ 日付入りで保存。退去時に「入居前からある」と証明できます</p>
                </li>
                <li>
                  <span className="font-medium">・設備の不具合をその日のうちに業者に連絡する</span>
                  <p className="text-slate-500 mt-0.5 ml-2">→ メールまたはLINEで文字として残す</p>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">保存しておくべきもの</p>
              <ul className="space-y-1 text-xs text-slate-600">
                <li>・重要事項説明書・賃貸借契約書のコピー</li>
                <li>・見積書・請求書・領収書</li>
                <li>・今回業者とやり取りしたメールの記録</li>
              </ul>
            </div>
          </div>
        </details>
      )}

      {/* ブロック7：ナビゲーション */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <Link
          href="/diagnosis"
          className="flex-1 text-center text-sm text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          もう一度診断する
        </Link>
        <Link
          href="/"
          className="flex-1 text-center text-sm text-slate-500 px-4 py-2.5 rounded-xl hover:text-slate-700 transition-colors"
        >
          トップに戻る
        </Link>
      </div>

    </div>
  );
}
