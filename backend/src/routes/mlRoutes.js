import express from 'express';
import { getMlModelInfo } from '../controllers/mlController.js';

const router = express.Router();

// Model card + evaluation metrics (contract §14/§16) — public, no user data
router.get('/info', getMlModelInfo);

export default router;
