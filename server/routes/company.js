import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getTopics, getCompanies, getQuestions, solveQuestion, unsolveQuestion, getProgress } from '../controllers/companyController.js';

const router = Router();

// All company prep routes require authentication
router.use(authenticate);

router.get('/topics', getTopics);
router.get('/:topic/companies', getCompanies);
router.get('/:topic/:company', getQuestions);
router.post('/solve', solveQuestion);
router.post('/unsolve', unsolveQuestion);
router.get('/progress/:topic/:company', getProgress);

export default router;
