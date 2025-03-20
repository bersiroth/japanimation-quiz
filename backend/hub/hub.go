// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package hub

import (
	"encoding/json"
	"time"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	Broadcast chan []byte

	// Read messages from the clients.
	read chan *ClientMessage

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte),
		read:       make(chan *ClientMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

type Message struct {
	Name     string `json:"name"`
	Data     string `json:"data"`
	SentDate string `json:"sentDate"`
	ClientId string `json:"clientId"`
}
type ConnexionMessage struct {
	Id       string `json:"id"`
	Nickname string `json:"nickname"`
}

func (h *Hub) Run(registerCallback func(h *Hub, client *Client), unregisterCallback func(h *Hub, client *Client), readCallback func(message *ClientMessage)) {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			marshal, err := json.Marshal(
				ConnexionMessage{
					Id:       client.Id.String(),
					Nickname: client.Nickname,
				})
			if err != nil {
				panic(err)
			}
			marshal, err = json.Marshal(
				Message{
					Name:     "connexion",
					Data:     string(marshal),
					SentDate: time.Now().String(),
					ClientId: client.Id.String(),
				})
			if err != nil {
				panic(err)
			}
			client.Send <- marshal
			registerCallback(h, client)
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				unregisterCallback(h, client)
			}
		case message := <-h.Broadcast:
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
		case message := <-h.read:
			readCallback(message)
		}

	}
}
