'use strict';

const seed = require('./seedData');
const { HttpError } = require('../lib/errors');

const PROFICIENCY = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/**
 * Zero-dependency store used for tests and for `npm start` without a database.
 * Implements exactly the same async surface as pgStore.js, so the routes are
 * storage-agnostic.
 */
class MemoryStore {
  constructor(seedData = seed) {
    this.counters = { listing: 0, request: 0, exchange: 0 };

    this.categories = clone(seedData.categories);
    this.skills = clone(seedData.skills);
    this.users = clone(seedData.users);
    this.userSkills = clone(seedData.userSkills);

    this.listings = clone(seedData.listings);
    this.requests = clone(seedData.requests);
    this.exchanges = clone(seedData.exchanges);

    // Seed rows may be sparse, so derive each counter from its own table.
    this.counters = {
      listing: Math.max(0, ...this.listings.map((r) => r.listingId || 0)),
      request: Math.max(0, ...this.requests.map((r) => r.requestId || 0)),
      exchange: Math.max(0, ...this.exchanges.map((r) => r.exchangeId || 0)),
    };
    for (const row of this.listings) {
      row.createdAt = row.createdAt || new Date().toISOString();
      row.updatedAt = row.updatedAt || row.createdAt;
    }
    for (const row of this.requests) {
      row.createdAt = row.createdAt || new Date().toISOString();
      row.updatedAt = row.updatedAt || row.createdAt;
    }
    for (const row of this.exchanges) {
      row.initiatedAt = row.initiatedAt || new Date().toISOString();
    }
  }

  // ---------------------------------------------------------------- helpers

  nextId(kind) {
    this.counters[kind] = (this.counters[kind] || 0) + 1;
    return this.counters[kind];
  }

  skillById(skillId) {
    return this.skills.find((s) => s.skillId === skillId) || null;
  }

  userById(userId) {
    return this.users.find((u) => u.userId === userId) || null;
  }

  assertUser(userId) {
    if (!this.userById(userId)) throw HttpError.unprocessable(`User ${userId} does not exist`, { field: 'userId' });
  }

  assertSkill(skillId, field) {
    if (skillId === null || skillId === undefined) return;
    if (!this.skillById(skillId)) {
      throw HttpError.unprocessable(`Skill ${skillId} does not exist`, { field });
    }
  }

  // --------------------------------------------------------------- listings

  async createListing(data) {
    this.assertUser(data.userId);
    this.assertSkill(data.offerSkillId, 'offerSkillId');
    this.assertSkill(data.wantSkillId, 'wantSkillId');

    const now = new Date().toISOString();
    const row = {
      listingId: this.nextId('listing'),
      userId: data.userId,
      listingType: data.listingType,
      offerSkillId: data.offerSkillId ?? null,
      wantSkillId: data.wantSkillId ?? null,
      title: data.title,
      description: data.description ?? null,
      availability: data.availability ?? null,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.listings.push(row);
    return this.getListing(row.listingId);
  }

  decorateListing(row) {
    const offer = row.offerSkillId ? this.skillById(row.offerSkillId) : null;
    const want = row.wantSkillId ? this.skillById(row.wantSkillId) : null;
    const owner = this.userById(row.userId);
    const proficiency = this.userSkills.find(
      (us) => us.userId === row.userId && us.skillId === row.offerSkillId
    );
    return {
      ...clone(row),
      offerSkillName: offer ? offer.skillName : null,
      wantSkillName: want ? want.skillName : null,
      offerCategory: offer ? offer.categoryId : null,
      wantCategory: want ? want.categoryId : null,
      userName: owner ? owner.userName : null,
      offerProficiency: proficiency ? proficiency.proficiency : null,
    };
  }

  async listListings({ listingType, skillId, search, excludeUserId, userId, status = 'ACTIVE' } = {}) {
    let rows = this.listings.slice();

    if (userId !== undefined) rows = rows.filter((r) => r.userId === userId);
    if (excludeUserId !== undefined) rows = rows.filter((r) => r.userId !== excludeUserId);
    if (listingType) rows = rows.filter((r) => r.listingType === listingType);
    if (status) rows = rows.filter((r) => r.status === status);
    if (skillId !== undefined) {
      rows = rows.filter((r) => r.offerSkillId === skillId || r.wantSkillId === skillId);
    }
    if (search) {
      const needle = String(search).toLowerCase();
      rows = rows.filter((r) => r.title.toLowerCase().includes(needle));
    }

    rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return rows.map((r) => this.decorateListing(r));
  }

  async getListing(listingId) {
    const row = this.listings.find((r) => r.listingId === listingId);
    return row ? this.decorateListing(row) : null;
  }

  async updateListing(listingId, userId, patch) {
    const row = this.listings.find((r) => r.listingId === listingId);
    if (!row) throw HttpError.notFound(`Listing ${listingId} not found`);
    if (row.userId !== userId) throw HttpError.forbidden('Only the listing owner can update it');

    const { title, description, availability, status } = patch || {};
    if (title !== undefined) {
      if (!String(title).trim()) throw HttpError.badRequest('`title` cannot be empty');
      row.title = title;
    }
    if (description !== undefined) row.description = description;
    if (availability !== undefined) row.availability = availability;
    if (status !== undefined) {
      if (!['ACTIVE', 'PAUSED', 'CLOSED'].includes(status)) {
        throw HttpError.badRequest('`status` must be ACTIVE, PAUSED or CLOSED');
      }
      row.status = status;
    }
    row.updatedAt = new Date().toISOString();
    return this.getListing(listingId);
  }

  async closeListing(listingId, userId) {
    return this.updateListing(listingId, userId, { status: 'CLOSED' });
  }

  /** Candidate pool for the matcher - active listings that are not mine. */
  async listCandidateListings(excludeUserId) {
    const rows = this.listings.filter(
      (r) => r.status === 'ACTIVE' && r.userId !== excludeUserId
    );
    return rows.map((r) => this.decorateListing(r));
  }

  /** Pending request count per listing, for the "My listings" badges. */
  async countPendingRequests(userId) {
    const rows = this.listings.filter((r) => r.userId === userId);
    return rows.map((r) => ({
      ...this.decorateListing(r),
      pendingRequests: this.requests.filter(
        (q) => q.listingId === r.listingId && q.status === 'PENDING'
      ).length,
    }));
  }

  // --------------------------------------------------------------- requests

  decorateRequest(row) {
    const offered = row.offeredSkillId ? this.skillById(row.offeredSkillId) : null;
    const wanted = row.requestedSkillId ? this.skillById(row.requestedSkillId) : null;
    const sender = this.userById(row.senderId);
    const recipient = this.userById(row.recipientId);
    const listing = row.listingId ? this.listings.find((l) => l.listingId === row.listingId) : null;
    return {
      ...clone(row),
      offeredSkillName: offered ? offered.skillName : null,
      requestedSkillName: wanted ? wanted.skillName : null,
      senderName: sender ? sender.userName : null,
      recipientName: recipient ? recipient.userName : null,
      listingTitle: listing ? listing.title : null,
    };
  }

  async createRequest(data) {
    this.assertUser(data.senderId);
    this.assertUser(data.recipientId);
    this.assertSkill(data.offeredSkillId, 'offeredSkillId');
    this.assertSkill(data.requestedSkillId, 'requestedSkillId');

    if (data.senderId === data.recipientId) {
      throw HttpError.badRequest('You cannot send an exchange request to yourself');
    }
    if (data.offeredSkillId === data.requestedSkillId) {
      throw HttpError.badRequest('`offeredSkillId` and `requestedSkillId` must differ');
    }

    if (data.listingId != null) {
      const listing = this.listings.find((l) => l.listingId === data.listingId);
      if (!listing) throw HttpError.notFound(`Listing ${data.listingId} not found`);
      if (listing.status !== 'ACTIVE') {
        throw HttpError.conflict(`Listing ${data.listingId} is not accepting requests`, {
          listingStatus: listing.status,
        });
      }
    }

    const duplicate = this.requests.find(
      (q) =>
        q.senderId === data.senderId &&
        q.recipientId === data.recipientId &&
        q.offeredSkillId === data.offeredSkillId &&
        q.requestedSkillId === data.requestedSkillId &&
        q.status === 'PENDING'
    );
    if (duplicate) {
      throw HttpError.conflict('An identical request is already pending', {
        requestId: duplicate.requestId,
      });
    }

    const now = new Date().toISOString();
    const row = {
      requestId: this.nextId('request'),
      listingId: data.listingId ?? null,
      senderId: data.senderId,
      recipientId: data.recipientId,
      offeredSkillId: data.offeredSkillId,
      requestedSkillId: data.requestedSkillId,
      message: data.message ?? null,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    this.requests.push(row);
    return this.getRequest(row.requestId);
  }

  async listRequests({ userId, box = 'ALL' } = {}) {
    let rows = this.requests.slice();
    if (box === 'INBOX') rows = rows.filter((r) => r.recipientId === userId);
    else if (box === 'OUTBOX') rows = rows.filter((r) => r.senderId === userId);
    else rows = rows.filter((r) => r.senderId === userId || r.recipientId === userId);

    rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return rows.map((r) => this.decorateRequest(r));
  }

  async getRequest(requestId) {
    const row = this.requests.find((r) => r.requestId === requestId);
    return row ? this.decorateRequest(row) : null;
  }

  async countRequestStates(userId) {
    const rows = this.requests.filter((r) => r.recipientId === userId);
    return {
      pending: rows.filter((r) => r.status === 'PENDING').length,
      accepted: rows.filter((r) => r.status === 'ACCEPTED').length,
      rejected: rows.filter((r) => r.status === 'REJECTED').length,
    };
  }

  /** Accept/reject/cancel with the ownership rule enforced. */
  async setRequestStatus(requestId, { status, actorId, actorRole }) {
    const row = this.requests.find((r) => r.requestId === requestId);
    if (!row) throw HttpError.notFound(`Request ${requestId} not found`);

    if (actorRole === 'recipient') {
      if (row.recipientId !== actorId) {
        throw HttpError.forbidden('Only the recipient can respond to a request');
      }
      if (status !== 'ACCEPTED' && status !== 'REJECTED') {
        throw HttpError.badRequest('A recipient can only ACCEPT or REJECT');
      }
    } else {
      if (row.senderId !== actorId) {
        throw HttpError.forbidden('Only the sender can cancel a request');
      }
      if (status !== 'CANCELLED') {
        throw HttpError.badRequest('A sender can only CANCEL');
      }
    }

    if (row.status !== 'PENDING') {
      throw HttpError.conflict(`Request is already ${row.status}`, { status: row.status });
    }

    row.status = status;
    row.updatedAt = new Date().toISOString();

    // Accepting creates the confirmed swap, exactly like the PostgreSQL path
    // (W14 + W17 in one transaction).
    let exchange = null;
    if (status === 'ACCEPTED') {
      exchange = await this.createExchange({
        requestId,
        initiatorId: row.senderId,
        partnerId: row.recipientId,
        offeredSkillId: row.offeredSkillId,
        requestedSkillId: row.requestedSkillId,
      });
    }

    const request = await this.getRequest(requestId);
    return exchange ? { ...request, exchange } : request;
  }

  // -------------------------------------------------------------- exchanges

  decorateExchange(row, viewerId) {
    const offered = row.offeredSkillId ? this.skillById(row.offeredSkillId) : null;
    const wanted = row.requestedSkillId ? this.skillById(row.requestedSkillId) : null;
    const initiator = this.userById(row.initiatorId);
    const partner = this.userById(row.partnerId);
    return {
      ...clone(row),
      offeredSkillName: offered ? offered.skillName : null,
      requestedSkillName: wanted ? wanted.skillName : null,
      initiatorName: initiator ? initiator.userName : null,
      partnerName: partner ? partner.userName : null,
      myRole: viewerId === row.initiatorId ? 'INITIATOR' : 'PARTNER',
    };
  }

  async createExchange({ requestId, initiatorId, partnerId, offeredSkillId, requestedSkillId }) {
    const request = this.requests.find((r) => r.requestId === requestId);
    if (!request) throw HttpError.notFound(`Request ${requestId} not found`);
    if (request.status !== 'ACCEPTED') {
      throw HttpError.conflict('Only an accepted request can become an exchange', {
        status: request.status,
      });
    }
    if (this.exchanges.some((e) => e.requestId === requestId)) {
      throw HttpError.conflict('This request already has an exchange');
    }

    const row = {
      exchangeId: this.nextId('exchange'),
      requestId,
      initiatorId,
      partnerId,
      offeredSkillId,
      requestedSkillId,
      status: 'ACTIVE',
      initiatedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };
    this.exchanges.push(row);
    return this.getExchange(row.exchangeId);
  }

  async listExchanges({ userId, status } = {}) {
    let rows = this.exchanges.filter(
      (e) => e.initiatorId === userId || e.partnerId === userId
    );
    if (status) rows = rows.filter((e) => e.status === status);
    rows.sort((a, b) => String(b.initiatedAt).localeCompare(String(a.initiatedAt)));
    return rows.map((r) => this.decorateExchange(r, userId));
  }

  async getExchange(exchangeId, viewerId) {
    const row = this.exchanges.find((e) => e.exchangeId === exchangeId);
    if (!row) return null;
    return this.decorateExchange(row, viewerId ?? row.initiatorId);
  }

  async updateExchangeStatus(exchangeId, userId, status) {
    const row = this.exchanges.find((e) => e.exchangeId === exchangeId);
    if (!row) throw HttpError.notFound(`Exchange ${exchangeId} not found`);
    if (row.initiatorId !== userId && row.partnerId !== userId) {
      throw HttpError.forbidden('Only a participant can change the exchange status');
    }
    const allowed = ['ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      throw HttpError.badRequest(`\`status\` must be one of ${allowed.join(', ')}`);
    }

    const transitions = {
      ACTIVE: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (!transitions[row.status].includes(status)) {
      throw HttpError.conflict(`Cannot move an exchange from ${row.status} to ${status}`, {
        from: row.status,
        to: status,
      });
    }

    row.status = status;
    if (status === 'IN_PROGRESS' && !row.startedAt) row.startedAt = new Date().toISOString();
    if (status === 'COMPLETED') row.completedAt = new Date().toISOString();
    return this.getExchange(exchangeId, userId);
  }

  // -------------------------------------------------------- matcher support

  async getUserSkills(userId) {
    return this.userSkills
      .filter((us) => us.userId === userId)
      .map((us) => {
        const skill = this.skillById(us.skillId);
        return {
          skillId: us.skillId,
          skillName: skill ? skill.skillName : null,
          categoryId: skill ? skill.categoryId : null,
          categoryName: skill ? this.categories.find((c) => c.categoryId === skill.categoryId)?.categoryName : null,
          proficiency: us.proficiency,
          hourlyRate: us.hourlyRate,
        };
      });
  }

  /**
   * The matcher's view of a user: what they can teach (with proficiency) and
   * what they want to learn (from their listings).
   */
  async getUserProfile(userId) {
    this.assertUser(userId);
    const offers = this.userSkills
      .filter((us) => us.userId === userId)
      .map((us) => ({ skillId: us.skillId, proficiency: us.proficiency }));

    const wantIds = [
      ...new Set(
        this.listings
          .filter((l) => l.userId === userId && l.wantSkillId != null)
          .map((l) => l.wantSkillId)
      ),
    ];
    return { userId, offers, wants: wantIds };
  }

  async listUsers() {
    return this.users.map((u) => ({ userId: u.userId, userName: u.userName }));
  }

  async listSkills() {
    return this.skills.map((s) => ({
      skillId: s.skillId,
      skillName: s.skillName,
      categoryId: s.categoryId,
      categoryName: this.categories.find((c) => c.categoryId === s.categoryId)?.categoryName,
    }));
  }

  async countCompletedExchanges(userId) {
    return this.exchanges.filter(
      (e) => e.status === 'COMPLETED' && (e.initiatorId === userId || e.partnerId === userId)
    ).length;
  }

  async listCompletedExchangeCounts() {
    const counts = {};
    for (const e of this.exchanges) {
      if (e.status !== 'COMPLETED') continue;
      counts[e.initiatorId] = (counts[e.initiatorId] || 0) + 1;
      counts[e.partnerId] = (counts[e.partnerId] || 0) + 1;
    }
    return counts;
  }
}

module.exports = { MemoryStore, PROFICIENCY };
