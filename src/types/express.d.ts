import { Request } from 'express';
import { User } from '../models/user.model';

export interface AuthRequest<T = any> extends Request {
  user?: User;
  body: T;
}
