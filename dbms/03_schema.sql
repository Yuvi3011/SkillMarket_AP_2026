-- =====================================================================
-- SkillMarket: CREATE TABLE Statements (PostgreSQL 17)
-- AP Project · Team T0148 · BCNF-Compliant Schema
-- =====================================================================

DROP SCHEMA IF EXISTS skillmarket CASCADE;
CREATE SCHEMA skillmarket;
SET search_path TO skillmarket;

-- 1. users
CREATE TABLE users (
    user_id         SERIAL          PRIMARY KEY,
    user_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    user_bio        TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2. categories
CREATE TABLE categories (
    category_id     SERIAL          PRIMARY KEY,
    category_name   VARCHAR(100)    NOT NULL UNIQUE,
    category_slug   VARCHAR(50)     NOT NULL UNIQUE
);

-- 3. skills
CREATE TABLE skills (
    skill_id        SERIAL          PRIMARY KEY,
    skill_name      VARCHAR(150)    NOT NULL,
    category_id     INTEGER         NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    description     TEXT
);

-- 4. user_skills (M:N junction — user offers a skill at a rate)
CREATE TABLE user_skills (
    user_id         INTEGER         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id        INTEGER         NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency     VARCHAR(20)     NOT NULL DEFAULT 'BEGINNER',
    hourly_rate     NUMERIC(8,2)    NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    CONSTRAINT chk_proficiency CHECK (proficiency IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    CONSTRAINT chk_hourly_rate CHECK (hourly_rate >= 0)
);

-- 5. orders (client books a provider's skill)
CREATE TABLE orders (
    order_id        SERIAL          PRIMARY KEY,
    client_id       INTEGER         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider_id     INTEGER         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id        INTEGER         NOT NULL REFERENCES skills(skill_id) ON DELETE RESTRICT,
    order_date      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    session_time    INTEGER         NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    total_price     NUMERIC(10,2)   NOT NULL,
    CONSTRAINT chk_order_status CHECK (status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_session_time CHECK (session_time > 0),
    CONSTRAINT chk_total_price CHECK (total_price >= 0),
    CONSTRAINT chk_client_provider CHECK (client_id <> provider_id)
);

-- 6. exchanges (bilateral skill swap — no money)
CREATE TABLE exchanges (
    exchange_id     SERIAL          PRIMARY KEY,
    initiator_id    INTEGER         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    partner_id      INTEGER         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    offered_skill_id    INTEGER     NOT NULL REFERENCES skills(skill_id) ON DELETE RESTRICT,
    requested_skill_id  INTEGER     NOT NULL REFERENCES skills(skill_id) ON DELETE RESTRICT,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PROPOSED',
    initiated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_exchange_status CHECK (status IN ('PROPOSED', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_exchange_users CHECK (initiator_id <> partner_id),
    CONSTRAINT chk_exchange_skills CHECK (offered_skill_id <> requested_skill_id)
);

-- 7. reviews (one review per order, by the client)
CREATE TABLE reviews (
    review_id       SERIAL          PRIMARY KEY,
    order_id        INTEGER         NOT NULL UNIQUE REFERENCES orders(order_id) ON DELETE CASCADE,
    reviewer_id     INTEGER         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating          SMALLINT        NOT NULL,
    review_text     TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
);
