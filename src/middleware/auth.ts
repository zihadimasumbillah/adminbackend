import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuthRequest } from '../types/express';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided',
        redirect: '/login'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    
    const user = await User.findOne({ 
      where: { id: decoded.id },
      paranoid: false 
    });

    if (!user || user.deleted_at || user.status === 'blocked') {
      return res.status(403).json({ 
        message: 'Account is blocked or deleted',
        redirect: '/login'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      message: 'Please authenticate',
      redirect: '/login'
    });
  }
};