import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { UniqueConstraintError } from 'sequelize';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ 
      where: { email },
      paranoid: false 
    });

    if (existingUser) {
      if (existingUser.deleted_at) {
        await existingUser.restore();
        const hashedPassword = await bcrypt.hash(password, 10);
        await existingUser.update({
          name,
          password: hashedPassword,
          status: 'active',
          last_login_time: new Date()
        });

        const token = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET!, {
          expiresIn: '24h',
        });

        return res.status(201).json({
          user: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            status: existingUser.status
          },
          token
        });
      }
      
      return res.status(400).json({ 
        message: 'This email is already registered' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      status: 'active',
      last_login_time: new Date()
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '24h',
    });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ 
        message: 'This email is already registered' 
      });
    }
    res.status(400).json({ 
      message: 'Error creating user'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ 
      where: { email },
      paranoid: true 
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ 
        message: 'Account is blocked. Please contact administrator.' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await user.update({ last_login_time: new Date() });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '24h',
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: 'Error logging in', error });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
};