import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-slate-800 tracking-tight">
            賃貸費用チェッカー
          </span>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
            β
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate-500">
          <Link href="/diagnosis" className="hover:text-slate-800 transition-colors">
            診断する
          </Link>
          <Link href="/fees" className="hover:text-slate-800 transition-colors">
            費目解説
          </Link>
          <Link href="/disclaimer" className="hover:text-slate-800 transition-colors">
            免責
          </Link>
          <Link href="/contact" className="hover:text-slate-800 transition-colors">
            お問い合わせ
          </Link>
        </nav>
      </div>
    </header>
  );
}
