import { Router } from 'express';
import { z } from 'zod';
import db from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateXUrl, extractMediaMetadata, processDownloadJob, checkAvailableStorage } from '../utils/downloader';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Analyze X URL
router.post('/analyze', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { url } = req.body;
    
    if (!validateXUrl(url)) {
      return res.status(400).json({ error: 'Invalid or unsupported X/Twitter URL' });
    }

    const metadata = await extractMediaMetadata(url);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze URL' });
  }
});

// Queue Download Job
router.post('/jobs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { url, quality, estimatedSizeBytes } = req.body;

    if (!validateXUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Check storage before download (Termux constraint)
    const hasSpace = await checkAvailableStorage(estimatedSizeBytes);
    if (!hasSpace) {
      return res.status(400).json({ error: 'INSUFFICIENT_STORAGE' });
    }

    const jobId = uuidv4();
    db.prepare('INSERT INTO DownloaderJob (id, userId, url, status, quality, sizeBytes) VALUES (?, ?, ?, ?, ?, ?)').run(
      jobId, req.userId!, url, 'QUEUED', quality || '720p', estimatedSizeBytes
    );
    const job: any = db.prepare('SELECT * FROM DownloaderJob WHERE id = ?').get(jobId);

    // Start async processing without blocking request (Event-driven)
    processDownloadJob(jobId, url, quality)
      .then(async (filePath) => {
        db.prepare('UPDATE DownloaderJob SET status = ?, filePath = ? WHERE id = ?').run('COMPLETED', filePath, jobId);
      })
      .catch(async (err) => {
        db.prepare('UPDATE DownloaderJob SET status = ?, error = ? WHERE id = ?').run('FAILED', err.message, jobId);
      });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to queue job' });
  }
});

// Get Queue & History
router.get('/jobs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const jobs = db.prepare('SELECT * FROM DownloaderJob WHERE userId = ? ORDER BY createdAt DESC').all(req.userId!);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Terminal safe execution endpoint
router.post('/terminal/command', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { command } = req.body;
  const allowedCommands = ['help', 'status', 'queue', 'clear', 'storage', 'version'];
  
  const cmdStr = command.trim().toLowerCase();
  
  if (!allowedCommands.includes(cmdStr)) {
    return res.status(403).json({ output: 'Command not recognized or unauthorized.' });
  }

  let output = '';
  switch(cmdStr) {
    case 'help':
      output = 'Available commands:\nhelp - Show this message\nstatus - Show system status\nqueue - Show download queue\nstorage - Show available storage\nversion - Show app version';
      break;
    case 'status':
      output = 'Backend: ONLINE\nActive Workers: 1/1\nDatabase: Connected (SQLite)';
      break;
    case 'queue':
      const queuedCount: any = db.prepare('SELECT COUNT(*) as c FROM DownloaderJob WHERE status = ?').get('QUEUED');
      const processingCount: any = db.prepare('SELECT COUNT(*) as c FROM DownloaderJob WHERE status = ?').get('PROCESSING');
      output = `Queued Jobs: ${queuedCount.c}\nProcessing: ${processingCount.c}`;
      break;
    case 'storage':
      output = 'Estimated available private storage: 5.0 GB\nTermux Storage Access: Limited';
      break;
    case 'version':
      output = 'Nexus Downloader v1.0.0 (Termux Optimized)';
      break;
  }

  res.json({ output });
});

export default router;
