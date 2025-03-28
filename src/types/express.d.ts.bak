import { User } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      header(name: string): string | undefined;
    }
  }
}

export interface AuthRequest extends Express.Request {
  user?: User;
  body: {
    userIds: string[];  
    name?: string;
    email?: string;
    password?: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'blocked';
  last_login_time: string;
  last_activity_time: string;
  created_at: string;
  activity_pattern: Record<string, {
    count: number;
    minutes: number;
  }>;
  total_activity: {
    minutes: number;
    hours: number;
    displayTime: string;
  };
}