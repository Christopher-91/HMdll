import { Router } from 'express';
import * as ctrl from './costs.controller.js';

const router = Router();
router.post('/calculate', ctrl.calculate);
router.get('/country/:slug', ctrl.getCountryCostData);
router.get('/all-countries', ctrl.getAllCountryCostData);

export default router;
