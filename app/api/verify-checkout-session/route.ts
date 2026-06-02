import Stripe from "stripe";
import { savePurchase } from "@/lib/redis";

// NOTE: 本番ではWebhookによる非同期確認を推奨。
// このエンドポイントはMVP向けの同期確認用です。

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return Response.json(
      { paid: false, error: "session_id が指定されていません" },
      { status: 400 }
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[verify-checkout-session] STRIPE_SECRET_KEY が未設定です");
    return Response.json(
      { paid: false, error: "決済サービスが設定されていません" },
      { status: 500 }
    );
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";

    if (paid && session.customer) {
      const stripeCustomerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id;

      try {
        await savePurchase({
          stripeCustomerId,
          email: session.customer_details?.email ?? undefined,
          product: "980",
          sessionId,
          createdAt: Date.now(),
        });
      } catch (redisErr) {
        console.error("[verify-checkout-session] Redis 保存エラー:", redisErr);
      }
    }

    return Response.json({ paid });
  } catch (err) {
    console.error("[verify-checkout-session] Stripe エラー:", err);
    return Response.json(
      { paid: false, error: "支払い状態の確認に失敗しました" },
      { status: 500 }
    );
  }
}
