import DiagnosisFormV2 from "@/components/DiagnosisFormV2";

export const metadata = {
  title: "賃貸費用チェック｜賃貸費用チェッカー",
  description: "賃貸の初期費用（仲介手数料・鍵交換代・クリーニング費など）の見積書・請求書を診断。確認すべき論点とメール文面を提示します。",
};

export default function DiagnosisPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">賃貸費用チェック</h1>
        <p className="text-sm text-slate-500">
          契約前・契約後を問わず、費用の根拠を確認できる状態を整えます。宅建業者として借主に判断機会を提供していたかを確認します。
        </p>
      </div>
      <DiagnosisFormV2 />
    </div>
  );
}
