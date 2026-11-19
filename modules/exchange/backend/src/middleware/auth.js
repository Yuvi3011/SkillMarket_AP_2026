'use strict';

const crypto = require('node:crypto');
const { HttpError } = require('../lib/errors');

const HMAC_ALGORITHM = 'sha256';

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function fromBase64url(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

/** Minimal HS256 JWT signer - the SkillMarket auth service uses the same shape. */
function signToken(userId, secret, expiresInSeconds = 60 * 60 * 24) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({ sub: String(userId), iat: now, exp: now + expiresInSeconds })
  );
  const signature = crypto
    .createHmac(HMAC_ALGORITHM, secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token, secret) {
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new HttpError(401, 'BAD_TOKEN', 'Malformed token');

  const [header, payload, signature] = parts;
  const expected = crypto
    .createHmac(HMAC_ALGORITHM, secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpError(401, 'BAD_TOKEN', 'Invalid token signature');
  }

  let claims;
  try {
    claims = JSON.parse(fromBase64url(payload));
  } catch {
    throw new HttpError(401, 'BAD_TOKEN', 'Invalid token payload');
  }

  if (!claims.exp || claims.exp * 1000 < Date.now()) {
    throw new HttpError(401, 'TOKEN_EXPIRED', 'Token has expired');
  }

  const userId = Number(claims.sub);
  if (!Number.isInteger(userId)) {
    throw new HttpError(401, 'BAD_TOKEN', 'Token subject is not a user id');
  }
  return userId;
}

function parsePositiveId(value, field = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw HttpError.unprocessable(`\`${field}\` must be a positive integer`, {
      field,
      value,
    });
  }
  return n;
}

/**
 * Resolves the acting user.
 *
 * Two accepted credentials, in order:
 *   1. `Authorization: Bearer <jwt>`  - verified against config.jwtSecret
 *   2. `x-user-id: <id>`              - development convenience header
 *
 * The second exists so the React pages and the module tests can run without a
 * full auth service. Production deployments should only accept path 1.
 */
function requireAuth(req, _res, next) {
  try {
    const header = req.get('authorization') || '';
    if (header.toLowerCase().startsWith('bearer ')) {
      req.userId = verifyToken(header.slice(7).trim(), req.app.locals.config.jwtSecret);
      req.authMethod = 'jwt';
      return next();
    }

    const devUserId = req.get('x-user-id');
    if (devUserId) {
      const id = Number(devUserId);
      if (!Number.isInteger(id) || id <= 0) {
        throw HttpError.unauthorized('`x-user-id` must be a positive integer');
      }
      req.userId = id;
      req.authMethod = 'x-user-id';
      return next();
    }

    throw HttpError.unauthorized();
  } catch (err) {
    next(err);
  }
}

module.exports = { signToken, verifyToken, requireAuth, parsePositiveId };
