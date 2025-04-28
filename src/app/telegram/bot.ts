import { Bot } from "grammy";
import { getAdminUsers } from "../lib/supabase-queries";
import { notifyAdminAboutError } from "./api";
export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.catch(async (err) => {
  console.error("Error in telegram bot:", err.error);
  try {
    const admins = await getAdminUsers();
    admins
      .filter((a) => a.chat_id)
      .forEach((a) => notifyAdminAboutError(a.chat_id!, err));
  } catch (e) {
    console.error("Can't get a list of admins to notify about error", e);
  }
});
