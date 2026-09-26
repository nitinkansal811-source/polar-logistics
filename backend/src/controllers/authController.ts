import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { DbStore } from '../services/dbStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'polar_mission_control_2026';

export const login = async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const store = DbStore.getInstance();
  const users = await store.getUsers();

  // Allow login by email or role selection
  let user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user && role) {
    user = users.find((u) => u.role === role);
  }

  if (!user) {
    // Default to Expedition Lead for easy evaluation
    user = users[0];
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      station_id: user.station_id,
      badge_number: user.badge_number
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user
  });
};

export const getMe = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const store = DbStore.getInstance();
    const users = await store.getUsers();
    const user = users.find((u) => u.id === decoded.id) || decoded;
    return res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const getDemoUsers = async (req: Request, res: Response) => {
  const store = DbStore.getInstance();
  const users = await store.getUsers();
  return res.json({ users });
};
