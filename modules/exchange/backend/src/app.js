'use strict';

const express = require('express');
const cors = require('cors');
const config = require('./config');
const { createStore } = require('./db');
const { notFoundHandler, errorHandler } = require('./lib/errors');
const exchangeRoutes = require('./routes/exchangeRoutes');

/**
 * Builds the Express app. The store is injected so tests can supply an
 * isolated seeded instance instead of touching the singleton.
 *
 * @param {{store?: object}} [options]
 */
function createApp({ store } = {}) {
  const app = express();
  const activeStore = store || createStore();

  app.locals.config = config;
  app.locals.store = activeStore;

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: config.corsOrigin,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
      maxAge: 600,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'skillmarket-exchange-api',
      store: config.store,
      time: new Date().toISOString(),
    });
  });

  app.use('/api/exchanges', exchangeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
