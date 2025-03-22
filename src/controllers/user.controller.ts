import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Op, Sequelize, literal } from 'sequelize';
import sequelize from '../config/database';

interface AuthRequest extends Request {
  user?: any;
}

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id',
        'name',
        'email',
        'status',
        'last_login_time',
        'created_at',
        [
          Sequelize.literal(`CASE 
            WHEN "last_login_time" > NOW() - INTERVAL '5 minutes' THEN 'online'
            WHEN "last_login_time" > NOW() - INTERVAL '1 hour' THEN 'away'
            ELSE 'offline'
          END`),
          'activity_status'
        ]
      ],
      where: {
        deleted_at: null 
      },
      order: [
        ['last_login_time', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    const formattedUsers = users.map(user => ({
      ...user.toJSON(),
      last_login_time: new Date(user.last_login_time).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
      }),
      created_at: new Date(user.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
      })
    }));

    res.json(formattedUsers);
  } catch (err: unknown) {
    console.error('Error fetching users:', err);
    const error = err as Error;
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
};

export const blockUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { userIds } = req.body;
    
    await User.update(
      { status: 'blocked' },
      { where: { id: userIds } }
    );

    res.json({ message: 'Users blocked successfully' });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ 
      message: 'Error blocking users', 
      error: error.message || 'Unknown error occurred'
    });
  }
};

export const unblockUsers = async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;
    await User.update(
      { status: 'active' },
      { where: { id: userIds } }
    );
    res.json({ message: 'Users unblocked successfully' });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ 
      message: 'Error unblocking users', 
      error: error.message || 'Unknown error occurred'
    });
  }
};

export const deleteUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { userIds } = req.body;
    const currentUserId = req.user?.id;
    
    const isSelfDelete = userIds.includes(currentUserId);

    await User.destroy({ 
      where: { id: userIds } 
    });

    await User.update(
      { status: 'blocked' },
      { 
        where: { id: userIds },
        paranoid: false 
      }
    );

    if (isSelfDelete) {
      res.json({ 
        message: 'Account deleted successfully',
        redirect: '/login'
      });
    } else {
      res.json({ message: 'Users deleted successfully' });
    }
  } catch (err: unknown) {
    console.error('Error deleting users:', err);
    const error = err as Error;
    res.status(500).json({ 
      message: 'Error deleting users', 
      error: error.message || 'Unknown error occurred'
    });
  }
};