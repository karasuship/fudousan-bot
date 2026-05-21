import Link from "next/link";

const FACTS = [
  {
    num: "01",
    title: "仲介手数料には上限がある",
    body: "宅建業法上、借主から受け取れる上限は賃料1ヶ月分＋消費税。借主の書面による承諾なしに1ヶ月分を請求するケースがある。",
  },
  {
    num: "02",
    title: "鍵交換代は任意のケースがある",
    body: "実施されていない・説明がないまま請求されているケースで、確認の余地が生じることがある。任意費用であれば断れる場合がある。",
  },
  {
    num: "03",
    title: "退去費用は交渉できる場合がある",
    body: "通常の使用による劣化は借主負担にならないのが原則（国土交通省原状回復ガイドライン）。請求内容に根拠を求めることができる。",
  },
];

const MODES = [
  { icon: "🏠", label: "初期費用チェック", desc: "見積もり・請求の内訳を確認" },
];

const STEPS = [
  { num: "1", title: "費用の内訳を入力する", desc: "見積書・請求書の費用名と金額を入力（約2分）" },
  { num: "2", title: "状況を入力する", desc: "費用の種類・説明の有無など約2分で入力" },
  { num: "3", title: "確認ポイントと次の行動が出る", desc: "何が問題か・なぜ確認が必要か・何をすべきかが整理される" },
];

export default function HomePage() {
  return (
    <div>
      {/* ── 1. ヒーローセクション ── */}
      <section className="bg-[#0f172a] px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 bg-white/10 rounded-full px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            無料・登録不要・約2分
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
            その費用、根拠を<br />
            聞いたことがありますか？
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
            賃貸の初期費用・更新料・退去費用は、確認するだけで変わることがある。
            無料・登録不要・約2分で診断。
          </p>

          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-500 text-white px-7 py-4 rounded-xl text-base font-semibold transition-colors"
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

      {/* ── 2. 3つの事実セクション ── */}
      <section className="bg-white px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-8">
            知っておくべき3つの事実
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {FACTS.map((f) => (
              <div
                key={f.num}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
              >
                <span className="text-xs font-bold text-[#0f172a] bg-slate-100 rounded px-1.5 py-0.5 mb-3 inline-block">
                  {f.num}
                </span>
                <h3 className="text-sm font-bold text-slate-800 leading-snug mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. 診断モード選択セクション ── */}
      <section className="bg-[#f8fafc] px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-2">
            初期費用の確認を始める
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            見積書・請求書の内訳を入力すると、確認すべき論点を整理します
          </p>
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-2 bg-[#0f172a] hover:bg-slate-800 text-white px-7 py-4 rounded-xl text-sm font-semibold transition-colors"
          >
            {MODES[0].icon} {MODES[0].label}を始める
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── 4. 使い方セクション ── */}
      <section className="bg-[#f1f5f9] px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-8">
            使い方
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="flex flex-col gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0f172a] text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {s.num}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/diagnosis"
              className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-500 text-white px-7 py-4 rounded-xl text-sm font-semibold transition-colors"
            >
              無料で診断する →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
