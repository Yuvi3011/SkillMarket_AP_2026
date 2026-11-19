'use strict';

const { Pool } = require('pg');
const { HttpError } = require('../lib/errors');

/**
 * PostgreSQL implementation of the exchange store.
 * Every statement here is the same query documented in
 * ../../dbms/02_exchange_queries.sql (R14-R23 / W10-W18).
 */
class PgStore {
  constructor(connectionString) {
    if (!connectionString) throw new Error('PgStore requires a connection string');
    this.pool = new Pool({ connectionString });
  }

  async close() {
    await this.pool.end();
  }

  // ------------------------------------------------------------- mappers

  rowToListing(r) {
    if (!r) return null;
    return {
      listingId: r.listing_id,
      userId: r.user_id,
      listingType: r.listing_type,
      offerSkillId: r.offer_skill_id,
      wantSkillId: r.want_skill_id,
      title: r.title,
      description: r.description,
      availability: r.availability,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      offerSkillName: r.offer_skill_name ?? null,
      wantSkillName: r.want_skill_name ?? null,
      offerCategory: r.offer_category ?? null,
      wantCategory: r.want_category ?? null,
      userName: r.user_name ?? null,
      offerProficiency: r.offer_proficiency ?? null,
    };
  }

  rowToRequest(r) {
    if (!r) return null;
    return {
      requestId: r.request_id,
      listingId: r.listing_id,
      senderId: r.sender_id,
      recipientId: r.recipient_id,
      offeredSkillId: r.offered_skill_id,
      requestedSkillId: r.requested_skill_id,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      offeredSkillName: r.offered_skill_name ?? null,
      requestedSkillName: r.requested_skill_name ?? null,
      senderName: r.sender_name ?? null,
      recipientName: r.recipient_name ?? null,
      listingTitle: r.listing_title ?? null,
    };
  }

  rowToExchange(r, viewerId) {
    if (!r) return null;
    return {
      exchangeId: r.exchange_id,
      requestId: r.request_id,
      initiatorId: r.initiator_id,
      partnerId: r.partner_id,
      offeredSkillId: r.offered_skill_id,
      requestedSkillId: r.requested_skill_id,
      status: r.status,
      initiatedAt: r.initiated_at,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      offeredSkillName: r.offered_skill_name ?? null,
      requestedSkillName: r.requested_skill_name ?? null,
      initiatorName: r.initiator_name ?? null,
      partnerName: r.partner_name ?? null,
      myRole: viewerId === r.initiator_id ? 'INITIATOR' : 'PARTNER',
    };
  }

  // ------------------------------------------------------------- listings

  async createListing(data) {
    const { rows } = await this.pool.query(
      `INSERT INTO exchange_listings
         (user_id, listing_type, offer_skill_id, want_skill_id, title, description, availability)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING listing_id, created_at`,
      [
        data.userId,
        data.listingType,
        data.offerSkillId ?? null,
        data.wantSkillId ?? null,
        data.title,
        data.description ?? null,
        data.availability ?? null,
      ]
    );
    return this.getListing(rows[0].listing_id);
  }

  async listListings({ listingType, skillId, search, excludeUserId, userId, status } = {}) {
    const { rows } = await this.pool.query(
      `SELECT l.listing_id, l.listing_type, l.title, l.description, l.availability,
              l.status, l.created_at, l.updated_at,
              l.offer_skill_id, so.skill_name AS offer_skill_name,
              l.want_skill_id,  sw.skill_name AS want_skill_name,
              u.user_id, u.user_name,
              c1.category_id AS offer_category,
              c2.category_id AS want_category,
              us.proficiency AS offer_proficiency
       FROM   exchange_listings l
       JOIN   users u    ON u.user_id = l.user_id
       LEFT   JOIN skills so ON so.skill_id = l.offer_skill_id
       LEFT   JOIN skills sw ON sw.skill_id = l.want_skill_id
       LEFT   JOIN categories c1 ON c1.category_id = so.category_id
       LEFT   JOIN categories c2 ON c2.category_id = sw.category_id
       LEFT   JOIN user_skills us ON us.user_id = l.user_id AND us.skill_id = l.offer_skill_id
       WHERE  ($1::varchar IS NULL OR l.listing_type = $1)
         AND  ($6::varchar IS NULL OR l.status = $6)
         AND  ($2::integer IS NULL OR l.offer_skill_id = $2 OR l.want_skill_id = $2)
         AND  ($3::text    IS NULL OR l.title ILIKE '%' || $3 || '%')
         AND  ($4::integer IS NULL OR l.user_id <> $4)
         AND  ($5::integer IS NULL OR l.user_id = $5)
       ORDER  BY l.created_at DESC`,
      [
        listingType ?? null,
        skillId ?? null,
        search ?? null,
        excludeUserId ?? null,
        userId ?? null,
        status ?? 'ACTIVE',
      ]
    );
    return rows.map((r) => this.rowToListing(r));
  }

  async getListing(listingId) {
    const { rows } = await this.pool.query(
      `SELECT l.listing_id, l.listing_type, l.title, l.description, l.availability,
              l.status, l.created_at, l.updated_at,
              l.offer_skill_id, so.skill_name AS offer_skill_name,
              l.want_skill_id,  sw.skill_name AS want_skill_name,
              u.user_id, u.user_name,
              c1.category_id AS offer_category,
              c2.category_id AS want_category,
              us.proficiency AS offer_proficiency
       FROM   exchange_listings l
       JOIN   users u    ON u.user_id = l.user_id
       LEFT   JOIN skills so ON so.skill_id = l.offer_skill_id
       LEFT   JOIN skills sw ON sw.skill_id = l.want_skill_id
       LEFT   JOIN categories c1 ON c1.category_id = so.category_id
       LEFT   JOIN categories c2 ON c2.category_id = sw.category_id
       LEFT   JOIN user_skills us ON us.user_id = l.user_id AND us.skill_id = l.offer_skill_id
       WHERE  l.listing_id = $1`,
      [listingId]
    );
    return this.rowToListing(rows[0]);
  }

  async updateListing(listingId, userId, patch) {
    const existing = await this.getListing(listingId);
    if (!existing) throw HttpError.notFound(`Listing ${listingId} not found`);
    if (existing.userId !== userId) {
      throw HttpError.forbidden('Only the listing owner can update it');
    }

    const { rows } = await this.pool.query(
      `UPDATE exchange_listings
       SET    title        = COALESCE($2, title),
              description  = COALESCE($3, description),
              availability = COALESCE($4, availability),
              status       = COALESCE($5, status)
       WHERE  listing_id = $6 AND user_id = $7
       RETURNING listing_id, status, updated_at`,
      [
        patch.title ?? null,
        patch.description ?? null,
        patch.availability ?? null,
        patch.status ?? null,
        listingId,
        userId,
      ]
    );
    return this.getListing(rows[0].listing_id);
  }

  async closeListing(listingId, userId) {
    return this.updateListing(listingId, userId, { status: 'CLOSED' });
  }

  async listCandidateListings(excludeUserId) {
    const { rows } = await this.pool.query(
      `SELECT l.listing_id, l.listing_type, l.title, l.description, l.availability,
              l.status, l.created_at, l.updated_at,
              l.offer_skill_id, l.want_skill_id, u.user_id, u.user_name,
              us.proficiency AS offer_proficiency
       FROM   exchange_listings l
       JOIN   users u ON u.user_id = l.user_id
       LEFT   JOIN user_skills us ON us.user_id = l.user_id AND us.skill_id = l.offer_skill_id
       WHERE  l.status = 'ACTIVE' AND l.user_id <> $1
       ORDER  BY l.created_at DESC`,
      [excludeUserId]
    );
    return rows.map((r) => ({
      listingId: r.listing_id,
      userId: r.user_id,
      listingType: r.listing_type,
      title: r.title,
      description: r.description,
      availability: r.availability,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      offerSkillId: r.offer_skill_id,
      wantSkillId: r.want_skill_id,
      userName: r.user_name ?? null,
      offerProficiency: r.offer_proficiency ?? null,
    }));
  }

  async countPendingRequests(userId) {
    const { rows } = await this.pool.query(
      `SELECT l.listing_id, l.listing_type, l.title, l.status, l.created_at,
              l.offer_skill_id, l.want_skill_id, u.user_name,
              so.skill_name AS offer_skill_name, sw.skill_name AS want_skill_name,
              (SELECT count(*) FROM exchange_requests r
                WHERE r.listing_id = l.listing_id AND r.status = 'PENDING') AS pending_requests
       FROM   exchange_listings l
       JOIN   users u ON u.user_id = l.user_id
       LEFT   JOIN skills so ON so.skill_id = l.offer_skill_id
       LEFT   JOIN skills sw ON sw.skill_id = l.want_skill_id
       WHERE  l.user_id = $1
       ORDER  BY l.created_at DESC`,
      [userId]
    );
    return rows.map((r) => ({
      listingId: r.listing_id,
      userId,
      listingType: r.listing_type,
      title: r.title,
      status: r.status,
      createdAt: r.created_at,
      offerSkillId: r.offer_skill_id,
      wantSkillId: r.want_skill_id,
      userName: r.user_name ?? null,
      offerSkillName: r.offer_skill_name ?? null,
      wantSkillName: r.want_skill_name ?? null,
      pendingRequests: Number(r.pending_requests),
    }));
  }

  // ------------------------------------------------------------- requests

  async createRequest(data) {
    const { rows } = await this.pool.query(
      `INSERT INTO exchange_requests
         (listing_id, sender_id, recipient_id, offered_skill_id, requested_skill_id, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING request_id, created_at`,
      [
        data.listingId ?? null,
        data.senderId,
        data.recipientId,
        data.offeredSkillId,
        data.requestedSkillId,
        data.message ?? null,
      ]
    );
    return this.getRequest(rows[0].request_id);
  }

  async listRequests({ userId, box = 'ALL' } = {}) {
    const { rows } = await this.pool.query(
      `SELECT r.request_id, r.listing_id, r.sender_id, r.recipient_id,
              r.offered_skill_id, r.requested_skill_id, r.message,
              r.status, r.created_at, r.updated_at,
              so.skill_name AS offered_skill_name, sw.skill_name AS requested_skill_name,
              s.user_name AS sender_name, p.user_name AS recipient_name,
              l.title AS listing_title
       FROM   exchange_requests r
       JOIN   users s ON s.user_id = r.sender_id
       JOIN   users p ON p.user_id = r.recipient_id
       LEFT   JOIN skills so ON so.skill_id = r.offered_skill_id
       LEFT   JOIN skills sw ON sw.skill_id = r.requested_skill_id
       LEFT   JOIN exchange_listings l ON l.listing_id = r.listing_id
       WHERE  (($1::varchar = 'INBOX'  AND r.recipient_id = $2)
            OR ($1::varchar = 'OUTBOX' AND r.sender_id    = $2)
            OR ($1::varchar = 'ALL'    AND (r.sender_id = $2 OR r.recipient_id = $2)))
       ORDER  BY r.created_at DESC`,
      [box, userId]
    );
    return rows.map((r) => this.rowToRequest(r));
  }

  async getRequest(requestId) {
    const { rows } = await this.pool.query(
      `SELECT r.request_id, r.listing_id, r.sender_id, r.recipient_id,
              r.offered_skill_id, r.requested_skill_id, r.message,
              r.status, r.created_at, r.updated_at,
              so.skill_name AS offered_skill_name, sw.skill_name AS requested_skill_name,
              s.user_name AS sender_name, p.user_name AS recipient_name,
              l.title AS listing_title
       FROM   exchange_requests r
       JOIN   users s ON s.user_id = r.sender_id
       JOIN   users p ON p.user_id = r.recipient_id
       LEFT   JOIN skills so ON so.skill_id = r.offered_skill_id
       LEFT   JOIN skills sw ON sw.skill_id = r.requested_skill_id
       LEFT   JOIN exchange_listings l ON l.listing_id = r.listing_id
       WHERE  r.request_id = $1`,
      [requestId]
    );
    return this.rowToRequest(rows[0]);
  }

  async countRequestStates(userId) {
    const { rows } = await this.pool.query(
      `SELECT count(*) FILTER (WHERE status = 'PENDING') AS pending,
              count(*) FILTER (WHERE status = 'ACCEPTED') AS accepted,
              count(*) FILTER (WHERE status = 'REJECTED') AS rejected
       FROM   exchange_requests
       WHERE  recipient_id = $1`,
      [userId]
    );
    const r = rows[0];
    return { pending: Number(r.pending), accepted: Number(r.accepted), rejected: Number(r.rejected) };
  }

  async setRequestStatus(requestId, { status, actorId, actorRole }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const current = await client.query(
        `SELECT request_id, recipient_id, sender_id, status
         FROM   exchange_requests WHERE request_id = $1 FOR UPDATE`,
        [requestId]
      );
      if (current.rows.length === 0) {
        throw HttpError.notFound(`Request ${requestId} not found`);
      }
      const row = current.rows[0];

      if (actorRole === 'recipient') {
        if (row.recipient_id !== actorId) {
          throw HttpError.forbidden('Only the recipient can respond to a request');
        }
        if (status !== 'ACCEPTED' && status !== 'REJECTED') {
          throw HttpError.badRequest('A recipient can only ACCEPT or REJECT');
        }
      } else {
        if (row.sender_id !== actorId) {
          throw HttpError.forbidden('Only the sender can cancel a request');
        }
        if (status !== 'CANCELLED') {
          throw HttpError.badRequest('A sender can only CANCEL');
        }
      }
      if (row.status !== 'PENDING') {
        throw HttpError.conflict(`Request is already ${row.status}`, { status: row.status });
      }

      await client.query(
        `UPDATE exchange_requests SET status = $1 WHERE request_id = $2`,
        [status, requestId]
      );

      let exchange = null;
      if (status === 'ACCEPTED') {
        const accepted = await client.query(
          `UPDATE exchange_requests SET status = 'ACCEPTED'
           WHERE request_id = $1 AND status = 'PENDING'
           RETURNING request_id, sender_id, recipient_id, offered_skill_id, requested_skill_id`,
          [requestId]
        );
        const a = accepted.rows[0];
        const inserted = await client.query(
          `INSERT INTO exchanges
             (request_id, initiator_id, partner_id, offered_skill_id, requested_skill_id, status)
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
           RETURNING exchange_id`,
          [a.request_id, a.sender_id, a.recipient_id, a.offered_skill_id, a.requested_skill_id]
        );
        exchange = { exchangeId: inserted.rows[0].exchange_id };
      }

      await client.query('COMMIT');
      const request = await this.getRequest(requestId);
      return exchange ? { ...request, exchange } : request;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ------------------------------------------------------------ exchanges

  async createExchange({ requestId, initiatorId, partnerId, offeredSkillId, requestedSkillId }) {
    const { rows } = await this.pool.query(
      `INSERT INTO exchanges
         (request_id, initiator_id, partner_id, offered_skill_id, requested_skill_id, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       RETURNING exchange_id, initiated_at`,
      [requestId, initiatorId, partnerId, offeredSkillId, requestedSkillId]
    );
    return this.getExchange(rows[0].exchange_id);
  }

  async listExchanges({ userId, status } = {}) {
    const { rows } = await this.pool.query(
      `SELECT e.exchange_id, e.request_id, e.initiator_id, e.partner_id,
              e.offered_skill_id, e.requested_skill_id, e.status,
              e.initiated_at, e.started_at, e.completed_at,
              so.skill_name AS offered_skill_name, sw.skill_name AS requested_skill_name,
              ui.user_name AS initiator_name, up.user_name AS partner_name
       FROM   exchanges e
       JOIN   users ui ON ui.user_id = e.initiator_id
       JOIN   users up ON up.user_id = e.partner_id
       JOIN   skills so ON so.skill_id = e.offered_skill_id
       JOIN   skills sw ON sw.skill_id = e.requested_skill_id
       WHERE  (e.initiator_id = $1 OR e.partner_id = $1)
         AND  ($2::varchar IS NULL OR e.status = $2)
       ORDER  BY e.initiated_at DESC`,
      [userId, status ?? null]
    );
    return rows.map((r) => this.rowToExchange(r, userId));
  }

  async getExchange(exchangeId, viewerId) {
    const { rows } = await this.pool.query(
      `SELECT e.exchange_id, e.request_id, e.initiator_id, e.partner_id,
              e.offered_skill_id, e.requested_skill_id, e.status,
              e.initiated_at, e.started_at, e.completed_at,
              so.skill_name AS offered_skill_name, sw.skill_name AS requested_skill_name,
              ui.user_name AS initiator_name, up.user_name AS partner_name
       FROM   exchanges e
       JOIN   users ui ON ui.user_id = e.initiator_id
       JOIN   users up ON up.user_id = e.partner_id
       JOIN   skills so ON so.skill_id = e.offered_skill_id
       JOIN   skills sw ON sw.skill_id = e.requested_skill_id
       WHERE  e.exchange_id = $1`,
      [exchangeId]
    );
    if (!rows[0]) return null;
    return this.rowToExchange(rows[0], viewerId ?? rows[0].initiator_id);
  }

  async updateExchangeStatus(exchangeId, userId, status) {
    const { rows } = await this.pool.query(
      `UPDATE exchanges
       SET    status       = $2,
              started_at   = CASE WHEN $2 = 'IN_PROGRESS' AND started_at IS NULL THEN NOW() ELSE started_at END,
              completed_at = CASE WHEN $2 = 'COMPLETED' THEN NOW() ELSE completed_at END
       WHERE  exchange_id = $1
         AND (initiator_id = $3 OR partner_id = $3)
       RETURNING exchange_id, status`,
      [exchangeId, status, userId]
    );
    if (!rows[0]) {
      const existing = await this.getExchange(exchangeId, userId);
      if (!existing) throw HttpError.notFound(`Exchange ${exchangeId} not found`);
      throw HttpError.forbidden('Only a participant can change the exchange status');
    }
    return this.getExchange(exchangeId, userId);
  }

  // ------------------------------------------------------- matcher support

  async getUserSkills(userId) {
    const { rows } = await this.pool.query(
      `SELECT us.skill_id, s.skill_name, c.category_id, c.category_name,
              us.proficiency, us.hourly_rate
       FROM   user_skills us
       JOIN   skills s     ON s.skill_id = us.skill_id
       JOIN   categories c ON c.category_id = s.category_id
       WHERE  us.user_id = $1`,
      [userId]
    );
    return rows.map((r) => ({
      skillId: r.skill_id,
      skillName: r.skill_name,
      categoryId: r.category_id,
      categoryName: r.category_name,
      proficiency: r.proficiency,
      hourlyRate: r.hourly_rate === null ? null : Number(r.hourly_rate),
    }));
  }

  async getUserProfile(userId) {
    const offers = await this.getUserSkills(userId);
    const { rows } = await this.pool.query(
      `SELECT DISTINCT want_skill_id FROM exchange_listings
       WHERE user_id = $1 AND want_skill_id IS NOT NULL AND status <> 'CLOSED'`,
      [userId]
    );
    return {
      userId,
      offers: offers.map((o) => ({ skillId: o.skillId, proficiency: o.proficiency })),
      wants: rows.map((r) => r.want_skill_id),
    };
  }

  async listUsers() {
    const { rows } = await this.pool.query(
      `SELECT user_id, user_name FROM users ORDER BY user_id`
    );
    return rows.map((r) => ({ userId: r.user_id, userName: r.user_name }));
  }

  async listSkills() {
    const { rows } = await this.pool.query(
      `SELECT s.skill_id, s.skill_name, c.category_id, c.category_name
       FROM   skills s JOIN categories c ON c.category_id = s.category_id
       ORDER  BY s.skill_name`
    );
    return rows.map((r) => ({
      skillId: r.skill_id,
      skillName: r.skill_name,
      categoryId: r.category_id,
      categoryName: r.category_name,
    }));
  }

  async countCompletedExchanges(userId) {
    const { rows } = await this.pool.query(
      `SELECT count(*) AS n FROM exchanges
       WHERE  status = 'COMPLETED' AND (initiator_id = $1 OR partner_id = $1)`,
      [userId]
    );
    return Number(rows[0].n);
  }

  async listCompletedExchangeCounts() {
    const { rows } = await this.pool.query(
      `SELECT user_id, count(*) AS n FROM (
          SELECT initiator_id AS user_id FROM exchanges WHERE status = 'COMPLETED'
          UNION ALL
          SELECT partner_id   AS user_id FROM exchanges WHERE status = 'COMPLETED'
       ) t GROUP BY user_id`
    );
    return Object.fromEntries(rows.map((r) => [r.user_id, Number(r.n)]));
  }
}

module.exports = { PgStore };
