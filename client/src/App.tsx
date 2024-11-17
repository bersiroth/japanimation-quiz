import logo from './assets/logo.png';
import AnimeCard from './AnimeCard.tsx';

enum AnimeSongType {
  opening = 'Opening',
  ending = 'Ending',
  insert = 'Insert',
}

export type AnimeSong = {
  anime: string;
  type: AnimeSongType;
  position?: number;
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

  return (
    <div className="flex h-screen flex-col font-rocknroll">
      <header className="border-b-8 border-red-600 bg-zinc-700">
        <nav className="mx-auto flex p-2 lg:mx-auto lg:max-w-7xl lg:px-5">
          <div className="flex items-center text-2xl text-zinc-300 sm:text-5xl">
            <img src={logo} alt="logo" className="mr-5 h-16 w-16 rounded-3xl" />
            <span>Japanimation Quiz</span>
          </div>
        </nav>
      </header>

      <main className="mb-auto">
        <div className="flex flex-col gap-8 p-2 py-7 sm:mx-auto sm:max-w-7xl sm:p-5">
          <div className="flex flex-col justify-between gap-10 py-2 sm:flex-row">
            <div className="relative flex flex-col gap-2 rounded border border-red-600 bg-zinc-50 p-4 pt-6 text-base text-zinc-800 shadow-md sm:w-1/2">
              <span className="absolute -top-3 left-0.5 rounded bg-zinc-50 px-1 text-base text-red-600">
                Quiz
              </span>
              <div className="flex flex-col justify-around gap-2 sm:h-auto">
                <span>Joueur connecté : 0</span>
                <div className="flex w-full flex-col items-center">
                  <button className="rounded bg-red-600 p-2 text-zinc-200">
                    Rejoindre le quiz
                  </button>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col gap-2 rounded border border-red-600 bg-zinc-50 p-4 pt-6 text-base text-zinc-800 shadow-md sm:w-1/2">
              <span className="absolute -top-3 left-2 rounded bg-zinc-50 px-1 text-base text-red-600">
                Résumé
              </span>
              <div className="flex flex-col justify-around gap-2 sm:h-auto">
                Test
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xl text-zinc-800">
              Dernières musiques du quiz
            </span>
            <div className="flex flex-col flex-wrap justify-between gap-2 md:flex-row">
              {animeSongs.slice(0, 5).map((animeSong, index) => (
                <AnimeCard
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
