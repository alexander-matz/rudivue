"use strict";

importScripts('libmatching.js');

self.onmessage = (event) => {
  const data = event.data;
  const {match, score, rounds} = data;

  let origScore = score
    , origMatch = match
    , bestScore = score
    , bestMatch = match;

  for (let j = 0; j < rounds; ++j) {
    let attempt = Matching.copy(origMatch);

    for (let i = 0; i < 10; ++i) {
      const hit = Math.random() < 0.2;
      if (!hit) continue;
      const dish = Math.floor(Math.random() * 3);
      const seat = Math.floor(Math.random() * 3);
      const g1 = Math.floor(Math.random() * (match.teams / 3));
      const g2 = Math.floor(Math.random() * (match.teams / 3));
      Matching.swapSeats(attempt, dish, seat, g1, g2);
    }

    for (let i = 0; i < 2; ++i) {
      const hit = Math.random() < 0.125;
      if (!hit) continue;
      const t1 = Math.floor(Math.random() * match.teams);
      const t2 = Math.floor(Math.random() * match.teams);
      Matching.swapTeams(attempt, t1, t2);
    }

    const score = Matching.score(attempt);

    if (score < bestScore) {
      bestScore = score;
      bestMatch = attempt;
    }
  }

  postMessage({score: bestScore, match: bestMatch})
}
