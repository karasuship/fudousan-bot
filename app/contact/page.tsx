import type { Metadata } from "next";
import { SITE } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `お問い合わせ｜${SITE.serviceName}`,
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">お問い合わせ</h1>
      <p className="text-sm text-slate-500 mb-10 leading-relaxed">
        サービスに関するご意見・ご質問・購入に関するお問い合わせは、
        以下のメールアドレスまでご連絡ください。
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-10">
        <p className="text-sm font-medium text-slate-700 mb-1">メールアドレス</p>
        <a
          href={`mailto:${SITE.email}`}
          className="text-blue-600 underline hover:text-blue-800 text-sm"
        >
          {SITE.email}
        </a>
        <p className="text-xs text-slate-400 mt-2">
          ※ 通常2〜3営業日以内にご返信いたします。
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-slate-700">よくある質問</h2>
        <div className="space-y-5 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-700">診断結果は法律的に正しいですか？</p>
            <p className="mt-1 text-slate-500">
              本サービスの診断は一般的な情報提供であり、法的助言ではありません。
              個別案件については弁護士等の専門家にご相談ください。
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700">入力した情報は保存されますか？</p>
            <p className="mt-1 text-slate-500">
              診断入力情報はサーバーに保存されません。診断はその場限りで処理されます。
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700">購入後に返金はできますか？</p>
            <p className="mt-1 text-slate-500">
              デジタルコンテンツの即時提供であるため、原則として返金対応は行っておりません。
              決済エラー・システム障害等の場合は個別対応いたします。上記メールアドレスまでご連絡ください。
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700">確認メールの全文はどこで取得できますか？</p>
            <p className="mt-1 text-slate-500">
              診断完了後の結果画面から購入手続きを行うと、即時にメール全文を確認できます。
              価格は{SITE.priceLabel}です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
