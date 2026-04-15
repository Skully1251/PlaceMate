import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateResumeHandler, getResume } from '../controllers/resumeController.js';

const router = Router();

// All resume routes require authentication
router.use(authenticate);

router.post('/generate', generateResumeHandler);
router.get('/', getResume);

export default router;
