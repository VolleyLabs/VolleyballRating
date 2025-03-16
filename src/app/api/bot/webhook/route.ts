import { bot } from "@/app/telegram/bot"
import "@/app/telegram/handlers"
import { webhookCallback } from "grammy"

export const config = { api: { bodyParser: false } }

export default webhookCallback(bot, "next-js")
