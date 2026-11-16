const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { LEVELS, createChallenge, evaluateSubmission } = require("./game-engine");
const app = express();
const games = new Map();
const readSongs = () => JSON.parse(fs.readFileSync(path.join(__dirname, "data", "songs.json"), "utf8"));
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "OFFBEAT API" }));
app.get("/api/genres", (_req, res) => res.json({ genres: [...new Set(readSongs().map(s => s.genre))].sort() }));
app.get("/api/songs", (req, res) => {
  const genre = String(req.query.genre || "").toLowerCase();
  res.json({ songs: readSongs().filter(s => !genre || s.genre.toLowerCase() === genre)
    .map(({ id, title, artist, genre }) => ({ id, title, artist, genre })) });
});
app.get("/api/levels", (_req, res) => res.json({ levels: Object.entries(LEVELS)
  .map(([id, value]) => ({ id: Number(id), ...value })) }));
app.post("/api/games", (req, res) => {
  const song = readSongs().find(s => s.id === req.body?.songId);
  const level = Number(req.body?.level || 1);
  if (!song) return res.status(404).json({ error: "Song not found" });
  if (!Number.isInteger(level) || !LEVELS[level]) return res.status(400).json({ error: "Invalid level" });
  const built = createChallenge(song, level);
  const gameId = crypto.randomUUID();
  games.set(gameId, { level, answerKey: built.answerKey, score: 0, completed: false, songId: song.id });
  return res.status(201).json({ gameId,
    song: { title: song.title, artist: song.artist, genre: song.genre },
    level: built.level, challenge: built.challenge });
});
app.post("/api/games/:id/submit", (req, res) => {
  const game = games.get(req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });
  if (game.completed) return res.status(409).json({ error: "Round already completed" });
  const result = evaluateSubmission(game, req.body || {});
  game.score = result.score;
  game.completed = result.completed;
  return res.json({ ...result, message: result.correct ? "Correct!" : "Try again." });
});
app.get("/api/games/:id", (req, res) => {
  const game = games.get(req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });
  return res.json({ gameId: req.params.id, songId: game.songId, level: game.level,
    score: game.score, completed: game.completed });
});
app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found" }));
if (require.main === module) app.listen(process.env.PORT || 3000,
  () => console.log("OFFBEAT listening on port " + (process.env.PORT || 3000)));
module.exports = app;
