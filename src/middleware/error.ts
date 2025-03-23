import { Request, Response, NextFunction } from 'express';
import { UniqueConstraintError } from 'sequelize';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof UniqueConstraintError) {
    const field = error.errors[0].path;
    const message = field === 'email' 
      ? 'Email already registered'
      : 'Username already taken';
    return res.status(400).json({ message });
  }

  res.status(500).json({ message: 'Internal server error' });
};