import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { startInterview, submitInterview, getHistory, chat, saveResult } from '../controllers/interviewController.js';

const router = Router();

// All interview routes require authentication
router.use(authenticate);

router.post('/start', startInterview);
router.post('/submit', submitInterview);
router.post('/save-result', saveResult);
router.get('/history', getHistory);
router.post('/chat', chat);

export default router;
