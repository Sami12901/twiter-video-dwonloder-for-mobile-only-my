import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Termux default path fallback
const DOWNLOAD_STORAGE_PATH = process.env.DOWNLOAD_STORAGE_PATH || path.join(process.env.HOME || '', 'storage/downloads/nexus');

// Strict 1-worker concurrency for Realme 11 5G target
let isWorkerActive = false;

// Mocked check for available storage (Termux df command)
export const checkAvailableStorage = async (requiredBytes: number): Promise<boolean> => {
  try {
    // In a real Termux env, we'd run `df -k /storage/emulated/0`
    // For this implementation, we assume we have 5GB free always
    const assumedFreeBytes = 5 * 1024 * 1024 * 1024; // 5GB
    return assumedFreeBytes > requiredBytes;
  } catch {
    return true; // Fallback
  }
};

export const validateXUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const validDomains = ['twitter.com', 'x.com', 'fxtwitter.com', 'vxtwitter.com'];
    return validDomains.includes(parsed.hostname) && parsed.pathname.includes('/status/');
  } catch {
    return false;
  }
};

export const extractMediaMetadata = async (url: string) => {
  // In a real scenario, this would use the cookie profile to fetch X/Twitter API
  // or use an internal scraper. We mock it for the architectural implementation.
  return {
    title: 'X Video',
    duration: 120,
    qualities: ['360p', '480p', '720p', '1080p'],
    estimatedSizeBytes: 25 * 1024 * 1024, // 25 MB
  };
};

export const processDownloadJob = async (jobId: string, url: string, quality: string) => {
  if (isWorkerActive) {
    throw new Error('Worker is busy. Max 1 concurrent download allowed.');
  }

  isWorkerActive = true;
  
  try {
    if (!fs.existsSync(DOWNLOAD_STORAGE_PATH)) {
      fs.mkdirSync(DOWNLOAD_STORAGE_PATH, { recursive: true });
    }

    const fileName = `x_video_${jobId}_${quality}.mp4`;
    const finalPath = path.join(DOWNLOAD_STORAGE_PATH, fileName);

    // Simulated download streaming to disk (no RAM buffer)
    console.log(`[Downloader] Starting stream to ${finalPath}`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate 5s download

    // Simulated FFmpeg processing (1 worker only)
    console.log(`[FFmpeg] Processing video at ${finalPath}`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate 3s processing

    return finalPath;
  } finally {
    // Cooldown applied for thermal management
    setTimeout(() => {
      isWorkerActive = false;
    }, 2000); 
  }
};
