import { NextResponse } from 'next/server';
import { createVoting, dayOfWeekToNumber, GameLocation, GameSchedule, getActiveVotings, getGameLocations, getActiveGameSchedules, stripSeconds, Voting, VotingState } from "@/app/lib/supabase-queries";
import { pinVoting, startVoting } from '@/app/telegram/api';
import { getTimeString } from '@/app/utils/date';

export async function GET() {
    const now = new Date();
    const schedules = await getActiveGameSchedules();
    const locations = (await getGameLocations()).reduce((acc, location) => {
      acc[location.id] = location;
      return acc;
    }, {} as Record<string, GameLocation>);
    const votings = (await getActiveVotings()).reduce((acc, voting) => {
      acc[voting.game_schedule_id] = voting;
      return acc;
    }, {} as Record<string, Voting>);
    const gameToStartVoting = findScheduleToStartVoting(now, schedules, votings)
    if (gameToStartVoting === null) {
      return NextResponse.json({})
    }
    await createAndStartVoting(gameToStartVoting, now, locations)

  return NextResponse.json({})
}

const findScheduleToStartVoting = (now: Date, schedules: GameSchedule[], votings: Record<string, Voting>): GameSchedule | null => {
  const currentTime = getTimeString(now)
  const todayDayOfWeek = now.getDay();
  for (const schedule of schedules) {
    const votingDate = ((dayOfWeekToNumber(schedule.day_of_week) + 7 - schedule.voting_in_advance_days) % 7);
    if (todayDayOfWeek === votingDate && currentTime === stripSeconds(schedule.voting_time) && !votings[schedule.id]) {
      console.log('Game schedule was found')
      return schedule;
    }
  }
  console.log('Game schedule was not found')
  return null;
}

/*
  1) post voting in the telegram
  2) pin it in 5 seconds
  3) create voting in the database
*/
const createAndStartVoting = async (schedule: GameSchedule, now: Date, locations: Record<string, GameLocation>) => {
  const message = await startVoting(schedule, locations[schedule.location])
  setTimeout(() => pinVoting(process.env.CHAT_ID!, message.message_id), 5000)
  await createVoting({
    game_time: getGameTime(now, schedule),
    state: VotingState.ACTIVE,
    chat_id: process.env.CHAT_ID!,
    poll_id: message.poll.id,
    game_schedule_id: schedule.id
  });
}

// now, schedule => HH:mm of the game
const getGameTime = (now: Date, gameSchedule: GameSchedule) => {
  const gameTime = new Date(now);
  gameTime.setDate(gameTime.getDate() + gameSchedule.voting_in_advance_days);
  const [gameHoursStr, gameMinutesStr] = gameSchedule.time.split(':');
  const gameHours = parseInt(gameHoursStr, 10);
  const gameMinutes = parseInt(gameMinutesStr, 10);
  gameTime.setHours(gameHours);
  gameTime.setMinutes(gameMinutes);
  gameTime.setSeconds(0);
  gameTime.setMilliseconds(0);
  return gameTime;
}

// This prevents requests with methods other than GET
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}