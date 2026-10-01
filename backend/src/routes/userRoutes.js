import express from 'express';
import { getCurrentUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Minimal auth-protected user endpoint(s) — data: { user } (CONTRACT.md §3)
router.get('/', protect, getCurrentUser);
router.get('/me', protect, getCurrentUser);

export default router;
