import express from 'express';
import { getFarms, getFarmById, createFarm, updateFarm, deleteFarm } from '../controllers/farmController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All farm routes are auth-protected; ownership checks happen in the controller
// (farm.userId.toString() === req.user.id) per CONTRACT.md §3.
router.get('/', protect, getFarms);
router.get('/:id', protect, getFarmById);
router.post('/', protect, createFarm);
router.put('/:id', protect, updateFarm);
router.delete('/:id', protect, deleteFarm);

export default router;
