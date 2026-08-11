import { Router } from 'express';
import db from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get Profile by Username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = db.data.users.find(u => u.username === username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followersCount = db.data.follows.filter(f => f.followingId === user.id).length;
    const followingCount = db.data.follows.filter(f => f.followerId === user.id).length;
    const postsCount = db.data.posts.filter(p => p.userId === user.id).length;

    const userProfile = {
      id: user.id,
      username: user.username,
      profile: null,
      _count: {
        followers: followersCount,
        following: followingCount,
        posts: postsCount
      }
    };

    res.json(userProfile);
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

    const exists = db.data.follows.find(f => f.followerId === currentUserId && f.followingId === targetUserId);
    if (exists) {
      return res.status(400).json({ error: 'Already following' });
    }

    db.data.follows.push({
      id: uuidv4(),
      followerId: currentUserId,
      followingId: targetUserId,
      createdAt: new Date().toISOString()
    });
    db.write();

    res.json({ message: 'Successfully followed' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to follow' });
  }
});

// Unfollow a user
router.delete('/:id/follow', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = req.params.id as string;
    const currentUserId = req.userId!;

    db.data.follows = db.data.follows.filter(f => !(f.followerId === currentUserId && f.followingId === targetUserId));
    db.write();

    res.json({ message: 'Successfully unfollowed' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to unfollow' });
  }
});

export default router;
