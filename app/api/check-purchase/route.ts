import { hasPurchased } from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const { stripeCustomerId } = await req.json();
    if (!stripeCustomerId) {
      return Response.json({ has300: false, has980: false });
    }

    const [has300, has980] = await Promise.all([
      hasPurchased(stripeCustomerId, "300"),
      hasPurchased(stripeCustomerId, "980"),
    ]);

    return Response.json({ has300, has980 });
  } catch (err) {
    console.error("[check-purchase] エラー:", err);
    return Response.json({ has300: false, has980: false });
  }
}
