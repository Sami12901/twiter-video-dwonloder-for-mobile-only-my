import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1'; // Realme 11 5G target constraint

export const prisma = new PrismaClient();

app.use(cors({
  origin: 'http://127.0.0.1:5173', // Vite default port
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

import authRouter from './routes/auth';
import postsRouter from './routes/posts';
import usersRouter from './routes/users';
import downloaderRouter from './routes/downloader';

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
    storage: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/downloader', downloaderRouter);

// Start the server
app.listen(Number(port), host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
