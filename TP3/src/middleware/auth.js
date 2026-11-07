import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env, isOAuthConfigured } from '../config/env.js';
import { ApiError } from './errorHandler.js';

let remoteJwks;

function getRemoteJwks() {
  if (!remoteJwks) {
    remoteJwks = createRemoteJWKSet(new URL(env.oauth.jwksUri));
  }

  return remoteJwks;
}

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token, ...rest] = header.split(' ');

  if (!/^Bearer$/i.test(scheme) || !token || rest.length > 0) {
    return null;
  }

  return token;
}

function verifyLocalToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);

  if (typeof payload !== 'object' || !payload.sub) {
    throw new Error('Token payload does not contain a subject.');
  }

  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    provider: 'local',
  };
}

async function verifyOAuthToken(token) {
  const options = {};

  if (env.oauth.issuer) options.issuer = env.oauth.issuer;
  if (env.oauth.audience) options.audience = env.oauth.audience;

  const { payload } = await jwtVerify(token, getRemoteJwks(), options);

  if (!payload.sub) {
    throw new Error('OAuth2 token does not contain a subject.');
  }

  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    provider: 'oauth2',
  };
}

/**
 * Protects an endpoint with a Bearer token.
 *
 * The token may be:
 *   1. a JWT issued by POST /api/auth/login (signed with JWT_SECRET), or
 *   2. when OAuth2 is configured, a JWT access token issued by the configured
 *      OAuth2/OpenID Connect provider and verified against its JWKS endpoint.
 *
 * Missing, malformed, expired or invalid tokens produce 401 Unauthorized.
 */
export async function protect(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return next(
      new ApiError(
        401,
        'UNAUTHORIZED',
        'Authentication required. Send a Bearer token in the Authorization header.'
      )
    );
  }

  try {
    req.user = verifyLocalToken(token);
    return next();
  } catch {
    // Not a valid local JWT; try the OAuth2 provider when configured.
  }

  if (isOAuthConfigured()) {
    try {
      req.user = await verifyOAuthToken(token);
      return next();
    } catch {
      // Fall through to the 401 response below.
    }
  }

  return next(new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired token.'));
}
