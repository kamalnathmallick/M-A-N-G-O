import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { offlineAuthStore } from '../services/offlineAuthStore.js';

const dbReady = () => mongoose.connection.readyState === 1;

const signToken = (user) =>
  jwt.sign(
    { id: user.id || user._id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

const publicUser = (user) => ({
  id: user.id || user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  location: user.location
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, location } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email and password are required', null, 400);
    }
    if (typeof password !== 'string' || password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', null, 400);
    }

    // --- MongoDB path -----------------------------------------------------
    if (dbReady()) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse(res, 'An account with this email already exists', null, 409);
      }

      const user = await User.create({
        name,
        email,
        password,
        phone: phone || '',
        role: role || 'farmer',
        location: location || 'Ratnagiri, Maharashtra, India'
      });

      const token = signToken({ id: user._id, role: user.role, email: user.email });

      return successResponse(
        res,
        { token, user: publicUser(user) },
        'User registered successfully',
        201
      );
    }

    // --- Offline fallback (MongoDB down): in-memory account ---------------
    try {
      const user = await offlineAuthStore.create({
        name,
        email,
        password,
        phone: phone || '',
        role: role || 'farmer',
        location: location || 'Ratnagiri, Maharashtra, India'
      });
      const token = signToken(user);
      return successResponse(
        res,
        { token, user },
        'User registered successfully (offline mode — account is not persisted)',
        201
      );
    } catch (err) {
      if (err.code === 'OFFLINE_DUPLICATE_EMAIL') {
        return errorResponse(res, 'An account with this email already exists', null, 409);
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Please provide email and password', null, 400);
    }

    // --- MongoDB path -----------------------------------------------------
    if (dbReady()) {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return errorResponse(res, 'Invalid credentials', null, 401);
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return errorResponse(res, 'Invalid credentials', null, 401);
      }

      const token = signToken({ id: user._id, role: user.role, email: user.email });

      return successResponse(res, { token, user: publicUser(user) }, 'Login successful');
    }

    // --- Offline fallback -------------------------------------------------
    const offlineUser = offlineAuthStore.findByEmail(email);
    if (!offlineUser) {
      return errorResponse(res, 'Invalid credentials', null, 401);
    }
    const isMatch = await offlineAuthStore.matchPassword(email, password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', null, 401);
    }

    const token = signToken(offlineUser);
    return successResponse(
      res,
      { token, user: offlineAuthStore.toPublicUser(offlineUser) },
      'Login successful (offline mode)'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/demo
 * Returns a real signed JWT for the seeded demo user so that demo-mode
 * frontend sessions can call authenticated endpoints (e.g. /predictions/bud).
 * When MongoDB is offline, falls back to an in-memory demo account so the
 * app stays usable without a database.
 */
export const demoLogin = async (req, res, next) => {
  try {
    const DEMO_EMAIL = 'farmer@mangosense.org';
    const DEMO_NAME = 'Demo Farmer';

    // --- MongoDB path -------------------------------------------------------
    if (dbReady()) {
      let user = await User.findOne({ email: DEMO_EMAIL });
      if (!user) {
        // Seed user was wiped — recreate it on-the-fly so demo always works.
        user = await User.create({
          name: 'Ramesh Patil',
          email: DEMO_EMAIL,
          password: 'password123',
          role: 'farmer',
          location: 'Ratnagiri, Maharashtra, India'
        });
      }
      const token = signToken({ id: user._id, role: user.role, email: user.email });
      return successResponse(
        res,
        { token, user: { ...publicUser(user), isDemo: true } },
        'Demo session created'
      );
    }

    // --- Offline fallback (MongoDB down) ------------------------------------
    let offlineUser = offlineAuthStore.findByEmail(DEMO_EMAIL);
    if (!offlineUser) {
      offlineUser = await offlineAuthStore.create({
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        password: 'demo-offline-only',
        role: 'farmer',
        location: 'Ratnagiri, Maharashtra, India'
      });
    }
    const token = signToken(offlineUser);
    return successResponse(
      res,
      { token, user: { ...offlineAuthStore.toPublicUser(offlineUser), isDemo: true } },
      'Demo session created (offline mode)'
    );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', null, 401);
    }

    return successResponse(res, { user: publicUser(req.user) }, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};
