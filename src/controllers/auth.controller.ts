import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { UserActivityHistory } from '../models/user-activity-history.model'; 
import { UniqueConstraintError } from 'sequelize';
import { AuthRequest } from '../types/express'; 
import sequelize from '../config/database'; 
import { QueryTypes, Op } from 'sequelize';
import { recordUserActivity, reconnectUserActivity } from '../services/activity.service';
import { validatePassword, validateEmail } from '../utils/validation';
import rateLimit from 'express-rate-limit';
import { sanitizeInput } from '../utils/sanitization';

const createToken = (userId: string): string => 
  jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '24h' });

const formatUserResponse = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  status: user.status
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5,
  message: 'Too many registration attempts from this IP, please try again after an hour'
});

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required',
        code: 'MISSING_FIELDS'
      });
    }

    const sanitizedName = sanitizeInput(name);
    const normalizedEmail = email.toLowerCase().trim();

    const existingActiveName = await User.findOne({
      where: {
        name: sanitizedName,
        deleted_at: null
      }
    });

    if (existingActiveName) {
      return res.status(400).json({
        message: 'This name is already in use',
        field: 'name',
        code: 'NAME_EXISTS'
      });
    }

    const deletedUser = await User.findOne({
      where: {
        email: normalizedEmail,
        deleted_at: { [Op.not]: null }
      },
      paranoid: false
    });

    if (deletedUser) {
      try {
        const nameConflict = await User.findOne({
          where: {
            name: sanitizedName,
            deleted_at: null,
            id: { [Op.not]: deletedUser.id }
          }
        });

        if (nameConflict) {
          return res.status(400).json({
            message: 'This name is already in use',
            field: 'name',
            code: 'NAME_EXISTS'
          });
        }

        await sequelize.transaction(async (t) => {
          await deletedUser.update({
            name: sanitizedName,
            password: await bcrypt.hash(password, 12),
            status: 'active',
            last_activity_time: new Date(),
            deleted_at: null
          }, { transaction: t });

          await UserActivityHistory.update(
            { 
              is_deleted_user: false,
              user_id: deletedUser.id
            },
            { 
              where: { 
                email: normalizedEmail,
                is_deleted_user: true 
              },
              transaction: t
            }
          );
        });

        const token = createToken(deletedUser.id);

        return res.status(200).json({
          user: {
            ...formatUserResponse(deletedUser),
            last_login_time: new Date().toISOString(),
            last_activity_time: new Date().toISOString()
          },
          token
        });
      } catch (error) {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({
            message: 'This name is already in use',
            field: 'name',
            code: 'NAME_EXISTS'
          });
        }
        throw error;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ 
      name: sanitizedName,
      email: normalizedEmail,
      password: hashedPassword,
      status: 'active',
      last_activity_time: new Date(),
      last_login_time: new Date(),
      created_at: new Date(),
      login_attempts: 0
    });

    const token = createToken(user.id);

    return res.status(201).json({
      user: formatUserResponse(user),
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed due to server error',
      code: 'SERVER_ERROR'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const user = await User.findOne({ 
      where: { email, deleted_at: null }
    });

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact an administrator.',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const now = new Date();
    await user.update({ 
      last_login_time: now,
      last_activity_time: now
    });

    const token = createToken(user.id);

    res.json({
      user: {
        ...formatUserResponse(user),
        last_login_time: now.toISOString(),
        last_activity_time: now.toISOString()
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed due to server error',
      code: 'SERVER_ERROR'
    });
  }
};

interface ActivityUpdateBody {
  clientTime?: string | Date;
  userIds?: string[];
  name?: string;
  email?: string;
  password?: string;
}

export const updateActivity = async (req: AuthRequest<ActivityUpdateBody>, res: Response) => {
  try {
    if (!req.user?.id || !req.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const email = req.user.email;
    const now = new Date();
    const clientTime = req.body?.clientTime ? new Date(req.body.clientTime) : null;
    
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.status === 'blocked') {
        return res.status(403).json({ 
          message: 'Account blocked',
          code: 'ACCOUNT_BLOCKED' 
        });
      }

      const lastActivityTime = user.last_activity_time 
        ? new Date(user.last_activity_time).getTime()
        : new Date(user.last_login_time).getTime();
      
      const nowTime = now.getTime();
      let sessionMinutes = 0;
      
            if (nowTime > lastActivityTime) {
        const diffMs = nowTime - lastActivityTime;
        const diffMinutes = diffMs / (1000 * 60);
                if (diffMinutes <= 30) {
                    sessionMinutes = diffMinutes;
        } else if (diffMinutes <= 120) {
          sessionMinutes = Math.min(15, diffMinutes / 4);
        } else if (diffMinutes <= 480) {
          sessionMinutes = 5;
        }
      }
      if (sessionMinutes >= 0.5) {
        recordUserActivity(userId, email, sessionMinutes)
          .catch(err => console.error('Background activity recording failed:', err));
      }
      
      await user.update({ last_activity_time: now });
      
      res.json({ 
        success: true,
        serverTime: now.toISOString(),
        formattedTime: now.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }),
        lastUpdate: {
          raw: now.toISOString(),
          relative: 'just now',
          sessionMinutes: Math.round(sessionMinutes * 10) / 10,
          lastActivityTime: new Date(lastActivityTime).toISOString() 
        }
      });
    } catch (dbError) {
      console.error('Database error in updateActivity:', dbError);
      return res.status(500).json({ message: 'Database error' });
    }
  } catch (error) {
    console.error('Failed to update activity:', error);
    res.status(500).json({ message: 'Failed to update activity' });
  }
};

export const logout = (_req: Request, res: Response) => 
  res.json({ message: 'Logged out successfully' });

export const validateToken = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
 
    res.json({
      user: formatUserResponse(req.user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate token' });
  }
};
