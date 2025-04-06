import { create } from 'zustand';
import Cookies from 'js-cookie';

export enum GameStatus {
  Init,
  Waiting,
  Question,
  Answer,
}

export interface GameEvent {
  name: string;
  data: string;
  sentDate: string;
  clientId: string;
}

interface playerConnectionDataEvent {
  id: string;
  nickname: string;
}

export interface player {
  name: string;
  score: number;
  hasAnsweredCorrectly: boolean;
}

interface song {
  name: string;
  anime: string;
  band: string;
  trackName: string;
  coverUrl: string;
  audioUrl: string;
}

interface gameDataEvent {
  players: player[];
  audioUrl: string;
  song: song;
  songs: song[];
  remainingTime: number;
  index: number;
  songsLength: number;
}

interface answerValidationEvent {
  animeResult: boolean;
  kindResult: boolean;
  songResult: boolean;
  bandResult: boolean;
}

interface me {
  id: string;
  nickname: string;
}

interface GameStoreState {
  state: GameStatus;
  me: me;
  players: player[];
  audioUrl: string;
  song: song;
  songs: song[];
  remainingTime: number;
  index: number;
  songsLength: number;
  canAnswer: boolean;
  hasValidation: boolean;
  animeAnswerGood: boolean;
  kindAnswerGood: boolean;
  songAnswerGood: boolean;
  bandAnswerGood: boolean;
}

interface GameStoreAction {
  setState: (gameState: GameStatus) => void;
  setNickname: (nickname: string) => void;
  setCanAnswer: (canAnswer: boolean) => void;
  setHasValidation: (hasValidation: boolean) => void;
  handleServerMessage: (gameEvent: GameEvent) => void;
  resetAnswers: () => void;
}

type GameStore = GameStoreState & GameStoreAction;

export const useGameStore = create<GameStore>((set, get) => ({
  state: GameStatus.Init,
  me: !Cookies.get('player')
    ? ({} as me)
    : (JSON.parse(Cookies.get('player')!) as me),
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
  canAnswer: true,
  hasValidation: false,
  animeAnswerGood: false,
  kindAnswerGood: false,
  songAnswerGood: false,
  bandAnswerGood: false,
  setState: (gameState) => set({ state: gameState }),
  setNickname: (nickname) => set({ me: { nickname: nickname } as me }),
  setCanAnswer: (canAnswer) => set({ canAnswer: canAnswer }),
  setHasValidation: (hasValidation) => set({ hasValidation: hasValidation }),
  handleServerMessage: (gameEvent) => {
    if (gameEvent.name === 'player:connection') {
      const eventData: playerConnectionDataEvent = JSON.parse(
        gameEvent.data
      ) as playerConnectionDataEvent;
      const me: me = {
        id: eventData.id,
        nickname: eventData.nickname,
      };
      Cookies.set('player', JSON.stringify(me));
      set({ me: me });
    } else if (gameEvent.name === 'game:question:update') {
      const eventData: gameDataEvent = JSON.parse(
        gameEvent.data
      ) as gameDataEvent;
      set({
        players: eventData.players,
      });
    } else if (gameEvent.name === 'game:question:init') {
      const eventData: gameDataEvent = JSON.parse(
        gameEvent.data
      ) as gameDataEvent;
      set({
        state: GameStatus.Question,
        players: eventData.players,
        audioUrl: eventData.audioUrl,
        song: eventData.song,
        songs: eventData.songs,
        remainingTime: eventData.remainingTime,
        index: eventData.index,
        songsLength: eventData.songsLength,
      });
    } else if (gameEvent.name === 'game:validation') {
      const eventData: answerValidationEvent = JSON.parse(
        gameEvent.data
      ) as answerValidationEvent;
      set({
        hasValidation: true,
        animeAnswerGood: get().animeAnswerGood || eventData.animeResult,
        kindAnswerGood: get().kindAnswerGood || eventData.kindResult,
        songAnswerGood: get().songAnswerGood || eventData.songResult,
        bandAnswerGood: get().bandAnswerGood || eventData.bandResult,
      });
    } else if (gameEvent.name === 'game:answer') {
      const eventData: gameDataEvent = JSON.parse(
        gameEvent.data
      ) as gameDataEvent;
      set({
        state: GameStatus.Answer,
        players: eventData.players,
        audioUrl: eventData.audioUrl,
        song: eventData.song,
        songs: eventData.songs,
        remainingTime: eventData.remainingTime,
        index: eventData.index,
        songsLength: eventData.songsLength,
      });
    } else {
      console.warn('Unknown event name:', gameEvent.name);
    }
  },
  resetAnswers: () =>
    set({
      animeAnswerGood: false,
      kindAnswerGood: false,
      songAnswerGood: false,
      bandAnswerGood: false,
      hasValidation: false,
    }),
}));
