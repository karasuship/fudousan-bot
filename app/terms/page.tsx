import type { Metadata } from "next";
import { SITE } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `利用規約｜${SITE.serviceName}`,
  description: `${SITE.serviceName}の利用規約ページです。`,
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

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">利用規約</h1>
      <p className="text-sm text-slate-500 mb-10 leading-relaxed">
        本利用規約（以下「本規約」）は、{SITE.operatorName}（以下「当社」）が提供する
        「{SITE.serviceName}」（以下「本サービス」）の利用条件を定めるものです。
        本サービスをご利用いただく前に必ずお読みください。
        本サービスをご利用いただいた時点で、本規約に同意いただいたものとみなします。
      </p>

      <div className="space-y-10">
        <Section num="第1条" title="サービスの目的と範囲">
          <p>
            本サービスは、賃貸契約に関する費用・条項等の一般的な確認事項を整理し、
            管理会社・仲介業者等への確認メール文面を生成することを目的とするWebサービスです。
          </p>
          <p>本サービスが提供する機能の範囲は以下のとおりです。</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>入力情報に基づく確認事項・優先度の整理（一般的な参考情報の提供）</li>
            <li>確認メール文面の生成（AIを活用したデジタルコンテンツ）</li>
            <li>次の行動に関する一般的な案内・情報整理</li>
          </ul>
        </Section>

        <Section num="第2条" title="非法律相談・非法的助言">
          <p>
            本サービスは、法律相談・法的助言・交渉代行・紛争解決の支援を行うものでは<strong>ありません</strong>。
          </p>
          <p>
            診断結果・生成されたメール文面はいずれも一般的な参考情報であり、
            個別の法的判断・法的見解の提示・成果の保証を行うものではありません。
          </p>
          <p>
            個別の法律問題については、弁護士・司法書士等の法律専門家、
            または各都道府県の消費生活センター・宅建協会の相談窓口にご相談ください。
          </p>
        </Section>

        <Section num="第3条" title="有料サービスと提供内容">
          <p>
            本サービスの一部機能（確認メール文面の全文取得等）は有料です。
            価格・提供内容の詳細は診断画面・決済画面および
            「特定商取引法に基づく表記」をご確認ください。
          </p>
          <p>
            有料コンテンツは決済完了後に即時提供されます。
            デジタルコンテンツの性質上、提供後の返品・返金には原則として対応しておりません。
            ただし、決済エラー・システム障害等により正常に提供されなかった場合は
            個別にご対応いたします。
          </p>
        </Section>

        <Section num="第4条" title="利用者の責任">
          <p>
            利用者は、診断結果・生成コンテンツを参考情報として用いるにあたり、
            最終的な判断・行動の責任を自己が負うものとします。
          </p>
          <p>
            生成されたメール文面の使用・送付・その結果については、
            利用者自身の判断と責任において行ってください。
            当社は文面の使用に起因する結果について責任を負いません。
          </p>
        </Section>

        <Section num="第5条" title="禁止事項">
          <p>利用者は以下の行為を行ってはなりません。</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>本サービスを違法な目的・不正な目的に使用すること</li>
            <li>本サービスの生成物を無断で第三者へ転載・再配布・販売すること</li>
            <li>本サービスのシステムに過度な負荷をかける行為</li>
            <li>当社またはサービスの信用・名誉を毀損する行為</li>
            <li>虚偽の情報を入力すること</li>
            <li>その他当社が不適切と判断する行為</li>
          </ul>
        </Section>

        <Section num="第6条" title="サービスの変更・停止">
          <p>
            当社は、利用者への事前通知なく本サービスの内容の変更・追加・一時停止・終了を行うことがあります。
            これにより利用者に損害が生じた場合であっても、当社は責任を負いません。
          </p>
        </Section>

        <Section num="第7条" title="免責事項">
          <p>
            本サービスの提供する情報の正確性・完全性・最新性について、当社は保証しません。
          </p>
          <p>
            本サービスの利用または利用不能によって生じた損害（直接損害・間接損害・特別損害・
            派生的損害を含む）について、当社は法令上認められる範囲で責任を負わないものとします。
          </p>
          <p>
            診断結果・生成メール文面の使用によって期待された成果が得られなかった場合であっても、
            当社はその結果について責任を負いません。
          </p>
        </Section>

        <Section num="第8条" title="個人情報の取り扱い">
          <p>
            本サービスにおける個人情報の取り扱いについては、
            別途定めるプライバシーポリシーに従います。
          </p>
        </Section>

        <Section num="第9条" title="規約の変更">
          <p>
            当社は、必要に応じて本規約を変更することがあります。
            変更後の規約は本サービス上に掲示した時点より効力を生じるものとします。
          </p>
        </Section>

        <Section num="第10条" title="準拠法・管轄裁判所">
          <p>
            本規約は日本法に準拠し、解釈されます。
            本サービスに関して生じる紛争については、当社の所在地を管轄する裁判所を
            第一審の専属的合意管轄裁判所とします。
          </p>
        </Section>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">制定：{SITE.year}年</p>
        </div>
      </div>
    </div>
  );
}
