'use strict';

/** An error that carries an HTTP status and a stable machine-readable code. */
class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
  }

  static badRequest(message, details) {
    return new HttpError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new HttpError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have access to this resource') {
    return new HttpError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new HttpError(404, 'NOT_FOUND', message);
  }

  static conflict(message, details) {
    return new HttpError(409, 'CONFLICT', message, details);
  }

  static unprocessable(message, details) {
    return new HttpError(422, 'UNPROCESSABLE', message, details);
  }
}

/** Wrap an async route handler so rejected promises reach the error middleware. */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** 404 handler - mounted after all routers. */
function notFoundHandler(req, res, next) {
  next(HttpError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

/** Central error formatter. Never leaks stack traces outside development. */
function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV !== 'production';

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Poor man's body-parser guard: malformed JSON arrives as a 400 SyntaxError.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
    });
  }

  console.error('[exchange-api] unhandled error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'Unexpected server error',
      ...(isDev ? { stack: err.stack } : {}),
    },
  });
}

module.exports = { HttpError, asyncHandler, notFoundHandler, errorHandler };
