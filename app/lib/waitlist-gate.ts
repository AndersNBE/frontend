import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const WAITLIST_COOKIE_NAME = "udfall_waitlist_access";
const WAITLIST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getConfiguredWaitlistCode(): string | null {
  const code = process.env.WAITLIST_ACCESS_CODE?.trim();
  return code || null;
}

function getWaitlistSecret(): string | null {
  const customSecret = process.env.WAITLIST_COOKIE_SECRET?.trim();
  if (customSecret) return customSecret;
  return getConfiguredWaitlistCode();
}

function signWaitlistPayload(payload: string): string | null {
  const secret = getWaitlistSecret();
  if (!secret) return null;
  return createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isCorrectWaitlistAccessCode(rawInput: string): boolean {
  const expected = getConfiguredWaitlistCode();
  if (!expected) {
    return false;
  }
  return safeEqual(rawInput.trim(), expected);
}

export function isWaitlistGateConfigured(): boolean {
  return Boolean(getConfiguredWaitlistCode());
}

function buildWaitlistCookieValue(userId: string): string {
  const payload = `${userId}:${Math.floor(Date.now() / 1000)}`;
  const signature = signWaitlistPayload(payload);
  if (!signature) {
    throw new Error("Missing WAITLIST_ACCESS_CODE.");
  }
  return `${payload}.${signature}`;
}

function verifyWaitlistCookieValue(
  value: string | undefined,
  userId: string,
): boolean {
  if (!value) return false;
  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex <= 0) return false;

  const payload = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  const payloadUserId = payload.split(":")[0];
  if (!payloadUserId || payloadUserId !== userId) return false;

  const expectedSignature = signWaitlistPayload(payload);
  if (!expectedSignature) return false;
  return safeEqual(signature, expectedSignature);
}

export async function isWaitlistAccessGrantedForUser(userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(WAITLIST_COOKIE_NAME)?.value;
  return verifyWaitlistCookieValue(value, userId);
}

export async function setWaitlistAccessCookieForUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(WAITLIST_COOKIE_NAME, buildWaitlistCookieValue(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WAITLIST_COOKIE_MAX_AGE_SECONDS,
  });
}
