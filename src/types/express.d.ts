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