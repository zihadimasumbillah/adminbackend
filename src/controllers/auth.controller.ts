import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { UniqueConstraintError } from 'sequelize';

const createToken = (userId: string): string => 
  jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '24h' });

const formatUserResponse = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  status: user.status
});

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      status: 'active',
      last_login_time: new Date(),
      created_at: new Date()
    });

    res.status(201).json({
      user: formatUserResponse(user),
      token: createToken(user.id)
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      const field = error.errors[0].path;
      return res.status(400).json({ 
        message: field === 'email' 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Account blocked' });
    }

    await user.update({ last_login_time: new Date() });
    res.json({
      user: formatUserResponse(user),
      token: createToken(user.id)
    });
  } catch {
    res.status(500).json({ message: 'Login failed' });
  }
};

export const logout = (_req: Request, res: Response) => 
  res.json({ message: 'Logged out successfully' });