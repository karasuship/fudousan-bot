import Link from "next/link";
import { getAllFeeContents } from "@/lib/feeContent";

export const metadata = {
  title: "初期費用 費目解説 | 賃貸費用チェッカー",
  description: "仲介手数料・鍵交換代・クリーニング費など、賃貸契約の初期費用の各費目について、根拠・確認ポイント・交渉の考え方を解説します。",
};

export default function FeesPage() {
  const contents = getAllFeeContents();

  const grouped = contents.reduce<Record<string, typeof contents>>(
    (acc, fee) => {
      if (!acc[fee.category]) acc[fee.category] = [];
      acc[fee.category].push(fee);
      return acc;
    },
    {}
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">費目解説</h1>
      <p className="text-gray-600 mb-10">
        賃貸契約の初期費用に登場する各費目について、性質・確認ポイント・交渉の考え方を解説します。
      </p>

      {Object.entries(grouped).map(([category, fees]) => (
        <section key={category} className="mb-10">
          <h2 className="text-lg font-semibold text-gray-500 mb-4 border-b pb-2">
            {category}
          </h2>
          <div className="flex flex-col gap-4">
            {fees.map((fee) => (
              <Link
                key={fee.feeId}
                href={`/fees/${fee.slug}`}
                className="block border rounded-lg p-5 hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="font-semibold text-gray-900 mb-1">
                  {fee.title}
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">
                  {fee.summary}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
