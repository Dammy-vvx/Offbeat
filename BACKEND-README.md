# OFFBEAT Backend v1

Node.js + Express prototype. The original README.md is preserved at the repository root.

## Run locally
Requires Node.js 18 or later.

1. Run \`npm install\`
2. Run \`npm test\`
3. Run \`npm start\`
4. Visit http://localhost:3000/api/health

## API
- GET /api/health
- GET /api/genres
- GET /api/songs?genre=Pop
- GET /api/levels
- POST /api/games with JSON \`{"songId":"lover-demo","level":2}\`
- POST /api/games/:id/submit with answer JSON
- GET /api/games/:id

Answer fields: transcript (level 1), lineOrder (level 2), wordOrder (level 3), missingWords (level 4), lineOrder and missingWords (level 5). IDs come from the returned challenge.

## Scope and limitations
This is an API prototype, not yet wired to the existing frontend's TAKE THE MIC button.
Sessions live in memory and reset on server restart. The only demo lyric excerpt is the one provided by the user. Streaming playback and licensed lyric access are separate integrations. Voice transcription and tolerant vocal scoring are not implemented.
