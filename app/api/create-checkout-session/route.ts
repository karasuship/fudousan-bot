import Stripe from "stripe";

// NOTE: 本番環境では Stripe Webhook での支払い確認を強く推奨します
// 参考: https://stripe.com/docs/webhooks
// MVP段階では session_id を使ったサーバーサイド確認（verify-checkout-session）で代替しています

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.error("[create-checkout-session] STRIPE_SECRET_KEY が未設定です");
    return Response.json(
      { error: "決済サービスが設定されていません。管理者に連絡してください。" },
      { status: 500 }
    );
  }

  // 念のため公開鍵が誤って設定されていないかチェック
  if (secretKey.startsWith("pk_")) {
    console.error("[create-checkout-session] STRIPE_SECRET_KEY に公開鍵が設定されています");
    return Response.json(
      { error: "決済キーの設定が誤っています。管理者に連絡してください。" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("[create-checkout-session] NEXT_PUBLIC_BASE_URL が未設定です");
    return Response.json(
      { error: "サイトURLが設定されていません。管理者に連絡してください。" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: "賃貸費用チェッカー｜確認メール全文",
              description: "今回の診断に対応した確認メール文案の全文を表示します",
            },
            unit_amount: 980,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // {CHECKOUT_SESSION_ID} は Stripe が自動で session ID に置換します
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout-session] Stripe エラー:", err);
    return Response.json(
      { error: "決済セッションの作成に失敗しました。しばらく経ってから再度お試しください。" },
      { status: 500 }
    );
  }
}
