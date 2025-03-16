import { Bot } from "grammy";
export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

if (process.env.NODE_ENV !== 'production') {
  bot.start()
  console.log("🤖 Bot is running in long polling mode (development)");
}