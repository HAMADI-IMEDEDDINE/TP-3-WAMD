import 'dotenv/config';

const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  clientOrigins: parseOrigins(
    process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  ),
  oauth: {
    issuer: process.env.OAUTH_ISSUER || '',
    audience: process.env.OAUTH_AUDIENCE || '',
    jwksUri: process.env.OAUTH_JWKS_URI || '',
  },
};

/**
 * Fails fast when required environment variables are missing.
 * Called once at startup and by the database seed script.
 */
export function assertRuntimeConfig() {
  const missing = [];

  if (!env.mongodbUri) missing.push('MONGODB_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the values.'
    );
  }

  if (env.jwtSecret.length < 32) {
    console.warn(
      '[config] JWT_SECRET should be at least 32 characters long for adequate security.'
    );
  }
}

/**
 * OAuth2/OIDC access-token verification is optional. It is enabled only when
 * both the issuer and the JWKS endpoint are configured.
 */
export function isOAuthConfigured() {
  return Boolean(env.oauth.issuer && env.oauth.jwksUri);
}
