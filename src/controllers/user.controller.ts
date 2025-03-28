import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Sequelize, QueryTypes, Op } from 'sequelize';
import sequelize from '../config/database'; 
import { AuthRequest } from '../types/express';
import { UserActivityHistory } from '../models/user-activity-history.model';
import { recordUserActivity, markUserActivityAsDeleted } from '../services/activity.service';

const formatDateForAPI = (date: Date | null): string => {
  if (!date) {
    return new Date().toISOString(); 
  }
  
  const validDate = new Date(date);
  if (isNaN(validDate.getTime())) {
    console.warn('Invalid date detected:', date);
    return new Date().toISOString();
  }
  return validDate.toISOString(); 
};

const ACTIVITY_STATUS = `CASE 
  WHEN "last_activity_time" > NOW() - INTERVAL '5 minutes' THEN 'online'
  WHEN "last_activity_time" > NOW() - INTERVAL '1 hour' THEN 'away'
  WHEN "last_activity_time" IS NULL THEN 'offline'
  ELSE 'offline' END`;

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      sortBy = 'name',
      order = 'ASC',
      limit = 10,
      page = 1
    } = req.query;

    const whereClause: any = { deleted_at: null };
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (status && ['active', 'blocked'].includes(status as string)) {
      whereClause.status = status;
    }

    let orderBy: any[];
    
    switch (sortBy) {
      case 'name':
        orderBy = [
          [Sequelize.fn('LOWER', Sequelize.col('name')), order], 
          ['id', 'ASC'] 
        ];
        break;
        
      case 'last_login_time':
        orderBy = [
          ['last_login_time', order, 'NULLS LAST'], 
          ['name', 'ASC'] 
        ];
        break;
        
      case 'created_at':
        orderBy = [
          ['created_at', order, 'NULLS LAST'],
          ['name', 'ASC'] 
        ];
        break;
        
      default:
        orderBy = [
          [Sequelize.fn('LOWER', Sequelize.col('name')), 'ASC'],
          ['id', 'ASC']
        ];
    }

    const { rows: users, count } = await User.findAndCountAll({
      where: whereClause,
      order: orderBy,
      distinct: true,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      attributes: [
        'id',
        'name',
        'email',
        'status',
        'last_login_time',
        'last_activity_time',
        'created_at'
      ]
    });

    const formattedUsers = await Promise.all(users.map(async user => ({
      ...user.toJSON(),
      last_login_time: formatDateForAPI(user.last_login_time),
      last_activity_time: formatDateForAPI(user.last_activity_time),
      created_at: formatDateForAPI(user.created_at),
      activity_pattern: await getUserActivityData(user.id, user.email)
    })));

    return res.json({
      users: formattedUsers,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit))
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};

const updateUserStatus = async (userIds: string[], status: 'active' | 'blocked') => {
  try {
    const oppositeStatus = status === 'active' ? 'blocked' : 'active';
    const usersToUpdate = await User.findAll({
      where: { 
        id: userIds,
        status: oppositeStatus 
      },
      attributes: ['id', 'name', 'email']
    });
    
    if (usersToUpdate.length === 0) {
      return { 
        message: `No users needed ${status === 'active' ? 'unblocking' : 'blocking'}`,
        affected: 0
      };
    }
    
    const idsToUpdate = usersToUpdate.map(user => user.id);
    await User.update(
      { status }, 
      { where: { id: idsToUpdate } }
    );
    
    return { 
      message: `${usersToUpdate.length} users ${status === 'active' ? 'unblocked' : 'blocked'} successfully`,
      affected: usersToUpdate.length
    };
  } catch (error) {
    console.error(`Error ${status}ing users:`, error);
    throw error;
  }
};

const checkUserStatus = async (userId: string) => {
  const user = await User.findOne({
    where: { id: userId },
    attributes: ['status', 'deleted_at']
  });
  return !user || user.deleted_at || user.status === 'blocked';
};

export const blockUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.body.userIds.length === 0) {
      return res.status(400).json({ message: 'No users selected' });
    }

    const isSelfBlock = req.body.userIds.includes(req.user.id);
    
    await User.update(
      { status: 'blocked' }, 
      { where: { id: req.body.userIds } }
    );
    
    if (isSelfBlock) {
      return res.json({
        message: 'Selected users have been blocked. You will be redirected to login.',
        selfBlocked: true,
        redirect: '/auth'
      });
    }

    return res.json({ 
      message: 'Selected users have been blocked successfully',
      affected: req.body.userIds.length
    });

  } catch (error) {
    console.error('Block operation failed:', error);
    return res.status(500).json({ message: 'Operation failed' });
  }
};

export const unblockUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (await checkUserStatus(req.user!.id)) {
      return res.status(403).json({ message: 'Account unavailable', redirect: '/login' });
    }
    
    if (req.body.userIds.length === 0) {
      return res.status(400).json({ message: 'No users selected' });
    }
    
    const result = await updateUserStatus(req.body.userIds, 'active', res);
    res.json(result);
  } catch (error) {
    console.error('Unblock operation failed:', error);
    res.status(500).json({ message: 'Operation failed' });
  }
};

export const deleteUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { userIds } = req.body;
    
    await sequelize.transaction(async (t) => {
      await UserActivityHistory.update(
        { 
          is_deleted_user: true,
          user_id: null
        },
        { 
          where: { 
            user_id: { [Op.in]: userIds }
          },
          transaction: t
        }
      );

      await User.destroy({
        where: { id: userIds },
        transaction: t
      });
    });

    if (userIds.includes(req.user!.id)) {
      return res.json({
        message: 'Your account has been deleted. You will be redirected to login.',
        selfDeleted: true
      });
    }

    return res.json({
      message: 'Selected users have been deleted successfully',
      selfDeleted: false
    });

  } catch (error) {
    console.error('Error deleting users:', error);
    return res.status(500).json({ message: 'Failed to delete users' });
  }
};

export const getUserActivity = async (_req: Request, res: Response) => {
  try {
    const hourlyResults = await sequelize.query(`
      SELECT 
        date_trunc('hour', last_activity_time) as activity_hour,
        COUNT(*) as user_count,
        AVG(EXTRACT(EPOCH FROM (last_activity_time - last_login_time)) / 60) as avg_session_minutes
      FROM users
      WHERE 
        last_activity_time > NOW() - INTERVAL '7 days'
        AND last_activity_time > last_login_time
      GROUP BY activity_hour
      ORDER BY activity_hour ASC
    `, { type: QueryTypes.SELECT });
    
    const dayOfWeekActivity = await sequelize.query(`
      SELECT 
        EXTRACT(DOW FROM last_activity_time) as day_of_week,
        COUNT(*) as user_count,
        AVG(EXTRACT(EPOCH FROM (last_activity_time - last_login_time)) / 60) as avg_session_minutes,
        SUM(EXTRACT(EPOCH FROM (last_activity_time - last_login_time)) / 60) as total_minutes
      FROM users
      WHERE 
        last_activity_time > NOW() - INTERVAL '30 days'
        AND last_activity_time > last_login_time
      GROUP BY day_of_week
      ORDER BY day_of_week ASC
    `, { type: QueryTypes.SELECT });
    
    const activityData = {
      hourly: hourlyResults,
      weekday: dayOfWeekActivity.map((day: any) => ({
        ...day,
        avg_session_minutes: Math.round(parseFloat(day.avg_session_minutes) * 10) / 10,
        total_minutes: Math.round(parseFloat(day.total_minutes))
      }))
    };
    
    res.json(activityData);
  } catch (error) {
    console.error('Error fetching activity data:', error);
    res.status(500).json({ message: 'Failed to fetch activity data' });
  }
};

async function calculateActivityPattern(userId: string, email: string) {
  const activityData = await sequelize.query(`
    SELECT 
      day_of_week,
      SUM(session_minutes) as total_minutes,
      COUNT(*) as total_sessions
    FROM user_activity_history
    WHERE (user_id = :userId OR (email = :email AND is_deleted_user = TRUE))
      AND activity_date > NOW() - INTERVAL '30 days'
    GROUP BY day_of_week
    ORDER BY day_of_week
  `, {
    replacements: { userId, email },
    type: QueryTypes.SELECT
  });

  const formattedPattern: Record<string, { count: number, minutes: number }> = {};
  
  for (let i = 0; i < 7; i++) {
    formattedPattern[i] = { count: 0, minutes: 0 };
  }

  activityData.forEach((day: any) => {
    const dayIndex = parseInt(day.day_of_week);
    formattedPattern[dayIndex] = {
      count: parseInt(day.total_sessions) || 0,
      minutes: Math.round(parseFloat(day.total_minutes) || 0)
    };
  });

  return formattedPattern;
}

async function getUserActivityData(userId: string, email: string) {
  try {
    const activityPattern = await calculateActivityPattern(userId, email);
    const totalMinutes = Object.values(activityPattern).reduce((sum, day) => 
      sum + (day.minutes || 0), 0
    );
    
    return {
      pattern: activityPattern,
      total: {
        minutes: totalMinutes,
        hours: Math.floor(totalMinutes / 60),
        displayTime: formatActivityTime(totalMinutes)
      }
    };
  } catch (error) {
    console.error('Error in getUserActivityData:', error);
    return {
      pattern: {},
      total: {
        minutes: 0,
        hours: 0,
        displayTime: '0m'
      }
    };
  }
}

function formatActivityTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

export const getUserActivityPattern = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const CACHE_TTL = 60 * 1000; 
    const activityCache = new Map();
    
    const cacheKey = `activity_${userId}`;
    const cached = activityCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return res.json({ pattern: cached.data });
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const activityData = await sequelize.query(`
      SELECT 
        day_of_week,
        SUM(session_minutes) as total_minutes,
        SUM(session_count) as total_sessions,
        BOOL_OR(is_deleted_user) as has_deleted_data
      FROM user_activity_history
      WHERE (user_id = :userId OR (email = :email AND is_deleted_user = TRUE))
      GROUP BY day_of_week
      ORDER BY day_of_week
    `, {
      replacements: { userId: user.id, email: user.email },
      type: QueryTypes.SELECT
    });
    
    const formattedPattern: Record<string, { count: number, minutes: number }> = {};
    
    for (let i = 0; i < 7; i++) {
      formattedPattern[i] = { count: 0, minutes: 0 };
    }

    activityData.forEach((day: any) => {
      const dayIndex = parseInt(day.day_of_week);
      formattedPattern[dayIndex].count = parseInt(day.total_sessions) || 0;
      formattedPattern[dayIndex].minutes = Math.min(
        Math.round(parseFloat(day.total_minutes) || 0),
        480 
      );
    });
    
    activityCache.set(cacheKey, {
      timestamp: Date.now(),
      data: formattedPattern
    });
    
    return res.json({ pattern: formattedPattern });
  } catch (error) {
    console.error('Error fetching user activity pattern:', error);
    res.status(500).json({ message: 'Failed to fetch activity pattern' });
  }
};


