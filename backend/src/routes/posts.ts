import { Router } from 'express';
import { z } from 'zod';
import db from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

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
    const postId = uuidv4();
    
    const newPost = {
      id: postId,
      content: content || null,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      userId: req.userId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.data.posts.push(newPost);
    db.write();

    const user = db.data.users.find(u => u.id === req.userId);

    const postResponse = {
      ...newPost,
      user: { id: user?.id, username: user?.username }
    };

    res.status(201).json(postResponse);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create post', details: error });
  }
});

// Get Feed (Timeline)
router.get('/feed', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const sortedPosts = [...db.data.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);

    const postsResponse = sortedPosts.map(p => {
      const u = db.data.users.find(u => u.id === p.userId);
      return {
        ...p,
        user: { id: u?.id, username: u?.username }
      };
    });

    res.json(postsResponse);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

export default router;
