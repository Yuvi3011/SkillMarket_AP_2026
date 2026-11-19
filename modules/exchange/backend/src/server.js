'use strict';

const config = require('./config');
const { createApp } = require('./app');

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`[exchange-api] listening on http://localhost:${config.port}`);
  console.log(`[exchange-api] store: ${config.store}`);
  console.log(`[exchange-api] health: http://localhost:${config.port}/api/health`);
});

function shutdown(signal) {
  console.log(`\n[exchange-api] ${signal} received - shutting down`);
  server.close(() => process.exit(0));
  // Do not hang forever on keep-alive sockets.
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
