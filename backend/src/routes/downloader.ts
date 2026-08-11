import { Router } from 'express';
import { z } from 'zod';
import db from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateXUrl, extractMediaMetadata, processDownloadJob, checkAvailableStorage } from '../utils/downloader';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Save Twitter Cookies
router.post('/cookies', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { cookies } = req.body; // raw document.cookie string
    const user = db.data.users.find(u => u.id === req.userId);
    
    if (user) {
      user.cookies = cookies;
      db.write();
      res.json({ message: 'Cookies saved successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save cookies' });
  }
});

// Check if user has cookies
router.get('/cookies', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = db.data.users.find(u => u.id === req.userId);
  res.json({ hasCookies: !!(user && user.cookies && user.cookies.trim() !== '') });
});

// Analyze X URL
router.post('/analyze', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { url } = req.body;
    
    if (!validateXUrl(url)) {
      return res.status(400).json({ error: 'Invalid or unsupported X/Twitter URL' });
    }

    const metadata = await extractMediaMetadata(url, req.userId!);
    res.json(metadata);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to analyze URL' });
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
    const newJob = {
      id: jobId,
      userId: req.userId!,
      url,
      status: 'QUEUED',
      quality: quality || '720p',
      sizeBytes: estimatedSizeBytes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.data.downloaderJobs.push(newJob);
    db.write();

    // Start async processing without blocking request (Event-driven)
    processDownloadJob(jobId, url, quality, req.userId!)
      .then(async (filePath) => {
        const job = db.data.downloaderJobs.find(j => j.id === jobId);
        if (job) {
          job.status = 'COMPLETED';
          job.filePath = filePath;
          db.write();
        }
      })
      .catch(async (err) => {
        const job = db.data.downloaderJobs.find(j => j.id === jobId);
        if (job) {
          job.status = 'FAILED';
          job.error = err.message;
          db.write();
        }
      });

    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: 'Failed to queue job' });
  }
});

// Get Queue & History
router.get('/jobs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const jobs = db.data.downloaderJobs
      .filter(j => j.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Serve downloaded file to browser
router.get('/download/:jobId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const job = db.data.downloaderJobs.find(j => j.id === req.params.jobId && j.userId === req.userId);
    
    if (!job || !job.filePath) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    res.download(job.filePath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download file' });
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
      output = 'Backend: ONLINE\nActive Workers: 1/1\nDatabase: Connected (JSON)';
      break;
    case 'queue':
      const queuedCount = db.data.downloaderJobs.filter(j => j.status === 'QUEUED').length;
      const processingCount = db.data.downloaderJobs.filter(j => j.status === 'PROCESSING').length;
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
