'use strict';

const express = require('express');
const { HttpError, asyncHandler } = require('../lib/errors');
const { requireAuth, parsePositiveId } = require('../middleware/auth');
const { rankMatches } = require('../matching/matcher');

const router = express.Router();

// ---------------------------------------------------------------- helpers

function requireString(value, field, { min = 1, max = 500 } = {}) {
  if (value === undefined || value === null) {
    throw HttpError.badRequest(`\`${field}\` is required`, { field });
  }
  const text = String(value).trim();
  if (text.length < min) {
    throw HttpError.badRequest(`\`${field}\` must be at least ${min} characters`, { field });
  }
  if (text.length > max) {
    throw HttpError.badRequest(`\`${field}\` must be at most ${max} characters`, { field });
  }
  return text;
}

function optionalString(value, field, { max = 2000 } = {}) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim();
  if (text.length > max) {
    throw HttpError.badRequest(`\`${field}\` must be at most ${max} characters`, { field });
  }
  return text;
}

function requireEnum(value, field, allowed) {
  const upper = String(value).toUpperCase();
  if (!allowed.includes(upper)) {
    throw HttpError.badRequest(`\`${field}\` must be one of ${allowed.join(', ')}`, {
      field,
      allowed,
    });
  }
  return upper;
}

function optionalInt(value, field, { min = 1, max = 1000 } = {}) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw HttpError.badRequest(`\`${field}\` must be an integer between ${min} and ${max}`, { field });
  }
  return n;
}

function store(req) {
  return req.app.locals.store;
}

// =====================================================================
// Reference data (dropdowns on the frontend) — public on purpose: the
// exchange shell needs the user list before anybody has signed in.
// =====================================================================

router.get(
  '/skills',
  asyncHandler(async (req, res) => {
    res.json({ skills: await store(req).listSkills() });
  })
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    res.json({ users: await store(req).listUsers() });
  })
);

// Everything below this line needs an acting student.
router.use(requireAuth);

// =====================================================================
// Acting student's profile (drives the request composer defaults)
// =====================================================================

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const [profile, skills] = await Promise.all([
      store(req).getUserProfile(req.userId),
      store(req).getUserSkills(req.userId),
    ]);
    res.json({ profile, teachableSkills: skills });
  })
);

// =====================================================================
// Exchange listings
// =====================================================================

// Browse listings. Query: ?type=OFFER|REQUEST&skillId=&q=&mine=1
router.get(
  '/listings',
  asyncHandler(async (req, res) => {
    const listingType = req.query.type
      ? requireEnum(req.query.type, 'type', ['OFFER', 'REQUEST'])
      : undefined;
    const skillId = optionalInt(req.query.skillId, 'skillId');
    const q = req.query.q ? String(req.query.q).trim() : undefined;
    const mineOnly = req.query.mine === '1' || req.query.mine === 'true';

    const listings = await store(req).listListings({
      listingType,
      skillId: skillId ?? undefined,
      search: q,
      excludeUserId: mineOnly ? undefined : req.userId,
      userId: mineOnly ? req.userId : undefined,
    });

    res.json({ count: listings.length, listings });
  })
);

// Create a listing (Offer a Skill / Request a Skill pages)
router.post(
  '/listings',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const listingType = requireEnum(body.listingType, 'listingType', ['OFFER', 'REQUEST']);
    const title = requireString(body.title, 'title', { min: 3, max: 200 });
    const offerSkillId = body.offerSkillId == null ? null : parsePositiveId(body.offerSkillId, 'offerSkillId');
    const wantSkillId = body.wantSkillId == null ? null : parsePositiveId(body.wantSkillId, 'wantSkillId');

    if (offerSkillId == null && wantSkillId == null) {
      throw HttpError.badRequest('Provide at least one of `offerSkillId` or `wantSkillId`');
    }
    if (offerSkillId != null && wantSkillId != null && offerSkillId === wantSkillId) {
      throw HttpError.badRequest('`offerSkillId` and `wantSkillId` must be different skills');
    }

    const listing = await store(req).createListing({
      userId: req.userId,
      listingType,
      offerSkillId,
      wantSkillId,
      title,
      description: optionalString(body.description, 'description'),
      availability: optionalString(body.availability, 'availability', { max: 120 }),
    });

    res.status(201).json({ listing });
  })
);

// My listings, each with a pending-request badge count
router.get(
  '/my-listings',
  asyncHandler(async (req, res) => {
    const listings = await store(req).countPendingRequests(req.userId);
    res.json({ count: listings.length, listings });
  })
);

router.get(
  '/listings/:id',
  asyncHandler(async (req, res) => {
    const listing = await store(req).getListing(parsePositiveId(req.params.id, 'id'));
    if (!listing) throw HttpError.notFound('Listing not found');
    res.json({ listing });
  })
);

router.patch(
  '/listings/:id',
  asyncHandler(async (req, res) => {
    const listingId = parsePositiveId(req.params.id, 'id');
    const body = req.body || {};
    const patch = {};

    if (body.title !== undefined) patch.title = requireString(body.title, 'title', { min: 3, max: 200 });
    if (body.description !== undefined) patch.description = optionalString(body.description, 'description');
    if (body.availability !== undefined) {
      patch.availability = optionalString(body.availability, 'availability', { max: 120 });
    }
    if (body.status !== undefined) {
      patch.status = requireEnum(body.status, 'status', ['ACTIVE', 'PAUSED', 'CLOSED']);
    }
    if (Object.keys(patch).length === 0) {
      throw HttpError.badRequest('Nothing to update');
    }

    const listing = await store(req).updateListing(listingId, req.userId, patch);
    res.json({ listing });
  })
);

// Soft delete: the row is kept for history, it just stops matching.
router.delete(
  '/listings/:id',
  asyncHandler(async (req, res) => {
    const listing = await store(req).closeListing(
      parsePositiveId(req.params.id, 'id'),
      req.userId
    );
    res.json({ listing });
  })
);

// =====================================================================
// Smart matching
// =====================================================================

router.get(
  '/matching',
  asyncHandler(async (req, res) => {
    const limit = optionalInt(req.query.limit, 'limit', { min: 1, max: 50 }) ?? 10;
    const minScore = optionalInt(req.query.minScore, 'minScore', { min: 0, max: 100 }) ?? 0;

    const result = await rankMatches({
      store: store(req),
      targetUserId: req.userId,
      limit,
      minScore,
    });

    res.json(result);
  })
);

// =====================================================================
// Exchange requests
// =====================================================================

// ?box=INBOX|OUTBOX|ALL
router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const box = requireEnum(req.query.box || 'ALL', 'box', ['INBOX', 'OUTBOX', 'ALL']);
    const requests = await store(req).listRequests({ userId: req.userId, box });
    res.json({ box, count: requests.length, requests });
  })
);

// Inbox counters for nav badges
router.get(
  '/requests/summary',
  asyncHandler(async (req, res) => {
    res.json({ counts: await store(req).countRequestStates(req.userId) });
  })
);

router.get(
  '/requests/:id',
  asyncHandler(async (req, res) => {
    const request = await store(req).getRequest(parsePositiveId(req.params.id, 'id'));
    if (!request) throw HttpError.notFound('Request not found');
    if (request.senderId !== req.userId && request.recipientId !== req.userId) {
      throw HttpError.forbidden('You are not a party to this request');
    }
    res.json({ request });
  })
);

// Send a request. Body: { recipientId, offeredSkillId, requestedSkillId, listingId?, message? }
router.post(
  '/requests',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const recipientId = parsePositiveId(body.recipientId, 'recipientId');
    const offeredSkillId = parsePositiveId(body.offeredSkillId, 'offeredSkillId');
    const requestedSkillId = parsePositiveId(body.requestedSkillId, 'requestedSkillId');
    const listingId = body.listingId == null ? null : parsePositiveId(body.listingId, 'listingId');

    const request = await store(req).createRequest({
      listingId,
      senderId: req.userId,
      recipientId,
      offeredSkillId,
      requestedSkillId,
      message: optionalString(body.message, 'message'),
    });

    res.status(201).json({ request });
  })
);

// Recipient accepts -> the request flips to ACCEPTED and an exchange is created
router.post(
  '/requests/:id/accept',
  asyncHandler(async (req, res) => {
    const requestId = parsePositiveId(req.params.id, 'id');
    const request = await store(req).getRequest(requestId);
    if (!request) throw HttpError.notFound('Request not found');

    const result = await store(req).setRequestStatus(requestId, {
      status: 'ACCEPTED',
      actorId: req.userId,
      actorRole: 'recipient',
    });

    // memoryStore flips the row only; pgStore also inserts the exchange in the
    // same transaction. Normalise both into one response shape.
    let exchange = result.exchange ?? null;
    if (!exchange) {
      const existing = await store(req)
        .listExchanges({ userId: req.userId })
        .then((rows) => rows.find((e) => e.requestId === requestId));
      exchange = existing ?? null;
    }

    res.json({ request: result, exchange });
  })
);

router.post(
  '/requests/:id/reject',
  asyncHandler(async (req, res) => {
    const requestId = parsePositiveId(req.params.id, 'id');
    const request = await store(req).setRequestStatus(requestId, {
      status: 'REJECTED',
      actorId: req.userId,
      actorRole: 'recipient',
    });
    res.json({ request });
  })
);

router.post(
  '/requests/:id/cancel',
  asyncHandler(async (req, res) => {
    const requestId = parsePositiveId(req.params.id, 'id');
    const request = await store(req).setRequestStatus(requestId, {
      status: 'CANCELLED',
      actorId: req.userId,
      actorRole: 'sender',
    });
    res.json({ request });
  })
);

// =====================================================================
// Exchanges (confirmed swaps)
// =====================================================================

router.get(
  '/exchanges',
  asyncHandler(async (req, res) => {
    const status = req.query.status
      ? requireEnum(req.query.status, 'status', ['ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      : undefined;
    const exchanges = await store(req).listExchanges({ userId: req.userId, status });
    res.json({ count: exchanges.length, exchanges });
  })
);

router.get(
  '/exchanges/:id',
  asyncHandler(async (req, res) => {
    const exchange = await store(req).getExchange(
      parsePositiveId(req.params.id, 'id'),
      req.userId
    );
    if (!exchange) throw HttpError.notFound('Exchange not found');
    res.json({ exchange });
  })
);

// Exchange status management: ACTIVE -> IN_PROGRESS -> COMPLETED | CANCELLED
router.patch(
  '/exchanges/:id',
  asyncHandler(async (req, res) => {
    const exchangeId = parsePositiveId(req.params.id, 'id');
    const status = requireEnum(
      (req.body || {}).status,
      'status',
      ['ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    );

    const exchange = await store(req).updateExchangeStatus(exchangeId, req.userId, status);
    res.json({ exchange });
  })
);

module.exports = router;
