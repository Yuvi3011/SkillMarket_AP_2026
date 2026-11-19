# Module 3 — Skill Exchange & Smart Matching

Barter-style skill exchange for SkillMarket: students publish what they can teach
and what they want to learn, the platform ranks compatible partners, and a
request/accept flow turns a match into a tracked exchange. No money changes hands.

```
modules/exchange/
├── README.md
├── dbms/
│   ├── 01_exchange_schema.sql      exchanges, exchange_requests, exchange_listings
│   └── 02_exchange_queries.sql     R14–R23 / W10–W18 (mirrors pgStore.js)
├── backend/
│   ├── package.json                npm start · npm run dev · npm test
│   ├── .env.example
│   ├── src/
│   │   ├── app.js                  Express app (store injected)
│   │   ├── server.js               listen + graceful shutdown
│   │   ├── config.js               env-driven config
│   │   ├── db/
│   │   │   ├── index.js            createStore() factory
│   │   │   ├── memoryStore.js      zero-dependency store (tests + demo)
│   │   │   ├── pgStore.js          PostgreSQL store (same interface)
│   │   │   └── seedData.js         deterministic sample dataset
│   │   ├── lib/errors.js           HttpError + async wrapper + error formatter
│   │   ├── middleware/auth.js      HS256 JWT or x-user-id (dev)
│   │   ├── matching/matcher.js     the smart matching algorithm
│   │   └── routes/exchangeRoutes.js
│ 	└── test/
│       ├── matcher.test.js         12 tests
│       └── api.test.js             19 tests
└── frontend/
    ├── ExchangeApp.jsx             shell + hash router + acting-user picker
    ├── SkillExchange.jsx           browse listings
    ├── OfferSkill.jsx              publish what you teach
    ├── RequestSkill.jsx            publish what you want to learn
    ├── MatchingRecommendations.jsx ranked matches with score breakdown
    ├── ExchangeRequests.jsx        inbox/sent + accept / reject / withdraw
    ├── MyExchanges.jsx             exchange lifecycle + my listings
    ├── RequestComposer.jsx         propose-a-swap modal
    ├── exchangeApi.js              fetch client
    └── exchange.css                #7546f5 / #f8f9fc, matches the repo palette
```

---

## 1. Data model

| Table | Purpose |
|---|---|
| `exchange_listings` | A student's card: *I teach X, I want Y*. Either side may be NULL (one-sided card), but not both. |
| `exchange_requests` | A proposal from `sender_id` to `recipient_id` with an explicit `offered_skill_id` / `requested_skill_id` pair. States: `PENDING → ACCEPTED / REJECTED / CANCELLED`. |
| `exchanges` | The confirmed swap, created **on acceptance**. Exactly one row per accepted request. States: `ACTIVE → IN_PROGRESS → COMPLETED / CANCELLED`. |

This deliberately redefines `exchanges` from `dbms/03_schema.sql`, where it stored
the *proposal* (`PROPOSED/ACCEPTED/DECLINED`). Splitting proposal from confirmed
swap removes the status collision and lets `exchanges.request_id` be `UNIQUE`.
Apply `01_exchange_schema.sql` after `03_schema.sql`; it drops and recreates the
table.

`exchange_requests.status` is enforced twice: a `CHECK` constraint in the schema
and an ownership + state-machine check in the store, so the API and the database
agree on who may move a request where.

## 2. Smart matching

`src/matching/matcher.js` — deterministic, weighted, explainable. For a target
student it scores every active listing they do not own:

| Signal | Weight | Meaning |
|---|---|---|
| `complementarity` | 40 | 20 if they offer a skill you want + 20 if they want a skill you teach |
| `bidirectional` | 10 | both directions match at once — a true two-way swap |
| `teacherQuality` | 10 | partner's proficiency in the skill they would teach |
| `categoryAffinity` | 10 | matched skill is in a category you already use |
| `typeAlignment` | 8 | OFFER listings fit learners, REQUEST listings fit teachers |
| `availability` | 7 | overlapping time windows (weekend / evening / …) |
| `trust` | 10 | completed-exchange count, saturating (`0.3 + 0.7·n/(n+2)`) |
| `freshness` | 5 | exponential decay, 30-day half-life |

Total = 100. Every response carries `score`, `breakdown` and human-readable
`reasons`, so the UI explains the ranking instead of showing an opaque number.
Listings the student already has a live request with are filtered out.

`GET /api/exchanges/matching?limit=10&minScore=0` returns the ranked shortlist.

## 3. API

Base path `/api/exchanges`. All routes except `GET /skills` and `GET /users`
require an acting student.

| Method | Path | Purpose |
|---|---|---|
| GET | `/skills` · `/users` · `/profile` | reference data for the forms |
| GET | `/listings?type=&skillId=&q=&mine=1` | browse listings |
| POST | `/listings` | create a listing (Offer / Request pages) |
| GET · PATCH · DELETE | `/listings/:id` | read, update, close (soft delete) |
| GET | `/my-listings` | own listings + pending-request counts |
| GET | `/matching?limit=&minScore=` | smart recommendations |
| GET | `/requests?box=INBOX\|OUTBOX\|ALL` | requests |
| GET | `/requests/summary` | inbox counters |
| POST | `/requests` | send a request |
| POST | `/requests/:id/accept` | recipient accepts → creates the exchange |
| POST | `/requests/:id/reject` · `/cancel` | recipient declines / sender withdraws |
| GET | `/exchanges?status=` | my exchanges |
| PATCH | `/exchanges/:id` | status management |

Errors are `{ "error": { "code", "message", "details" } }` with codes
`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`UNPROCESSABLE`, `INVALID_JSON`, `INTERNAL_ERROR`.

### Authentication

`requireAuth` accepts either `Authorization: Bearer <HS256 JWT>` (verified against
`JWT_SECRET` using `node:crypto`, no dependency) or the `x-user-id` header for
local development and the test suite. Production should accept only the JWT path.

## 4. Running it

```bash
# Backend — zero setup: runs on the seeded in-memory store
cd modules/exchange/backend
npm install
npm start                 # http://localhost:4000/api/health

# With PostgreSQL instead
cp .env.example .env      # set DATABASE_URL
psql -f ../dbms/01_exchange_schema.sql

# Tests (31 tests, no database required)
npm test
```

The frontend is plain React + CSS with no build config, matching the rest of the
repository. Mount `ExchangeApp` from the host app's router, or import any page
directly (`SkillExchange`, `OfferSkill`, …). Point it at the API with
`VITE_EXCHANGE_API_URL`, `window.EXCHANGE_API_URL`, or localStorage
`sm_exchange_api`; it defaults to `/api/exchanges`.

```jsx
import ExchangeApp from "./modules/exchange/frontend/ExchangeApp";
<ExchangeApp />   // hash-routed: #/  #/matching  #/requests  #/my-exchanges  #/offer  #/request
```

## 5. Verification performed

- `npm test` — 31 assertions suites covering matcher weights/ordering, request
  ownership, duplicate handling, accept→exchange creation, the exchange state
  machine, and validation errors. All pass.
- Live server smoke run: create listing → match → send request → accept →
  `IN_PROGRESS` → `COMPLETED`, plus duplicate-request rejection.
- Browser run of the real components (bundled with esbuild against the actual
  sources): browse listings, ranked matching page, propose-swap modal, accept in
  the inbox, lifecycle buttons in My Exchanges — all rendered live API data.
