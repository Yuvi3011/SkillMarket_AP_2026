'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { createApp } = require('../src/app');
const { MemoryStore } = require('../src/db/memoryStore');

function harness() {
  const store = new MemoryStore();
  const app = createApp({ store });
  return { store, app };
}

const asUser = (agent, userId) => agent.set('x-user-id', String(userId));

test('GET /api/health reports the active store', async () => {
  const { app } = harness();
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.body.store, 'memory');
});

test('unknown API routes return a structured 404', async () => {
  const { app } = harness();
  const res = await request(app).get('/api/nope');
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('malformed JSON bodies are rejected with 400', async () => {
  const { app } = harness();
  const res = await asUser(request(app).post('/api/exchanges/listings'), 1)
    .set('Content-Type', 'application/json')
    .send('{ not json');
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_JSON');
});

test('every exchange route requires an acting user', async () => {
  const { app } = harness();
  const res = await request(app).get('/api/exchanges/listings');
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

test('GET /listings hides my own listings and supports filters', async () => {
  const { app } = harness();

  const all = await asUser(request(app).get('/api/exchanges/listings'), 1);
  assert.equal(all.status, 200);
  assert.ok(all.body.count > 0);
  assert.ok(all.body.listings.every((l) => l.userId !== 1), 'own listings must be excluded');

  const offers = await asUser(
    request(app).get('/api/exchanges/listings?type=OFFER'),
    1
  );
  assert.ok(offers.body.listings.every((l) => l.listingType === 'OFFER'));

  const bySkill = await asUser(
    request(app).get('/api/exchanges/listings?skillId=1'),
    1
  );
  assert.ok(bySkill.body.listings.every((l) => l.offerSkillId === 1 || l.wantSkillId === 1));

  const searched = await asUser(
    request(app).get('/api/exchanges/listings?q=guitar'),
    1
  );
  assert.ok(searched.body.listings.every((l) => /guitar/i.test(l.title)));

  const mine = await asUser(
    request(app).get('/api/exchanges/listings?mine=1'),
    1
  );
  assert.ok(mine.body.listings.every((l) => l.userId === 1));
});

test('POST /listings validates the payload', async () => {
  const { app } = harness();
  const agent = () => asUser(request(app).post('/api/exchanges/listings'), 1);

  const missingTitle = await agent().send({
    listingType: 'OFFER',
    offerSkillId: 1,
    wantSkillId: 3,
  });
  assert.equal(missingTitle.status, 400);
  assert.equal(missingTitle.body.error.code, 'BAD_REQUEST');

  const noSkills = await agent().send({
    listingType: 'OFFER',
    title: 'Teach and learn nothing',
  });
  assert.equal(noSkills.status, 400);

  const sameSkill = await agent().send({
    listingType: 'OFFER',
    title: 'Python for Python',
    offerSkillId: 1,
    wantSkillId: 1,
  });
  assert.equal(sameSkill.status, 400);

  const badType = await agent().send({
    listingType: 'TRADE',
    title: 'Python for design',
    offerSkillId: 1,
    wantSkillId: 3,
  });
  assert.equal(badType.status, 400);
});

test('POST /listings creates an ACTIVE listing and it becomes matchable', async () => {
  const { app, store } = harness();
  const res = await asUser(request(app).post('/api/exchanges/listings'), 6).send({
    listingType: 'OFFER',
    offerSkillId: 6,
    wantSkillId: 5,
    title: 'Premiere editing for blog writing',
    description: 'Two reels a week in exchange for two posts.',
    availability: 'Weekdays, evenings',
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.listing.status, 'ACTIVE');
  assert.equal(res.body.listing.offerSkillName, 'Video Editing');
  assert.equal(res.body.listing.wantSkillName, 'Content Writing');

  const match = await asUser(request(app).get('/api/exchanges/matching?limit=50'), 5);
  assert.ok(match.body.matches.some((m) => m.listingId === res.body.listing.listingId));
});

test('GET /my-listings reports pending request counts', async () => {
  const { app } = harness();
  const res = await asUser(request(app).get('/api/exchanges/my-listings'), 5);
  assert.equal(res.status, 200);
  // Seed: user 6 has a PENDING request against user 5's listing 5.
  const row = res.body.listings.find((l) => l.listingId === 5);
  assert.equal(row.pendingRequests, 1);
  const clean = await asUser(request(app).get('/api/exchanges/my-listings'), 3);
  // Seed request on listing 3 is ACCEPTED, so it is not pending.
  assert.equal(clean.body.listings.find((l) => l.listingId === 3).pendingRequests, 0);
});

test('only the owner can patch or close a listing', async () => {
  const { app } = harness();

  const forbidden = await asUser(
    request(app).patch('/api/exchanges/listings/3'),
    1
  ).send({ status: 'PAUSED' });
  assert.equal(forbidden.status, 403);

  const ok = await asUser(request(app).patch('/api/exchanges/listings/3'), 3).send({
    status: 'PAUSED',
    description: 'Updated description',
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.listing.status, 'PAUSED');

  const closed = await asUser(request(app).delete('/api/exchanges/listings/3'), 3);
  assert.equal(closed.status, 200);
  assert.equal(closed.body.listing.status, 'CLOSED');

  const publicList = await asUser(request(app).get('/api/exchanges/listings'), 1);
  assert.ok(publicList.body.listings.every((l) => l.listingId !== 3));
});

test('POST /requests rejects self-requests, duplicates and invalid skills', async () => {
  const { app } = harness();
  const payload = {
    recipientId: 1,
    offeredSkillId: 3,
    requestedSkillId: 1,
    message: 'I will teach you Figma flows.',
  };

  const created = await asUser(request(app).post('/api/exchanges/requests'), 2).send(payload);
  assert.equal(created.status, 201);
  assert.equal(created.body.request.status, 'PENDING');

  const duplicate = await asUser(request(app).post('/api/exchanges/requests'), 2).send(payload);
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, 'CONFLICT');

  const self = await asUser(request(app).post('/api/exchanges/requests'), 1).send({
    recipientId: 1,
    offeredSkillId: 1,
    requestedSkillId: 3,
  });
  assert.equal(self.status, 400);

  const badSkill = await asUser(request(app).post('/api/exchanges/requests'), 2).send({
    recipientId: 1,
    offeredSkillId: 9999,
    requestedSkillId: 1,
  });
  assert.equal(badSkill.status, 422);
});

test('a recipient can accept a request, which creates the exchange', async () => {
  const { app } = harness();

  const sent = await asUser(request(app).post('/api/exchanges/requests'), 2).send({
    recipientId: 1,
    offeredSkillId: 3,
    requestedSkillId: 1,
    message: 'Swap Figma for Python?',
  });
  const requestId = sent.body.request.requestId;

  const wrongParty = await asUser(
    request(app).post(`/api/exchanges/requests/${requestId}/accept`),
    3
  );
  assert.equal(wrongParty.status, 403);

  const accepted = await asUser(
    request(app).post(`/api/exchanges/requests/${requestId}/accept`),
    1
  );
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.request.status, 'ACCEPTED');
  assert.ok(accepted.body.exchange, 'accepting must create an exchange');
  assert.equal(accepted.body.exchange.status, 'ACTIVE');

  const doubleAccept = await asUser(
    request(app).post(`/api/exchanges/requests/${requestId}/accept`),
    1
  );
  assert.equal(doubleAccept.status, 409);

  const mine = await asUser(request(app).get('/api/exchanges/exchanges'), 1);
  assert.ok(mine.body.exchanges.some((e) => e.requestId === requestId));
  assert.equal(mine.body.exchanges.find((e) => e.requestId === requestId).myRole, 'PARTNER');

  const theirs = await asUser(request(app).get('/api/exchanges/exchanges'), 2);
  assert.equal(theirs.body.exchanges.find((e) => e.requestId === requestId).myRole, 'INITIATOR');
});

test('a recipient can reject a request and it stays out of exchanges', async () => {
  const { app } = harness();

  const sent = await asUser(request(app).post('/api/exchanges/requests'), 2).send({
    recipientId: 1,
    offeredSkillId: 3,
    requestedSkillId: 1,
  });
  const rejected = await asUser(
    request(app).post(`/api/exchanges/requests/${sent.body.request.requestId}/reject`),
    1
  );
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.request.status, 'REJECTED');

  const inbox = await asUser(request(app).get('/api/exchanges/requests?box=INBOX'), 1);
  const row = inbox.body.requests.find((r) => r.requestId === sent.body.request.requestId);
  assert.equal(row.status, 'REJECTED');

  const exchanges = await asUser(request(app).get('/api/exchanges/exchanges'), 1);
  assert.ok(exchanges.body.exchanges.every((e) => e.requestId !== sent.body.request.requestId));
});

test('a sender can withdraw a pending request', async () => {
  const { app } = harness();

  const sent = await asUser(request(app).post('/api/exchanges/requests'), 2).send({
    recipientId: 1,
    offeredSkillId: 3,
    requestedSkillId: 1,
  });
  const id = sent.body.request.requestId;

  const wrongParty = await asUser(
    request(app).post(`/api/exchanges/requests/${id}/cancel`),
    1
  );
  assert.equal(wrongParty.status, 403);

  const cancelled = await asUser(
    request(app).post(`/api/exchanges/requests/${id}/cancel`),
    2
  );
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.request.status, 'CANCELLED');
});

test('request inbox counters reflect state', async () => {
  const { app } = harness();
  const res = await asUser(request(app).get('/api/exchanges/requests/summary'), 5);
  assert.equal(res.status, 200);
  assert.equal(res.body.counts.pending, 1);
});

test('exchange status follows ACTIVE -> IN_PROGRESS -> COMPLETED', async () => {
  const { app } = harness();

  const sent = await asUser(request(app).post('/api/exchanges/requests'), 2).send({
    recipientId: 1,
    offeredSkillId: 3,
    requestedSkillId: 1,
  });
  const accepted = await asUser(
    request(app).post(`/api/exchanges/requests/${sent.body.request.requestId}/accept`),
    1
  );
  const exchangeId = accepted.body.exchange.exchangeId;

  const skipAhead = await asUser(
    request(app).patch(`/api/exchanges/exchanges/${exchangeId}`),
    1
  ).send({ status: 'COMPLETED' });
  assert.equal(skipAhead.status, 409);

  const started = await asUser(
    request(app).patch(`/api/exchanges/exchanges/${exchangeId}`),
    1
  ).send({ status: 'IN_PROGRESS' });
  assert.equal(started.status, 200);
  assert.equal(started.body.exchange.status, 'IN_PROGRESS');
  assert.ok(started.body.exchange.startedAt);

  const completed = await asUser(
    request(app).patch(`/api/exchanges/exchanges/${exchangeId}`),
    2 // the partner may also move it forward
  ).send({ status: 'COMPLETED' });
  assert.equal(completed.status, 200);
  assert.equal(completed.body.exchange.status, 'COMPLETED');
  assert.ok(completed.body.exchange.completedAt);

  const afterCompletion = await asUser(
    request(app).patch(`/api/exchanges/exchanges/${exchangeId}`),
    1
  ).send({ status: 'IN_PROGRESS' });
  assert.equal(afterCompletion.status, 409);
});

test('a non-participant cannot manage an exchange', async () => {
  const { app } = harness();

  const sent = await asUser(request(app).post('/api/exchanges/requests'), 2).send({
    recipientId: 1,
    offeredSkillId: 3,
    requestedSkillId: 1,
  });
  const accepted = await asUser(
    request(app).post(`/api/exchanges/requests/${sent.body.request.requestId}/accept`),
    1
  );
  const exchangeId = accepted.body.exchange.exchangeId;

  const res = await asUser(
    request(app).patch(`/api/exchanges/exchanges/${exchangeId}`),
    3
  ).send({ status: 'IN_PROGRESS' });
  assert.equal(res.status, 403);
});

test('matching endpoint returns scored, explainable recommendations', async () => {
  const { app } = harness();
  const res = await asUser(request(app).get('/api/exchanges/matching?limit=3'), 3);

  assert.equal(res.status, 200);
  assert.ok(res.body.matches.length > 0);
  assert.ok(res.body.matches.length <= 3);

  const top = res.body.matches[0];
  assert.equal(top.listingId, 4);
  assert.ok(top.score > 80);
  assert.ok(Array.isArray(top.reasons) && top.reasons.length > 0);
  assert.ok(top.breakdown.complementarity > 0);
  assert.deepEqual(res.body.profile.wants, [4]);
});

test('matching honours minScore and never recommends my own listings', async () => {
  const { app } = harness();
  const res = await asUser(
    request(app).get('/api/exchanges/matching?minScore=90'),
    3
  );
  assert.equal(res.status, 200);
  assert.ok(res.body.matches.every((m) => m.score >= 90));
  assert.ok(res.body.matches.every((m) => m.userId !== 3));
});

test('GET /profile returns the teachable skills and learning goals', async () => {
  const { app } = harness();
  const res = await asUser(request(app).get('/api/exchanges/profile'), 1);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.profile.wants.sort(), [3, 8]);
  assert.ok(res.body.teachableSkills.length >= 1);
  assert.equal(res.body.teachableSkills[0].skillName, 'Python');
});

test('GET /skills and /users are public and feed the form dropdowns', async () => {
  const { app } = harness();

  const skills = await request(app).get('/api/exchanges/skills');
  assert.equal(skills.status, 200);
  assert.ok(skills.body.skills.length >= 8);
  assert.ok(skills.body.skills[0].skillName);

  const users = await request(app).get('/api/exchanges/users');
  assert.equal(users.status, 200);
  assert.ok(users.body.users.length >= 6);
  assert.ok(users.body.users[0].userName);
});
