import { Router } from 'express';
import db from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get Profile by Username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user: any = db.prepare('SELECT id, username FROM User WHERE username = ?').get(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats: any = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM Follow WHERE followingId = ?) as followers,
        (SELECT COUNT(*) FROM Follow WHERE followerId = ?) as following,
        (SELECT COUNT(*) FROM Post WHERE userId = ?) as posts
    `).get(user.id, user.id, user.id);

    user._count = {
      followers: stats.followers,
      following: stats.following,
      posts: stats.posts
    };
    user.profile = null;

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Follow a user
router.post('/:id/follow', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = req.params.id as string;
    const currentUserId = req.userId!;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const followId = uuidv4();
    db.prepare('INSERT INTO Follow (id, followerId, followingId) VALUES (?, ?, ?)').run(followId, currentUserId, targetUserId);

    res.json({ message: 'Successfully followed' });
  } catch (error) {
    res.status(400).json({ error: 'Already following or invalid user' });
  }
});

// Unfollow a user
router.delete('/:id/follow', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = req.params.id as string;
    const currentUserId = req.userId!;

    db.prepare('DELETE FROM Follow WHERE followerId = ? AND followingId = ?').run(currentUserId, targetUserId);

    res.json({ message: 'Successfully unfollowed' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to unfollow' });
  }
});

export default router;
