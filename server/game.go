package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"os"
	"time"
)

type Player struct {
	Name string `json:"name"`
	Id   int    `json:"-"`
}

type SongKind string

const (
	Opening SongKind = "opening"
	Ending  SongKind = "ending"
	Insert  SongKind = "insert"
)

type Song struct {
	Name      string   `json:"name"`
	Anime     string   `json:"anime"`
	Band      string   `json:"band"`
	TrackName string   `json:"trackName"`
	Kind      SongKind `json:"kind"`
	CoverUrl  string   `json:"coverUrl"`
}

type GameStatus string

const (
	Waiting GameStatus = "waiting"
	Playing GameStatus = "playing"
)

type Game struct {
	Players        []Player `json:"players"`
	songs          []Song
	Song           Song `json:"song"`
	Index          int  `json:"index"`
	gameBroadcast  chan []byte
	statsBroadcast chan []byte
	State          GameStatus `json:"state"`
	SongsLength    int        `json:"songsLength"`
}

const songsLength = 5

func newGame(gameBroadcast chan []byte, statsBroadcast chan []byte) *Game {
	songs := getRandomSongs(songsLength)
	game := &Game{
		[]Player{},
		songs,
		songs[0],
		1,
		gameBroadcast,
		statsBroadcast,
		Waiting,
		songsLength,
	}
	return game
}

type PlayerStats struct {
	Player Player `json:"player"`
	Score  int    `json:"score"`
}
type TopStats struct {
	TopActivePlayers []PlayerStats `json:"topActivePlayers"`
	TopPlayers       []PlayerStats `json:"topPlayers"`
}

type GameStats struct {
	Players     []Player   `json:"players"`
	Index       int        `json:"index"`
	State       GameStatus `json:"state"`
	Songs       []Song     `json:"songs"`
	SongsLength int        `json:"songsLength"`
}

func newGameStats(g *Game) GameStats {
	return GameStats{
		g.Players,
		g.Index,
		g.State,
		g.songs[:g.Index],
		g.SongsLength,
	}
}

type stats struct {
	TopStats  TopStats  `json:"topStats"`
	GameStats GameStats `json:"gameStats"`
}

func broadcastStats(g *Game) {
	var topStats TopStats
	jsonData, err := os.ReadFile("stats.json")
	if err != nil {
		panic(err)
	}
	if err := json.Unmarshal(jsonData, &topStats); err != nil {
		panic(err)
	}
	marshal, err := json.Marshal(stats{
		topStats,
		newGameStats(g),
	})
	if err != nil {
		panic(err)
	}
	g.statsBroadcast <- marshal
}

func (g *Game) start() {
	g.State = Playing
	for {
		//fmt.Println("Game loop")
		log.Println("Game loop")
		go broadcastStats(g)

		marshal, err := json.Marshal(g)
		if err != nil {
			panic(err)
		}
		g.gameBroadcast <- marshal
		if g.Index == songsLength {
			break
		}
		time.Sleep(10 * time.Second)
		g.nextSong()
	}

	time.Sleep(5 * time.Second)
	g.restart()
}

func (g *Game) nextSong() {
	g.Song = g.songs[g.Index-1]
	g.Index++
}

func (g *Game) addPlayer(player *Player) {
	g.Players = append(g.Players, *player)
}

func (g *Game) restart() {
	log.Println("Game restart")
	g.songs = getRandomSongs(songsLength)
	g.Song = g.songs[0]
	g.Index = 1
	g.start()
}

func getRandomSongs(nb int) []Song {
	var m []Song
	jsonData, err := os.ReadFile("songs.json")
	if err != nil {
		panic(err)
	}
	if err := json.Unmarshal(jsonData, &m); err != nil {
		panic(err)
	}
	var mr []Song
	for i := 0; i < nb; i++ {
		k := rand.Intn(len(m))
		mr = append(mr, m[k])
		m = append(m[:k], m[k+1:]...)
	}
	return mr
}
