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

    const userData = JSON.parse(userString);

    // Create Supabase admin client to interact with database
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Check if user exists or create them
    const { data: existingUser, error: userQueryError } = await supabaseAdmin
      .from("users")
      .select()
      .eq("id", userData.id)
      .single();

    if (userQueryError && userQueryError.code !== "PGRST116") {
      console.error("Error checking user:", userQueryError);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      );
    }

    if (!existingUser) {
      // Insert user into database
      const { error: insertError } = await supabaseAdmin.from("users").insert({
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name || null,
        username: userData.username || null,
        photo_url: userData.photo_url || null,
      });

      if (insertError) {
        console.error("Error creating user:", insertError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("user_id", userData.id)
      .single();

    const isAdmin = !!adminData && !adminError;

    // Generate JWT with Supabase JWT secret
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!supabaseJwtSecret) {
      return NextResponse.json(
        { error: "JWT secret not configured" },
        { status: 500 }
      );
    }

    const payload = {
      aud: "authenticated",
      role: "authenticated",
      sub: userData.id.toString(),
      email: `${userData.id}@telegram.user`, // Using fake email for compatibility
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      user_metadata: {
        telegram_id: userData.id,
        telegram_username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_admin: isAdmin, // Add admin status to user_metadata
      },
      app_metadata: {
        role: isAdmin ? "admin" : "user", // Add role to app_metadata for RLS
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
