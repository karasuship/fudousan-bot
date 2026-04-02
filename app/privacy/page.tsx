import type { Metadata } from "next";
import { SITE } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `プライバシーポリシー｜${SITE.serviceName}`,
  description: `${SITE.serviceName}のプライバシーポリシーページです。`,
};

function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-slate-800">
        {num}．{title}
      </h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        プライバシーポリシー
      </h1>
      <p className="text-sm text-slate-500 mb-10 leading-relaxed">
        {SITE.operatorName}（以下「当社」）は、{SITE.serviceName}（以下「本サービス」）において
        利用者の個人情報を適切に取り扱うため、以下のとおりプライバシーポリシーを定めます。
      </p>

      <div className="space-y-10">
        <Section num="第1条" title="取得する情報">
          <p>本サービスでは、以下の情報を取得することがあります。</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>お問い合わせ時に入力されたメールアドレス・氏名・お問い合わせ内容</li>
            <li>決済時にStripeが取得するクレジットカード情報（当社は保持しません）</li>
            <li>アクセスログ（IPアドレス、ブラウザ種別、参照元URL等）</li>
            <li>診断入力情報（サーバーには保存せず、セッション内でのみ使用します）</li>
          </ul>
        </Section>

        <Section num="第2条" title="利用目的">
          <p>取得した情報は以下の目的で使用します。</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>本サービスの提供・運営・改善</li>
            <li>お問い合わせへの対応</li>
            <li>決済処理および購入コンテンツの提供</li>
            <li>不正利用の検知・防止</li>
            <li>サービス利用状況の分析（匿名化した形式）</li>
          </ul>
        </Section>

        <Section num="第3条" title="第三者提供">
          <p>
            当社は、以下の場合を除き、利用者の個人情報を第三者に提供しません。
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>利用者本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護のために必要な場合</li>
            <li>
              決済処理のためにStripe, Inc.にカード情報を提供する場合
              （Stripeのプライバシーポリシーに従います）
            </li>
          </ul>
        </Section>

        <Section num="第4条" title="アクセス解析">
          <p>
            本サービスでは、サービス改善を目的としてGoogle Analytics等のアクセス解析ツールを
            使用することがあります。これらのツールはCookieを使用して情報を収集しますが、
            個人を特定する情報は含まれません。
          </p>
          <p>
            Cookieの利用を希望されない場合は、ブラウザの設定からCookieを無効にしてください。
          </p>
        </Section>

        <Section num="第5条" title="情報の管理">
          <p>
            当社は、取得した個人情報への不正アクセス・紛失・破損・改ざん・漏洩を
            防止するために、適切な安全管理措置を講じます。
          </p>
        </Section>

        <Section num="第6条" title="開示・訂正・削除">
          <p>
            利用者は、当社が保有する自己の個人情報の開示・訂正・削除を請求することができます。
            請求は下記お問い合わせ先にご連絡ください。なお、本人確認のための対応をお願いする
            場合があります。
          </p>
        </Section>

        <Section num="第7条" title="お問い合わせ">
          <p>
            プライバシーポリシーに関するご質問・ご意見は以下までご連絡ください。
          </p>
          <p>
            {SITE.operatorName}
            <br />
            メール：
            <a
              href={`mailto:${SITE.email}`}
              className="text-blue-600 underline hover:text-blue-800"
            >
              {SITE.email}
            </a>
          </p>
        </Section>

        <Section num="第8条" title="ポリシーの変更">
          <p>
            当社は、必要に応じて本ポリシーを変更することがあります。
            変更後のポリシーは本サービス上に掲示した時点より効力を生じるものとします。
          </p>
        </Section>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">制定：{SITE.year}年</p>
        </div>
      </div>
    </div>
  );
}
