import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export interface PurchaseRecord {
  stripeCustomerId: string;
  email?: string;
  product: "300" | "980";
  sessionId: string;
  createdAt: number;
}

export async function savePurchase(record: PurchaseRecord): Promise<void> {
  const key = `purchase:${record.stripeCustomerId}:${record.product}`;
  await redis.set(key, JSON.stringify(record), { ex: 60 * 60 * 24 * 365 });
}

export async function hasPurchased(
  stripeCustomerId: string,
  product: "300" | "980"
): Promise<boolean> {
  const key = `purchase:${stripeCustomerId}:${product}`;
  const result = await redis.get(key);
  return result !== null;
}

export async function linkEmail(
  stripeCustomerId: string,
  email: string
): Promise<void> {
  await redis.set(`email:${email}`, stripeCustomerId, {
    ex: 60 * 60 * 24 * 365,
  });
  await redis.set(`customer:${stripeCustomerId}:email`, email, {
    ex: 60 * 60 * 24 * 365,
  });
}

export async function getCustomerIdByEmail(
  email: string
): Promise<string | null> {
  const result = await redis.get<string>(`email:${email}`);
  return result ?? null;
}
