import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import Card from '../components/Card.tsx';
import AnimeCard from '../components/AnimeCard.tsx';

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

  const { lastMessage } = useWebSocket('ws://127.0.0.1:8080/ws/game', {
    onOpen: () => console.log('game opened'),
    onError: (event) => console.error('game error', event),
    onClose: () => audio.current.pause(),
  });
  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      console.log('game data', data);
      setGameStep(data);
      console.log('game step', data.type);
      console.log('state', state);
      if (data.type === 'question') {
        audio.current.pause();
        audio.current.currentTime = 0;
        console.log('setsrc', 'http://localhost:8080/' + data.audioUrl);
        audio.current.src = 'http://localhost:8080/' + data.audioUrl;
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
        audio.current.pause();
        audio.current.currentTime = 0;
      }
    }
  }, [lastMessage]);

  const audio = useRef(new Audio());

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
              {gameStep.type === 'question' && (
                <span className="text-s">
                  Question : {parseInt(audio.current.currentTime)}s - 10s
                </span>
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
          {gameStep?.players.map((player) => (
            <span key={player.name}>{player.name}</span>
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
