import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuthRequest } from '../types/express';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ message: 'Authentication required', redirect: '/login' });

    const { id } = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findOne({ 
      where: { id },
      paranoid: false,
      attributes: ['id', 'status', 'deleted_at'] 
    });

    if (!user?.id || user.deleted_at || user.status === 'blocked') {
      return res.status(403).json({ message: 'Account unavailable', redirect: '/login' });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Authentication failed', redirect: '/login' });
  }
};