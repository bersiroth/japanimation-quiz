import Card from '../components/Card.tsx';
import { GameStatus, useGameStore } from '../stores/gameStore.ts';
import GamePlayers from '../components/GamePlayers.tsx';
import GameSongs from '../components/GameSongs.tsx';
import GameInit from '../components/GameInit.tsx';
import GameState from '../components/GameState.tsx';

function GamePage() {
  const gameStore = useGameStore();

  return (
    <div className="flex flex-col flex-wrap gap-8 p-2 py-7 sm:mx-auto sm:max-w-7xl sm:p-5">
      <div className="flex flex-col justify-between gap-10 py-2 sm:flex-row">
        <Card title="Game">
          {gameStore.state !== GameStatus.Init && <GameState />}
          {gameStore.state === GameStatus.Init && <GameInit />}
        </Card>
        <Card title="Player">
          <GamePlayers />
        </Card>
      </div>
      <Card title="Last songs" size={'full'}>
        <GameSongs />
      </Card>
    </div>
  );
}

export default GamePage;
