import type { Metadata } from "next";
import { SITE } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `特定商取引法に基づく表記｜${SITE.serviceName}`,
  description: `${SITE.serviceName}の特定商取引法に基づく表記ページです。`,
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-4 border-t border-slate-100">
      <dt className="text-sm font-medium text-slate-500 sm:pt-0.5">{label}</dt>
      <dd className="text-sm text-slate-700 leading-relaxed">{children}</dd>
    </div>
  );
}

export default function TokushoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        特定商取引法に基づく表記
      </h1>
      <p className="text-sm text-slate-500 mb-10">
        特定商取引に関する法律（特定商取引法）第11条に基づき、以下のとおり表記します。
      </p>

      <dl>
        <Row label="販売事業者名">{SITE.operatorName}</Row>
        <Row label="運営責任者">{SITE.representative}</Row>
        <Row label="所在地">
          {SITE.address ? (
            SITE.address
          ) : (
            <>
              個人情報保護の観点から住所を非公開としています。
              <br />
              請求があった場合には、遅滞なく開示いたします。
            </>
          )}
        </Row>
        <Row label="お問い合わせ先">
          <a
            href={`mailto:${SITE.email}`}
            className="text-blue-600 underline hover:text-blue-800"
          >
            {SITE.email}
          </a>
          <br />
          <span className="text-xs text-slate-400">
            ※ お問い合わせへの回答は通常2〜3営業日以内を目安としています。
          </span>
        </Row>
        {SITE.phone && <Row label="電話番号">{SITE.phone}</Row>}
        <Row label="サービス内容">
          賃貸契約に関する費用・条項等の確認事項を整理し、管理会社・仲介業者等への
          確認メール文面を生成するデジタルサービスです。
          <br />
          ※ 本サービスは一般的な参考情報の整理を目的としており、
          法的助言・法律相談・交渉代行ではありません。
        </Row>
        <Row label="販売価格">
          {SITE.priceLabel}（消費税込）
          <br />
          <span className="text-xs text-slate-500">
            ※ 各機能の価格は診断画面・決済画面に表示される金額が最終金額です。
          </span>
        </Row>
        <Row label="商品代金以外の費用">
          インターネット接続に必要な通信料等はお客様のご負担となります。
          その他の追加費用は発生しません。
        </Row>
        <Row label="支払方法">クレジットカード決済（Stripe）</Row>
        <Row label="支払時期">購入手続き完了時に即時課金されます。</Row>
        <Row label="サービス提供時期">
          決済完了後、即時にデジタルコンテンツ（確認メール文面・診断結果）を
          ご利用いただけます。
        </Row>
        <Row label="返品・キャンセル・返金">
          本サービスはデジタルコンテンツの即時提供であるため、
          コンテンツ提供後の返品・返金には原則として対応しておりません。
          <br />
          ただし、決済処理エラーやシステム障害等により正常にサービスが
          提供されなかった場合は個別にご対応いたします。
          その場合は上記お問い合わせ先までご連絡ください。
        </Row>
        <Row label="動作環境">
          最新版の主要Webブラウザ（Google Chrome・Safari・Firefox・Microsoft Edge等）。
          JavaScriptおよびCookieが有効であること。
        </Row>
        <Row label="注意事項">
          本サービスは一般的な参考情報の整理を目的としており、
          法的助言・法律相談・交渉代行ではありません。
          診断結果は入力内容に基づく参考情報であり、正確性・完全性・成果を保証するものではありません。
          個別の法律問題については弁護士等の専門家にご相談ください。
        </Row>
      </dl>
    </div>
  );
}
