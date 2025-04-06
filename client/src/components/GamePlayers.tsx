import { player, useGameStore } from '../stores/gameStore.ts';

function GamePlayers() {
  const gameStore = useGameStore();
  return (
    <>
      {Object.entries(gameStore.players).map(
        ([id, player]: [string, player]) => {
          return (
            <div
              key={id}
              className={`text-s flex flex-row ${player.hasAnsweredCorrectly ? 'text-green-500' : ''} ${id === gameStore.me.id ? 'bg-red-300/20' : ''} mb-2 border-b-2 border-red-900 p-2`}
            >
              <div className="w-4/5">{player.name}</div>
              <div>{player.score} Pts</div>
            </div>
          );
        }
      )}
    </>
  );
}

export default GamePlayers;
