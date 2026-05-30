import Link from "next/link";

const MISCONCEPTIONS = [
  {
    wrong: "重説にサインしたから全部有効",
    right: "サインは書類の確認。消費者契約法は不当な条項を無効と定めています。説明・根拠・真の同意が必要です。",
  },
  {
    wrong: "特約に書いてあれば有効",
    right: "書いてあるだけでは不十分です。要件を満たさない特約は無効になり得ます。",
  },
  {
    wrong: "結局裁判しないと解決しない",
    right: "裁判になった時点で業者の方が困ります。顧問弁護士費用・事務コストは数万円を超えます。記録の残る確認メールを送るだけで業者の計算が変わります。",
  },
];

export default function HomePage() {
  return (
    <div>

      {/* ── 1. ヒーロー ── */}
      <section className="bg-[#0f172a] px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 bg-white/10 rounded-full px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            無料・登録不要・約2分
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
            その見積書に、<br />
            説明できない費用はありませんか
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
            賃貸契約の初期費用には、根拠のない慣行で請求されている費用が含まれていることがあります。
            制度はあなたを守っています。知らないから、使えていないだけです。
          </p>
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-[#0f172a] px-6 py-3 rounded-xl text-base font-semibold transition-colors"
          >
            無料で診断する
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="text-xs text-slate-500 mt-4">
            法的助言ではありません。一般的な情報提供を目的としています。
          </p>
        </div>
      </section>

      {/* ── 2. サービスの本質 ── */}
      <section className="bg-white px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-4 leading-snug">
            行政・消費者保護の観点から守られているあなたの権利を、<br className="hidden sm:block" />
            実際に使える言葉と手段に翻訳します
          </h2>
          <p className="text-sm text-slate-500 mb-10 leading-relaxed">
            その費用が本当に必要なものかを確認し、削除・減額・返金の交渉を進めるための情報と手段を提供します
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* 契約前 */}
            <div className="rounded-xl border border-slate-200 bg-[#f8fafc] px-5 py-5">
              <p className="text-xs font-semibold text-blue-700 bg-blue-50 rounded px-2 py-0.5 inline-block mb-3">
                契約前にできること
              </p>
              <ul className="space-y-2.5">
                {[
                  "見積書の費目ごとに削除・減額できる可能性と金額を把握",
                  "交渉のロードマップと難易度がわかる",
                  "業者に送る確認メールをそのまま生成",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* 契約後 */}
            <div className="rounded-xl border border-slate-200 bg-[#f8fafc] px-5 py-5">
              <p className="text-xs font-semibold text-slate-600 bg-slate-100 rounded px-2 py-0.5 inline-block mb-3">
                契約後にできること
              </p>
              <ul className="space-y-2.5">
                {[
                  "費目ごとの論点を整理して記録を固定",
                  "業者の返答パターン別に次の手がわかる",
                  "1通目・2通目のメールを生成して根拠を問い続ける",
                  "解決しない場合の行政相談文・消費者センター向け文書を生成",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-slate-400 font-bold shrink-0 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. よくある誤解（3枚） ── */}
      <section className="bg-[#f8fafc] px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-2">
            「払うしかない」は本当ですか
          </h2>
          <p className="text-sm text-slate-500 mb-8">よくある思い込みと、実際のところ</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {MISCONCEPTIONS.map((m) => (
              <div
                key={m.wrong}
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
              >
                <p className="text-sm line-through text-red-400 mb-2">{m.wrong}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{m.right}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. 最終CTA ── */}
      <section className="bg-[#0f172a] px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            あなたの見積書を、今すぐ診断する
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            制度はあなたを守っています。<br />
            知らないから、使えていないだけです。
          </p>
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-[#0f172a] px-8 py-3 rounded-xl text-base font-semibold transition-colors"
          >
            無料で診断する
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="text-xs text-slate-500 mt-4">
            法的助言ではありません。一般的な情報提供を目的としています。
          </p>
        </div>
      </section>

    </div>
  );
}
