import { bot } from "@/app/telegram/bot"
import "@/app/telegram/handlers"
import { NextResponse } from "next/server"


export async function GET() {
  // do nothing
  return NextResponse.json({})
}