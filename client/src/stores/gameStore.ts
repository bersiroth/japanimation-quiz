import { create } from 'zustand';
import Cookies from 'js-cookie';

export enum GameState {
  Init,
  Waiting,
  Question,
  Answer,
}

export type GameEvent = {
  name: string;
  data: string;
  sentDate: string;
  clientId: string;
};

type playerConnectionDataEvent = {
  id: string;
  nickname: string;
};

type player = {
  name: string;
  score: number;
  hasAnsweredCorrectly: boolean;
};

type song = {
  name: string;
  anime: string;
  band: string;
  trackName: string;
  coverUrl: string;
  audioUrl: string;
};

type gameDataEvent = {
  players: player[];
  audioUrl: string;
  song: song;
  songs: song[];
  remainingTime: number;
  index: number;
  songsLength: number;
};

type me = {
  id: string;
  nickname: string;
};

type GameStoreState = {
  state: GameState;
  me: me;
  players: player[];
  audioUrl: string;
  song: song;
  songs: song[];
  remainingTime: number;
  index: number;
  songsLength: number;
};

type GameStoreAction = {
  setState: (gameState: GameState) => void;
  handleServerMessage: (gameEvent: GameEvent) => void;
};

type GameStore = GameStoreState & GameStoreAction;

export const useGameStore = create<GameStore>((set, get) => ({
  state: GameState.Init,
  me: !Cookies.get('player')
    ? ({} as me)
    : JSON.parse(Cookies.get('player') as string),
  players: [],
  audioUrl: '',
  song: {
    name: '',
    anime: '',
    band: '',
    trackName: '',
    coverUrl: '',
    audioUrl: '',
  },
  songs: [],
  remainingTime: 0,
  index: 0,
  songsLength: 0,
  setState: (gameState) => set({ state: gameState }),
  handleServerMessage: (gameEvent) => {
    if (gameEvent.name === 'player:connection') {
      const eventData: playerConnectionDataEvent = JSON.parse(gameEvent.data);
      const me: me = {
        id: eventData.id,
        nickname: eventData.nickname,
      };
      Cookies.set('player', JSON.stringify(me));
      set({ me: me });
    } else if (gameEvent.name === 'game:question:init') {
      const eventData: gameDataEvent = JSON.parse(gameEvent.data);
      set({
        state: GameState.Question,
        players: eventData.players,
        audioUrl: eventData.audioUrl,
        song: eventData.song,
        songs: eventData.songs,
        remainingTime: eventData.remainingTime,
        index: eventData.index,
        songsLength: eventData.songsLength,
      });
    } else if (gameEvent.name === 'game:answer') {
      const eventData: gameDataEvent = JSON.parse(gameEvent.data);
      set({
        state: GameState.Answer,
        players: eventData.players,
        audioUrl: eventData.audioUrl,
        song: eventData.song,
        songs: eventData.songs,
        remainingTime: eventData.remainingTime,
        index: eventData.index,
        songsLength: eventData.songsLength,
      });
    }
  },
}));
