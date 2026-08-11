import { Router } from 'express';
import { prisma } from '../index';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get Profile by Username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        profile: true,
        _count: {
          select: { followers: true, following: true, posts: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Follow a user
router.post('/:id/follow', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId!;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      }
    });

    res.json({ message: 'Successfully followed' });
  } catch (error) {
    res.status(400).json({ error: 'Already following or invalid user' });
  }
});

// Unfollow a user
router.delete('/:id/follow', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId!;

    await prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: targetUserId,
      }
    });

    res.json({ message: 'Successfully unfollowed' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to unfollow' });
  }
});

export default router;
