import express from 'express';
import { auth } from '../middleware/auth';
import { getAllUsers, blockUsers, unblockUsers, deleteUsers } from '../controllers/user.controller';

const router = express.Router();

router.get('/', auth, getAllUsers);
router.post('/block', auth, blockUsers);
router.post('/unblock', auth, unblockUsers);
router.post('/delete', auth, deleteUsers);

export default router;