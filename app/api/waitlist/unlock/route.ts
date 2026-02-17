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
      { error: "Waitlist gate er ikke konfigureret paa serveren." },
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
      { error: "Du skal vaere logget ind." },
      { status: 401 },
    );
  }

  let body: UnlockRequestBody;
  try {
    body = (await request.json()) as UnlockRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Ugyldig request payload." },
      { status: 400 },
    );
  }

  const password =
    typeof body.password === "string" ? body.password : "";

  if (!isCorrectWaitlistAccessCode(password)) {
    return NextResponse.json(
      { error: "Forkert adgangskode." },
      { status: 401 },
    );
  }

  await setWaitlistAccessCookieForUser(user.id);
  return NextResponse.json({ ok: true });
}
