import { bot } from "@/app/telegram/bot"
import "@/app/telegram/handlers"
import { NextResponse } from "next/server"

let botIsRunning = false;

export async function GET() {
  if (process.env.NODE_ENV !== 'production' && !botIsRunning) {
    bot.start()
    console.log("🤖 Bot is running in long polling mode (development)");
    botIsRunning = true
  }
  return NextResponse.json({})
}