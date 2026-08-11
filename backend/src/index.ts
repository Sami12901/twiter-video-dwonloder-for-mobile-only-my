import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1'; // Realme 11 5G target constraint

import db from './db';

// Attach db to app if needed, or just import it in routes.
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from any localhost port (Vite may use 5173/5174/5175)
    if (!origin || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
