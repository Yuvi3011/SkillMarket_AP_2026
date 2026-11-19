'use strict';

const config = require('../config');
const { MemoryStore } = require('./memoryStore');
const { PgStore } = require('./pgStore');

/**
 * Builds a store for the configured driver. Exposed as a factory so tests can
 * build an isolated seeded instance per case.
 *
 * @param {{driver?: 'memory'|'pg', connectionString?: string, seed?: object}} [options]
 */
function createStore(options = {}) {
  const driver = options.driver || config.store;

  if (driver === 'pg') {
    return new PgStore(options.connectionString || config.databaseUrl);
  }
  if (driver === 'memory') {
    return new MemoryStore(options.seed);
  }
  throw new Error(`Unknown store driver: ${driver}`);
}

module.exports = { createStore, config, MemoryStore, PgStore };
