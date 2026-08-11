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

    const existingUser = db.data.users.find(u => u.email === email || u.username === username);

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.data.users.push({
      id: userId, username, email, password: hashedPassword,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    db.write();

    res.status(201).json({ message: 'User created successfully', userId });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed', details: error });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = db.data.users.find(u => u.email === email);
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

    db.data.sessions.push({
      id: sessionId, userId: user.id, token, expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    });
    db.write();

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
    db.data.sessions = db.data.sessions.filter(s => s.token !== token);
    db.write();
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

  const session = db.data.sessions.find(s => s.token === token);
  const user = session ? db.data.users.find(u => u.id === session.userId) : null;

  if (!session || !user || new Date(session.expiresAt) < new Date()) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  res.json({ user: { id: user.id, username: user.username, email: user.email } });
});

export default router;
