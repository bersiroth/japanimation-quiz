import { GameStatus, useGameStore } from '../stores/gameStore.ts';
import { useState } from 'react';

function GameInit() {
  const gameStore = useGameStore();
  const [nickname, setNickname] = useState('');
  return (
    <>
      {gameStore.me.nickname && (
        <>
          <div className="flex justify-center">
            Hello {gameStore.me.nickname} !
          </div>
          <div className="flex justify-center pb-5">
            Would you like to play ?
          </div>
          <button
            className="rounded bg-red-600 p-2 text-zinc-200"
            onClick={() => {
              gameStore.setState(GameStatus.Waiting);
            }}
          >
            JOIN GAME
          </button>
        </>
      )}
      {!gameStore.me.nickname && (
        <>
          <div className="flex flex-row gap-4 pb-3">
            <label htmlFor="nickname" className={`w-28 p-1 text-right`}>
              Nickname
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (nickname.length > 0) {
                    gameStore.setNickname(nickname);
                    gameStore.setState(GameStatus.Waiting);
                  }
                }
              }}
              className={`w-2/3 rounded-md border border-slate-200 p-1 shadow-sm hover:border-slate-300 focus:border-slate-400 focus:shadow focus:outline-none`}
            />
          </div>
          <button
            className="rounded bg-red-600 p-2 text-zinc-200"
            onClick={() => {
              if (nickname.length > 0) {
                gameStore.setNickname(nickname);
                gameStore.setState(GameStatus.Waiting);
              }
            }}
          >
            JOIN GAME
          </button>
        </>
      )}
    </>
  );
}

export default GameInit;
