import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { checkATS, getATSHistory } from '../controllers/atsController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// All ATS routes require authentication
router.use(authenticate);

router.post('/check', upload.single('resume'), checkATS);
router.get('/history', getATSHistory);

export default router;
