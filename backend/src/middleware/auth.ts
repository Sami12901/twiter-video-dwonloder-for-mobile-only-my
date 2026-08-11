import { Request, Response, NextFunction } from 'express';
import db from '../db';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.session_token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const session = db.data.sessions.find((s) => s.token === token);
    const user = session ? db.data.users.find((u) => u.id === session.userId) : null;

    if (!session || !user || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const safeUser = { id: user.id, username: user.username, email: user.email };
    req.userId = user.id;
    req.user = safeUser;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during authentication' });
  }
};
