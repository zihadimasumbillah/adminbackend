import express from 'express';
import { register, login, logout } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);

export default router;