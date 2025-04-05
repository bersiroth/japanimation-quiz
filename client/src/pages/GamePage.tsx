import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import Card from '../components/Card.tsx';
import AnimeCard from '../components/AnimeCard.tsx';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { GameEvent, GameState, useGameStore } from '../stores/gameStore.ts';

function GamePage() {
  const gameStore = useGameStore();

  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [nickname, setNickname] = useState('');

  const { lastMessage, sendJsonMessage } = useWebSocket(
    'ws://127.0.0.1:8080/ws/game',
    {
      queryParams: {
        id: gameStore.me.id ? gameStore.me.id : '',
        nickname: gameStore.me.nickname ? gameStore.me.nickname : '',
      },
      onOpen: () => console.log('game opened'),
      onError: (event) => console.error('game error', event),
      onClose: () => audio.current.pause(),
    },
    gameStore.state !== GameState.Init
  );

  useEffect(() => {
    switch (gameStore.state) {
      case GameState.Question:
        setHasValidation(false);
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
        setDuration(0);
        audio.current.onloadedmetadata = () => {
          setDuration(parseInt(audio.current.duration));
          console.log('duration', parseInt(audio.current.duration));
        };
        audio.current.ontimeupdate = () => {
          setCurrent(parseInt(audio.current.currentTime));
        };
        audio.current.play();
        setInitialRemainingTime(gameStore.remainingTime);
        setKey((prevState) => prevState + 1);
        setPlay(true);
        break;
      case GameState.Answer:
        audio.current.pause();
        setInitialRemainingTime(0);
        setKey((prevState) => prevState + 1);
        setPlay(true);
        break;
    }
  }, [gameStore.state]);

  useEffect(() => {
    if (lastMessage !== null) {
      const gameEvent: GameEvent = JSON.parse(lastMessage.data);
      gameStore.handleServerMessage(gameEvent);
      // if (gameEvent.name === 'answerValidation') {
      //   if (!animeAnswerGood) setAnimeAnswerGood(gameEvent.data.animeResult);
      //   if (!kindAnswerGood) setKindAnswerGood(gameEvent.data.kindResult);
      //   if (!songAnswerGood) setSongAnswerGood(gameEvent.data.songResult);
      //   if (!bandAnswerGood) setBandAnswerGood(gameEvent.data.bandResult);
      //   setHasValidation(true);
      // } else if (gameEvent.name === 'player') {
      //   setPlayerId(gameEvent.data.id);
      // }
    }
  }, [lastMessage]);

  const audio = useRef(new Audio());

  const [animeAnswer, setAnimeAnswer] = useState('');
  const [kindAnswer, setKindAnswer] = useState('opening');
  const [songAnswer, setSongAnswer] = useState('');
  const [bandAnswer, setBandAnswer] = useState('');
  const [animeAnswerGood, setAnimeAnswerGood] = useState(false);
  const [kindAnswerGood, setKindAnswerGood] = useState(false);
  const [songAnswerGood, setSongAnswerGood] = useState(false);
  const [bandAnswerGood, setBandAnswerGood] = useState(false);
  const [hasValidation, setHasValidation] = useState(false);
  const [canAnswer, setCanAnswer] = useState(true);
  function sendAnswer() {
    if (!canAnswer) {
      return;
    }
    const answer = {
      type: 'answer',
      anime: hasValidation && animeAnswerGood ? '' : animeAnswer,
      kind: hasValidation && kindAnswerGood ? 'other' : kindAnswer,
      song: hasValidation && songAnswerGood ? '' : songAnswer,
      band: hasValidation && bandAnswerGood ? '' : bandAnswer,
    };
    const message = {
      name: 'game:answer',
      data: JSON.stringify(answer),
      sentDate: new Date().toISOString(),
      clientId: gameStore.me.id,
    };
    setCanAnswer(false);
    sendJsonMessage(message);
    setTimeout(() => setCanAnswer(true), 1000);
  }

  const [key, setKey] = useState(0);
  const [play, setPlay] = useState(false);
  const [initialRemainingTime, setInitialRemainingTime] = useState(30);

  if (gameStore.state === GameState.Waiting) {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex flex-col flex-wrap gap-8 p-2 py-7 sm:mx-auto sm:max-w-7xl sm:p-5">
      <div className="flex flex-col justify-between gap-10 py-2 sm:flex-row">
        <Card title="Game">
          {gameStore.state !== GameState.Init && (
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
                    let content = <></>;
                    if (remainingTime === 0) {
                      audio.current.pause();
                      content = (
                        <>
                          <div>Time's</div>
                          <div>up!</div>
                        </>
                      );
                    } else {
                      content = (
                        <span className="text-6xl">{remainingTime}</span>
                      );
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
              <div className="flex flex-row gap-4 pb-3">
                <label
                  htmlFor="anime"
                  className={`${hasValidation ? (animeAnswerGood ? 'text-green-500' : 'text-red-500') : 'text-inherit'} w-28 p-1 text-right`}
                >
                  Anime
                </label>
                <input
                  type="text"
                  id="anime"
                  disabled={
                    gameStore.state !== GameState.Question ||
                    (hasValidation && animeAnswerGood)
                  }
                  value={animeAnswer}
                  onChange={(e) => setAnimeAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendAnswer();
                    }
                  }}
                  className={`${hasValidation ? (animeAnswerGood ? 'border-green-500 text-green-500 hover:border-green-600 focus:border-green-700' : 'border-red-500 text-red-500 hover:border-red-600 focus:border-red-700') : 'border-slate-200 hover:border-slate-300 focus:border-slate-400'} w-2/3 rounded-md border p-1 shadow-sm focus:shadow focus:outline-none`}
                />
              </div>
              <div className="flex flex-row gap-4 pb-3">
                <label
                  htmlFor="kind"
                  className={`${hasValidation ? (kindAnswerGood ? 'text-green-500' : 'text-red-500') : 'text-inherit'} w-28 p-1 text-right`}
                >
                  Kind
                </label>
                <select
                  value={kindAnswer}
                  disabled={
                    gameStore.state !== GameState.Question ||
                    (hasValidation && kindAnswerGood)
                  }
                  onChange={(e) => setKindAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendAnswer();
                    }
                  }}
                  className={`${hasValidation ? (kindAnswerGood ? 'border-green-500 text-green-500 hover:border-green-600 focus:border-green-700' : 'border-red-500 text-red-500 hover:border-red-600 focus:border-red-700') : 'border-slate-200 hover:border-slate-300 focus:border-slate-400'} w-2/3 rounded-md border p-1 shadow-sm focus:shadow focus:outline-none`}
                >
                  <option value="opening">Opening</option>
                  <option value="ending">Ending</option>
                  <option value="insert">Insert</option>
                </select>
              </div>
              <div className="flex flex-row gap-4 pb-3">
                <label
                  htmlFor="song"
                  className={`${hasValidation ? (songAnswerGood ? 'text-green-500' : 'text-red-500') : 'text-inherit'} w-28 p-1 text-right`}
                >
                  Song name
                </label>
                <input
                  type="text"
                  id="song"
                  disabled={gameStore.state !== GameState.Question}
                  value={songAnswer}
                  onChange={(e) => setSongAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendAnswer();
                    }
                  }}
                  className={`${hasValidation ? (songAnswerGood ? 'border-green-500 text-green-500 hover:border-green-600 focus:border-green-700' : 'border-red-500 text-red-500 hover:border-red-600 focus:border-red-700') : 'border-slate-200 hover:border-slate-300 focus:border-slate-400'} w-2/3 rounded-md border p-1 shadow-sm focus:shadow focus:outline-none`}
                />
              </div>
              <div className="flex flex-row gap-4 pb-3">
                <label
                  htmlFor="band"
                  className={`${hasValidation ? (bandAnswerGood ? 'text-green-500' : 'text-red-500') : 'text-inherit'} w-28 p-1 text-right`}
                >
                  Band
                </label>
                <input
                  type="text"
                  id="band"
                  disabled={gameStore.state !== GameState.Question}
                  value={bandAnswer}
                  onChange={(e) => setBandAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendAnswer();
                    }
                  }}
                  className={`${hasValidation ? (bandAnswerGood ? 'border-green-500 text-green-500 hover:border-green-600 focus:border-green-700' : 'border-red-500 text-red-500 hover:border-red-600 focus:border-red-700') : 'border-slate-200 hover:border-slate-300 focus:border-slate-400'} w-2/3 rounded-md border p-1 shadow-sm focus:shadow focus:outline-none`}
                />
              </div>
              <button
                className="ml-32 w-20 rounded bg-red-600 p-2 text-zinc-200 disabled:opacity-50"
                onClick={sendAnswer}
                disabled={gameStore.state !== GameState.Question || !canAnswer}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendAnswer();
                  }
                }}
              >
                <span>Send</span>
              </button>
              <div className="h-5">
                {gameStore.state === GameState.Answer && (
                  <span className="text-s">
                    Answer : {gameStore.song.anime} {gameStore.song.name}
                  </span>
                )}
              </div>
            </>
          )}
          {gameStore.state === GameState.Init && !gameStore.me.nickname && (
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
                        gameStore.me.nickname = nickname;
                        gameStore.setState(GameState.Waiting);
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
                    gameStore.me.nickname = nickname;
                    gameStore.setState(GameState.Waiting);
                  }
                }}
              >
                JOIN GAME
              </button>
            </>
          )}
          {gameStore.state === GameState.Init && gameStore.me.nickname && (
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
                  gameStore.setState(GameState.Waiting);
                }}
              >
                JOIN GAME
              </button>
            </>
          )}
        </Card>
        <Card title="Player">
          {/*{Object.entries(gameStep.players).map(*/}
          {/*  ([id, player]: [string, object]) => {*/}
          {/*    return (*/}
          {/*      <div*/}
          {/*        key={id}*/}
          {/*        className={`text-s flex flex-row ${player.hasAnsweredCorrectly ? 'text-green-500' : ''} ${id === playerId ? 'bg-red-300/20' : ''} mb-2 border-b-2 border-red-900 p-2`}*/}
          {/*      >*/}
          {/*        <div className="w-4/5">{player.name}</div>*/}
          {/*        <div>{player.score} Pts</div>*/}
          {/*      </div>*/}
          {/*    );*/}
          {/*  }*/}
          {/*)}*/}
        </Card>
      </div>
      <Card title="Last answers">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col flex-wrap gap-2 md:flex-row">
            {/*{gameStep.songs?.map((animeSong, index) => (*/}
            {/*  <AnimeCard*/}
            {/*    key={index}*/}
            {/*    hiddenLg={index === 3}*/}
            {/*    hiddenXl={index > 3}*/}
            {/*    animeSong={animeSong}*/}
            {/*    withButton={false}*/}
            {/*    withText={false}*/}
            {/*    small={true}*/}
            {/*  />*/}
            {/*))}*/}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default GamePage;
