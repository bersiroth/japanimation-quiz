package game

import (
	"encoding/json"
	"os"
)

type PlayerStats struct {
	Player Player `json:"player"`
	Score  int    `json:"score"`
}
type TopStats struct {
	TopActivePlayers []PlayerStats `json:"topActivePlayers"`
	TopPlayers       []PlayerStats `json:"topPlayers"`
	lastGame         GameStats     `json:"lastGame"`
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

type Stats struct {
	TopStats  TopStats  `json:"topStats"`
	GameStats GameStats `json:"gameStats"`
	LastGame  GameStats `json:"lastGame"`
}

func NewStats(g *Game) Stats {
	jsonData, err := os.ReadFile("./game/stats.json")
	if err != nil {
		panic(err)
	}
	var topStats TopStats
	if err := json.Unmarshal(jsonData, &topStats); err != nil {
		panic(err)
	}
	return Stats{
		topStats,
		newGameStats(g),
		topStats.lastGame,
	}
}
