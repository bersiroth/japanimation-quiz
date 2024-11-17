import { AnimeSong } from "./App.tsx";

function AnimeCard(
  { animeSong, hiddenLg, hiddenXl}: {
    animeSong: AnimeSong,
    hiddenLg?: boolean,
    hiddenXl?: boolean
  }) {
  const hiddenClasses = `${hiddenLg ? 'hidden lg:flex' : ''} ${hiddenXl ? 'hidden xl:flex' : ''}`;
  const visibleClass = !hiddenLg && !hiddenXl ? 'flex' : '';

  return (
    <div className={`${hiddenClasses} ${visibleClass} md:flex-col gap-2 md:gap-0 bg-zinc-50 text-xs border border-red-500 text-zinc-700 md:text-md rounded-md shadow-md`}>
      <div className="h-56 w-56 max-md:h-40 max-md:w-40">
        <img src={animeSong.picture} alt="logo" className="rounded-l-md md:rounded-t-md md:rounded-b-none object-cover h-full w-full"/>
      </div>
      <div className="flex flex-col justify-between w-full my-2 mr-2 gap-1 md:px-2 md:gap-4">
        <div className="flex flex-col gap-1 relative">
          <span className="absolute text-xs right-0 md:-right-1 md:-top-10 bg-zinc-700 rounded-xl text-zinc-200 p-1.5 font-bold"> {animeSong.type} {animeSong.position} </span>
          <span className="font-bold text-md text-red-500 pb-1 w-40 md:w-48 h-10 sm:h-10">{animeSong.anime}</span>
          <span>{animeSong.title}</span>
          <span>par {animeSong.artiste}</span>
        </div>
        <div className="flex gap-3">
          <button className="bg-green-600 ml-auto text-zinc-200 rounded p-2">Ecouter</button>
          <button className="bg-red-600 text-zinc-200 rounded p-2">Voir</button>
        </div>
      </div>
    </div>
  );
}

export default AnimeCard;