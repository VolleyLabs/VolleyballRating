import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    // Parse the initData string
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      return NextResponse.json({ error: "Hash is missing" }, { status: 400 });
    }

    // Remove hash from params for validation
    params.delete("hash");

    // Sort parameters alphabetically as required by Telegram
    const sortedParams = Array.from(params.entries()).sort();

    // Create data check string as described in Telegram docs
    const dataCheckString = sortedParams
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // Generate secret key from bot token
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "Bot token not configured" },
        { status: 500 }
      );
    }

    // Create secret key = HMAC_SHA256(bot_token, "WebAppData")
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Verify signature: HMAC_SHA256(data_check_string, secret_key)
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Compare calculated hash with received hash
    if (calculatedHash !== hash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Check auth_date to prevent replay attacks
    const authDate = parseInt(params.get("auth_date") || "0");
    const currentTime = Math.floor(Date.now() / 1000);

    // Reject if auth_date is more than 1 hour old
    if (currentTime - authDate > 3600) {
      return NextResponse.json(
        { error: "Authentication data expired" },
        { status: 401 }
      );
    }

    // Extract user data
    const userString = params.get("user");
    if (!userString) {
      return NextResponse.json({ error: "User data missing" }, { status: 400 });
    }

    interface TelegramUserData {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      language_code?: string;
      is_premium?: boolean;
      allows_write_to_pm?: boolean;
      is_bot?: boolean;
    }

    const userData = JSON.parse(userString) as TelegramUserData;

    // Create Supabase admin client to interact with database
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Check if user exists or create/update them
    // Prepare user record for upsert (insert or update)
    const userRecord = {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name || null,
      username: userData.username || null,
      photo_url: userData.photo_url || null,
      language_code: userData.language_code || null,
      is_premium: userData.is_premium ?? null,
      allows_write_to_pm: userData.allows_write_to_pm ?? null,
      is_bot: userData.is_bot ?? false,
      last_auth: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert(userRecord, { onConflict: "id" });

    if (upsertError) {
      console.error("Error upserting user:", upsertError);
      return NextResponse.json(
        { error: "Failed to upsert user" },
        { status: 500 }
      );
    }

    // Check if user has admin flag in users table
    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from("users")
      .select("admin")
      .eq("id", userData.id)
      .single();

    if (adminErr) {
      console.error("Error fetching admin status:", adminErr);
    }

    const isAdmin = adminRow?.admin === true;

    // Generate JWT with Supabase JWT secret
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!supabaseJwtSecret) {
      return NextResponse.json(
        { error: "JWT secret not configured" },
        { status: 500 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const sessionId = crypto.randomUUID();
    const payload = {
      iss: `${supaUrl}/auth/v1`,
      iat: now,
      aud: "authenticated",
      role: "authenticated",
      user_role: "user",
      sub: userData.id.toString(),
      email: `${userData.id}@telegram.user`, // Using fake email for compatibility
      exp: now + 24 * 60 * 60, // 24 hours
      aal: "aal1",
      amr: [
        {
          method: "telegram",
          timestamp: now,
        },
      ],
      session_id: sessionId,
      is_anonymous: false,
      user_metadata: {
        telegram_id: userData.id,
        telegram_username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_admin: isAdmin, // Add admin status to user_metadata
      },
      app_metadata: {
        provider: "telegram",
        providers: ["telegram"],
      },
    };

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode(supabaseJwtSecret));

    return NextResponse.json({ token, isAdmin });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
