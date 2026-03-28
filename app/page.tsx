import Link from "next/link";

const MODES = [
  { icon: "🏠", label: "初期費用チェック", desc: "入居前の見積書・請求書を確認" },
  { icon: "📋", label: "契約書チェック", desc: "契約書・重要事項説明書の条項を確認" },
  { icon: "🔄", label: "更新・再契約チェック", desc: "更新料・再契約料を確認" },
  { icon: "🔧", label: "管理不備・修繕相談", desc: "設備不具合・害虫などの連絡補助" },
  { icon: "📦", label: "退去費用チェック", desc: "原状回復・クリーニング費用を確認" },
  { icon: "💴", label: "敷金精算チェック", desc: "差引内訳・返還額の根拠を確認" },
];

const FEATURES = [
  {
    title: "確認すべき点を整理",
    description: "入力内容から「問題なし／要確認／注意」を判定し、確認すべき事項をリストアップします。",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "3段階リスク判定",
    description: "「問題少／要確認／要注意」で状況を整理し、何から動くべきかを明示します。",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "確認メール文案生成",
    description: "管理会社・仲介業者への確認メールをモード・トーン別に自動生成します（有料）。",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-14">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            無料 · 登録不要 · 約2分
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight mb-4">
            知らずに数万円〜数十万円<br />
            <span className="text-slate-500">損している可能性があります</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
            初期費用・契約書・更新料・修繕・退去費用・敷金精算など、<br className="hidden sm:inline" />
            賃貸の各場面で「確認すべき点」と「管理会社への確認メール」を提示します。
          </p>
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            無料で確認する（損しているかチェック）
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="text-xs text-slate-400 mt-3">
            ※ 法的助言ではありません。詳しくは
            <Link href="/disclaimer" className="underline hover:text-slate-600">
              免責事項
            </Link>
            をご確認ください。
          </p>
        </div>
      </section>

      {/* 6モード */}
      <section className="bg-slate-50 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
            対応している相談モード
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {MODES.map((m) => (
              <div
                key={m.label}
                className="bg-white border border-slate-200 rounded-xl px-3 py-3 flex flex-col gap-1"
              >
                <span className="text-lg leading-none">{m.icon}</span>
                <span className="text-xs font-semibold text-slate-700 leading-tight">{m.label}</span>
                <span className="text-xs text-slate-400 leading-tight">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-8">
          できること
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-800">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Note */}
      <section className="max-w-3xl mx-auto px-4 pb-14">
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">ご利用にあたって</h3>
          <ul className="space-y-1.5 text-sm text-slate-500">
            <li>・本サービスは一般的な情報提供を目的とし、法的助言・法律相談ではありません。</li>
            <li>・診断結果は入力内容をもとにした一般論です。個別の判断は専門家にご相談ください。</li>
            <li>・「違法」「返金される」などの断定的な判断は行いません。</li>
          </ul>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-slate-800 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-white text-xl font-semibold mb-2">気になることがありますか？</h2>
          <p className="text-slate-400 text-sm mb-6">モードを選んで約2分で確認できます</p>
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-2 bg-white text-slate-800 px-6 py-3 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            相談スタート
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
