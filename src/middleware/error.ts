import { Request, Response, NextFunction } from 'express';
import { UniqueConstraintError } from 'sequelize';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof UniqueConstraintError) {
    return res.status(400).json({
      message: 'This email is already registered'
    });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Internal server error'
  });
};