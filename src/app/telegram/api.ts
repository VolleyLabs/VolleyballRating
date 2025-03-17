import { BotError } from "grammy";
import { DayOfWeek, GameLocation, GameSchedule, stripSeconds, UserDbType, Voting } from "../lib/supabase-queries";
import { getTimeString } from "../utils/date";
import { bot } from "./bot";

export const startVoting = async (gameSchedule: GameSchedule, location: GameLocation) => {
  
  const russianDayOfWeek = dayOfWeekToRussian(gameSchedule.day_of_week)
  const [gameHoursStr, gameMinutesStr] = gameSchedule.time.split(':');
  const gameHours = parseInt(gameHoursStr, 10);
  const gameMinutes = parseInt(gameMinutesStr, 10);
  const endHour = ((gameHours + Math.floor(gameSchedule.duration_minutes / 60)) % 24).toString().padStart(2, '0');
  const endMinute = ((gameMinutes + gameSchedule.duration_minutes) % 60).toString().padStart(2, '0');

  const gameDate = new Date();
  gameDate.setDate(gameDate.getDate() + gameSchedule.voting_in_advance_days);
  const gameDay = gameDate.getDate().toString().padStart(2, '0');
  const gameMonth = (gameDate.getMonth() + 1).toString().padStart(2, '0');


  const message = `${russianDayOfWeek}, ${gameDay}.${gameMonth}! Волейбол в зале ${location.name} с ${stripSeconds(gameSchedule.time)} до ${endHour}:${endMinute}`
  return bot.api.sendPoll(process.env.CHAT_ID!, message, [
    {text: 'Играю!'},
    {text: 'Пропускаю. Но очень хочу играть'},
  ], {is_anonymous: false})
}

const dayOfWeekToRussian = (dayOfWeek: DayOfWeek): string => {
  switch (dayOfWeek) {
    case DayOfWeek.MONDAY:
      return 'Понедельник';
    case DayOfWeek.TUESDAY:
      return 'Вторник';
    case DayOfWeek.WEDNESDAY:
      return 'Среда';
    case DayOfWeek.THURSDAY:
      return 'Четверг';
    case DayOfWeek.FRIDAY:
      return 'Пятница';
    case DayOfWeek.SATURDAY:
      return 'Суббота';
    case DayOfWeek.SUNDAY:
      return 'Воскресенье';
  }
};

export const pinVoting = async (chatId: string, message_id: number) => {
  return await bot.api.pinChatMessage(chatId, message_id)
}

export const notifyPlayers = async (voting: Voting, users: UserDbType[]) => {
  return await bot.api.sendMessage(
    process.env.CHAT_ID!,
    `Сегодня на игру в ${getTimeString(voting.game_time)} приглашаются:
${users.map((u,i) => `Игрок #${i + 1} @${u.username} ${u.first_name}`).join('\n')}`
  )
}

export const notifyOneOutOneIn = async (userOut: UserDbType, userIn: UserDbType) => {
  return await bot.api.sendMessage(
    process.env.CHAT_ID!,
    `Снялся @${userOut.username}. В игру вступает @${userIn.username} ${userIn.first_name}`
  )
}

export const notifyOneOut = async (userOut: UserDbType) => {
  return await bot.api.sendMessage(
    process.env.CHAT_ID!,
    `Снялся @${userOut.username}. Замены нет`
  )
}

export const notifyOneOutWarning = async (userOut: UserDbType, required: number, actual: number) => {
  return await bot.api.sendMessage(
    process.env.CHAT_ID!,
    `Снялся @${userOut.username}. Недостаточно игроков для начала игры! Требуется ${required}, участвуют ${actual}`
  )
}

export const notifyOneInWarning = async (userIn: UserDbType, required: number, actual: number) => {
  return await bot.api.sendMessage(
    process.env.CHAT_ID!,
    `В игру вступает @${userIn.username}. Все еще недостаточно игроков для начала игры! Требуется ${required}, участвуют ${actual}`
  )
}

export const notifyOneInSafe = async (userIn: UserDbType) => {
  return await bot.api.sendMessage(
    process.env.CHAT_ID!,
    `В игру вступает @${userIn.username}. Достаточно игроков для начала игры!`
  )
}

export const notifyOneIn = async (userIn: UserDbType) => {
  return await bot.api.sendMessage(
    process.env.CHAT_ID!,
    `В игру вступает @${userIn.username}`
  )
}
export const notifyAdminAboutError = async (chatId: string, error: BotError) => {
  return await bot.api.sendMessage(chatId, `Error in telegram bot: ${error}`)
}