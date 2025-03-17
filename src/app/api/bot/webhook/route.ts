import { bot } from "@/app/telegram/bot"
import "@/app/telegram/handlers"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.text();
  const update = JSON.parse(body);
  await bot.handleUpdate(update);
  return new Response("ok", { status: 200 });
}