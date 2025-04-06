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
			AudioUrl:      g.Song.AudioUrl,
			Index:         g.Index,
			SongsLength:   songsLength,
			RemainingTime: int(g.questionTime - second),
		})
		if err != nil {
			panic(err)
		}
		g.gameHub.SendMessageToClient(&hub.Message{
			MessageName: "game:question:init",
			JsonData:    marshal,
		}, client)
	}
	if g.State == GameStatusAnswer {
		marshal, err := json.Marshal(gameStep{
			Players:     g.Players,
			Song:        g.Song,
			Songs:       g.songs[:g.Index],
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
	Anime string `json:"anime"`
	Kind  string `json:"kind"`
	Song  string `json:"song"`
	Band  string `json:"band"`
}
type serverAnswer struct {
	AnimeResult bool `json:"animeResult"`
	KindResult  bool `json:"kindResult"`
	SongResult  bool `json:"songResult"`
	BandResult  bool `json:"bandResult"`
}

func (g *Game) HandleClientMessage(client *hub.Client, message hub.Message) {
	if message.MessageName == "client:answer" {
		g.handleClientAnswerMessage(client, message.JsonData)
	}
}

func (g *Game) handleClientAnswerMessage(client *hub.Client, messageJsonData json.RawMessage) {
	// Parse the client answer
	var clientAnswer clientAnswer
	if err := json.Unmarshal(messageJsonData, &clientAnswer); err != nil {
		panic(err)
	}

	// Initialize server answer
	var serverAnswer serverAnswer
	playerId := client.Id.String()
	player := g.Players[playerId]

	// Helper function to process each answer
	processAnswer := func(correctValue string, givenValue string, onCorrect func(), resultSetter *bool) {
		log.Println(correctValue, givenValue)
		if correctValue == givenValue {
			log.Println("Good answer")
			player.Score++
			onCorrect()
			*resultSetter = true
		} else {
			log.Println("Bad answer")
			*resultSetter = false
		}
	}

	// Evaluate answers and update results
	processAnswer(g.Song.Anime, clientAnswer.Anime, func() {
		player.HasAnsweredCorrectly = true
	}, &serverAnswer.AnimeResult)

	processAnswer(string(g.Song.Kind), clientAnswer.Kind, func() {}, &serverAnswer.KindResult)
	processAnswer(g.Song.Name, clientAnswer.Song, func() {}, &serverAnswer.SongResult)
	processAnswer(g.Song.Band, clientAnswer.Band, func() {}, &serverAnswer.BandResult)

	// Save the updated player back to the game
	g.Players[playerId] = player

	// Marshal the server answer and send it to the client
	marshaledAnswer, err := json.Marshal(serverAnswer)
	if err != nil {
		panic(err)
	}
	g.gameHub.SendMessageToClient(&hub.Message{
		MessageName: "game:validation",
		JsonData:    marshaledAnswer,
	}, client)

	// Broadcast the game state
	go broadcastGame(g)
}

func broadcastGame(g *Game) {
	if g.State == GameStatusQuestion {
		second := time.Now().Unix()
		step := gameStep{
			Players:       g.Players,
			Songs:         g.songs[:g.Index-1],
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
