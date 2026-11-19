-- =====================================================================
-- SkillMarket · Module 3: Skill Exchange & Smart Matching
-- File: modules/exchange/dbms/01_exchange_schema.sql
-- PostgreSQL 17 · extends dbms/03_schema.sql (Team T0148)
--
-- Three tables implement the barter flow:
--   exchange_listings  -> what a student offers and/or wants to learn
--   exchange_requests  -> a proposal sent from one student to another
--   exchanges          -> the confirmed swap, created on acceptance
--
-- NOTE: dbms/03_schema.sql defined `exchanges` as a *proposal* record
-- (PROPOSED/ACCEPTED/DECLINED). This module splits that concept into
-- exchange_requests (proposal) + exchanges (confirmed swap), so the old
-- table is dropped and recreated below with the corrected lifecycle.
-- =====================================================================

SET search_path TO skillmarket;

DROP TABLE IF EXISTS exchanges CASCADE;
DROP TABLE IF EXISTS exchange_requests CASCADE;
DROP TABLE IF EXISTS exchange_listings CASCADE;

-- ---------------------------------------------------------------------
-- 1. exchange_listings
--    One row = one student's public "I can teach X / I want to learn Y" card.
--    At least one of offer_skill_id / want_skill_id must be set.
-- ---------------------------------------------------------------------
CREATE TABLE exchange_listings (
    listing_id      SERIAL          PRIMARY KEY,
    user_id         INTEGER         NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    listing_type    VARCHAR(10)     NOT NULL,
    offer_skill_id  INTEGER         REFERENCES skills(skill_id)         ON DELETE RESTRICT,
    want_skill_id   INTEGER         REFERENCES skills(skill_id)         ON DELETE RESTRICT,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT,
    availability    VARCHAR(120),
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_listing_type   CHECK (listing_type IN ('OFFER', 'REQUEST')),
    CONSTRAINT chk_listing_status CHECK (status IN ('ACTIVE', 'PAUSED', 'CLOSED')),
    -- an OFFER listing may leave want_skill_id NULL ("I'll teach Python, open
    -- to learning anything"); a REQUEST listing may leave offer_skill_id NULL.
    CONSTRAINT chk_listing_one_skill CHECK (
        offer_skill_id IS NOT NULL OR want_skill_id IS NOT NULL
    ),
    CONSTRAINT chk_listing_distinct_skills CHECK (
        offer_skill_id IS NULL OR want_skill_id IS NULL
        OR offer_skill_id <> want_skill_id
    )
);

-- ---------------------------------------------------------------------
-- 2. exchange_requests
--    A proposal sent by sender_id to recipient_id. `status` is the
--    accept/reject state machine; accepting creates an `exchanges` row.
-- ---------------------------------------------------------------------
CREATE TABLE exchange_requests (
    request_id          SERIAL      PRIMARY KEY,
    listing_id          INTEGER     REFERENCES exchange_listings(listing_id) ON DELETE SET NULL,
    sender_id           INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_id        INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    offered_skill_id    INTEGER     NOT NULL REFERENCES skills(skill_id)   ON DELETE RESTRICT,
    requested_skill_id  INTEGER     NOT NULL REFERENCES skills(skill_id)   ON DELETE RESTRICT,
    message             TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_request_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_request_users  CHECK (sender_id <> recipient_id),
    CONSTRAINT chk_request_skills CHECK (offered_skill_id <> requested_skill_id)
);

-- ---------------------------------------------------------------------
-- 3. exchanges
--    The confirmed, trackable swap. Exactly one row per accepted request.
-- ---------------------------------------------------------------------
CREATE TABLE exchanges (
    exchange_id         SERIAL      PRIMARY KEY,
    request_id          INTEGER     NOT NULL UNIQUE REFERENCES exchange_requests(request_id) ON DELETE CASCADE,
    initiator_id        INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    partner_id          INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    offered_skill_id    INTEGER     NOT NULL REFERENCES skills(skill_id)   ON DELETE RESTRICT,
    requested_skill_id  INTEGER     NOT NULL REFERENCES skills(skill_id)   ON DELETE RESTRICT,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    initiated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,

    CONSTRAINT chk_exchange_status CHECK (status IN ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_exchange_users  CHECK (initiator_id <> partner_id),
    CONSTRAINT chk_exchange_skills CHECK (offered_skill_id <> requested_skill_id)
);

-- ---------------------------------------------------------------------
-- Indexes for the hot access paths
-- ---------------------------------------------------------------------
CREATE INDEX idx_listings_user        ON exchange_listings (user_id);
CREATE INDEX idx_listings_offer_skill ON exchange_listings (offer_skill_id);
CREATE INDEX idx_listings_want_skill  ON exchange_listings (want_skill_id);
CREATE INDEX idx_listings_type_status ON exchange_listings (listing_type, status);

CREATE INDEX idx_requests_recipient   ON exchange_requests (recipient_id, status);
CREATE INDEX idx_requests_sender      ON exchange_requests (sender_id, status);
CREATE INDEX idx_requests_listing     ON exchange_requests (listing_id);

CREATE INDEX idx_exchanges_initiator  ON exchanges (initiator_id);
CREATE INDEX idx_exchanges_partner    ON exchanges (partner_id);
CREATE INDEX idx_exchanges_status     ON exchanges (status);

-- ---------------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION skillmarket.touch_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listings_touch BEFORE UPDATE ON exchange_listings
    FOR EACH ROW EXECUTE FUNCTION skillmarket.touch_updated_at();
CREATE TRIGGER trg_requests_touch BEFORE UPDATE ON exchange_requests
    FOR EACH ROW EXECUTE FUNCTION skillmarket.touch_updated_at();
