import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Sequelize } from 'sequelize';
import { AuthRequest } from '../types/express';

const formatDate = (date: Date): string => 
  new Date(date).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

const ACTIVITY_STATUS = `CASE 
  WHEN "last_login_time" > NOW() - INTERVAL '5 minutes' THEN 'online'
  WHEN "last_login_time" > NOW() - INTERVAL '1 hour' THEN 'away'
  ELSE 'offline' END`;

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id', 'name', 'email', 'status', 'last_login_time', 'created_at',
        [Sequelize.literal(ACTIVITY_STATUS), 'activity_status']
      ],
      where: { deleted_at: null },
      order: [['last_login_time', 'DESC']]
    });

    res.json(users.map(user => ({
      ...user.toJSON(),
      last_login_time: formatDate(user.last_login_time),
      created_at: formatDate(user.created_at)
    })));
  } catch {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const updateUserStatus = async (userIds: string[], status: 'active' | 'blocked', res: Response) => {
  try {
    await User.update({ status }, { where: { id: userIds } });
    res.json({ message: `Users ${status} successfully` });
  } catch {
    res.status(500).json({ message: `Error ${status}ing users` });
  }
};

export const blockUsers = async (req: AuthRequest, res: Response) => 
  updateUserStatus(req.body.userIds, 'blocked', res);

export const unblockUsers = async (req: AuthRequest, res: Response) => 
  updateUserStatus(req.body.userIds, 'active', res);

export const deleteUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { userIds } = req.body;
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    await Promise.all([
      User.destroy({ where: { id: userIds } }),
      User.update({ status: 'blocked' }, { where: { id: userIds }, paranoid: false })
    ]);

    res.json(userIds.includes(req.user.id)
      ? { message: 'Account deleted successfully', redirect: '/login' }
      : { message: 'Users deleted successfully' }
    );
  } catch {
    res.status(500).json({ message: 'Error deleting users' });
  }
};