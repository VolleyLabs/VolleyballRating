import { closeVoting, getActiveVotings, getGameSchedule, getUsersByIds, getVotingPlayers, Voting } from '@/app/lib/supabase-queries';
import { notifyPlayers } from '@/app/telegram/api';
import { NextResponse } from 'next/server';
import "@/app/telegram/handlers"

export async function GET() {
  const now = new Date();
  const votings = await getActiveVotings()
    await Promise.all(
          votings
            .filter(v => isSameDay(now, v.game_time))
            .map(v => notifyAndCloseVoting(v))
    )
  return NextResponse.json({})
}

const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

const notifyAndCloseVoting = async (voting: Voting) => {
  const schedule = await getGameSchedule(voting.game_schedule_id)
  const players = (await getVotingPlayers(voting.id)).slice(0, schedule.players_count)
  const users = await getUsersByIds(players.map(p => p.player_id))
  notifyPlayers(voting, users)
  closeVoting(voting)
}

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