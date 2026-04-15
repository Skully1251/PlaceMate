import { Router } from 'express';
import { signup, login, googleAuth } from '../controllers/authController.js';

const router = Router();

// Auth routes (no auth middleware - these are login/signup endpoints)
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);

export default router;
