// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"flag"
	"log"
	"net/http"
	"strings"
)

var addr = flag.String("addr", ":8080", "http service address")

func main() {
	flag.Parse()
	gameHub := newHub()
	statsHub := newHub()
	game := newGame(gameHub.broadcast, statsHub.broadcast)

	go statsHub.run(func(h *Hub) {
		log.Println("Stats hub registered callback")
	})
	http.HandleFunc("/ws/stats", func(w http.ResponseWriter, r *http.Request) {
		serveWs(statsHub, w, r)
	})

	go gameHub.run(func(h *Hub) {
		game.addPlayer(&Player{
			Name: "Player",
			Id:   1,
		})
		if len(h.clients) > 0 && game.State == Waiting {
			log.Println("Game started")
			go game.start()
		}
		log.Println("Game hub registered callback")
	})
	http.HandleFunc("/ws/game", func(w http.ResponseWriter, r *http.Request) {
		serveWs(gameHub, w, r)
	})

	fs := http.FileServer(http.Dir("assets/"))
	http.HandleFunc("/assets/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") {
			http.NotFound(w, r)
			return
		}
		http.StripPrefix("/assets/", fs).ServeHTTP(w, r)
	})

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
