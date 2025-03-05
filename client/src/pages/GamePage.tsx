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
        setGameStep(data);
        audio.current.pause();
        audio.current.currentTime = 0;
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

        if (state === 'Playing') {
          audio.current.play();
        }
      } else if (data.type === 'answer') {
        setGameStep(data);
        audio.current.pause();
      }
    }
  }, [lastMessage]);

  const audio = useRef(new Audio());

  const [animeAnswer, setAnimeAnswer] = useState('');
  function sendAnswer() {
    const answer = { type: 'answer', anime: animeAnswer };
    sendJsonMessage(answer);
  }

  return (
    <div className="flex flex-col flex-wrap gap-8 p-2 py-7 sm:mx-auto sm:max-w-7xl sm:p-5">
      <div className="flex flex-col justify-between gap-10 py-2 sm:flex-row">
        <Card title="GamePage">
          {state === 'Join' && (
            <button
              className="rounded bg-red-600 p-2 text-zinc-200"
              onClick={() => {
                setState('Playing');
                if (gameStep.type === 'question') {
                  audio.current.play();
                }
              }}
            >
              JOIN GAME
            </button>
          )}
          {state === 'Playing' && (
            <>
              {duration !== 0 && (
                <>
                  <div>
                    Anime {gameStep.index} / {gameStep.songsLength}
                  </div>
                  <div className="flex justify-center pb-10">
                    <CountdownCircleTimer
                      isPlaying
                      duration={30}
                      colors={['#93b62b', '#ffc211', '#f7941c', '#c9171c']}
                      colorsTime={[30, 18, 9, 0]}
                      size={200}
                      strokeWidth={20}
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
                </>
              )}
              {gameStep.type === 'question' && (
                <>
                  <div className="flex flex-row gap-4 pb-3">
                    <label htmlFor="anime">Anime name</label>
                    <input
                      type="text"
                      id="anime"
                      value={animeAnswer}
                      onChange={(e) => setAnimeAnswer(e.target.value)}
                      className="rounded-md border border-slate-200 shadow-sm hover:border-slate-300 focus:border-slate-400 focus:shadow focus:outline-none"
                    />
                  </div>
                  <button
                    className="rounded bg-red-600 p-2 text-zinc-200"
                    onClick={sendAnswer}
                  >
                    <span>Send</span>
                  </button>
                </>
              )}
              {gameStep.type === 'answer' && (
                <span className="text-s">
                  Answer : {gameStep.song.anime} {gameStep.song.name}
                </span>
              )}
            </>
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
      <div className="flex flex-col gap-2">
        <span className="text-xl text-zinc-800">Musiques du dernier quiz</span>
        <div className="flex flex-col flex-wrap justify-between gap-2 md:flex-row">
          {gameStep.songs?.map((animeSong, index) => (
            <AnimeCard
              key={index}
              hiddenLg={index === 3}
              hiddenXl={index > 3}
              animeSong={animeSong}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default GamePage;
