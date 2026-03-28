"use client";

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">お問い合わせ</h1>
      <p className="text-sm text-slate-500 mb-10">
        サービスに関するご意見・ご質問はこちらからお寄せください。
      </p>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            お名前
          </label>
          <input
            type="text"
            placeholder="山田 太郎"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            メールアドレス
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            お問い合わせ種別
          </label>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white">
            <option>サービスに関するご質問</option>
            <option>診断結果についての疑問</option>
            <option>誤情報・改善提案</option>
            <option>その他</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            お問い合わせ内容
          </label>
          <textarea
            rows={5}
            placeholder="ご質問・ご意見をご記入ください"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
          />
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-700">
          <strong>ご注意：</strong> 現在、本フォームはデモ版です。送信いただいた内容はお受けできません。
          個別の法律相談には対応しておりません。
        </div>

        <button
          type="submit"
          className="w-full bg-slate-800 text-white py-3 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors opacity-50 cursor-not-allowed"
          disabled
        >
          送信する（準備中）
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">よくある質問</h2>
        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-700">診断結果は法律的に正しいですか？</p>
            <p className="mt-1 text-slate-500">
              本サービスの診断は一般的な情報提供であり、法的助言ではありません。個別案件については専門家にご相談ください。
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700">入力した情報は保存されますか？</p>
            <p className="mt-1 text-slate-500">
              現在、入力情報はサーバーに保存されません。診断はその場限りで処理されます。
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700">無料で使えますか？</p>
            <p className="mt-1 text-slate-500">
              はい、現在すべての機能を無料でご利用いただけます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
