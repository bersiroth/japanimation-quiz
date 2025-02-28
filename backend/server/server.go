package server

import (
	"japanimation-quiz/game"
	"log"
	"net/http"
	"strings"
)

func RunWsSocketServer() {
	gameHub := newHub()
	statsHub := newHub()
	game := game.NewGame(gameHub.broadcast, statsHub.broadcast)

	go statsHub.run(func(h *Hub, c *Client) {}, func(h *Hub, c *Client) {})
	http.HandleFunc("/ws/stats", func(w http.ResponseWriter, r *http.Request) {
		ServeWs(statsHub, w, r)
	})

	go gameHub.run(func(h *Hub, c *Client) {
		game.AddPlayer("Player", c.Id)
		log.Println("Game hub registered callback")
	}, func(h *Hub, c *Client) {
		game.RemovePlayer(c.Id)
		log.Println("Game hub unregister callback")
	})
	http.HandleFunc("/ws/game", func(w http.ResponseWriter, r *http.Request) {
		ServeWs(gameHub, w, r)
	})
}

func RunHttpServer() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Println(r.URL.Path)
		if strings.HasPrefix(r.URL.Path, "/static/") {
			log.Println("Serving static")
			fs := http.FileServer(http.Dir("static/"))
			http.StripPrefix("/static/", fs).ServeHTTP(w, r)
			return
		}
		log.Println("Serving index.html")
		fs := http.FileServer(http.Dir("client/"))
		http.StripPrefix("/", fs).ServeHTTP(w, r)
	})
	fs := http.FileServer(http.Dir("client/assets"))
	http.Handle("/assets/", http.StripPrefix("/assets/", fs))
}
