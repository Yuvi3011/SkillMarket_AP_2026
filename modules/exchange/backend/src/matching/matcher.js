'use strict';

/**
 * SkillMarket · Module 3 — Smart Skill Matching
 * ------------------------------------------------
 * Deterministic, explainable ranking of exchange listings for one student.
 *
 * The score is a weighted sum of nine signals. Every signal is exposed in the
 * response (`breakdown` + `reasons`) so the UI can explain *why* a partner was
 * recommended instead of showing an opaque "AI score".
 *
 *   complementarity   40   they offer a skill you want (+20) and/or want a
 *                          skill you teach (+20)
 *   bidirectional     10   both directions match at once (a true two-way swap)
 *   teacherQuality    10   how strong the partner is in the skill they teach
 *   categoryAffinity  10   the matched skill sits in a category you already use
 *   typeAlignment      8   OFFER listings suit learners, REQUEST listings suit
 *                          teachers
 *   availability       7   overlapping time windows (weekends/evenings/...)
 *   trust             10   completed-exchange history, saturating
 *   freshness          5   recency of the listing
 *                     ---
 *                     100
 */

const WEIGHTS = Object.freeze({
  complementarity: 40,
  bidirectional: 10,
  teacherQuality: 10,
  categoryAffinity: 10,
  typeAlignment: 8,
  availability: 7,
  trust: 10,
  freshness: 5,
});

const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

const PROFICIENCY_WEIGHT = Object.freeze({
  BEGINNER: 0.34,
  INTERMEDIATE: 0.57,
  ADVANCED: 0.8,
  EXPERT: 1.0,
});

const UNKNOWN_PROFICIENCY = 0.4;

const AVAILABILITY_TOKENS = Object.freeze([
  'weekend',
  'weekday',
  'evening',
  'afternoon',
  'morning',
  'night',
  'flexible',
]);

const DAY_MS = 24 * 60 * 60 * 1000;
const FRESHNESS_HALFLIFE_DAYS = 30;

function proficiencyWeight(proficiency) {
  if (!proficiency) return UNKNOWN_PROFICIENCY;
  return PROFICIENCY_WEIGHT[String(proficiency).toUpperCase()] ?? UNKNOWN_PROFICIENCY;
}

function tokenizeAvailability(text) {
  if (!text) return new Set();
  const lower = String(text).toLowerCase();
  const found = new Set();
  for (const token of AVAILABILITY_TOKENS) {
    if (lower.includes(token)) found.add(token);
  }
  return found;
}

function overlap(setA, setB) {
  const common = [];
  for (const value of setA) if (setB.has(value)) common.push(value);
  return common;
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Score one listing against one student's profile.
 *
 * @param {object} params
 * @param {object} params.listing            decorated listing row
 * @param {object} params.profile            { userId, offers:[{skillId,proficiency}], wants:[skillId] }
 * @param {Map<number, {skillId:number, categoryId:number, skillName:string}>} params.skillsById
 * @param {number} [params.completedExchanges] partner's completed swaps (trust signal)
 * @param {Set<string>} [params.availabilityTokens] the student's own availability tokens
 * @param {Date} [params.now]
 */
function scoreListing({
  listing,
  profile,
  skillsById,
  completedExchanges = 0,
  availabilityTokens = new Set(),
  now = new Date(),
}) {
  const wants = new Set(profile.wants);
  const offers = new Map(profile.offers.map((o) => [o.skillId, o.proficiency]));

  const listingOffer = listing.offerSkillId ?? null;
  const listingWant = listing.wantSkillId ?? null;

  const offerSkill = listingOffer != null ? skillsById.get(listingOffer) : null;
  const wantSkill = listingWant != null ? skillsById.get(listingWant) : null;

  const breakdown = {};
  const reasons = [];
  const matchedSkills = [];

  // ---- 1. complementarity (40 = 20 + 20) --------------------------------
  const theyOfferWhatIWant = listingOffer != null && wants.has(listingOffer);
  const theyWantWhatIOffer = listingWant != null && offers.has(listingWant);

  const complement =
    (theyOfferWhatIWant ? 20 : 0) + (theyWantWhatIOffer ? 20 : 0);
  breakdown.complementarity = round(complement, 1);

  if (theyOfferWhatIWant) {
    matchedSkills.push({
      skillId: listingOffer,
      skillName: offerSkill ? offerSkill.skillName : null,
      direction: 'THEY_OFFER',
    });
    reasons.push(
      `${listing.userName ?? 'They'} offer ${offerSkill ? offerSkill.skillName : 'a skill'}, which is on your learning list`
    );
  }
  if (theyWantWhatIOffer) {
    matchedSkills.push({
      skillId: listingWant,
      skillName: wantSkill ? wantSkill.skillName : null,
      direction: 'THEY_WANT',
    });
    reasons.push(
      `They want ${wantSkill ? wantSkill.skillName : 'a skill'}, which you can teach`
    );
  }

  // ---- 2. bidirectional bonus (10) ---------------------------------------
  const bidirectional = theyOfferWhatIWant && theyWantWhatIOffer ? 10 : 0;
  breakdown.bidirectional = round(bidirectional, 1);
  if (bidirectional) {
    reasons.push('Two-way swap: you both get a skill you want');
  }

  // ---- 3. teacher quality (10) ------------------------------------------
  let teacherQuality = 0;
  if (theyOfferWhatIWant) {
    teacherQuality = WEIGHTS.teacherQuality * proficiencyWeight(listing.offerProficiency);
    const level = listing.offerProficiency || 'unspecified level';
    reasons.push(`Teaching strength: ${level}`);
  }
  breakdown.teacherQuality = round(teacherQuality, 1);

  // ---- 4. category affinity (10) -----------------------------------------
  const myCategories = new Set();
  for (const offer of profile.offers) {
    const skill = skillsById.get(offer.skillId);
    if (skill) myCategories.add(skill.categoryId);
  }
  for (const skillId of profile.wants) {
    const skill = skillsById.get(skillId);
    if (skill) myCategories.add(skill.categoryId);
  }

  const matchedCategories = new Set(
    matchedSkills
      .map((m) => skillsById.get(m.skillId))
      .filter(Boolean)
      .map((s) => s.categoryId)
  );
  const listingCategories = new Set(
    [offerSkill, wantSkill].filter(Boolean).map((s) => s.categoryId)
  );

  let categoryAffinity = 0;
  if ([...matchedCategories].some((c) => myCategories.has(c))) {
    categoryAffinity = WEIGHTS.categoryAffinity;
    reasons.push('The matched skill is in a category you already work in');
  } else if (overlap(myCategories, listingCategories).length > 0) {
    categoryAffinity = 4;
  }
  breakdown.categoryAffinity = round(categoryAffinity, 1);

  // ---- 5. listing-type alignment (8) -------------------------------------
  let typeAlignment = 0;
  if (listing.listingType === 'OFFER' && wants.size > 0) {
    typeAlignment = WEIGHTS.typeAlignment;
    reasons.push('They are offering a skill, which fits your learning goal');
  } else if (listing.listingType === 'REQUEST' && offers.size > 0) {
    typeAlignment = WEIGHTS.typeAlignment;
    reasons.push('They are looking for a skill, which fits what you teach');
  }
  breakdown.typeAlignment = round(typeAlignment, 1);

  // ---- 6. availability overlap (7) ---------------------------------------
  const listingTokens = tokenizeAvailability(listing.availability);
  const sharedAvailability = overlap(availabilityTokens, listingTokens);
  const availability = sharedAvailability.length > 0 ? WEIGHTS.availability : 0;
  breakdown.availability = round(availability, 1);
  if (sharedAvailability.length > 0) {
    reasons.push(`Availability overlaps: ${sharedAvailability.join(', ')}`);
  }

  // ---- 7. trust (10) ------------------------------------------------------
  // Saturating curve: a brand-new partner still gets a base of 3 so they are
  // not buried; proven partners approach the full 10.
  const trustRatio = completedExchanges / (completedExchanges + 2);
  const trust = WEIGHTS.trust * (0.3 + 0.7 * trustRatio);
  breakdown.trust = round(trust, 1);
  if (completedExchanges > 0) {
    reasons.push(
      `${completedExchanges} completed exchange${completedExchanges === 1 ? '' : 's'} on record`
    );
  }

  // ---- 8. freshness (5) ---------------------------------------------------
  const createdAt = listing.createdAt ? new Date(listing.createdAt) : now;
  const ageDays = Math.max(0, (now - createdAt) / DAY_MS);
  const freshness = WEIGHTS.freshness * Math.exp(-ageDays / FRESHNESS_HALFLIFE_DAYS);
  breakdown.freshness = round(freshness, 1);

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const score = round(Math.min(TOTAL_WEIGHT, Math.max(0, total)), 1);

  return {
    listingId: listing.listingId,
    userId: listing.userId,
    userName: listing.userName,
    listingType: listing.listingType,
    title: listing.title,
    description: listing.description,
    availability: listing.availability,
    status: listing.status,
    createdAt: listing.createdAt,
    offerSkillId: listingOffer,
    offerSkillName: offerSkill ? offerSkill.skillName : null,
    wantSkillId: listingWant,
    wantSkillName: wantSkill ? wantSkill.skillName : null,
    offerProficiency: listing.offerProficiency ?? null,
    score,
    breakdown,
    reasons,
    matchedSkills,
  };
}

/**
 * Rank every active listing for a student.
 *
 * @param {object} params
 * @param {object} params.store   memoryStore or pgStore instance
 * @param {number} params.targetUserId
 * @param {number} [params.limit]
 * @param {number} [params.minScore]   drop matches below this score
 * @param {boolean} [params.includeAlreadyRequested]
 */
async function rankMatches({
  store,
  targetUserId,
  limit = 10,
  minScore = 0,
  includeAlreadyRequested = false,
}) {
  const profile = await store.getUserProfile(targetUserId);
  const [candidates, skills, completedCounts, requests, myListings] = await Promise.all([
    store.listCandidateListings(targetUserId),
    store.listSkills(),
    store.listCompletedExchangeCounts(),
    includeAlreadyRequested
      ? Promise.resolve([])
      : store.listRequests({ userId: targetUserId, box: 'OUTBOX' }),
    store.listListings({ userId: targetUserId }),
  ]);

  const skillsById = new Map(skills.map((s) => [s.skillId, s]));

  // The student's own availability, gathered from their listings.
  const availabilityTokens = new Set();
  for (const listing of myListings) {
    for (const token of tokenizeAvailability(listing.availability)) {
      availabilityTokens.add(token);
    }
  }

  // Hide listings we already have a live request against, so the student is
  // not shown the same partner twice.
  const alreadyContacted = new Set(
    requests
      .filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED')
      .map((r) => r.recipientId)
  );

  const results = candidates
    .filter((listing) => includeAlreadyRequested || !alreadyContacted.has(listing.userId))
    .map((listing) =>
      scoreListing({
        listing,
        profile,
        skillsById,
        completedExchanges: completedCounts[listing.userId] || 0,
        availabilityTokens,
        now: new Date(),
      })
    )
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score || a.listingId - b.listingId);

  return {
    targetUserId,
    profile,
    count: results.length,
    matches: limit > 0 ? results.slice(0, limit) : results,
  };
}

module.exports = {
  WEIGHTS,
  TOTAL_WEIGHT,
  PROFICIENCY_WEIGHT,
  AVAILABILITY_TOKENS,
  tokenizeAvailability,
  scoreListing,
  rankMatches,
};
