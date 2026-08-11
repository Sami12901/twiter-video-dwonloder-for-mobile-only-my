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
    
    db.prepare('INSERT INTO Post (id, content, mediaUrl, mediaType, userId) VALUES (?, ?, ?, ?, ?)').run(
      postId, content || null, mediaUrl || null, mediaType || null, req.userId
    );

    const postRow: any = db.prepare(`
      SELECT p.*, u.username as u_username 
      FROM Post p JOIN User u ON p.userId = u.id 
      WHERE p.id = ?
    `).get(postId);

    const post = {
      ...postRow,
      user: { id: postRow.userId, username: postRow.u_username }
    };

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create post', details: error });
  }
});

// Get Feed (Timeline)
router.get('/feed', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.*, u.username as u_username 
      FROM Post p JOIN User u ON p.userId = u.id 
      ORDER BY p.createdAt DESC LIMIT 50
    `).all() as any[];

    const posts = rows.map(r => ({
      ...r,
      user: { id: r.userId, username: r.u_username }
    }));

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

export default router;
