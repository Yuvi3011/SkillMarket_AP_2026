-- =====================================================================
-- SkillMarket AP — DBMS CP3: Application SQL Queries
-- File: dbms/04_queries.sql
--
-- Lists every SQL query executed by the SkillMarket web application.
-- Markers:  -- READ   (SELECT)
--           -- WRITE  (INSERT / UPDATE / DELETE)
-- $1, $2 … are parameterised placeholders (prepared-statement style).
-- =====================================================================

SET search_path TO skillmarket;

-- ==============================
-- AUTHENTICATION & USER PROFILE
-- ==============================

-- R1 READ
-- Login: look up a user by their email address (password checked in app layer)
SELECT user_id, email, password_hash, full_name, role, is_active
FROM   users
WHERE  email = $1;

-- R2 READ
-- User profile page: fetch full profile by user_id
SELECT u.user_id, u.full_name, u.email, u.bio, u.profile_pic_url,
       u.location, u.created_at, u.role
FROM   users u
WHERE  u.user_id = $1;

-- R3 READ
-- Public provider profile: show another user's public info + their skills
SELECT u.user_id, u.full_name, u.bio, u.profile_pic_url, u.location,
       s.skill_id, s.skill_name, c.category_name,
       us.hourly_rate, us.proficiency, us.experience_years
FROM   users u
JOIN   user_skills us ON us.user_id  = u.user_id
JOIN   skills s       ON s.skill_id  = us.skill_id
JOIN   categories c   ON c.category_id = s.category_id
WHERE  u.user_id = $1
ORDER  BY s.skill_name;

-- ==============================
-- SKILLS & CATEGORIES
-- ==============================

-- R4 READ
-- Browse skills by category (category filter on skills marketplace page)
SELECT s.skill_id, s.skill_name, s.description, c.category_name
FROM   skills s
JOIN   categories c ON c.category_id = s.category_id
WHERE  c.category_id = $1
ORDER  BY s.skill_name;

-- R5 READ
-- Search skills by name (search bar — ILIKE for case-insensitive partial match)
SELECT s.skill_id, s.skill_name, s.description, c.category_name
FROM   skills s
JOIN   categories c ON c.category_id = s.category_id
WHERE  s.skill_name ILIKE '%' || $1 || '%'
ORDER  BY s.skill_name;

-- R6 READ
-- Provider's skill listings (my skills page — what I offer)
SELECT s.skill_id, s.skill_name, c.category_name,
       us.hourly_rate, us.proficiency, us.experience_years, us.created_at
FROM   user_skills us
JOIN   skills s     ON s.skill_id    = us.skill_id
JOIN   categories c ON c.category_id = s.category_id
WHERE  us.user_id = $1
ORDER  BY s.skill_name;

-- R7 READ
-- Marketplace listings: all providers offering a specific skill (skill detail page)
SELECT u.user_id, u.full_name, u.profile_pic_url, u.location,
       us.hourly_rate, us.proficiency, us.experience_years,
       coalesce(avg_r.avg_rating, 0) AS avg_rating,
       coalesce(avg_r.review_count, 0) AS review_count
FROM   user_skills us
JOIN   users u ON u.user_id = us.user_id
LEFT JOIN (
    SELECT r.reviewee_id,
           round(avg(r.rating)::numeric, 1) AS avg_rating,
           count(*)                          AS review_count
    FROM   reviews r
    GROUP  BY r.reviewee_id
) avg_r ON avg_r.reviewee_id = u.user_id
WHERE  us.skill_id = $1
ORDER  BY avg_r.avg_rating DESC NULLS LAST, us.hourly_rate ASC;

-- ==============================
-- ORDERS
-- ==============================

-- R8 READ
-- My orders as a client (orders I placed)
SELECT o.order_id, o.status, o.created_at, o.total_amount,
       s.skill_name, u.full_name AS provider_name
FROM   orders o
JOIN   skills s ON s.skill_id = o.skill_id
JOIN   users  u ON u.user_id  = o.provider_id
WHERE  o.client_id = $1
ORDER  BY o.created_at DESC;

-- R9 READ
-- My orders as a provider (orders assigned to me)
SELECT o.order_id, o.status, o.created_at, o.total_amount,
       s.skill_name, u.full_name AS client_name
FROM   orders o
JOIN   skills s ON s.skill_id = o.skill_id
JOIN   users  u ON u.user_id  = o.client_id
WHERE  o.provider_id = $1
ORDER  BY o.created_at DESC;

-- R10 READ
-- Order detail page
SELECT o.order_id, o.client_id, o.provider_id, o.skill_id,
       o.status, o.description, o.total_amount,
       o.created_at, o.updated_at,
       s.skill_name, c.full_name AS client_name, p.full_name AS provider_name
FROM   orders o
JOIN   skills s ON s.skill_id   = o.skill_id
JOIN   users  c ON c.user_id    = o.client_id
JOIN   users  p ON p.user_id    = o.provider_id
WHERE  o.order_id = $1;

-- ==============================
-- SKILL EXCHANGES
-- ==============================

-- R11 READ
-- My exchanges (proposals I sent or received)
SELECT e.exchange_id, e.status, e.created_at,
       s1.skill_name AS offered_skill, s2.skill_name AS wanted_skill,
       u1.full_name AS proposer, u2.full_name AS recipient
FROM   exchanges e
JOIN   skills s1 ON s1.skill_id = e.offered_skill_id
JOIN   skills s2 ON s2.skill_id = e.wanted_skill_id
JOIN   users  u1 ON u1.user_id  = e.proposer_id
JOIN   users  u2 ON u2.user_id  = e.recipient_id
WHERE  e.proposer_id = $1 OR e.recipient_id = $1
ORDER  BY e.created_at DESC;

-- ==============================
-- REVIEWS
-- ==============================

-- R12 READ
-- Reviews for a provider (provider profile page)
SELECT r.review_id, r.rating, r.comment, r.created_at,
       u.full_name AS reviewer_name, s.skill_name
FROM   reviews r
JOIN   users  u ON u.user_id  = r.reviewer_id
JOIN   skills s ON s.skill_id = r.skill_id
WHERE  r.reviewee_id = $1
ORDER  BY r.created_at DESC;

-- R13 READ
-- Average rating summary for a provider
SELECT round(avg(rating)::numeric, 1) AS avg_rating,
       count(*) AS total_reviews
FROM   reviews
WHERE  reviewee_id = $1;

-- ==============================
-- WRITE QUERIES
-- ==============================

-- W1 WRITE
-- Register a new user
INSERT INTO users (email, password_hash, full_name, bio, location, role)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING user_id;

-- W2 WRITE
-- Add a skill listing (provider lists a skill they offer)
INSERT INTO user_skills (user_id, skill_id, hourly_rate, proficiency, experience_years)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id, skill_id) DO UPDATE
    SET hourly_rate       = EXCLUDED.hourly_rate,
        proficiency       = EXCLUDED.proficiency,
        experience_years  = EXCLUDED.experience_years;

-- W3 WRITE
-- Place an order (client hires provider for a skill)
INSERT INTO orders (client_id, provider_id, skill_id, description, total_amount, status)
VALUES ($1, $2, $3, $4, $5, 'PENDING')
RETURNING order_id;

-- W4 WRITE
-- Update order status (accept, complete, cancel)
-- $1 = new status ('ACCEPTED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED')
-- $2 = order_id
-- $3 = acting user_id (checked in app to ensure only the right party updates)
UPDATE orders
SET    status     = $1,
       updated_at = now()
WHERE  order_id = $2;

-- W5 WRITE
-- Propose a skill exchange
INSERT INTO exchanges (proposer_id, recipient_id, offered_skill_id, wanted_skill_id, message, status)
VALUES ($1, $2, $3, $4, $5, 'PENDING')
RETURNING exchange_id;

-- W6 WRITE
-- Respond to a skill exchange proposal (accept or reject)
UPDATE exchanges
SET    status     = $1,   -- 'ACCEPTED' or 'REJECTED'
       updated_at = now()
WHERE  exchange_id = $2;

-- W7 WRITE
-- Submit a review after order completion
INSERT INTO reviews (reviewer_id, reviewee_id, order_id, skill_id, rating, comment)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING review_id;

-- W8 WRITE
-- Update user profile (bio, location, profile pic)
UPDATE users
SET    bio              = coalesce($1, bio),
       location         = coalesce($2, location),
       profile_pic_url  = coalesce($3, profile_pic_url),
       updated_at       = now()
WHERE  user_id = $4;

-- W9 WRITE
-- Deactivate / soft-delete a user account
UPDATE users
SET    is_active   = false,
       updated_at  = now()
WHERE  user_id = $1;
