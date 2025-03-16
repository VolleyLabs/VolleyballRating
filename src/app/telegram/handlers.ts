import { bot } from "./bot";
import {
  addVotingPlayer,
  getVotingByPollId,
  getVotingPlayers,
  deleteVotingPlayer,
  getGameSchedule,
  getUser,
} from "../lib/supabase-queries";
import {
  notifyOneIn,
  notifyOneInSafe,
  notifyOneInWarning,
  notifyOneOut,
  notifyOneOutOneIn,
  notifyOneOutWarning,
} from "./api";

const MIN_PLAYERS_COUNT = 12;

bot.on("message:text", async (ctx) => {
  console.log("Received message");
  if (ctx.message.chat.id.toString() === process.env.CHAT_ID!) {
    return;
  }
  if (ctx.message.text.startsWith("/start")) {
    console.log("Received /start command");
    ctx.reply("Welcome! Click the button below to launch the Mini App", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Open Mini App 🚀",
              web_app: { url: process.env.NEXT_PUBLIC_APP_URL || "https://volleyball-rating.vercel.app" },
            },
          ],
        ],
      },
    });
  }
});

bot.on("poll_answer", async (ctx) => {
  const pollId = ctx.pollAnswer.poll_id;
  const userId = ctx.pollAnswer.user!.id;
  const user = await getUser(userId);
  const votedToPlay = ctx.pollAnswer.option_ids.includes(0);
  const voting = await getVotingByPollId(pollId);
  if (!voting) {
    console.log("Voting not found");
    return;
  }
  const schedule = await getGameSchedule(voting.game_schedule_id);
  const votingPlayers = await getVotingPlayers(voting.id);
  const gamePlayers = votingPlayers.slice(0, schedule.players_count);
  const alreadyVoted = votingPlayers.filter((p) => p.player_id === userId)[0];
  const alreadyPlaying = gamePlayers.filter((p) => p.player_id === userId)[0];
  if (votedToPlay && !alreadyVoted) {
    console.log("adding user", userId, "to voting", voting.id);
    await addVotingPlayer({ voting_id: voting.id, player_id: userId });
    if (voting.state === "CLOSED") {
      const gamePlayersAfterJoining = gamePlayers.length + 1;
      if (gamePlayersAfterJoining < MIN_PLAYERS_COUNT) {
        // кто-то добавился но игроков не хватает
        notifyOneInWarning(user, MIN_PLAYERS_COUNT, gamePlayersAfterJoining);
      } else if (gamePlayersAfterJoining == MIN_PLAYERS_COUNT) {
        // кто-то добавился, ровно 12 игра состоится
        notifyOneInSafe(user);
      } else if (gamePlayersAfterJoining <= schedule.players_count) {
        // кто-то добавился в игру
        notifyOneIn(user);
      }
    }
  } else if (!votedToPlay && alreadyVoted) {
    console.log("removing user", userId, "from voting", voting.id);
    await deleteVotingPlayer(alreadyVoted);
    if (alreadyPlaying && voting.state === "CLOSED") {
      const gamePlayersAfterLeaving = gamePlayers.length - 1;
      const votingPlayersAfterLeaving = votingPlayers.length - 1;
      if (gamePlayersAfterLeaving < MIN_PLAYERS_COUNT) {
        // не хватает игроков, игра будет отменена
        notifyOneOutWarning(user, MIN_PLAYERS_COUNT, gamePlayersAfterLeaving);
      } else if (gamePlayersAfterLeaving < votingPlayersAfterLeaving) {
        // кто-то снялся, есть замена
        const userIn = await getUser(votingPlayers[gamePlayersAfterLeaving + 1].player_id);
        notifyOneOutOneIn(user, userIn);
      } else {
        // кто-то снялся, замены нет
        notifyOneOut(user);
      }
    }
  }
});
