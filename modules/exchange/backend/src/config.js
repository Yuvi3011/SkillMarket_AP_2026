'use strict';

const path = require('node:path');

// Node >= 20.6 can load .env itself; ignore a missing file.
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(__dirname, '..', '.env'));
  } catch {
    /* no .env file - environment variables only */
  }
}

function parseOrigins(raw) {
  if (!raw || raw.trim() === '*') return true; // reflector: echo any origin
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret',
  corsOrigin: parseOrigins(process.env.CORS_ORIGIN),
};

// `memory` is not a real driver - it selects the zero-dependency store that
// powers `npm test` and the demo mode.
config.store = config.databaseUrl ? 'pg' : 'memory';

module.exports = config;
