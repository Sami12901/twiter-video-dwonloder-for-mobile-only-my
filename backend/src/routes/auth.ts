import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../db';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);

    const existingUser = db.prepare('SELECT * FROM User WHERE email = ? OR username = ?').get(email, username);

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare('INSERT INTO User (id, username, email, password) VALUES (?, ?, ?, ?)').run(userId, username, email, hashedPassword);

    res.status(201).json({ message: 'User created successfully', userId });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed', details: error });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user: any = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    const sessionId = uuidv4();

    db.prepare('INSERT INTO Session (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)').run(sessionId, user.id, token, expiresAt.toISOString());

    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({ message: 'Logged in successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Login failed', details: error });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  const token = req.cookies.session_token;
  
  if (token) {
    db.prepare('DELETE FROM Session WHERE token = ?').run(token);
  }

  res.clearCookie('session_token');
  res.json({ message: 'Logged out successfully' });
});

// Get Current Session
router.get('/session', async (req, res) => {
  const token = req.cookies.session_token;

  if (!token) {
    return res.status(401).json({ error: 'No active session' });
  }

  const session: any = db.prepare(`
    SELECT s.*, u.id as u_id, u.username as u_username, u.email as u_email 
    FROM Session s 
    JOIN User u ON s.userId = u.id 
    WHERE s.token = ?
  `).get(token);

  if (!session || new Date(session.expiresAt) < new Date()) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  res.json({ user: { id: session.u_id, username: session.u_username, email: session.u_email } });
});

export default router;
