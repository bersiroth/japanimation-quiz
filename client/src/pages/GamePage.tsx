import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import Card from '../components/Card.tsx';
import AnimeCard from '../components/AnimeCard.tsx';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

function GamePage() {
  const [gameStep, setGameStep] = useState({
    players: [],
    audioUrl: '',
    song: {},
    type: '',
    remainingTime: 30,
  });
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [state, setState] = useState('Join');

  const { lastMessage, sendJsonMessage } = useWebSocket(
    'ws://127.0.0.1:8080/ws/game',
    {
      onOpen: () => console.log('game opened'),
      onError: (event) => console.error('game error', event),
      onClose: () => audio.current.pause(),
    }
  );
  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      console.log('game data', data);
      console.log('game step', data.type);
      console.log('state', state);
      if (data.type === 'question') {
        setHasValidation(false);
        setAnimeAnswerGood(false);
        setKindAnswerGood(false);
        setSongAnswerGood(false);
        setBandAnswerGood(false);
        setAnimeAnswer('');
        setSongAnswer('');
        setKindAnswer('other');
        setBandAnswer('');
        setGameStep(data);
        audio.current.pause();
        audio.current.currentTime = 30 - data.remainingTime;
        console.log('setsrc', 'http://localhost:8080/' + data.audioUrl);
        audio.current.src = 'http://localhost:8080/' + data.audioUrl;
        setDuration(0);
        audio.current.onloadedmetadata = () => {
          setDuration(parseInt(audio.current.duration));
          console.log('duration', parseInt(audio.current.duration));
        };
        audio.current.ontimeupdate = () => {
          setCurrent(parseInt(audio.current.currentTime));
        };

        audio.current.muted = state !== 'Playing';
        audio.current.play();
        setInitialRemainingTime(data.remainingTime);
        setKey((prevState) => prevState + 1);
        setPlay(true);
      } else if (data.type === 'answer') {
        setGameStep(data);
        audio.current.pause();
        setInitialRemainingTime(0);
        setKey((prevState) => prevState + 1);
        setPlay(true);
      } else if (data.type === 'answerValidation') {
        if (!animeAnswerGood) setAnimeAnswerGood(data.animeResult);
        if (!kindAnswerGood) setKindAnswerGood(data.kindResult);
        if (!songAnswerGood) setSongAnswerGood(data.songResult);
        if (!bandAnswerGood) setBandAnswerGood(data.bandResult);
        setHasValidation(true);
      }
    }
  }, [lastMessage]);

  const audio = useRef(new Audio());

  const [animeAnswer, setAnimeAnswer] = useState('');
  const [kindAnswer, setKindAnswer] = useState('other');
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
    setCanAnswer(false);
    sendJsonMessage(answer);
    setTimeout(() => setCanAnswer(true), 1000);
  }

  const [key, setKey] = useState(0);
  const [play, setPlay] = useState(false);
  const [initialRemainingTime, setInitialRemainingTime] = useState(30);

  if (gameStep.type === '') {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex flex-col flex-wrap gap-8 p-2 py-7 sm:mx-auto sm:max-w-7xl sm:p-5">
      <div className="flex flex-col justify-between gap-10 py-2 sm:flex-row">
        <Card title="GamePage">
          <div>
            Anime {gameStep.index} / {gameStep.songsLength}
          </div>
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
          {state === 'Playing' && (
            <>
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
                  disabled={gameStep.type !== 'question' || hasValidation && animeAnswerGood}
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
                  disabled={gameStep.type !== 'question' || hasValidation && kindAnswerGood}
                  onChange={(e) => setKindAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendAnswer();
                    }
                  }}
                  className={`${hasValidation ? (kindAnswerGood ? 'border-green-500 text-green-500 hover:border-green-600 focus:border-green-700' : 'border-red-500 text-red-500 hover:border-red-600 focus:border-red-700') : 'border-slate-200 hover:border-slate-300 focus:border-slate-400'} w-2/3 rounded-md border p-1 shadow-sm focus:shadow focus:outline-none`}                >
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
                  disabled={gameStep.type !== 'question'}
                  value={songAnswer}
                  onChange={(e) => setSongAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendAnswer();
                    }
                  }}
                  className={`${hasValidation ? (songAnswerGood ? 'border-green-500 text-green-500 hover:border-green-600 focus:border-green-700' : 'border-red-500 text-red-500 hover:border-red-600 focus:border-red-700') : 'border-slate-200 hover:border-slate-300 focus:border-slate-400'} w-2/3 rounded-md border p-1 shadow-sm focus:shadow focus:outline-none`}                />
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
                  disabled={gameStep.type !== 'question'}
                  value={bandAnswer}
                  onChange={(e) => setBandAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendAnswer();
                    }
                  }}
                  className={`${hasValidation ? (bandAnswerGood ? 'border-green-500 text-green-500 hover:border-green-600 focus:border-green-700' : 'border-red-500 text-red-500 hover:border-red-600 focus:border-red-700') : 'border-slate-200 hover:border-slate-300 focus:border-slate-400'} w-2/3 rounded-md border p-1 shadow-sm focus:shadow focus:outline-none`}                />
              </div>
              <button
                className="disabled:opacity-50 ml-32 w-20 rounded bg-red-600 p-2 text-zinc-200"
                onClick={sendAnswer}
                disabled={gameStep.type !== 'question' || !canAnswer}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendAnswer();
                  }
                }}
              >
                <span>Send</span>
              </button>
            </>
          )}
          <div className="h-5">
            {gameStep.type === 'answer' && (
              <span className="text-s">
                Answer : {gameStep.song.anime} {gameStep.song.name}
              </span>
            )}
          </div>
          {state === 'Join' && (
            <button
              className="rounded bg-red-600 p-2 text-zinc-200"
              onClick={() => {
                setState('Playing');
                if (gameStep.type === 'question') {
                  audio.current.muted = false;
                }
              }}
            >
              JOIN GAME
            </button>
          )}
        </Card>
        <Card title="Player">
          {gameStep?.players?.map((player) => (
            <span key={player.name}>
              {player.name} {player.score}
            </span>
          ))}
        </Card>
      </div>
      <Card title="Last answers">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col flex-wrap gap-2 md:flex-row">
            {gameStep.songs?.map((animeSong, index) => (
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
      </Card>
    </div>
  );
}

export default GamePage;
