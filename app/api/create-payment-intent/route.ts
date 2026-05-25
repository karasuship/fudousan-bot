import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_")) {
    return NextResponse.json(
      { error: "Stripe設定エラー" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 980,
      currency: "jpy",
      automatic_payment_methods: { enabled: true },
      metadata: { product: "fudousan_diagnosis" },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("PaymentIntent作成エラー:", err);
    return NextResponse.json(
      { error: "決済の準備に失敗しました" },
      { status: 500 }
    );
  }
}
