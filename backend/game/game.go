package game

import (
	"encoding/json"
	uuid "github.com/satori/go.uuid"
	"log"
	"math/rand"
	"os"
	"time"
)

type Player struct {
	Name string    `json:"name"`
	Id   uuid.UUID `json:"-"`
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

func NewGame(gameBroadcast chan []byte, statsBroadcast chan []byte) *Game {
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

func (g *Game) broadcastStats() {
	marshal, err := json.Marshal(NewStats(g))
	if err != nil {
		panic(err)
	}
	g.statsBroadcast <- marshal
}

func (g *Game) start() {
	g.State = Playing
	log.Println("Game started")
	for {
		log.Println("Game loop")
		go g.broadcastStats()

		marshal, err := json.Marshal(g)
		if err != nil {
			panic(err)
		}
		g.gameBroadcast <- marshal
		if g.Index == songsLength {
			break
		}
		time.Sleep(2 * time.Second)
		g.nextSong()
	}

	time.Sleep(2 * time.Second)
	g.restart()
}

func (g *Game) nextSong() {
	g.Song = g.songs[g.Index-1]
	g.Index++
}

func (g *Game) AddPlayer(name string, id uuid.UUID) {
	g.Players = append(g.Players, Player{
		Name: name,
		Id:   id,
	})
	if g.State == Waiting {
		go g.start()
		return
	}
	go g.broadcastStats()
}

func (g *Game) restart() {
	SaveGameStats(g)
	log.Println("Game restart")
	g.songs = getRandomSongs(songsLength)
	g.Song = g.songs[0]
	g.Index = 1
	if len(g.Players) == 0 {
		g.State = Waiting
		return
	}
	g.start()
}

func (g *Game) RemovePlayer(id uuid.UUID) {
	for i, player := range g.Players {
		if player.Id == id {
			g.Players = append(g.Players[:i], g.Players[i+1:]...)
			break
		}
	}
}

func getRandomSongs(nb int) []Song {
	var m []Song
	jsonData, err := os.ReadFile("./game/songs.json")
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
