-- =====================================================================
-- SkillMarket · Module 3: Skill Exchange & Smart Matching
-- File: modules/exchange/dbms/02_exchange_queries.sql
--
-- Continues the numbering of dbms/04_queries.sql (R1..R13, W1..W9).
-- $1, $2 … are parameterised placeholders (prepared-statement style).
-- Every query here is the exact statement used by the matching backend
-- in modules/exchange/backend/src/db/pgStore.js.
-- =====================================================================

SET search_path TO skillmarket;

-- ============================== LISTINGS ==============================

-- R14 READ
-- Browse exchange listings (Skill Exchange page)
-- $1 = listing_type ('OFFER'|'REQUEST'|NULL for all)
-- $2 = skill_id   (NULL = any) — matches either the offered or wanted skill
-- $3 = search text (NULL = any) — ILIKE over title
-- $4 = owner user_id to exclude (NULL = include everyone)
SELECT l.listing_id, l.listing_type, l.title, l.description, l.availability,
       l.status, l.created_at, l.updated_at,
       l.offer_skill_id, so.skill_name AS offer_skill_name,
       l.want_skill_id,  sw.skill_name AS want_skill_name,
       u.user_id, u.user_name,
       c1.category_name AS offer_category,
       c2.category_name AS want_category
FROM   exchange_listings l
JOIN   users u    ON u.user_id = l.user_id
LEFT   JOIN skills so ON so.skill_id = l.offer_skill_id
LEFT   JOIN skills sw ON sw.skill_id = l.want_skill_id
LEFT   JOIN categories c1 ON c1.category_id = so.category_id
LEFT   JOIN categories c2 ON c2.category_id = sw.category_id
WHERE  ($1::varchar IS NULL OR l.listing_type = $1)
  AND  l.status = 'ACTIVE'
  AND  ($2::integer IS NULL OR l.offer_skill_id = $2 OR l.want_skill_id = $2)
  AND  ($3::text    IS NULL OR l.title ILIKE '%' || $3 || '%')
  AND  ($4::integer IS NULL OR l.user_id <> $4)
ORDER  BY l.created_at DESC;

-- R15 READ
-- Single listing with the owner's proficiency in the offered skill
SELECT l.*, so.skill_name AS offer_skill_name, sw.skill_name AS want_skill_name,
       u.user_name, u.user_bio,
       us.proficiency AS offer_proficiency
FROM   exchange_listings l
JOIN   users u    ON u.user_id = l.user_id
LEFT   JOIN skills so ON so.skill_id = l.offer_skill_id
LEFT   JOIN skills sw ON sw.skill_id = l.want_skill_id
LEFT   JOIN user_skills us ON us.user_id = l.user_id AND us.skill_id = l.offer_skill_id
WHERE  l.listing_id = $1;

-- R16 READ
-- My listings (Offer a Skill / Request a Skill management)
SELECT l.listing_id, l.listing_type, l.title, l.status, l.created_at,
       so.skill_name AS offer_skill_name, sw.skill_name AS want_skill_name,
       (SELECT count(*) FROM exchange_requests r
         WHERE r.listing_id = l.listing_id AND r.status = 'PENDING') AS pending_requests
FROM   exchange_listings l
LEFT   JOIN skills so ON so.skill_id = l.offer_skill_id
LEFT   JOIN skills sw ON sw.skill_id = l.want_skill_id
WHERE  l.user_id = $1
ORDER  BY l.created_at DESC;

-- R17 READ
-- Candidate pool for the smart matcher: every active listing with the
-- owner's offered-skill proficiency, excluding the caller's own listings.
SELECT l.listing_id, l.user_id, l.listing_type, l.status, l.created_at,
       l.offer_skill_id, l.want_skill_id, l.availability,
       us.proficiency AS offer_proficiency
FROM   exchange_listings l
LEFT   JOIN user_skills us ON us.user_id = l.user_id AND us.skill_id = l.offer_skill_id
WHERE  l.status = 'ACTIVE'
  AND  l.user_id <> $1;

-- ============================== REQUESTS ==============================

-- R18 READ
-- Exchange requests for the current user.
-- $1 = user_id · $2 = box ('INBOX' | 'OUTBOX' | 'ALL')
SELECT r.request_id, r.status, r.message, r.created_at, r.updated_at,
       r.offered_skill_id, so.skill_name AS offered_skill_name,
       r.requested_skill_id, sw.skill_name AS requested_skill_name,
       s.user_id  AS sender_id,  s.user_name  AS sender_name,
       p.user_id  AS recipient_id, p.user_name AS recipient_name,
       l.listing_id, l.title AS listing_title
FROM   exchange_requests r
JOIN   users s ON s.user_id = r.sender_id
JOIN   users p ON p.user_id = r.recipient_id
LEFT   JOIN skills so ON so.skill_id = r.offered_skill_id
LEFT   JOIN skills sw ON sw.skill_id = r.requested_skill_id
LEFT   JOIN exchange_listings l ON l.listing_id = r.listing_id
WHERE  (($2 = 'INBOX'  AND r.recipient_id = $1)
     OR ($2 = 'OUTBOX' AND r.sender_id    = $1)
     OR ($2 = 'ALL'    AND (r.sender_id = $1 OR r.recipient_id = $1)))
ORDER  BY r.created_at DESC;

-- R19 READ
-- Incoming-request counters for the nav badges
SELECT count(*) FILTER (WHERE status = 'PENDING')  AS pending,
       count(*) FILTER (WHERE status = 'ACCEPTED')  AS accepted,
       count(*) FILTER (WHERE status = 'REJECTED')  AS rejected
FROM   exchange_requests
WHERE  recipient_id = $1;

-- ============================== EXCHANGES ==============================

-- R20 READ
-- My exchanges (both sides), with the counterpart's name and skills
SELECT e.exchange_id, e.status, e.initiated_at, e.started_at, e.completed_at,
       e.offered_skill_id, so.skill_name AS offered_skill_name,
       e.requested_skill_id, sw.skill_name AS requested_skill_name,
       e.initiator_id, ui.user_name AS initiator_name,
       e.partner_id,   up.user_name AS partner_name,
       CASE WHEN e.initiator_id = $1 THEN 'INITIATOR' ELSE 'PARTNER' END AS my_role
FROM   exchanges e
JOIN   users ui ON ui.user_id = e.initiator_id
JOIN   users up ON up.user_id = e.partner_id
JOIN   skills so ON so.skill_id = e.offered_skill_id
JOIN   skills sw ON sw.skill_id = e.requested_skill_id
WHERE  e.initiator_id = $1 OR e.partner_id = $1
ORDER  BY e.initiated_at DESC;

-- ============================== MATCHER SUPPORT ========================

-- R21 READ
-- A user's teaching portfolio: skills they offer, with proficiency
-- (proficiency is stored as BEGINNER/INTERMEDIATE/ADVANCED/EXPERT)
SELECT us.skill_id, s.skill_name, c.category_id, c.category_name,
       us.proficiency, us.hourly_rate
FROM   user_skills us
JOIN   skills s     ON s.skill_id = us.skill_id
JOIN   categories c ON c.category_id = s.category_id
WHERE  us.user_id = $1;

-- R22 READ
-- Trust signal: how many exchanges each user has completed
SELECT u.user_id, u.user_name, count(e.exchange_id) AS completed_exchanges
FROM   users u
LEFT   JOIN exchanges e
       ON e.status = 'COMPLETED' AND (e.initiator_id = u.user_id OR e.partner_id = u.user_id)
GROUP  BY u.user_id, u.user_name;

-- R23 READ
-- Complementarity shortlist (SQL pre-filter for the matcher):
-- listings that either offer something I want, or want something I offer.
-- $1 = my user_id
SELECT l.listing_id, l.user_id AS partner_id,
       l.offer_skill_id, l.want_skill_id,
       CASE WHEN want_skill_id IN (SELECT skill_id FROM user_skills WHERE user_id = $1)
            THEN 1 ELSE 0 END AS partner_wants_mine,
       CASE WHEN offer_skill_id IN (SELECT skill_id FROM user_skills WHERE user_id = $1)
            THEN 1 ELSE 0 END AS partner_offers_mine
FROM   exchange_listings l
WHERE  l.status = 'ACTIVE'
  AND  l.user_id <> $1
  AND  (l.offer_skill_id IN (SELECT skill_id FROM user_skills WHERE user_id = $1)
     OR l.want_skill_id  IN (SELECT skill_id FROM user_skills WHERE user_id = $1));

-- ============================== WRITES ================================

-- W10 WRITE
-- Create an exchange listing
INSERT INTO exchange_listings
       (user_id, listing_type, offer_skill_id, want_skill_id, title, description, availability)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING listing_id, created_at;

-- W11 WRITE
-- Update a listing (description / availability / status)
UPDATE exchange_listings
SET    title        = COALESCE($2, title),
       description  = COALESCE($3, description),
       availability = COALESCE($4, availability),
       status       = COALESCE($5, status)
WHERE  listing_id = $6 AND user_id = $7
RETURNING listing_id, status, updated_at;

-- W12 WRITE
-- Close (soft-delete) a listing
UPDATE exchange_listings SET status = 'CLOSED'
WHERE  listing_id = $1 AND user_id = $2;

-- W13 WRITE
-- Send an exchange request
INSERT INTO exchange_requests
       (listing_id, sender_id, recipient_id, offered_skill_id, requested_skill_id, message)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING request_id, created_at;

-- W14 WRITE
-- Recipient accepts a request. The exchange row is created in the same
-- transaction by the backend (createExchangeOnAccept).
UPDATE exchange_requests
SET    status = 'ACCEPTED', updated_at = NOW()
WHERE  request_id = $1 AND recipient_id = $2 AND status = 'PENDING'
RETURNING request_id, sender_id, offered_skill_id, requested_skill_id;

-- W15 WRITE
-- Recipient rejects a request
UPDATE exchange_requests
SET    status = 'REJECTED', updated_at = NOW()
WHERE  request_id = $1 AND recipient_id = $2 AND status = 'PENDING';

-- W16 WRITE
-- Sender withdraws their own pending request
UPDATE exchange_requests
SET    status = 'CANCELLED', updated_at = NOW()
WHERE  request_id = $1 AND sender_id = $2 AND status = 'PENDING';

-- W17 WRITE
-- Create the confirmed swap after acceptance (1:1 with the request)
INSERT INTO exchanges
       (request_id, initiator_id, partner_id, offered_skill_id, requested_skill_id, status)
VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
RETURNING exchange_id, initiated_at;

-- W18 WRITE
-- Exchange status management (ACTIVE -> IN_PROGRESS -> COMPLETED / CANCELLED)
UPDATE exchanges
SET    status      = $2,
       started_at  = CASE WHEN $2 = 'IN_PROGRESS' AND started_at IS NULL THEN NOW() ELSE started_at END,
       completed_at= CASE WHEN $2 = 'COMPLETED' THEN NOW() ELSE completed_at END
WHERE  exchange_id = $1
  AND (initiator_id = $3 OR partner_id = $3)
RETURNING exchange_id, status, started_at, completed_at;
