import express from 'express';
import { auth } from '../middleware/auth';
import { 
  getAllUsers, 
  blockUsers, 
  unblockUsers, 
  deleteUsers, 
  getUserActivity,
  getUserActivityPattern
} from '../controllers/user.controller';

const router = express.Router();

router.get('/', auth, getAllUsers);
router.get('/activity', auth, getUserActivity);
router.get('/activity/:userId', auth, getUserActivityPattern);
router.post('/block', auth, blockUsers);
router.post('/unblock', auth, unblockUsers);
router.post('/delete', auth, deleteUsers);

export default router;

