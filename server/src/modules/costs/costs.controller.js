import { calculateCosts, getCountryCosts, getAllCountryCosts } from './costs.service.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { successResponse } from '../../utils/response.js';

export const calculate = asyncHandler(async (req, res) => {
  const result = calculateCosts(req.body);
  successResponse(res, result);
});

export const getCountryCostData = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const result = getCountryCosts(slug);
  successResponse(res, result);
});

export const getAllCountryCostData = asyncHandler(async (req, res) => {
  const result = getAllCountryCosts();
  successResponse(res, result);
});
