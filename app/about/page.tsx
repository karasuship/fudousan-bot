import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-2">
          このサービスについて
        </h1>
        <p className="text-sm text-slate-500 mb-14">
          賃貸初期費用チェッカーの仕組みと根拠
        </p>

        {/* ── Section 1：なぜ根拠のない費用が通るのか ── */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-[#0f172a] mb-6">
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
        </section>

        {/* ── Section 2：業者の義務 ── */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-[#0f172a] mb-2">
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
        </section>

        {/* ── Section 3：根拠 ── */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-[#0f172a] mb-8">
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
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-4">制度を理解したら、診断を始めてみてください</p>
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-2 bg-[#0f172a] hover:bg-slate-800 text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            無料で診断する →
          </Link>
        </div>

      </div>
    </div>
  );
}
