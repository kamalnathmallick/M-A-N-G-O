import express from 'express';
import { getImages } from '../controllers/imageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/images?farmId=&plotId= — auth-protected, data: { images: [...] }
router.get('/', protect, getImages);

export default router;
