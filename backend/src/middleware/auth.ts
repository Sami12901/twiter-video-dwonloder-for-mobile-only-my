import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

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
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    req.userId = session.user.id;
    req.user = session.user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during authentication' });
  }
};
