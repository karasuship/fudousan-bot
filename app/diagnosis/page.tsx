import DiagnosisForm from "@/components/DiagnosisForm";

export const metadata = {
  title: "相談・診断｜賃貸費用チェッカー",
  description: "初期費用・契約書・更新料・修繕・退去費用・敷金精算など、賃貸の各場面で確認すべき点を整理します。",
};

export default function DiagnosisPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">相談・診断</h1>
        <p className="text-sm text-slate-500">
          相談したい場面を選ぶと、確認すべき事項と管理会社への確認メール文案を提示します。
        </p>
      </div>
      <DiagnosisForm />
    </div>
  );
}
