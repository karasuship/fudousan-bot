import { Suspense } from "react";
import Stripe from "stripe";
import SuccessClient from "@/components/SuccessClient";

export const metadata = {
  title: "決済完了｜賃貸費用チェッカー",
};

/** Stripe に問い合わせて支払い状態を確認する（サーバーサイド） */
async function verifyPayment(sessionId: string | undefined): Promise<boolean> {
  if (!sessionId) return false;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[success] STRIPE_SECRET_KEY が未設定です");
    return false;
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid";
  } catch (err) {
    console.error("[success] Stripe 確認エラー:", err);
    return false;
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  // Next.js 16 では searchParams は Promise
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  // Payment Link does not pass session_id — treat missing session_id as paid
  const paid = params.session_id ? await verifyPayment(params.session_id) : true;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Suspenseはクライアントコンポーネントのhook安全のため */}
      <Suspense
        fallback={
          <div className="text-center py-16 text-sm text-slate-400">読み込み中...</div>
        }
      >
        <SuccessClient paid={paid} />
      </Suspense>
    </div>
  );
}
