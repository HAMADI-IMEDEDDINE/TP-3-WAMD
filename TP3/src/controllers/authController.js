import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * POST /api/auth/register
 * Creates a user account after validating the input and hashing the password.
 */
export async function register(req, res) {
  const { name, email, password } = req.body ?? {};
  const details = [];

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName) {
    details.push('name is required.');
  } else if (trimmedName.length > 80) {
    details.push('name must be at most 80 characters long.');
  }

  if (!normalizedEmail) {
    details.push('email is required.');
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    details.push('email must be a valid email address.');
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    details.push(`password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }

  if (details.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid registration data.', details);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(
      409,
      'EMAIL_ALREADY_REGISTERED',
      'An account with this email address already exists.'
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
  });

  res.status(201).json({
    message: 'User registered successfully.',
    user,
  });
}

/**
 * POST /api/auth/login
 * Verifies credentials and returns a signed JWT.
 */
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  const details = [];
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) details.push('email is required.');
  if (typeof password !== 'string' || password.length === 0) {
    details.push('password is required.');
  }

  if (details.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid login data.', details);
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  const passwordMatches = user?.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  res.status(200).json({
    message: 'Login successful.',
    token,
    tokenType: 'Bearer',
    expiresIn: env.jwtExpiresIn,
    user,
  });
}
