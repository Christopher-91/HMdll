import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as callController from './call.controller.js';

const router = express.Router();

router.use(authenticate);

// Relay a call signal (offer, answer, ice-candidate, ring, decline, etc.)
router.post('/signal', callController.signal);

export default router;
