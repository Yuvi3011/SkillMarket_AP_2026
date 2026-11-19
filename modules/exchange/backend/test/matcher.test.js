'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MemoryStore } = require('../src/db/memoryStore');
const {
  WEIGHTS,
  TOTAL_WEIGHT,
  scoreListing,
  rankMatches,
  tokenizeAvailability,
} = require('../src/matching/matcher');

function skillsById(store) {
  return new Map(store.skills.map((s) => [s.skillId, s]));
}

test('weights are documented and sum to 100', () => {
  assert.equal(TOTAL_WEIGHT, 100);
  assert.deepEqual(Object.keys(WEIGHTS), [
    'complementarity',
    'bidirectional',
    'teacherQuality',
    'categoryAffinity',
    'typeAlignment',
    'availability',
    'trust',
    'freshness',
  ]);
});

test('a two-way swap scores near the ceiling and explains itself', async () => {
  const store = new MemoryStore();
  const listing = await store.getListing(4); // Dev offers Guitar, wants Excel
  const profile = await store.getUserProfile(3); // Sara teaches Excel, wants Guitar
  const counts = await store.listCompletedExchangeCounts();

  const result = scoreListing({
    listing,
    profile,
    skillsById: skillsById(store),
    completedExchanges: counts[listing.userId] || 0,
    availabilityTokens: new Set(['weekend']),
  });

  assert.equal(result.breakdown.complementarity, 40);
  assert.equal(result.breakdown.bidirectional, 10);
  assert.ok(result.score >= 85, `expected a high score, got ${result.score}`);
  assert.ok(result.reasons.length >= 4);
  assert.deepEqual(
    result.matchedSkills.map((m) => m.direction).sort(),
    ['THEY_OFFER', 'THEY_WANT']
  );
  // The breakdown must reconcile with the headline score.
  const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - result.score) < 0.2, `breakdown ${sum} != score ${result.score}`);
});

test('a listing with no skill overlap cannot outrank a complementary one', async () => {
  const store = new MemoryStore();
  const related = await store.getListing(4); // Dev: Guitar <-> Excel
  const unrelated = await store.getListing(7); // Aisha wants Digital Marketing only
  const profile = await store.getUserProfile(3);
  const counts = await store.listCompletedExchangeCounts();

  const score = (listing) =>
    scoreListing({
      listing,
      profile,
      skillsById: skillsById(store),
      completedExchanges: counts[listing.userId] || 0,
      availabilityTokens: new Set(['weekend']),
    }).score;

  assert.ok(score(related) > score(unrelated));
  assert.ok(score(unrelated) < 30, `unrelated listing scored ${score(unrelated)}`);
});

test('teacher quality scales with proficiency', async () => {
  const store = new MemoryStore();
  const profile = await store.getUserProfile(3); // wants Guitar
  const base = await store.getListing(4); // Dev teaches Guitar, INTERMEDIATE

  const expert = { ...base, offerProficiency: 'EXPERT' };
  const beginner = { ...base, offerProficiency: 'BEGINNER' };

  const scoreOf = (listing) =>
    scoreListing({
      listing,
      profile,
      skillsById: skillsById(store),
      completedExchanges: 0,
      availabilityTokens: new Set(),
    }).breakdown.teacherQuality;

  assert.ok(scoreOf(expert) > scoreOf(base));
  assert.ok(scoreOf(base) > scoreOf(beginner));
  assert.ok(scoreOf(beginner) > 0);
});

test('availability overlap is rewarded only on a real overlap', async () => {
  const store = new MemoryStore();
  const listing = await store.getListing(4); // "Weekends, afternoons"
  const profile = await store.getUserProfile(3);

  const overlapping = scoreListing({
    listing,
    profile,
    skillsById: skillsById(store),
    availabilityTokens: new Set(['weekend']),
  });
  const disjoint = scoreListing({
    listing,
    profile,
    skillsById: skillsById(store),
    availabilityTokens: new Set(['morning']),
  });

  assert.equal(overlapping.breakdown.availability, WEIGHTS.availability);
  assert.equal(disjoint.breakdown.availability, 0);
});

test('trust grows with completed exchanges but stays bounded', async () => {
  const store = new MemoryStore();
  const listing = await store.getListing(4);
  const profile = await store.getUserProfile(3);

  const trustFor = (completed) =>
    scoreListing({
      listing,
      profile,
      skillsById: skillsById(store),
      completedExchanges: completed,
      availabilityTokens: new Set(),
    }).breakdown.trust;

  const fresh = trustFor(0);
  const once = trustFor(1);
  const veteran = trustFor(20);

  assert.ok(fresh > 0, 'a brand-new partner still gets a base trust score');
  assert.ok(once > fresh);
  assert.ok(veteran > once);
  assert.ok(veteran <= WEIGHTS.trust);
});

test('freshness decays with listing age', async () => {
  const store = new MemoryStore();
  const profile = await store.getUserProfile(3);
  const fresh = await store.getListing(4);

  const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  const stale = { ...fresh, createdAt: daysAgo(90) };

  const freshness = (listing, now) =>
    scoreListing({
      listing,
      profile,
      skillsById: skillsById(store),
      availabilityTokens: new Set(),
      now,
    }).breakdown.freshness;

  assert.ok(freshness(fresh, new Date()) > freshness(stale, new Date()));
});

test('rankMatches returns a sorted, deduplicated shortlist', async () => {
  const store = new MemoryStore();
  const result = await rankMatches({ store, targetUserId: 3, limit: 5 });

  assert.ok(result.count > 0);
  assert.ok(result.matches.length <= 5);
  const scores = result.matches.map((m) => m.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  // Sara's own listings must never be recommended to her.
  assert.ok(result.matches.every((m) => m.userId !== 3));
  assert.equal(result.matches[0].listingId, 4);
});

test('rankMatches hides partners you already have a live request with', async () => {
  const store = new MemoryStore();
  // Seed row: user 6 has a PENDING request to user 5 (listing 5).
  const result = await rankMatches({ store, targetUserId: 6, limit: 20 });
  assert.ok(result.matches.every((m) => m.userId !== 5));

  const forced = await rankMatches({
    store,
    targetUserId: 6,
    limit: 20,
    includeAlreadyRequested: true,
  });
  assert.ok(forced.matches.some((m) => m.userId === 5));
});

test('minScore filters weak matches', async () => {
  const store = new MemoryStore();
  const result = await rankMatches({ store, targetUserId: 3, minScore: 80 });
  assert.ok(result.matches.every((m) => m.score >= 80));
});

test('availability tokenizer ignores casing and punctuation', () => {
  const tokens = tokenizeAvailability('Weekends, late evenings!');
  assert.ok(tokens.has('weekend'));
  assert.ok(tokens.has('evening'));
  assert.equal(tokenizeAvailability('').size, 0);
  assert.equal(tokenizeAvailability(undefined).size, 0);
});
