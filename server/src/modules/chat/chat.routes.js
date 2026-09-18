import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as chatController from './chat.controller.js';

const router = express.Router();

router.use(authenticate);

// Conversations
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversation);
router.post('/conversations/direct', chatController.createDirectConversation);

// Messages
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);

// Pusher Auth Endpoint
router.post('/pusher/auth', chatController.pusherAuth);

export default router;
