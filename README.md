# Bluesky API Playground

Currently playing arround with some data viz & analysis from Bluesky data.

## Papercuts

- Code is intentionally sequential to avoid overloading their servers, even if it takes `200ms` per request
- No data validation at this time; the trust is strong in this project
- Data viz is in private Observable
- Code is not compute or memory optimal, but who cares, GC is sure to hit between `200ms`

# Setup

## Deps
	- Node and your fav package manager
	- Redis, or Docker to run container Redis

## Dev Mode

1. Normal node project `git clone` & `npm install`
2. Create `.env`
3. Start Redis
	- Either `docker compose up -d` (May need `sudo`)
	- Start Redis as you see fit
3. Run `npm run dev`
