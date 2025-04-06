import { GameEvent, GameStatus, useGameStore } from '../stores/gameStore.ts';
import { useEffect, useRef, useState } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import useWebSocket from 'react-use-websocket';
import GameInput from './GameInput.tsx';

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
        gameStore.handleServerMessage(gameEvent);
      },
    },
    gameStore.state !== GameStatus.Init
  );

  useEffect(() => {
    switch (gameStore.state) {
      case GameStatus.Question: {
        gameStore.setHasValidation(false);
        setAnimeAnswerGood(false);
        setKindAnswerGood(false);
        setSongAnswerGood(false);
        setBandAnswerGood(false);
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

  // useEffect(() => {
  //   if (lastMessage !== null) {
  //     const gameEvent: GameEvent = JSON.parse(lastMessage.data);
  //     gameStore.handleServerMessage(gameEvent);
  // if (gameEvent.name === 'answerValidation') {
  //   if (!animeAnswerGood) setAnimeAnswerGood(gameEvent.data.animeResult);
  //   if (!kindAnswerGood) setKindAnswerGood(gameEvent.data.kindResult);
  //   if (!songAnswerGood) setSongAnswerGood(gameEvent.data.songResult);
  //   if (!bandAnswerGood) setBandAnswerGood(gameEvent.data.bandResult);
  //   setHasValidation(true);
  // } else if (gameEvent.name === 'player') {
  //   setPlayerId(gameEvent.data.id);
  // }
  //   }
  // }, [lastMessage]);

  const audio = useRef(new Audio());

  const [animeAnswer, setAnimeAnswer] = useState('');
  const [kindAnswer, setKindAnswer] = useState('opening');
  const [songAnswer, setSongAnswer] = useState('');
  const [bandAnswer, setBandAnswer] = useState('');
  const [animeAnswerGood, setAnimeAnswerGood] = useState(false);
  const [kindAnswerGood, setKindAnswerGood] = useState(false);
  const [songAnswerGood, setSongAnswerGood] = useState(false);
  const [bandAnswerGood, setBandAnswerGood] = useState(false);
  // const [hasValidation, setHasValidation] = useState(false);

  const [key, setKey] = useState(0);
  const [play, setPlay] = useState(false);
  const [initialRemainingTime, setInitialRemainingTime] = useState(30);

  function sendAnswer() {
    if (!gameStore.canAnswer) {
      return;
    }
    const answer = {
      type: 'answer',
      anime: gameStore.hasValidation && animeAnswerGood ? '' : animeAnswer,
      kind: gameStore.hasValidation && kindAnswerGood ? 'other' : kindAnswer,
      song: gameStore.hasValidation && songAnswerGood ? '' : songAnswer,
      band: gameStore.hasValidation && bandAnswerGood ? '' : bandAnswer,
    };
    const message = {
      name: 'game:answer',
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
      <div>{/*Anime {gameStep.index} / {gameStep.songsLength}*/}</div>
      <div className="flex justify-center pb-10">
        <CountdownCircleTimer
          isPlaying={play}
          key={key}
          duration={30}
          colors={['#93b62b', '#ffc211', '#f7941c', '#c9171c']}
          colorsTime={[30, 18, 9, 0]}
          size={200}
          strokeWidth={20}
          initialRemainingTime={initialRemainingTime}
          isSmoothColorTransition={true}
        >
          {({ remainingTime, color }) => {
            let content;
            if (remainingTime === 0) {
              audio.current.pause();
              content = (
                <>
                  <div>Time&#39;s</div>
                  <div>up!</div>
                </>
              );
            } else {
              content = <span className="text-6xl">{remainingTime}</span>;
            }

            return (
              <div
                className="flex flex-col items-center text-xl"
                style={{ color: color }}
              >
                {content}
              </div>
            );
          }}
        </CountdownCircleTimer>
      </div>
      <GameInput
        name="anime"
        label="Anime"
        value={animeAnswer}
        onChange={setAnimeAnswer}
        onSubmit={sendAnswer}
        answerGood={animeAnswerGood}
        hasValidation={gameStore.hasValidation}
        isDisabled={
          gameStore.state !== GameStatus.Question || !gameStore.canAnswer
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
        answerGood={kindAnswerGood}
        hasValidation={gameStore.hasValidation}
        isDisabled={
          gameStore.state !== GameStatus.Question || !gameStore.canAnswer
        }
      />
      <GameInput
        name="song"
        label="Song name"
        value={songAnswer}
        onChange={setSongAnswer}
        onSubmit={sendAnswer}
        answerGood={songAnswerGood}
        hasValidation={gameStore.hasValidation}
        isDisabled={
          gameStore.state !== GameStatus.Question || !gameStore.canAnswer
        }
      />
      <GameInput
        name="band"
        label="Band"
        value={bandAnswer}
        onChange={setBandAnswer}
        onSubmit={sendAnswer}
        answerGood={bandAnswerGood}
        hasValidation={gameStore.hasValidation}
        isDisabled={
          gameStore.state !== GameStatus.Question || !gameStore.canAnswer
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
