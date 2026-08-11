import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const createPostSchema = z.object({
  content: z.string().max(280).optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
}).refine(data => data.content || data.mediaUrl, {
  message: "Post must contain either content or media",
});

// Create Post
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { content, mediaUrl, mediaType } = createPostSchema.parse(req.body);
    
    const post = await prisma.post.create({
      data: {
        content,
        mediaUrl,
        mediaType,
        userId: req.userId!,
      },
      include: {
        user: { select: { id: true, username: true, profile: true } }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create post', details: error });
  }
});

// Get Feed (Timeline)
router.get('/feed', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Basic feed: all posts ordered by newest
    // In Phase 3, this will be filtered by 'following'
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, username: true, profile: true } }
      }
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

export default router;
