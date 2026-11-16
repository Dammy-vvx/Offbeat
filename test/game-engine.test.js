const test = require("node:test");
const assert = require("node:assert/strict");
const { createChallenge, evaluateSubmission } = require("../game-engine");
const song = { lines: ["We could let our friends crash in the living room",
  "This is our place, we make the call",
  "And I'm highly suspicious that everyone who sees you wants you",
  "I've loved you three summers now, honey, but I want 'em all"] };
for (let level = 1; level <= 5; level++) {
  test("Level " + level + " builds and validates a correct answer", () => {
    const { challenge, answerKey } = createChallenge(song, level);
    assert.ok(challenge);
    const submission = level === 1 ? { transcript: song.lines.join(" ") }
      : level === 2 ? { lineOrder: answerKey.lineOrder }
      : level === 3 ? { wordOrder: answerKey.wordOrder }
      : level === 4 ? { missingWords: answerKey.blanks }
      : { lineOrder: answerKey.lineOrder, missingWords: answerKey.blanks };
    const result = evaluateSubmission({ level, answerKey, score: 0, completed: false }, submission);
    assert.equal(result.correct, true);
    assert.equal(result.pointsAwarded, 100);
  });
}
test("Wrong answer earns zero points", () => {
  const { answerKey } = createChallenge(song, 2);
  const result = evaluateSubmission({ level: 2, answerKey, score: 0, completed: false }, { lineOrder: [] });
  assert.equal(result.correct, false);
  assert.equal(result.pointsAwarded, 0);
});
