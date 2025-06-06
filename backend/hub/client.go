// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package hub

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/dgraph-io/ristretto"
	"github.com/eko/gocache/lib/v4/cache"
	"github.com/eko/gocache/lib/v4/marshaler"
	"github.com/eko/gocache/lib/v4/store"
	ristretto_store "github.com/eko/gocache/store/ristretto/v4"
	"github.com/gorilla/websocket"
	uuid "github.com/satori/go.uuid"
	"log"
	"net/http"
	"time"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	Id       uuid.UUID
	Nickname string
	hub      *Hub

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	Send chan []byte
}

type FormatedMessage struct {
	Name     string `json:"name"`
	Data     string `json:"data"`
	SentDate string `json:"sentDate"`
	ClientId string `json:"clientId"`
}

type Message struct {
	MessageName string
	JsonData    json.RawMessage
}

type ClientMessage struct {
	Client  *Client
	Message Message
}

type cachedClient struct {
	Id       uuid.UUID
	Nickname string
}

func (c *Client) getCachedClient() cachedClient {
	return cachedClient{
		Id:       c.Id,
		Nickname: c.Nickname,
	}
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
		log.Println("Message received: ", string(message))
		var fm FormatedMessage
		err = json.Unmarshal(message, &fm)
		if err != nil {
			panic(err)
		}
		c.hub.read <- &ClientMessage{
			Client: c,
			Message: Message{
				MessageName: fm.Name,
				JsonData:    json.RawMessage(fm.Data),
			},
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
		log.Println(fmt.Sprintf("Client %s disconnected", c.Id))
	}()
	for {
		select {
		case message, ok := <-c.Send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			//n := len(c.send)
			//for i := 0; i < n; i++ {
			//	w.Write(newline)
			//	w.Write(<-c.send)
			//}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

var marshalerCache *marshaler.Marshaler

func initCache() {
	if marshalerCache != nil {
		return
	}
	ristrettoCache, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: 1000,
		MaxCost:     100,
		BufferItems: 64,
	})
	if err != nil {
		panic(err)
	}
	ristrettoStore := ristretto_store.NewRistretto(ristrettoCache)

	cacheManager := cache.New[any](ristrettoStore)
	marshalerCache = marshaler.New(cacheManager)
}

// ServeWs handles websocket requests from the peer.
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	nickname := r.URL.Query().Get("nickname")

	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	clientUuid, err := uuid.FromString(id)
	if err != nil {
		clientUuid = uuid.NewV4()
	}

	initCache()
	ctx := context.Background()
	var client *Client
	cachedClientValue, err := marshalerCache.Get(ctx, clientUuid.String(), new(cachedClient))
	if err != nil && cachedClientValue == nil {
		client = &Client{Id: clientUuid, Nickname: nickname, hub: hub, conn: conn, Send: make(chan []byte, 256)}
		log.Println("-- Client not found in cache --")
		err = marshalerCache.Set(ctx, clientUuid.String(), client.getCachedClient(), store.WithExpiration(7*24*time.Hour))
		if err != nil {
			log.Println(err)
			return
		}
	} else {
		log.Println("-- Client found in cache --")
		clientData := cachedClientValue.(*cachedClient) // Type assertion
		client = &Client{Id: clientData.Id, Nickname: clientData.Nickname, hub: hub, conn: conn, Send: make(chan []byte, 256)}
	}

	for c := range hub.clients {
		if c.Id == client.Id {
			return
		}
	}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}
