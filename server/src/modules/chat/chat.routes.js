import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as chatController from './chat.controller.js';

const router = express.Router();

router.use(authenticate);

// Conversations
router.get('/conversations', chatController.getConversations);
// IMPORTANT: /direct and /group must be declared before /:id to prevent Express
// treating the literal strings "direct" or "group" as a conversationId param.
router.post('/conversations/direct', chatController.createDirectConversation);
router.post('/conversations/group', chatController.createGroupConversation);
router.get('/conversations/:id', chatController.getConversation);

// Messages
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);

// Pusher Auth Endpoint
router.post('/pusher/auth', chatController.pusherAuth);

export default router;
