"use client";

import { useState, useEffect } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "入力内容を確認してください");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
    });
    const { clientSecret, error: apiError } = await res.json();
    if (apiError || !clientSecret) {
      setError(apiError ?? "決済の準備に失敗しました");
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "決済に失敗しました");
      setLoading(false);
      return;
    }

    onSuccess();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
      >
        {loading ? "処理中..." : "¥980 で購入する"}
      </button>
    </form>
  );
}

interface PaymentModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentModal({ onSuccess, onClose }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/create-payment-intent", { method: "POST" })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("決済の準備に失敗しました");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("通信エラーが発生しました");
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">
              不動産診断 有料版
            </p>
            <p className="text-xs text-slate-500">
              3ラリー文面・返答パターン別対応・戦略ロードマップ
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-light"
          >
            ✕
          </button>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-600">合計</span>
            <span className="text-xl font-bold text-slate-800">¥980</span>
          </div>

          {loading && (
            <p className="text-xs text-slate-400 text-center py-4">
              準備中...
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 text-center py-4">{error}</p>
          )}
          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#1e3a5f" },
                },
              }}
            >
              <CheckoutForm onSuccess={onSuccess} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
