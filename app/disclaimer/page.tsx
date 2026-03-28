export const metadata = {
  title: "免責事項｜賃貸費用チェッカー",
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">免責事項</h1>

      <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-semibold text-slate-800 mb-3">サービスの性質について</h2>
          <p>
            本サービス「賃貸費用チェッカー」は、賃貸契約に関する費用について一般的な情報提供を行うことを目的としたサービスです。
            本サービスが提供する情報・診断結果は、法律相談・法的助言・弁護士業務に相当するものではありません。
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-3">診断結果の限界</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>診断結果は入力された情報をもとにした一般論です。</li>
            <li>個別の契約内容・地域・状況によって判断は大きく異なります。</li>
            <li>「違法」「返金される」「請求できない」等の断定的な法的判断は行いません。</li>
            <li>診断結果が「問題なし」であっても、実際に問題がないことを保証するものではありません。</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-3">専門家への相談推奨</h2>
          <p>
            賃貸契約の費用について重要な判断をされる場合、または費用請求について争いが生じている場合は、
            弁護士・司法書士・宅地建物取引士等の専門家、または各都道府県の宅建協会・消費者センター等にご相談ください。
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-3">メール文案の使用について</h2>
          <p>
            本サービスが生成する確認メールの文案はあくまでも参考文例です。
            実際にご使用の際は内容を確認・修正のうえ、ご自身の責任においてご使用ください。
            文案の使用によって生じたいかなる結果についても、本サービスは責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-3">情報の正確性</h2>
          <p>
            本サービスが提供する情報は作成時点での一般的な情報に基づいており、
            法令改正・判例の変更等により内容が変化している可能性があります。
            最新・正確な情報については必ず専門家または公的機関にご確認ください。
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-3">免責</h2>
          <p>
            本サービスの利用によって生じた損害・不利益について、本サービスの運営者は一切の責任を負いません。
            利用者は自己の責任においてサービスを利用するものとします。
          </p>
        </section>
      </div>
    </div>
  );
}
