import { GameEvent, GameStatus, useGameStore } from '../stores/gameStore.ts';
import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import GameInput from './GameInput.tsx';
import GameCountdown from './GameCountdown.tsx';

function GameState() {
  const gameStore = useGameStore();

  const { sendJsonMessage } = useWebSocket(
    'ws://127.0.0.1:8080/ws/game',
    {
      queryParams: {
        id: gameStore.me.id ? gameStore.me.id : '',
        nickname: gameStore.me.nickname ? gameStore.me.nickname : '',
      },
      onOpen: () => console.log('game opened'),
      onError: (event) => console.error('game error', event),
      onClose: () => audio.current.pause(),
      onMessage: (event: MessageEvent<string>) => {
        const gameEvent: GameEvent = JSON.parse(event.data) as GameEvent;
        console.log('game event', gameEvent);
        gameStore.handleServerMessage(gameEvent);
      },
    },
    gameStore.state !== GameStatus.Init
  );

  useEffect(() => {
    switch (gameStore.state) {
      case GameStatus.Question: {
        gameStore.resetAnswers();
        setAnimeAnswer('');
        setSongAnswer('');
        setKindAnswer('opening');
        setBandAnswer('');
        audio.current.pause();
        audio.current.currentTime = 30 - gameStore.remainingTime;
        audio.current.src = 'http://localhost:8080/' + gameStore.audioUrl;
        const playAudio = async () => {
          await audio.current.play();
        };
        playAudio().catch((reason) => console.log(reason));
        setInitialRemainingTime(gameStore.remainingTime);
        setKey((prevState) => prevState + 1);
        setPlay(true);
        break;
      }
      case GameStatus.Answer:
        audio.current.pause();
        setInitialRemainingTime(0);
        setKey((prevState) => prevState + 1);
        setPlay(true);
        break;
    }
  }, [gameStore.state]);

  const audio = useRef(new Audio());

  const [animeAnswer, setAnimeAnswer] = useState('');
  const [kindAnswer, setKindAnswer] = useState('opening');
  const [songAnswer, setSongAnswer] = useState('');
  const [bandAnswer, setBandAnswer] = useState('');

  const [key, setKey] = useState(0);
  const [play, setPlay] = useState(false);
  const [initialRemainingTime, setInitialRemainingTime] = useState(30);

  function sendAnswer() {
    if (!gameStore.canAnswer) {
      return;
    }
    const answer = {
      anime: gameStore.animeAnswerGood ? '' : animeAnswer,
      kind: gameStore.kindAnswerGood ? 'other' : kindAnswer,
      song: gameStore.songAnswerGood ? '' : songAnswer,
      band: gameStore.bandAnswerGood ? '' : bandAnswer,
    };
    const message = {
      name: 'client:answer',
      data: JSON.stringify(answer),
      sentDate: new Date().toISOString(),
      clientId: gameStore.me.id,
    };
    gameStore.setCanAnswer(false);
    sendJsonMessage(message);
    setTimeout(() => {
      gameStore.setCanAnswer(true);
    }, 1000);
  }

  if (gameStore.state === GameStatus.Waiting) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div>
        Anime {gameStore.index} / {gameStore.songsLength}
      </div>
      <GameCountdown
        isPlaying={play}
        key={key}
        initialRemainingTime={initialRemainingTime}
        callback={() => audio.current.pause()}
      />
      <GameInput
        name="anime"
        label="Anime"
        value={animeAnswer}
        onChange={setAnimeAnswer}
        onSubmit={sendAnswer}
        answerGood={gameStore.animeAnswerGood}
        hasValidation={gameStore.hasValidation}
        isDisabled={
          gameStore.state !== GameStatus.Question ||
          !gameStore.canAnswer ||
          gameStore.animeAnswerGood
        }
      />
      <GameInput
        name="kind"
        label="Kind"
        type="select"
        selectValues={['opening', 'ending', 'insert']}
        value={kindAnswer}
        onChange={setKindAnswer}
        onSubmit={sendAnswer}
        answerGood={gameStore.kindAnswerGood}
        hasValidation={gameStore.hasValidation}
        isDisabled={
          gameStore.state !== GameStatus.Question ||
          !gameStore.canAnswer ||
          gameStore.kindAnswerGood
        }
      />
      <GameInput
        name="song"
        label="Song name"
        value={songAnswer}
        onChange={setSongAnswer}
        onSubmit={sendAnswer}
        answerGood={gameStore.songAnswerGood}
        hasValidation={gameStore.hasValidation}
        isDisabled={
          gameStore.state !== GameStatus.Question ||
          !gameStore.canAnswer ||
          gameStore.songAnswerGood
        }
      />
      <GameInput
        name="band"
        label="Band"
        value={bandAnswer}
        onChange={setBandAnswer}
        onSubmit={sendAnswer}
        answerGood={gameStore.bandAnswerGood}
        hasValidation={gameStore.hasValidation}
        isDisabled={
          gameStore.state !== GameStatus.Question ||
          !gameStore.canAnswer ||
          gameStore.bandAnswerGood
        }
      />
      <button
        className="ml-32 w-20 rounded bg-red-600 p-2 text-zinc-200 disabled:opacity-50"
        onClick={sendAnswer}
        disabled={
          gameStore.state !== GameStatus.Question || !gameStore.canAnswer
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            sendAnswer();
          }
        }}
      >
        <span>Send</span>
      </button>
      <div className="h-5">
        {gameStore.state === GameStatus.Answer && (
          <span className="text-s">
            Answer : {gameStore.song.anime} {gameStore.song.name}
          </span>
        )}
      </div>
    </>
  );
}

export default GameState;
