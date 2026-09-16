import * as usersService from './users.service.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { successResponse } from '../../utils/response.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await usersService.getProfile(req.user.id);
  successResponse(res, profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await usersService.updateProfile(req.user.id, req.body);
  successResponse(res, profile);
});

export const updateTestScores = asyncHandler(async (req, res) => {
  const profile = await usersService.updateTestScores(req.user.id, req.body.scores);
  successResponse(res, profile);
});

export const updateCareerGoals = asyncHandler(async (req, res) => {
  const profile = await usersService.updateCareerGoals(req.user.id, req.body.goals);
  successResponse(res, profile);
});

export const completeOnboarding = asyncHandler(async (req, res) => {
  const profile = await usersService.completeOnboarding(req.user.id);
  successResponse(res, profile);
});

export const searchUsers = asyncHandler(async (req, res) => {
  const results = await usersService.searchUsers(req.query.q, req.user.id);
  successResponse(res, results);
});
