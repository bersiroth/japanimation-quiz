import { useGameStore } from '../stores/gameStore.ts';
import AnimeCard from './AnimeCard.tsx';

function GameSongs() {
  const gameStore = useGameStore();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col flex-wrap gap-2 md:flex-row">
        {gameStore.songs?.map((animeSong, index) => (
          <AnimeCard
            key={index}
            hiddenLg={index === 3}
            hiddenXl={index > 3}
            animeSong={animeSong}
            withButton={false}
            withText={false}
            small={true}
          />
        ))}
      </div>
    </div>
  );
}

export default GameSongs;
