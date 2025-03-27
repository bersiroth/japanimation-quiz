package game

import (
	"encoding/json"
	"fmt"
	uuid "github.com/satori/go.uuid"
	"japanimation-quiz/hub"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"
)

type Player struct {
	Name                 string    `json:"name"`
	Id                   uuid.UUID `json:"-"`
	Score                int       `json:"score"`
	HasAnsweredCorrectly bool      `json:"hasAnsweredCorrectly"`
}

type SongKind string

const (
	SongKindOpening SongKind = "opening"
	SongKindEnding  SongKind = "ending"
	SongKindInsert  SongKind = "insert"
	SongKindOther   SongKind = "other"
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
	GameStatusWaiting  GameStatus = "waiting"
	GameStatusQuestion GameStatus = "question"
	GameStatusAnswer   GameStatus = "answer"
	GameStatusEnding   GameStatus = "ending"
)

type Game struct {
	Players             map[string]Player `json:"players"`
	disconnectedPlayers map[string]Player
	songs               []Song
	Song                Song `json:"song"`
	Index               int  `json:"index"`
	gameHub             *hub.Hub
	statsBroadcast      chan *hub.Message
	State               GameStatus `json:"state"`
	SongsLength         int        `json:"songsLength"`
	questionTime        int64
}

const songsLength = 5

func NewGame(gameHub *hub.Hub, statsBroadcast chan *hub.Message) *Game {
	songs := getRandomSongs(songsLength)
	game := &Game{
		make(map[string]Player),
		make(map[string]Player),
		songs,
		songs[0],
		1,
		gameHub,
		statsBroadcast,
		GameStatusWaiting,
		songsLength,
		0,
	}
	return game
}

func (g *Game) BroadcastStats() {
	//marshal, err := json.Marshal(NewStats(g))
	//if err != nil {
	//	panic(err)
	//}
	//g.statsBroadcast <- marshal
}

type gameStep struct {
	Players       map[string]Player `json:"players"`
	Songs         []Song            `json:"songs"`
	Song          Song              `json:"song"`
	Type          string            `json:"type"`
	AudioUrl      string            `json:"audioUrl"`
	Index         int               `json:"index"`
	SongsLength   int               `json:"songsLength"`
	RemainingTime int               `json:"remainingTime"`
}

func (g *Game) start() {
	log.Println("Game started")
	for {
		log.Println("---------- Loop " + strconv.Itoa(g.Index) + " / " + strconv.Itoa(songsLength) + " ----------")
		go g.BroadcastStats()

		log.Println("Step question : " + g.Song.Anime)
		g.State = GameStatusQuestion
		second := time.Now().Unix()
		g.questionTime = second + 30
		marshal, err := json.Marshal(gameStep{
			Players:       g.Players,
			Songs:         g.songs[:g.Index-1],
			Type:          "question",
			AudioUrl:      g.Song.AudioUrl,
			Index:         g.Index,
			SongsLength:   songsLength,
			RemainingTime: int(g.questionTime - second),
		})
		if err != nil {
			panic(err)
		}
		g.gameHub.Broadcast <- &hub.Message{
			MessageName: "game:question:init",
			JsonData:    marshal,
		}
		time.Sleep(32 * time.Second)

		log.Println("Step answer")
		g.State = GameStatusAnswer
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
		g.gameHub.Broadcast <- &hub.Message{
			MessageName: "game:answer",
			JsonData:    marshal,
		}
		time.Sleep(5 * time.Second)

		if g.Index == songsLength {
			break
		}
		g.nextSong()
	}

	g.State = GameStatusEnding
	time.Sleep(1 * time.Second)
	g.restart()
}

func (g *Game) nextSong() {
	g.Index++
	g.Song = g.songs[g.Index-1]
	for i := range g.Players {
		player := g.Players[i]
		player.HasAnsweredCorrectly = false
		g.Players[i] = player
	}
}

func (g *Game) AddPlayer(name string, client *hub.Client) {
	if player, exists := g.disconnectedPlayers[client.Id.String()]; exists {
		log.Println(fmt.Sprintf(`Reconnect player %s, %s`, client.Id.String(), name))
		player.HasAnsweredCorrectly = false
		g.Players[client.Id.String()] = player
	} else {
		log.Println(fmt.Sprintf(`New player %s, %s`, client.Id.String(), name))
		g.Players[client.Id.String()] = Player{
			Name:                 name,
			Id:                   client.Id,
			Score:                0,
			HasAnsweredCorrectly: false,
		}
	}
	if g.State == GameStatusWaiting {
		go g.start()
		return
	}
	go g.BroadcastStats()
	if g.State == GameStatusQuestion {
		second := time.Now().Unix()
		marshal, err := json.Marshal(gameStep{
			Players:       g.Players,
			Songs:         g.songs[:g.Index-1],
			Type:          "question",
			AudioUrl:      g.Song.AudioUrl,
			Index:         g.Index,
			SongsLength:   songsLength,
			RemainingTime: int(g.questionTime - second),
		})
		if err != nil {
			panic(err)
		}
		g.gameHub.SendMessageToClient(&hub.Message{
			MessageName: "game:question:update",
			JsonData:    marshal,
		}, client)
	}
	if g.State == GameStatusAnswer {
		marshal, err := json.Marshal(gameStep{
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
		g.gameHub.SendMessageToClient(&hub.Message{
			MessageName: "game:answer",
			JsonData:    marshal,
		}, client)
	}
}

func (g *Game) restart() {
	SaveGameStats(g)
	log.Println("Game restart")
	g.songs = getRandomSongs(songsLength)
	g.Song = g.songs[0]
	g.Index = 1
	if len(g.Players) == 0 {
		g.State = GameStatusWaiting
		go g.BroadcastStats()
		return
	}
	g.start()
}

func (g *Game) RemovePlayer(id uuid.UUID) {
	player := g.Players[id.String()]
	g.disconnectedPlayers[id.String()] = player
	delete(g.Players, id.String())
}

type clientAnswer struct {
	Type  string `json:"type"`
	Anime string `json:"anime"`
	Kind  string `json:"kind"`
	Song  string `json:"song"`
	Band  string `json:"band"`
}
type serverAnswer struct {
	Type        string `json:"type"`
	AnimeResult bool   `json:"animeResult"`
	KindResult  bool   `json:"kindResult"`
	SongResult  bool   `json:"songResult"`
	BandResult  bool   `json:"bandResult"`
}

func (g *Game) HandleClientMessage(client *hub.Client, message []byte) {
	var a clientAnswer
	var s serverAnswer
	s.Type = "answerValidation"
	if err := json.Unmarshal(message, &a); err != nil {
		panic(err)
	}

	log.Println(g.Song.Anime, a.Anime)
	if a.Anime == g.Song.Anime {
		log.Println("Good anime answer")
		player := g.Players[client.Id.String()]
		player.Score++
		player.HasAnsweredCorrectly = true
		g.Players[client.Id.String()] = player
		s.AnimeResult = true
	} else {
		log.Println("Bad anime answer")
		s.AnimeResult = false
	}

	log.Println(string(g.Song.Kind), a.Kind)
	if a.Kind == string(g.Song.Kind) {
		log.Println("Good kind answer")
		player := g.Players[client.Id.String()]
		player.Score++
		g.Players[client.Id.String()] = player
		s.KindResult = true
	} else {
		log.Println("Bad kind answer")
		s.KindResult = false
	}

	log.Println(g.Song.Name, a.Song)
	if a.Song == g.Song.Name {
		log.Println("Good song answer")
		player := g.Players[client.Id.String()]
		player.Score++
		g.Players[client.Id.String()] = player
		s.SongResult = true
	} else {
		log.Println("Bad song answer")
		s.SongResult = false
	}

	log.Println(g.Song.Band, a.Band)
	if a.Band == g.Song.Band {
		log.Println("Good band answer")
		player := g.Players[client.Id.String()]
		player.Score++
		g.Players[client.Id.String()] = player
		s.BandResult = true
	} else {
		log.Println("Bad band answer")
		s.BandResult = false
	}

	marshal, err := json.Marshal(s)
	if err != nil {
		panic(err)
	}

	g.gameHub.SendMessageToClient(&hub.Message{
		MessageName: "game:validation",
		JsonData:    marshal,
	}, client)

	go broadcastGame(g)
}

func broadcastGame(g *Game) {
	if g.State == GameStatusQuestion {
		second := time.Now().Unix()
		step := gameStep{
			Players:       g.Players,
			Songs:         g.songs[:g.Index-1],
			Type:          "question",
			AudioUrl:      g.Song.AudioUrl,
			Index:         g.Index,
			SongsLength:   songsLength,
			RemainingTime: int(g.questionTime - second),
		}
		marshal, err := json.Marshal(step)
		if err != nil {
			panic(err)
		}
		g.gameHub.Broadcast <- &hub.Message{
			MessageName: "game:question:update",
			JsonData:    marshal,
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
