import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeeContentBySlug, getAllFeeContents } from "@/lib/feeContent";

export function generateStaticParams() {
  return getAllFeeContents().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fee = getFeeContentBySlug(slug);
  if (!fee) return {};
  return {
    title: `${fee.title} | 賃貸費用チェッカー`,
    description: fee.summary,
  };
}

export default async function FeeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fee = getFeeContentBySlug(slug);
  if (!fee) notFound();

  return (
    <div className="bg-white">

      {/* ヘッダー */}
      <section className="bg-[#0f172a] px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/fees"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            費目一覧に戻る
          </Link>
          <p className="text-xs font-medium text-slate-400 tracking-widest uppercase mb-3">
            {fee.category}
          </p>
          <h1 className="text-xl sm:text-3xl font-bold text-white leading-tight tracking-tight mb-4">
            {fee.title}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            {fee.summary}
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 space-y-12">

        {/* sections */}
        <div className="space-y-8">
          {fee.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-base font-bold text-[#0f172a] mb-2">{section.heading}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        {/* keyPoints */}
        <div className="border border-slate-200 rounded-xl px-5 py-5">
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase mb-3">
            確認の3点
          </p>
          <ul className="space-y-2">
            {fee.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#0f172a]">
                <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* checkPoints */}
        <div>
          <h2 className="text-base font-bold text-[#0f172a] mb-3">確認すべきこと</h2>
          <ul className="space-y-2">
            {fee.checkPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="shrink-0 text-slate-400 mt-0.5">・</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* negotiability */}
        <div>
          <h2 className="text-base font-bold text-[#0f172a] mb-3">交渉のしやすさ</h2>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-green-700 mb-1">契約前</p>
              <p className="text-sm text-slate-700 leading-relaxed">{fee.negotiabilityPre}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">契約後</p>
              <p className="text-sm text-slate-700 leading-relaxed">{fee.negotiabilityPost}</p>
            </div>
          </div>
        </div>

        {/* emailExamples */}
        <div>
          <h2 className="text-base font-bold text-[#0f172a] mb-3">確認文例</h2>
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl px-4 py-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">契約前</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {fee.emailExamplePre}
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl px-4 py-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">契約後</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {fee.emailExamplePost}
              </p>
            </div>
          </div>
        </div>

        {/* faqs */}
        <div>
          <h2 className="text-base font-bold text-[#0f172a] mb-4">よくある質問</h2>
          <div className="space-y-4">
            {fee.faqs.map((faq, i) => (
              <div key={i} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-[#0f172a] mb-1.5">Q. {faq.q}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 診断CTA */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-6">
          <p className="text-sm font-semibold text-[#0f172a] mb-1">
            今の見積書を診断する
          </p>
          <p className="text-xs text-slate-500 mb-4">
            費目を選んで診断すると、交渉の根拠と確認メールの構成を無料で確認できます。
          </p>
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-2 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            無料で診断する
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
