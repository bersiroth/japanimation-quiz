import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.tsx';
import AnimeCard from '../components/AnimeCard.tsx';

enum AnimeSongType {
  opening = 'Opening',
  ending = 'Ending',
  insert = 'Insert',
}
export type AnimeSong = {
  anime: string;
  kind: AnimeSongType;
  position?: number;
  trackName: string;
  band: string;
  name: string;
  coverUrl: string;
};

function HomePage() {
  const [game, setGame] = useState({
    players: [],
    songs: [
      {
        name: 'Opening 1',
        trackName: 'R★O★C★K★S',
        band: 'HOUND DOG',
        anime: 'Naruto',
        kind: 'opening',
        coverUrl: 'static/naruto/opening-1.jpg',
      },
    ],
    index: 1,
    state: 'waiting',
    songsLength: 5,
  });
  const [lastGame, setLastGame] = useState({
    players: [],
    songs: [
      {
        name: 'Opening 1',
        trackName: 'R★O★C★K★S',
        band: 'HOUND DOG',
        anime: 'Naruto',
        kind: 'opening',
        coverUrl: 'static/naruto/opening-1.jpg',
      },
    ],
    index: 1,
    state: 'waiting',
    songsLength: 5,
  });
  const [stats, setStats] = useState({
    topActivePlayers: [],
    topPlayers: [],
  });

  const { lastMessage } = useWebSocket('ws://localhost:8080/ws/stats', {
    onOpen: () => console.log('stats opened'),
    onError: (event) => console.error('stats error', event),
  });
  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      setGame(data.gameStats);
      setStats(data.topStats);
      setLastGame(data.lastGame);
    }
  }, [lastMessage]);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-wrap gap-8 p-2 py-7 sm:mx-auto sm:max-w-7xl sm:p-5">
      <div className="flex flex-col justify-between gap-10 py-2 sm:flex-row">
        <Card title="Quiz">
          <span className="text-s">Etat : {game.state}</span>
          <span className="text-s">
            Joueur connecté : {game.players.length}
          </span>
          <span className="text-s">
            Musique {game.index} / {game.songsLength}
          </span>
          <div className="mt-5 flex w-full flex-col items-center">
            <button
              className="rounded bg-red-600 p-2 text-zinc-200"
              onClick={() => {
                navigate('/game');
              }}
            >
              Rejoindre le quiz
            </button>
          </div>
        </Card>

        <Card title="Stats">
          <div className="flex flex-row gap-2">
            <div className="w-1/2">
              <div className="h-14">Joueur les plus actif</div>
              <div className="flex flex-col gap-2">
                {stats.topActivePlayers?.map((activeStats, index) => (
                  <div key={index} className="flex">
                    <span>
                      {activeStats.player.name} : {activeStats.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-1/2">
              <div className="h-14">Joueur les plus victorieux</div>
              <div className="flex flex-col gap-2">
                {stats.topPlayers?.map((topStats, index) => (
                  <div key={index} className="flex">
                    <span>
                      {topStats.player.name} : {topStats.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xl text-zinc-800">Musiques du dernier quiz</span>
        <div className="flex flex-row flex-wrap justify-between gap-2 md:flex-row">
          {lastGame.songs
            ?.slice(0, 5)
            .map((animeSong, index) => (
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

export default HomePage;
