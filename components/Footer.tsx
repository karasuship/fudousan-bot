import Link from "next/link";
import { SITE } from "@/lib/siteConfig";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
        <p>© {SITE.year} {SITE.serviceName}</p>
        <div className="flex flex-wrap justify-center gap-5">
          <Link href="/tokusho" className="hover:text-slate-600 transition-colors">
            特定商取引法
          </Link>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">
            プライバシーポリシー
          </Link>
          <Link href="/disclaimer" className="hover:text-slate-600 transition-colors">
            免責事項
          </Link>
          <Link href="/contact" className="hover:text-slate-600 transition-colors">
            お問い合わせ
          </Link>
          <Link href="/fees" className="hover:text-slate-600 transition-colors">
            費目解説
          </Link>
          <Link href="/faq" className="hover:text-slate-600 transition-colors">
            よくある質問
          </Link>
          <Link href="/about" className="hover:text-slate-600 transition-colors">
            このサービスについて
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
