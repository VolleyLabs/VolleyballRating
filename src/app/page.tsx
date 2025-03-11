import Hello from './components/hello';
import { createClient } from '@/app/utils/supabase/server'
import { cookies } from 'next/headers'
import { Players, Votes } from './utils/supabase/api-client/models';


export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: players } = await supabase.from('players').select()
  // Fetch votes and join with players
  const { data: votes } = await supabase
    .from('votes')
    .select('id, playerA, playerB, winnerId, createdAt, playerAData:playerA(*), playerBData:playerB(*), winnerData:winnerId(*)')

  return (
    <ul>
      <Hello />
      <br />
      <br />
      {"Players:"}
      {players?.map((player: Players) => (
        <li key={player.id}>{player.name}</li>
      ))}
      <br />
      <br />
      {"Votes:"}
      {votes?.map((vote: Votes) => (
        <li key={vote.id}>{vote.playerA} {vote.playerB} {vote.winnerId}</li>
      ))}
    </ul>
  )
}