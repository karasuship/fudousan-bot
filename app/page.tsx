import Link from "next/link";

// ─── 既存定数（維持） ─────────────────────────────────────────────────────────

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

// ─── よくある誤解データ ───────────────────────────────────────────────────────

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
    wrong: "ガイドラインは法律じゃないから無意味",
    right: "裁判の判断基準になります。ガイドラインに反する特約が裁判で無効とされたケースが多数あります。",
  },
  {
    wrong: "結局裁判しないと解決しない",
    right: "裁判になった時点で業者の方が困ります。顧問弁護士費用・事務コストは数万円を超えます。記録の残る確認メールを送るだけで業者の計算が変わります。",
  },
  {
    wrong: "値切ったら業者が困る",
    right: "業者は借主からの仲介手数料だけでなく貸主からの広告料（AD）も受け取っています。0.5ヶ月に調整しても業者の収益は残ります。",
  },
  {
    wrong: "交渉したら断られる",
    right: "あなたを逃すと仲介手数料は¥0です。0.5ヶ月でも受け取る方が業者には得です。根拠のない理由で断ることは業者にとっても外聞が悪く得ではありません。",
  },
  {
    wrong: "担当者が感じよかったから申し訳ない",
    right: "担当者の人柄と費用の根拠は別の問題です。基準は「この人が困るか」ではなく「この費用に根拠があるか」です。",
  },
];

// ─── FAQ データ ───────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "重説にサインしてしまいました。もう遅いですか？",
    a: "サインは書類の確認であって全条項への有効な同意ではありません。特に本来貸主負担の費用を借主負担にする特約は要件を満たさなければ無効になり得ます。払い済みでも根拠確認・記録ができます。",
  },
  {
    q: "特約に書いてあれば払うしかないですか？",
    a: "書いてあるだけでは不十分です。消費者契約法は不当な条項を無効と定めています。「書いてある・読み上げた」だけでは有効な同意とは言えないケースがあります。",
  },
  {
    q: "ガイドラインは業者に無視されませんか？",
    a: "ガイドラインは裁判の判断基準になります。反する特約が裁判で無効とされたケースは多数あります。また根拠を求めたメールの記録は行政相談・消費者センターへの相談材料になります。",
  },
  {
    q: "結局裁判しないと解決しないのでは？",
    a: "裁判になった時点で業者の方が困ります。顧問弁護士費用・裁判準備コストは数万円を超えます。勝っても負けても名前が残り行政にマークされます。記録の残る確認メールを送るだけで業者の計算が変わります。",
  },
  {
    q: "値切って業者に申し訳ないですか？",
    a: "業者は借主からの仲介手数料だけでなく貸主からの広告料（AD）も受け取っています。0.5ヶ月に調整しても業者の収益がなくなるわけではありません。",
  },
  {
    q: "交渉したら他の人に入れられませんか？",
    a: "あなたを逃すと仲介手数料は¥0です。0.5ヶ月でも受け取る方が業者には得です。専任物件でも空室が続くコストを業者・大家ともに嫌います。根拠のない理由で断ることは業者にとっても外聞が悪く得ではありません。",
  },
  {
    q: "担当者が感じよかったので気が引けます",
    a: "担当者の人柄と費用の根拠は別の問題です。根拠のある費用なら担当者はすぐ答えられます。基準は「この人が困るか」ではなく「この費用に根拠があるか」です。",
  },
  {
    q: "消毒代は本当に断れますか？",
    a: "断れます。任意サービスなので断っても入居を拒否できません。「弊社の規定です」は根拠ではありません。規定であれば規定の文書開示を求めることができます。",
  },
  {
    q: "契約前でも使えますか？",
    a: "契約前専用のフローがあります。署名前の今が最も動きやすいタイミングです。今日メールを送ることができます。",
  },
  {
    q: "払ってしまった後でも使えますか？",
    a: "使えます。根拠確認・記録として使えます。消費者ホットライン（188）への相談材料になります。",
  },
];

// ─── コンポーネント ───────────────────────────────────────────────────────────

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

      {/* ── 2. 本来払うべき費用 ── */}
      <section className="bg-white px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-3">
            本来、借主が払うべき費用は決まっています
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            賃貸契約で借主が支払い義務を負う費用は以下が基本です。
          </p>
          <ul className="space-y-2 mb-6">
            {[
              "前家賃（1ヶ月分）",
              "日割り家賃（入居日からの日割り）",
              "仲介手数料（原則0.5ヶ月分）",
              "保証会社費用",
              "火災保険料（相場の範囲内）",
              "敷金（預け金・退去時に精算）",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400 mb-6">礼金は慣行であり法的義務ではありません。</p>
          <div className="border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-700 leading-relaxed">
              それ以外の費用——消毒代・書類作成費・24時間サポート・鍵交換代・クリーニング費——
              これらには借主が負担する根拠が必要です。
              根拠を確認することは借主の正当な権利です。
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. よくある誤解 ── */}
      <section className="bg-[#f8fafc] px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-2">
            「払うしかない」は本当ですか
          </h2>
          <p className="text-sm text-slate-500 mb-8">よくある思い込みと、実際のところ</p>
          <div className="grid sm:grid-cols-2 gap-4">
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

      {/* ── 4. 業界の構造 ── */}
      <section className="bg-[#f1f5f9] px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-6">
            なぜ根拠のない費用が通るのか
          </h2>
          <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
            <p>
              日本の宅地建物取引業者は132,291業者（令和6年度）。
              コンビニの約57,170店の約2.3倍が存在します。
            </p>
            <p>
              普段の生活でどちらをよく使うか、考えてみてください。
              それでも駅前に不動産屋がひしめいているのは、一度の契約で動くお金が大きく、
              そこに慣行という名の上乗せが乗っているからです。
            </p>
            <p>
              仲介手数料の原則は、借主から0.5ヶ月・貸主から0.5ヶ月の合計1ヶ月。
              でも多くの場合、借主から1ヶ月満額を請求し、貸主からは別途広告料（AD）も受け取っています。
            </p>
            <p>
              消毒代・書類作成費・24時間サポートは業者の収益の柱のひとつです。
              でもこれらは本来、業者の基本業務に含まれるか、実態の薄いサービスへの請求です。
              借主には何の対価か実感できないことも多い。
            </p>
            <p>
              根拠を追及されることは業者にとってコストになります。
              数万円を守り続けるより、取り下げる方が合理的な選択です。業者もそれを知っています。
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-6 leading-relaxed">
            ※宅建業者数：国土交通省 令和6年度報道発表資料<br />
            ※コンビニ店舗数：日本フランチャイズチェーン協会 2025年統計
          </p>
        </div>
      </section>

      {/* ── 5. 業者の義務 ── */}
      <section className="bg-white px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-2">
            業者には、あなたが知らない義務がある
          </h2>
          <p className="text-sm text-slate-500 mb-8">宅地建物取引業法が定める3つの義務</p>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {[
              {
                badge: "第35条",
                title: "重要事項説明義務",
                body: "契約前に費用の内容・根拠を書面で説明しなければならない。説明されていない費用の根拠を求める権利があります。",
              },
              {
                badge: "第46条",
                title: "報酬の上限規制",
                body: "仲介手数料は借主から賃料0.5ヶ月が原則。1ヶ月とするには説明と承諾が必要です。超過請求には根拠の提示が求められます。",
              },
              {
                badge: "第47条",
                title: "禁止行為",
                body: "重要な事実を告げない・虚偽を告げることは禁止。任意なのに「必須」と言うことは禁止行為にあたる可能性があります。",
              },
            ].map((item) => (
              <div key={item.badge} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <span className="bg-slate-100 text-slate-600 text-xs rounded px-2 py-0.5 font-mono inline-block mb-3">
                  {item.badge}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 leading-relaxed">
            違反した業者は行政処分（指示・業務停止・免許取消）を受けます。
            実際に、重要事項の説明なしで営業停止、虚偽記載で営業停止7〜29日の処分事例があります。
            処分を受けた業者は国土交通省のサイトで公表されます。
          </div>
          <a
            href="https://www.mlit.go.jp/nega-inf/cgi-bin/search.cgi?jigyoubunya=takuti"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
          >
            処分事例を確認する（国土交通省） →
          </a>
        </div>
      </section>

      {/* ── 6. 根拠 ── */}
      <section className="bg-[#f8fafc] px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-8">
            このサービスが根拠にしているもの
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3">宅地建物取引業法</h3>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>・第31条 誠実義務</li>
                <li>・第35条 重要事項説明義務</li>
                <li>・第46条 報酬の上限規制</li>
                <li>・第47条 禁止行為</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3">消費者契約法</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                第10条 不当条項の無効<br /><br />
                「書いてある・サインした」だけでは有効にならないことがあります。
                消費者の権利を一方的に制限する条項は無効になり得ます。
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3">国土交通省ガイドライン</h3>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-3">
                <li>・入居前クリーニングは本来貸主負担</li>
                <li>・鍵交換は本来貸主が行うもの</li>
                <li>・経年劣化は借主負担にならない</li>
              </ul>
              <p className="text-xs text-slate-500 leading-relaxed">
                法的強制力はないが裁判の判断基準として機能します。
                ガイドラインに反する特約が無効とされたケースが多数あります。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ── */}
      <section className="bg-white px-4 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-8">よくある質問</h2>
          <div className="space-y-2">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="rounded-xl border border-slate-200 overflow-hidden"
              >
                <summary className="px-5 py-4 text-sm font-medium text-slate-800 cursor-pointer hover:bg-slate-50 select-none list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-slate-400 text-xs shrink-0 ml-3">▼</span>
                </summary>
                <div className="px-5 pb-4 pt-1">
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. 最終CTA ── */}
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

      {/* ── 9. 3つの事実（既存・維持） ── */}
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

      {/* ── 10. 診断モード選択（既存・維持） ── */}
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

      {/* ── 11. 使い方（既存・維持） ── */}
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
