FROM golang:latest AS go-builder

ARG CGO_ENABLED=0

WORKDIR /app

COPY backend/hub hub
COPY backend/game game
COPY backend/go.* .
COPY backend/main.go .

RUN go mod download
RUN go build -v -o japanimation-quiz


FROM node:20-alpine AS node-builder

WORKDIR /app

COPY client/package.json .
COPY client/package-lock.json .
RUN npm install

COPY client/ .
RUN npm run build


FROM scratch

WORKDIR /app

COPY --from=go-builder /app/japanimation-quiz japanimation-quiz
COPY /backend/static static
COPY --from=node-builder /app/dist client
COPY /backend/game/*.json game/

EXPOSE 8080

ENTRYPOINT ["/app/japanimation-quiz"]