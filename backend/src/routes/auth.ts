import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../index';
import crypto from 'crypto';

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

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed', details: error });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
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

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

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
    await prisma.session.deleteMany({
      where: { token },
    });
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

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, username: true, email: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  res.json({ user: session.user });
});

export default router;
