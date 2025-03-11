import Hello from './components/hello';
import { createClient } from '@/app/utils/supabase/server'
import { cookies } from 'next/headers'

interface Player {
  id: number;
  name: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
}

// interface Vote {
//   id: number;
//   playerA: number;
//   playerB: number;
//   winnerId: number;
//   createdAt: string;
//   playerAData: Player;
//   playerBData: Player;
//   winnerData: Player;
// }

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: players } = await supabase.from('players').select()
  // Fetch votes and join with players
  // const { data: votes } = await supabase
  //   .from('votes')
  //   .select('id, playerA, playerB, winnerId, createdAt, playerAData:playerA(*), playerBData:playerB(*), winnerData:winnerId(*)')

  return (
    <ul>
      <Hello />
      <br />
      <br />
      {"Players:"}
      {players?.map((player: Player) => (
        <li key={player.id}>{player.name}</li>
      ))}
      <br />
      <br />
      {"Votes:"}
      {/* {votes?.map((vote: Vote) => (
        <li key={vote.id}>{vote.playerA} {vote.playerB} {vote.winnerId}</li>
      ))} */}
    </ul>
  )
}