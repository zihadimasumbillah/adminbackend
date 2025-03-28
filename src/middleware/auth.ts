import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuthRequest } from '../types/express';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '').trim();
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required', 
        code: 'AUTH_REQUIRED' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      
      const user = await User.findOne({ 
        where: { id: decoded.id },
        paranoid: false, 
        attributes: ['id', 'name', 'email', 'status', 'deleted_at'] 
      });

      if (!user || user.deleted_at) {
        return res.status(403).json({ 
          message: 'Account unavailable',
          code: 'ACCOUNT_UNAVAILABLE'
        });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ 
          message: 'Account blocked',
          code: 'ACCOUNT_BLOCKED'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {

      return res.status(401).json({ 
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR' 
    });
  }
};