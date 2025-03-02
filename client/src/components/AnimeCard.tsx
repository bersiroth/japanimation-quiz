import { AnimeSong } from './home.tsx';

function AnimeCard({
  animeSong,
  hiddenLg,
  hiddenXl,
}: {
  animeSong: AnimeSong;
  hiddenLg?: boolean;
  hiddenXl?: boolean;
}) {
  const hiddenClasses = `${hiddenLg ? 'hidden lg:flex' : ''} ${hiddenXl ? 'hidden xl:flex' : ''}`;
  const visibleClass = !hiddenLg && !hiddenXl ? 'flex' : '';
  return (
    <div
      className={`${hiddenClasses} ${visibleClass} md:text-md gap-2 rounded-md border border-red-500 bg-zinc-50 text-xs text-zinc-700 shadow-md md:flex-col md:gap-0`}
    >
      <div className="h-56 w-56 max-md:h-40 max-md:w-40">
        <img
          src={'http://localhost:8080/' + animeSong.coverUrl}
          alt="logo"
          className="h-full w-full rounded-l-md object-cover md:rounded-b-none md:rounded-t-md"
        />
      </div>
      <div className="my-2 mr-2 flex w-full flex-col justify-between gap-1 md:gap-4 md:px-2">
        <div className="relative flex flex-col gap-1">
          <span className="absolute right-0 rounded-xl bg-zinc-700 p-1.5 text-xs font-bold text-zinc-200 md:-right-1 md:-top-10">
            {' '}
            {animeSong.name}{' '}
          </span>
          <span className="text-md h-10 w-40 pb-1 font-bold text-red-500 sm:h-10 md:w-48">
            {animeSong.anime}
          </span>
          <span>{animeSong.trackName}</span>
          <span>par {animeSong.band}</span>
        </div>
        <div className="flex gap-3">
          <button className="ml-auto rounded bg-green-600 p-2 text-zinc-200">
            Ecouter
          </button>
          <button className="rounded bg-red-600 p-2 text-zinc-200">Voir</button>
        </div>
      </div>
    </div>
  );
}

export default AnimeCard;
