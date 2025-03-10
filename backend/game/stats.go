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
	Players     map[string]Player `json:"players"`
	Index       int               `json:"index"`
	State       GameStatus        `json:"state"`
	Songs       []Song            `json:"songs"`
	SongsLength int               `json:"songsLength"`
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

const file = "./game/stats.json"

func NewStats(g *Game) Stats {
	jsonData, err := os.ReadFile(file)
	if os.IsNotExist(err) {
		stats := Stats{}
		writeStats(stats)
		stats.GameStats = newGameStats(g)
		return stats
	} else if err != nil {
		panic(err)
	}
	stats := Stats{}
	if err := json.Unmarshal(jsonData, &stats); err != nil {
		panic(err)
	}
	stats.GameStats = newGameStats(g)
	return stats
}

func SaveGameStats(g *Game) {
	jsonData, err := os.ReadFile(file)
	if err != nil {
		panic(err)
	}
	stats := Stats{}
	if err := json.Unmarshal(jsonData, &stats); err != nil {
		panic(err)
	}
	stats.LastGame = newGameStats(g)
	writeStats(stats)
}

func writeStats(stats Stats) {
	updatedJsonData, err := json.Marshal(stats)
	if err != nil {
		panic(err)
	}
	if err := os.WriteFile(file, updatedJsonData, 0644); err != nil {
		panic(err)
	}
}
