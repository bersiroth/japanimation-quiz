package game

import (
	"encoding/json"
	uuid "github.com/satori/go.uuid"
	"japanimation-quiz/hub"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"
)

type Player struct {
	Name  string    `json:"name"`
	Id    uuid.UUID `json:"-"`
	Score int       `json:"score"`
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
	AudioUrl  string   `json:"audioUrl"`
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

func (g *Game) BroadcastStats() {
	marshal, err := json.Marshal(NewStats(g))
	if err != nil {
		panic(err)
	}
	g.statsBroadcast <- marshal
}

type gameStep struct {
	Players     []Player `json:"players"`
	Songs       []Song   `json:"songs"`
	Song        Song     `json:"song"`
	Type        string   `json:"type"`
	AudioUrl    string   `json:"audioUrl"`
	Index       int      `json:"index"`
	SongsLength int      `json:"songsLength"`
}

func (g *Game) start() {
	g.State = Playing
	log.Println("Game started")
	for {
		log.Println("---------- Loop " + strconv.Itoa(g.Index) + " / " + strconv.Itoa(songsLength) + " ----------")
		go g.BroadcastStats()

		log.Println("Step question : " + g.Song.Anime)
		marshal, err := json.Marshal(gameStep{
			Players:     g.Players,
			Songs:       g.songs[:g.Index-1],
			Type:        "question",
			AudioUrl:    g.Song.AudioUrl,
			Index:       g.Index,
			SongsLength: songsLength,
		})
		if err != nil {
			panic(err)
		}
		g.gameBroadcast <- marshal
		time.Sleep(32 * time.Second)

		log.Println("Step answer")
		marshal, err = json.Marshal(gameStep{
			Players:     g.Players,
			Song:        g.Song,
			Songs:       g.songs[:g.Index],
			Type:        "answer",
			AudioUrl:    g.Song.AudioUrl,
			Index:       g.Index,
			SongsLength: songsLength,
		})
		if err != nil {
			panic(err)
		}
		g.gameBroadcast <- marshal
		time.Sleep(5 * time.Second)

		if g.Index == songsLength {
			break
		}
		g.nextSong()
	}

	time.Sleep(1 * time.Second)
	g.restart()
}

func (g *Game) nextSong() {
	g.Index++
	g.Song = g.songs[g.Index-1]
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
	go g.BroadcastStats()
}

func (g *Game) restart() {
	SaveGameStats(g)
	log.Println("Game restart")
	g.songs = getRandomSongs(songsLength)
	g.Song = g.songs[0]
	g.Index = 1
	if len(g.Players) == 0 {
		g.State = Waiting
		go g.BroadcastStats()
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

type clientAnswer struct {
	Type  string `json:"type"`
	Anime string `json:"anime"`
}
type serverAnswer struct {
	Type   string `json:"type"`
	Result bool   `json:"result"`
}

func (g *Game) HandleClientMessage(client *hub.Client, message []byte) {
	var a clientAnswer
	if err := json.Unmarshal(message, &a); err != nil {
		panic(err)
	}
	log.Println(g.Song.Anime, a.Anime)
	if a.Anime == g.Song.Anime {
		log.Println("Good answer")
		for i, player := range g.Players {
			if player.Id == client.Id {
				g.Players[i].Score++
				break
			}
		}
		marshal, err := json.Marshal(serverAnswer{
			Type:   "result",
			Result: true,
		})
		if err != nil {
			panic(err)
		}
		client.Send <- marshal
	} else {
		log.Println("Bad answer")
		marshal, err := json.Marshal(serverAnswer{
			Type:   "result",
			Result: false,
		})
		if err != nil {
			panic(err)
		}
		client.Send <- marshal
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
