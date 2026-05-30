import Link from "next/link";

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

export default function FaqPage() {
  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-2">
          よくある質問
        </h1>
        <p className="text-sm text-slate-500 mb-10">
          賃貸初期費用・退去費用に関するよくある疑問
        </p>

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

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-4">疑問が解消したら、診断を始めてみてください</p>
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
