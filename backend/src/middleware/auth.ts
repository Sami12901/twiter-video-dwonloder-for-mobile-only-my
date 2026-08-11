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
    const session: any = db.prepare(`
      SELECT s.*, u.id as u_id, u.username as u_username, u.email as u_email 
      FROM Session s 
      JOIN User u ON s.userId = u.id 
      WHERE s.token = ?
    `).get(token);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = { id: session.u_id, username: session.u_username, email: session.u_email };
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during authentication' });
  }
};
