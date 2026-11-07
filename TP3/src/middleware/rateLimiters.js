import rateLimit from 'express-rate-limit';

const createHandler = (message) => (req, res) => {
  res.status(429).json({
    error: {
      code: 'TOO_MANY_REQUESTS',
      message,
    },
  });
};

// General API limit: 100 requests per 15 minutes per client IP.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createHandler(
    'Too many requests from this IP address. Please try again after 15 minutes.'
  ),
});

// Stricter limit for the login endpoint: 5 attempts per 15 minutes per IP.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createHandler(
    'Too many login attempts from this IP address. Please try again after 15 minutes.'
  ),
});
