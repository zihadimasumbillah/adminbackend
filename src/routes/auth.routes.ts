import express from 'express';
import { register, login, logout, updateActivity, validateToken } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);
router.post('/update-activity', auth, updateActivity);
router.get('/validate', auth, validateToken);

router.get('/ping', (req, res) => {
  res.json({ 
    status: 'OK',
    serverTime: new Date().toISOString(),
    message: 'Backend server is running'
  });
});

router.get('/ping', (req, res) => {
  const clientTimezone = req.headers['x-timezone'] || 'Unknown';
  const clientTime = req.headers['x-client-time'];
  const clientOffset = parseInt(req.headers['x-timezone-offset'] as string || '0');
  
  console.log('Client timezone info:', {
    timezone: clientTimezone,
    clientTime,
    offset: clientOffset,
    offsetHours: clientOffset / 60
  });

  const now = new Date();

  const adjustedTime = new Date(now.getTime());
  if (clientOffset) {
    adjustedTime.setMinutes(adjustedTime.getMinutes() - clientOffset);
  }
  
  let timezoneDiffMinutes = null;
  if (clientTime) {
    try {
      const clientDate = new Date(clientTime as string);
      timezoneDiffMinutes = Math.round((now.getTime() - clientDate.getTime()) / (1000 * 60));
    } catch (e) {
      console.error('Error parsing client time:', e);
    }
  }

  res.json({
    status: 'OK',
    serverTime: {
      utc: now.toISOString(),
      timestamp: now.getTime(),
      timezone: process.env.TZ || 'UTC',
      formatted: now.toString()
    },
    adjustedTime: {
      isoString: adjustedTime.toISOString(),
      formatted: adjustedTime.toString(),
      offset: clientOffset
    },
    clientInfo: {
      timezone: clientTimezone,
      clientTime: clientTime || 'Not provided',
      timezoneOffset: clientOffset ? `${clientOffset} minutes` : 'Not provided',
      clientHoursFromUTC: clientOffset ? (clientOffset / 60).toFixed(1) : 'Unknown',
      ip: req.ip || req.headers['x-forwarded-for'] || 'Unknown'
    },
    timezoneDiff: timezoneDiffMinutes !== null ? `${timezoneDiffMinutes} minutes` : 'Unknown'
  });
});

export default router;