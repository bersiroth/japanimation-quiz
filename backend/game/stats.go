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

func newStats(g *Game) stats {
	jsonData, err := os.ReadFile("./game/stats.json")
	if err != nil {
		panic(err)
	}
	var topStats TopStats
	if err := json.Unmarshal(jsonData, &topStats); err != nil {
		panic(err)
	}
	return stats{
		topStats,
		newGameStats(g),
	}
}
