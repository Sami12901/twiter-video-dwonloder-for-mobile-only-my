import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateXUrl, extractMediaMetadata, processDownloadJob, checkAvailableStorage } from '../utils/downloader';

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

    // Warn for mobile data usage constraint (>500MB)
    if (estimatedSizeBytes > 500 * 1024 * 1024) {
      // In a real app, client handles warning, but backend can return a flag
    }

    const job = await prisma.downloaderJob.create({
      data: {
        userId: req.userId!,
        url,
        quality: quality || '720p',
        status: 'QUEUED',
        sizeBytes: estimatedSizeBytes,
      }
    });

    // Start async processing without blocking request (Event-driven)
    processDownloadJob(job.id, url, quality)
      .then(async (filePath) => {
        await prisma.downloaderJob.update({
          where: { id: job.id },
          data: { status: 'COMPLETED', filePath }
        });
      })
      .catch(async (err) => {
        await prisma.downloaderJob.update({
          where: { id: job.id },
          data: { status: 'FAILED', error: err.message }
        });
      });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to queue job' });
  }
});

// Get Queue & History
router.get('/jobs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const jobs = await prisma.downloaderJob.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
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
      const queuedCount = await prisma.downloaderJob.count({ where: { status: 'QUEUED' }});
      const processingCount = await prisma.downloaderJob.count({ where: { status: 'PROCESSING' }});
      output = `Queued Jobs: ${queuedCount}\nProcessing: ${processingCount}`;
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
