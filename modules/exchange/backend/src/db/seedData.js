'use strict';

/**
 * Deterministic sample dataset for the in-memory store.
 *
 * Used when DATABASE_URL is not set (demo mode) and by the test suite, so the
 * API and the smart matcher can be exercised without a database. The shape
 * mirrors the PostgreSQL schema in ../../dbms/01_exchange_schema.sql.
 */

const categories = [
  { categoryId: 1, categoryName: 'Development', categorySlug: 'development' },
  { categoryId: 2, categoryName: 'Design', categorySlug: 'design' },
  { categoryId: 3, categoryName: 'Music', categorySlug: 'music' },
  { categoryId: 4, categoryName: 'Writing', categorySlug: 'writing' },
  { categoryId: 5, categoryName: 'Marketing', categorySlug: 'marketing' },
];

const skills = [
  { skillId: 1, skillName: 'Python', categoryId: 1, description: 'Scripting, automation and backend basics.' },
  { skillId: 2, skillName: 'React', categoryId: 1, description: 'Component-based frontend development.' },
  { skillId: 3, skillName: 'UI/UX Design', categoryId: 2, description: 'Wireframes, prototypes and design systems.' },
  { skillId: 4, skillName: 'Guitar', categoryId: 3, description: 'Acoustic and electric guitar lessons.' },
  { skillId: 5, skillName: 'Content Writing', categoryId: 4, description: 'Blog posts, copies and editing.' },
  { skillId: 6, skillName: 'Video Editing', categoryId: 2, description: 'Short-form and long-form editing.' },
  { skillId: 7, skillName: 'Excel & Data Analysis', categoryId: 5, description: 'Dashboards, pivots and cleaning.' },
  { skillId: 8, skillName: 'Digital Marketing', categoryId: 5, description: 'SEO, ads and social campaigns.' },
];

const users = [
  { userId: 1, userName: 'Aisha Kapoor', email: 'aisha@college.edu', userBio: 'CS junior. Python is my happy place.' },
  { userId: 2, userName: 'Rohan Mehta', email: 'rohan@college.edu', userBio: 'Design student who codes a little.' },
  { userId: 3, userName: 'Sara Ali', email: 'sara@college.edu', userBio: 'Numbers person, wants to jam.' },
  { userId: 4, userName: 'Dev Patel', email: 'dev@college.edu', userBio: 'Garage band guitarist.' },
  { userId: 5, userName: 'Meera Nair', email: 'meera@college.edu', userBio: 'Writes a lot, edits nothing yet.' },
  { userId: 6, userName: 'Arjun Singh', email: 'arjun@college.edu', userBio: 'Reels guy. Wants to write scripts.' },
];

// What each user can teach, with proficiency and a market rate.
const userSkills = [
  { userId: 1, skillId: 1, proficiency: 'ADVANCED', hourlyRate: 400 },
  { userId: 1, skillId: 8, proficiency: 'INTERMEDIATE', hourlyRate: 300 },
  { userId: 2, skillId: 3, proficiency: 'ADVANCED', hourlyRate: 450 },
  { userId: 2, skillId: 2, proficiency: 'INTERMEDIATE', hourlyRate: 350 },
  { userId: 3, skillId: 7, proficiency: 'EXPERT', hourlyRate: 300 },
  { userId: 4, skillId: 4, proficiency: 'INTERMEDIATE', hourlyRate: 250 },
  { userId: 5, skillId: 5, proficiency: 'ADVANCED', hourlyRate: 200 },
  { userId: 6, skillId: 6, proficiency: 'ADVANCED', hourlyRate: 500 },
];

// Exchange listings. offerSkillId / wantSkillId may be null (one-sided card).
const listings = [
  {
    listingId: 1, userId: 1, listingType: 'OFFER', offerSkillId: 1, wantSkillId: 3,
    title: 'Python for UI/UX design', description: 'I will get you comfortable with Python in 4 sessions, then I want to learn Figma flows.',
    availability: 'Weekends, evenings', status: 'ACTIVE',
  },
  {
    listingId: 2, userId: 2, listingType: 'OFFER', offerSkillId: 3, wantSkillId: 1,
    title: 'UI/UX design for Python', description: 'Wireframes, prototypes and critique. Looking for someone patient with absolute beginners.',
    availability: 'Weekdays, evenings', status: 'ACTIVE',
  },
  {
    listingId: 3, userId: 3, listingType: 'REQUEST', offerSkillId: 7, wantSkillId: 4,
    title: 'Excel dashboards for guitar', description: 'I can build you a dashboard for anything. Want to finally learn chords.',
    availability: 'Weekends', status: 'ACTIVE',
  },
  {
    listingId: 4, userId: 4, listingType: 'OFFER', offerSkillId: 4, wantSkillId: 7,
    title: 'Guitar for Excel', description: 'Acoustic basics, strumming patterns, a song at the end.',
    availability: 'Weekends, afternoons', status: 'ACTIVE',
  },
  {
    listingId: 5, userId: 5, listingType: 'REQUEST', offerSkillId: 5, wantSkillId: 6,
    title: 'Content writing for video editing', description: 'Blog posts and copies in exchange for Premiere basics.',
    availability: 'Weekdays', status: 'ACTIVE',
  },
  {
    listingId: 6, userId: 6, listingType: 'OFFER', offerSkillId: 6, wantSkillId: 5,
    title: 'Video editing for writing', description: 'Short-form editing, captions, sound sync.',
    availability: 'Weekdays, evenings', status: 'ACTIVE',
  },
  {
    listingId: 7, userId: 1, listingType: 'REQUEST', offerSkillId: null, wantSkillId: 8,
    title: 'Looking for digital marketing mentoring', description: 'One-sided: I mainly want to learn SEO and campaign setup.',
    availability: 'Flexible', status: 'ACTIVE',
  },
  {
    listingId: 8, userId: 2, listingType: 'OFFER', offerSkillId: 2, wantSkillId: null,
    title: 'React help, open to offers', description: 'Happy to help with React. I am open to learning anything useful.',
    availability: 'Evenings', status: 'ACTIVE',
  },
];

// A couple of historical rows so the trust signal is non-zero.
const requests = [
  {
    requestId: 1, listingId: 3, senderId: 4, recipientId: 3,
    offeredSkillId: 4, requestedSkillId: 7, message: 'I can start this weekend.',
    status: 'ACCEPTED',
  },
  {
    requestId: 2, listingId: 5, senderId: 6, recipientId: 5,
    offeredSkillId: 6, requestedSkillId: 5, message: 'Let us swap reels for blogs.',
    status: 'PENDING',
  },
];

const exchanges = [
  {
    exchangeId: 1, requestId: 1, initiatorId: 4, partnerId: 3,
    offeredSkillId: 4, requestedSkillId: 7, status: 'COMPLETED',
    startedAt: '2026-11-01T10:00:00Z', completedAt: '2026-11-15T10:00:00Z',
  },
];

module.exports = { categories, skills, users, userSkills, listings, requests, exchanges };
