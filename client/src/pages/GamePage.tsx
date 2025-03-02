import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import Card from '../components/Card.tsx';

function GamePage() {
  const [gameQuestion, setGameQuestion] = useState({
    players: [],
    audioUrl: '',
  });
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [state, setState] = useState('Join');

  const { lastMessage } = useWebSocket('ws://127.0.0.1:8080/ws/game', {
    onOpen: () => console.log('game opened'),
    onError: (event) => console.error('game error', event),
  });
  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      console.log('game data', data);
      setGameQuestion(data);
      if (state === 'Playing') {
        audio.current.pause();
        audio.current.currentTime = 0;
        audio.current.src = 'http://localhost:8080/' + gameQuestion.audioUrl;
        audio.current.onloadedmetadata = () => {
          setDuration(parseInt(audio.current.duration));
          console.log('duration', parseInt(audio.current.duration));
        };
        audio.current.ontimeupdate = () => {
          setCurrent(parseInt(audio.current.currentTime));
        };
        audio.current.play();
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
              }}
            >
              JOIN GAME
            </button>
          )}
          {state === 'Playing' && (
            <span className="text-s">
              {parseInt(audio.current.currentTime)} - {duration}
            </span>
          )}
        </Card>
        <Card title="Player">
          {gameQuestion?.players.map((player) => (
            <span key={player.name}>{player.name}</span>
          ))}
        </Card>
      </div>
    </div>
  );
}

export default GamePage;
