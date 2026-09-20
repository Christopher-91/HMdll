import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as connectionsController from './connections.controller.js';

const router = express.Router();

router.use(authenticate);

// Get connection status with a specific user
router.get('/status/:userId', connectionsController.getStatus);

// Get all incoming pending requests
router.get('/pending', connectionsController.getPending);

// Send a connection request
router.post('/request', connectionsController.sendRequest);

// Accept an incoming request
router.post('/accept', connectionsController.acceptRequest);

// Reject an incoming request
router.post('/reject', connectionsController.rejectRequest);

export default router;
