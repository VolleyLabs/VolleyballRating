// EN: Exchanges verified Telegram initData for a Supabase session (no real email needed).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, UserInsert } from "../../../../../database.types";
import { createHmac } from "node:crypto";
import type {
  TelegramAuthResponse,
  TelegramAuthErrorResponse,
} from "../../../types/telegram-auth";

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
  is_bot?: boolean;
};

function validateTelegramInitData(initDataRaw: string, botToken: string) {
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get("hash");
  if (!hash) throw new Error("hash-missing");

  // Remove hash from params for validation
  params.delete("hash");

  // Sort parameters alphabetically and build data_check_string
  const sortedParams = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const dataCheckString = sortedParams
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // Secret key = HMAC_SHA256(bot_token, "WebAppData")
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  // Verify signature: HMAC_SHA256(data_check_string, secret_key)
  const calculatedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) throw new Error("signature-invalid");

  // Check auth_date
  const authDate = parseInt(params.get("auth_date") || "0", 10);
  const currentTime = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate)) throw new Error("auth-date-invalid");
  if (currentTime - authDate > 3600) throw new Error("expired");

  const userString = params.get("user");
  if (!userString) throw new Error("user-missing");

  const user = JSON.parse(userString) as TelegramUser;
  return { user };
}

export async function POST(req: NextRequest) {
  const { initDataRaw } = await req.json();

  // 1) Verify Telegram initData on server (HMAC using "WebAppData" key)
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  let tg: TelegramUser;
  try {
    const { user } = validateTelegramInitData(initDataRaw, botToken);
    tg = user;
  } catch {
    return NextResponse.json<TelegramAuthErrorResponse>(
      { error: "invalid-init-data" },
      { status: 401 }
    );
  }

  // 2) Build deterministic synthetic email (RFC 2606 reserved TLD ".invalid")
  //    EN: never deliverable; used as unique identifier only.
  const email = `${tg.id}@telegram.invalid`;

  // 3) Ensure user exists (Admin API, server-only service_role)
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // EN: Idempotent "create", ignore conflict if user already exists.
  await admin.auth.admin
    .createUser({
      email,
      email_confirm: true, // EN: mark as confirmed so no email flow is required
      user_metadata: { tg_id: tg.id, username: tg.username ?? null },
      app_metadata: { tg_id: tg.id },
    })
    .catch(() => {
      // conflict -> ok
    });

  // 3b) Upsert Telegram user profile into public.users
  const userRecord: UserInsert = {
    id: tg.id,
    first_name: tg.first_name,
    last_name: tg.last_name ?? null,
    username: tg.username ?? null,
    photo_url: tg.photo_url ?? null,
    language_code: tg.language_code ?? null,
    is_premium: tg.is_premium ?? null,
    allows_write_to_pm: tg.allows_write_to_pm ?? null,
    is_bot: tg.is_bot ?? false,
    last_auth: new Date().toISOString(),
  };

  const { error: upsertError } = await admin
    .from("users")
    .upsert(userRecord, { onConflict: "id" });
  if (upsertError) {
    console.error("Error upserting user:", upsertError);
    return NextResponse.json(
      { error: "Failed to upsert user" },
      { status: 500 }
    );
  }

  // 4) Generate magic link to obtain token_hash (no email is sent)
  const { data: gen, error: genErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (genErr)
    return NextResponse.json<TelegramAuthErrorResponse>(
      { error: genErr.message },
      { status: 500 }
    );
  const tokenHash =
    (
      gen?.properties as
        | { token_hash?: string; hashed_token?: string }
        | undefined
    )?.token_hash ??
    (gen?.properties as { hashed_token?: string } | undefined)?.hashed_token ??
    "";
  if (!tokenHash)
    return NextResponse.json<TelegramAuthErrorResponse>(
      { error: "missing-token-hash" },
      { status: 500 }
    );

  // 5) Exchange token_hash -> Supabase session (public client)
  const pub = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error: verifyErr } = await pub.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (verifyErr || !data.session)
    return NextResponse.json<TelegramAuthErrorResponse>(
      { error: verifyErr?.message ?? "no-session" },
      { status: 500 }
    );

  // 6) Check admin flag from database
  const { data: adminRow, error: adminErr } = await admin
    .from("users")
    .select("admin")
    .eq("id", tg.id)
    .single();
  if (adminErr) {
    console.error("Error fetching admin status:", adminErr);
  }
  const isAdmin = adminRow?.admin === true;

  // 7) Return session tokens to the client (use supabase.auth.setSession on client)
  const { access_token, refresh_token, expires_in } = data.session;
  return NextResponse.json<TelegramAuthResponse>({
    access_token,
    refresh_token,
    expires_in,
    isAdmin,
  });
}
