/**
 * Error type used across controllers and middleware. It carries the HTTP
 * status, a stable machine-readable code, a human-readable message and
 * optional validation details.
 */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
    },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  let status = Number(error.status || error.statusCode) || 500;
  let code = typeof error.code === 'string' ? error.code : 'INTERNAL_SERVER_ERROR';
  let message = error.message || 'An unexpected server error occurred.';
  let details = error.details;

  if (error.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body contains invalid JSON.';
    details = undefined;
  } else if (error.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid data.';
    details = Object.values(error.errors).map((validationError) => validationError.message);
  } else if (error.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = `Invalid value for ${error.path}.`;
    details = undefined;
  } else if (error.code === 11000) {
    status = 409;
    code = 'DUPLICATE_KEY';
    message = 'A record with this value already exists.';
    details = Object.keys(error.keyValue || {});
  }

  if (status >= 500) {
    console.error('[error]', error);
    code = 'INTERNAL_SERVER_ERROR';
    message = 'An unexpected server error occurred.';
    details = undefined;
  }

  res.status(status).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
