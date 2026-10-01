import express from 'express';
import { getHistoryRecords, getHistoryById, createHistoryRecord } from '../controllers/historyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All history routes are auth-protected and scoped to the authenticated user
router.get('/', protect, getHistoryRecords);
router.get('/:id', protect, getHistoryById);
router.post('/', protect, createHistoryRecord);

export default router;
