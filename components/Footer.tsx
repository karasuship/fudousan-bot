import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
        <p>© 2025 賃貸費用チェッカー</p>
        <div className="flex gap-5">
          <Link href="/disclaimer" className="hover:text-slate-600 transition-colors">
            免責事項
          </Link>
          <Link href="/contact" className="hover:text-slate-600 transition-colors">
            お問い合わせ
          </Link>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-6">
        <p className="text-xs text-slate-300 text-center">
          本サービスは一般的な情報提供を目的としており、法的助言ではありません。
        </p>
      </div>
    </footer>
  );
}
