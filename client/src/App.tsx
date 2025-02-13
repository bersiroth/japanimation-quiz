import AnimeCard from './AnimeCard.tsx';
import Header from "./Header.tsx";
import Card from "./Card.tsx";
import {useEffect, useState} from "react";
import useWebSocket from "react-use-websocket";

enum AnimeSongType {
  opening = 'Opening',
  ending = 'Ending',
  insert = 'Insert',
}

export type AnimeSong = {
  anime: string;
  type: AnimeSongType;
  position?: number;
  title: string;
  artiste: string;
  picture: string;
};

function App() {
  const animeSongs: AnimeSong[] = [
    {
      anime: 'Your Name',
      type: AnimeSongType.insert,
      title: 'Zenzenzense',
      artiste: 'RADWIMPS',
      picture:
        'https://cdn.aniplaylist.com/thumbnails/9de0765869ce12f891465a7a227f1eab1c284056@xl.jpg',
    },
    {
      anime: 'Fullmetal Alchemist: Brotherhood',
      type: AnimeSongType.opening,
      position: 1,
      title: 'Again',
      artiste: 'YUI',
      picture:
        'https://cdn.aniplaylist.com/thumbnails/OdBOa0qNgJsfAf8w5Ysr7IQDF7CCnr8AlY4HgmAO@xl.jpeg',
    },
    {
      anime: 'Naruto',
      type: AnimeSongType.ending,
      position: 1,
      title: 'Wind',
      artiste: 'Akeboshi',
      picture:
        'https://cdn.aniplaylist.com/thumbnails/cc0fedee78c387e4964c5784ff0a6c373388a1b7@xl.jpg',
    },
    {
      anime: 'Naruto',
      type: AnimeSongType.opening,
      position: 3,
      title: 'GO!!!',
      artiste: 'FLOW',
      picture:
        'https://cdn.aniplaylist.com/thumbnails/GAwz9QCNru6KXYmjJKxDKRddfp3DBVDgTbbiZn7y@xl.png',
    },
    {
      anime: 'Naruto',
      type: AnimeSongType.ending,
      position: 2,
      title: 'Harmonia',
      artiste: 'Rythem',
      picture:
        'https://cdn.aniplaylist.com/thumbnails/Si3JmBE6gmfMrWRNM3AgY0bGRW4TLMHBkQFdaM4Z@xl.jpeg',
    },
  ];

  const [game, setGame] = useState({
    players: [],
    songs: [{
      name: "Opening 1",
      trackName: "R★O★C★K★S",
      band: "HOUND DOG",
      anime: "Naruto",
      kind: "opening",
      coverUrl: "static/naruto/opening-1.jpg",
    }],
    index: 1,
    state: "waiting",
    songsLength: 5,
  });

  const {lastMessage} = useWebSocket("ws://127.0.0.1:8080/ws/stats", {
    onOpen: () => console.log('stats opened'),
  });
  useWebSocket("ws://127.0.0.1:8080/ws/game", {
    onOpen: () => console.log('game opened'),
  });

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      console.log(data);
      setGame(data.gameStats);
    }
  }, [lastMessage]);

  return (
    <div className="flex h-screen flex-col font-rocknroll">
      <header className="border-b-8 border-red-600 bg-zinc-700">
        <Header/>
      </header>

      <main className="mb-auto">
        <div className="flex flex-col flex-wrap gap-8 p-2 py-7 sm:mx-auto sm:max-w-7xl sm:p-5">
          <div className="flex flex-col justify-between gap-10 py-2 sm:flex-row">
            <Card title="Quiz">
              <span className="text-s">Etat : {game.state}</span>
              <span className="text-s">Joueur connecté : {game.players.length}</span>
              <span className="text-s">Musique {game.index} / {game.songsLength}</span>
              <span className="text-s">Dernière musique : </span>
              <div className="h-40 flex flex-row gap-2">
                <div className="h-40 w-40 max-md:h-30 max-md:w-30">
                  <img
                    src={`http://127.0.0.1:8080/${game.songs[game.songs.length - 1].coverUrl}`}
                    alt="logo"
                    className="h-full w-full rounded-l-md object-cover md:rounded-b-none md:rounded-t-md border"
                  />
                </div>
                <div className="flex flex-col w-2/3">
                  <span className="text-md h-14 pb-1 font-bold text-red-500">{game.songs[game.songs.length - 1].anime}</span>
                  <span className="text-s ">{game.songs[game.songs.length - 1].name}</span>
                  <span className="text-s">{game.songs[game.songs.length - 1].trackName}</span>
                  <span className="text-s">par {game.songs[game.songs.length - 1].band}</span>
                </div>
              </div>
              <div className="flex w-full flex-col items-center">
                <button className="rounded bg-red-600 p-2 text-zinc-200">
                  Rejoindre le quiz
                </button>
              </div>
            </Card>

            <Card title="Résumé">
              Test
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xl text-zinc-800">
              Dernières musiques du quiz
            </span>
            <div className="flex flex-col flex-wrap justify-between gap-2 md:flex-row">
              {animeSongs.slice(0, 5).map((animeSong, index) => (
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
      </main>

      <footer className="bg-zinc-800">
        <div className="flex flex-col gap-2 p-2 text-zinc-300 lg:mx-auto lg:max-w-7xl lg:px-5">
          <span className="text-4xl">Footer</span>
          <div className="flex gap-4 text-4xl">
            <div className="max-xl:hidden">XL</div>
            <div className="max-lg:hidden">LG</div>
            <div className="max-md:hidden">MD</div>
            <div className="max-sm:hidden">SM</div>
            <div className="max-xs:hidden">XS</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
