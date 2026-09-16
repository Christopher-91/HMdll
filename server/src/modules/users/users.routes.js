import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getProfile);
router.put('/me', usersController.updateProfile);
router.put('/me/test-scores', usersController.updateTestScores);
router.put('/me/career-goals', usersController.updateCareerGoals);
router.post('/me/complete-onboarding', usersController.completeOnboarding);
router.get('/search', usersController.searchUsers);

export default router;
