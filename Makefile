run-backend:
	@cd backend && go run main.go
run-client:
	@cd client && npm run dev

build-client:
	@cd client && npm run build
build-backend:
	@cd backend && go build

build-run: build-client build-backend
	@open http://localhost:8080/ &&\
	cd backend && ./japanimation-quiz
