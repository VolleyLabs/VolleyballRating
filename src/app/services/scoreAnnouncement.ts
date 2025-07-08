import { AudioPlaylist } from "./audioPlaylist";
import { isControlBall, isMatchOver } from "./gameLogic";
import { announceScoreWithTTS } from "./ttsService";

// Score announcement functions - volleyball rules
// В волейболе принято объявлять счет в порядке: подающая команда - принимающая команда
// Если не знаем кто подает, объявляем сначала команду которая только что забила очко
export const announceScoreVolleyball = (
  leftScore: number,
  rightScore: number,
  leftScored: boolean,
  rightScored: boolean,
  audioPlaylist: AudioPlaylist,
  servingTeam?: "left" | "right"
) => {
  console.log(
    `Volleyball score announcement: ${leftScore}-${rightScore}, left scored: ${leftScored}, right scored: ${rightScored}`
  );

  // Stop any currently playing audio and clear queue
  audioPlaylist.stop();

  // Reset interrupted flag to allow new playback
  audioPlaylist.resetInterruption();

  // Add a small pause first
  audioPlaylist.addToQueue("pause.ogg");

  // Volleyball rules for score announcement:
  // 1. If we know who's serving, announce serving team first
  // 2. If we don't know who's serving, announce the team that just scored first
  // 3. This follows international volleyball conventions
  if (servingTeam === "left" || (!servingTeam && leftScored)) {
    // Left team is serving or just scored - announce left score first
    audioPlaylist.addToQueue(`${leftScore}.ogg`);
    audioPlaylist.addToQueue(`${rightScore}.ogg`);
  } else if (servingTeam === "right" || (!servingTeam && rightScored)) {
    // Right team is serving or just scored - announce right score first
    audioPlaylist.addToQueue(`${rightScore}.ogg`);
    audioPlaylist.addToQueue(`${leftScore}.ogg`);
  } else {
    // Fallback: announce left then right
    audioPlaylist.addToQueue(`${leftScore}.ogg`);
    audioPlaylist.addToQueue(`${rightScore}.ogg`);
  }

  // Check for special conditions
  if (isControlBall(leftScore, rightScore)) {
    audioPlaylist.addToQueue("controlball.ogg");
  }

  if (isMatchOver(leftScore, rightScore)) {
    audioPlaylist.addToQueue("win.ogg");
  }
};

// Простая функция для объявления текущего счета (без определения кто забил)
export const announceCurrentScore = (
  leftScore: number,
  rightScore: number,
  audioPlaylist: AudioPlaylist
) => {
  console.log(`Announcing current score: ${leftScore}-${rightScore}`);

  // Stop any currently playing audio and clear queue
  audioPlaylist.stop();

  // Reset interrupted flag to allow new playback
  audioPlaylist.resetInterruption();

  audioPlaylist.addToQueue("pause.ogg");

  audioPlaylist.addToQueue(`${leftScore}.ogg`);
  audioPlaylist.addToQueue(`${rightScore}.ogg`);

  if (isControlBall(leftScore, rightScore)) {
    audioPlaylist.addToQueue("controlball.ogg");
  }

  if (isMatchOver(leftScore, rightScore)) {
    audioPlaylist.addToQueue("win.ogg");
  }
};

// Combined announcement using both OGG and TTS as fallback
export const announceScoreWithFallback = async (
  leftScore: number,
  rightScore: number,
  leftScored: boolean,
  rightScored: boolean,
  audioPlaylist: AudioPlaylist,
  servingTeam?: "left" | "right",
  preferTTS: boolean = false
): Promise<void> => {
  if (preferTTS) {
    // Use TTS first
    try {
      await announceScoreWithTTS(
        leftScore,
        rightScore,
        leftScored,
        rightScored,
        servingTeam
      );
    } catch (error) {
      console.warn("TTS announcement failed, falling back to OGG:", error);
      announceScoreVolleyball(
        leftScore,
        rightScore,
        leftScored,
        rightScored,
        audioPlaylist,
        servingTeam
      );
    }
  } else {
    // Use OGG files first (default behavior)
    announceScoreVolleyball(
      leftScore,
      rightScore,
      leftScored,
      rightScored,
      audioPlaylist,
      servingTeam
    );
  }
};

// Announce special events
export const announceSpecialEvent = (
  event: "whistle" | "win" | "pause" | "controlball",
  audioPlaylist: AudioPlaylist
) => {
  console.log(`Announcing special event: ${event}`);

  // Don't interrupt for whistle and pause, but do interrupt for important events
  const shouldInterrupt = event === "win" || event === "controlball";

  if (shouldInterrupt) {
    audioPlaylist.stop();
    audioPlaylist.resetInterruption();
  }

  audioPlaylist.addToQueue(`${event}.ogg`);
};

// Announce timeout or break
export const announceTimeout = (audioPlaylist: AudioPlaylist) => {
  announceSpecialEvent("whistle", audioPlaylist);
  announceSpecialEvent("pause", audioPlaylist);
};

// Announce end of set/match
export const announceMatchEnd = (
  finalLeftScore: number,
  finalRightScore: number,
  audioPlaylist: AudioPlaylist
) => {
  console.log(`Announcing match end: ${finalLeftScore}-${finalRightScore}`);

  audioPlaylist.stop();
  audioPlaylist.resetInterruption();

  // Final score announcement
  audioPlaylist.addToQueue("pause.ogg");
  audioPlaylist.addToQueue(`${finalLeftScore}.ogg`);
  audioPlaylist.addToQueue(`${finalRightScore}.ogg`);
  audioPlaylist.addToQueue("win.ogg");
};

// Create a score announcement queue without immediately playing
export const createScoreAnnouncementQueue = (
  leftScore: number,
  rightScore: number,
  leftScored: boolean,
  rightScored: boolean,
  servingTeam?: "left" | "right"
): string[] => {
  const queue: string[] = [];

  queue.push("pause.ogg");

  // Determine order based on volleyball rules
  if (servingTeam === "left" || (!servingTeam && leftScored)) {
    queue.push(`${leftScore}.ogg`);
    queue.push(`${rightScore}.ogg`);
  } else if (servingTeam === "right" || (!servingTeam && rightScored)) {
    queue.push(`${rightScore}.ogg`);
    queue.push(`${leftScore}.ogg`);
  } else {
    queue.push(`${leftScore}.ogg`);
    queue.push(`${rightScore}.ogg`);
  }

  // Add special conditions
  if (isControlBall(leftScore, rightScore)) {
    queue.push("controlball.ogg");
  }

  if (isMatchOver(leftScore, rightScore)) {
    queue.push("win.ogg");
  }

  return queue;
};
