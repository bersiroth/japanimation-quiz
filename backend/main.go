// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"flag"
	"japanimation-quiz/game"
	"japanimation-quiz/hub"
	"log"
	"net/http"
	"strings"
)

var addr = flag.String("addr", ":8080", "http service address")

func main() {
	flag.Parse()
	initHub()
	runHttpServer()

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func initHub() {
	gameHub := hub.NewHub()
	statsHub := hub.NewHub()
	game := game.NewGame(gameHub.Broadcast, statsHub.Broadcast)

	go statsHub.Run(func(h *hub.Hub, c *hub.Client) {
		go game.BroadcastStats()
	}, func(h *hub.Hub, c *hub.Client) {}, func(message *hub.ClientMessage) {})
	http.HandleFunc("/ws/stats", func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWs(statsHub, w, r)
	})

	go gameHub.Run(func(h *hub.Hub, c *hub.Client) {
		game.AddPlayer("Player "+c.Id.String(), c)
		//log.Println("Game hub registered callback")
	}, func(h *hub.Hub, c *hub.Client) {
		game.RemovePlayer(c.Id)
		//log.Println("Game hub unregister callback")
	}, func(message *hub.ClientMessage) {
		//log.Println("Game hub read callback")
		game.HandleClientMessage(message.Client, message.Message)
	})
	http.HandleFunc("/ws/game", func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWs(gameHub, w, r)
	})
}

func runHttpServer() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		//log.Println(r.URL.Path)
		if strings.HasPrefix(r.URL.Path, "/static/") {
			//log.Println("Serving static")
			fs := http.FileServer(http.Dir("static/"))
			http.StripPrefix("/static/", fs).ServeHTTP(w, r)
			return
		}
		//log.Println("Serving index.html")
		fs := http.FileServer(http.Dir("client/"))
		http.StripPrefix("/", fs).ServeHTTP(w, r)
	})
	fs := http.FileServer(http.Dir("client/assets"))
	http.Handle("/assets/", http.StripPrefix("/assets/", fs))
}
