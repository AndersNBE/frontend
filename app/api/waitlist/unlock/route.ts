import { NextResponse } from "next/server";
import {
  isCorrectWaitlistAccessCode,
  isWaitlistGateConfigured,
  setWaitlistAccessCookieForUser,
} from "../../../lib/waitlist-gate";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type UnlockRequestBody = {
  password?: unknown;
};

export async function POST(request: Request) {
  if (!isWaitlistGateConfigured()) {
    return NextResponse.json(
      { error: "Waitlist gate is not configured on the server." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 },
    );
  }

  let body: UnlockRequestBody;
  try {
    body = (await request.json()) as UnlockRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const password =
    typeof body.password === "string" ? body.password : "";

  if (!isCorrectWaitlistAccessCode(password)) {
    return NextResponse.json(
      { error: "Invalid access code." },
      { status: 401 },
    );
  }

  await setWaitlistAccessCookieForUser(user.id);
  return NextResponse.json({ ok: true });
}
