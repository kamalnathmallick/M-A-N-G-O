import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';
import { offlineAuthStore } from '../services/offlineAuthStore.js';

const dbReady = () => mongoose.connection.readyState === 1;

/**
 * Resolve a verified JWT payload to a user.
 * Order: MongoDB User -> in-memory offline store (MongoDB offline fallback).
 * Returns null when the token is valid but the user cannot be found.
 */
const resolveUser = async (decoded) => {
  if (dbReady()) {
    try {
      const user = await User.findById(decoded.id).select('-password');
      if (user) return user;
    } catch (err) {
      // Fall through to the offline store (e.g. token issued while offline)
    }
  }
  return offlineAuthStore.findById(decoded.id);
};

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await resolveUser(decoded);
      if (!user) {
        return errorResponse(res, 'Not authorized, user no longer exists', null, 401);
      }
      req.user = user;
      return next();
    } catch (error) {
      // Never leak jwt/bcrypt internals to the client
      return errorResponse(res, 'Not authorized, token failed verification', null, 401);
    }
  }

  // If no token is provided:
  return errorResponse(res, 'Not authorized, no token provided', null, 401);
};

// Optional auth: populates req.user if a valid token is present, continues otherwise
export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = await resolveUser(decoded);
    } catch (err) {
      // Continue without user
    }
  }
  next();
};
