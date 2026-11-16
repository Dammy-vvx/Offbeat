const crypto = require("node:crypto");
const LEVELS = {
  1: { name: "Warmup", mode: "transcript" },
  2: { name: "Out of order", mode: "line-order" },
  3: { name: "Word salad", mode: "word-order" },
  4: { name: "Missing Signals", mode: "missing-words" },
  5: { name: "On with the chaos", mode: "chaos" }
};
const uuid = () => crypto.randomUUID();
function shuffle(input) {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.length > 1 && a.every((v, i) => v === input[i])) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}
function normalize(s) {
  return String(s ?? "").normalize("NFKC").toLowerCase()
    .replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}'\s]/gu, "")
    .replace(/\s+/g, " ").trim();
}
function createChallenge(song, number) {
  const level = LEVELS[number];
  if (!level) throw new Error("Unknown level");
  const originals = song.lines.map(text => ({ id: uuid(), text }));
  const answerKey = {};
  if (number === 1) {
    answerKey.transcript = normalize(song.lines.join(" "));
    return { level: { id: number, ...level },
      challenge: { type: level.mode, lines: originals }, answerKey };
  }
  if (number === 2) {
    answerKey.lineOrder = originals.map(x => x.id);
    return { level: { id: number, ...level },
      challenge: { type: level.mode, lines: shuffle(originals) }, answerKey };
  }
  if (number === 3) {
    const words = (song.lines.join(" ").match(/\S+/g) || []).map(text => ({ id: uuid(), text }));
    answerKey.wordOrder = words.map(x => x.id);
    return { level: { id: number, ...level },
      challenge: { type: level.mode, words: shuffle(words) }, answerKey };
  }
  const blanks = {};
  const transformed = originals.map(line => ({
    id: line.id,
    text: line.text.split(/\s+/).map(token => {
      const clean = token.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");
      if (clean.length < 4 || crypto.randomInt(100) >= (number === 4 ? 28 : 22)) return token;
      const blankId = uuid();
      blanks[blankId] = clean;
      return "[[" + blankId + "]]";
    }).join(" ")
  }));
  if (!Object.keys(blanks).length) {
    const line = transformed.find(x => /\b\w{4,}\b/.test(x.text));
    if (line) {
      const match = line.text.match(/\b\w{4,}\b/);
      const blankId = uuid();
      blanks[blankId] = match[0];
      line.text = line.text.replace(match[0], "[[" + blankId + "]]");
    }
  }
  answerKey.blanks = blanks;
  answerKey.lineOrder = originals.map(x => x.id);
  return { level: { id: number, ...level },
    challenge: { type: level.mode, lines: number === 5 ? shuffle(transformed) : transformed,
      blanks: Object.keys(blanks).map(id => ({ id })) }, answerKey };
}
function sameOrder(given, expected) {
  return Array.isArray(given) && given.length === expected.length &&
    given.every((id, i) => id === expected[i]);
}
function sameBlanks(given, expected) {
  if (!given || typeof given !== "object" || Array.isArray(given)) return false;
  return Object.keys(given).length === Object.keys(expected).length &&
    Object.keys(expected).every(id => normalize(given[id]) === normalize(expected[id]));
}
function evaluateSubmission(game, submission = {}) {
  const key = game.answerKey;
  const level = game.level;
  const correct = level === 1 ? normalize(submission.transcript) === key.transcript
    : level === 2 ? sameOrder(submission.lineOrder, key.lineOrder)
    : level === 3 ? sameOrder(submission.wordOrder, key.wordOrder)
    : level === 4 ? sameBlanks(submission.missingWords, key.blanks)
    : sameOrder(submission.lineOrder, key.lineOrder) && sameBlanks(submission.missingWords, key.blanks);
  const pointsAwarded = correct && !game.completed ? 100 : 0;
  return { correct, pointsAwarded, score: game.score + pointsAwarded, completed: game.completed || correct };
}
module.exports = { LEVELS, createChallenge, evaluateSubmission, normalize };
