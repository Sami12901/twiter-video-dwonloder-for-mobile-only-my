import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import db from '../db';

const execAsync = promisify(exec);

// Termux default path fallback
const DOWNLOAD_STORAGE_PATH = process.env.DOWNLOAD_STORAGE_PATH || path.join(process.env.HOME || '', 'storage/downloads/nexus');

// Strict 1-worker concurrency for Realme 11 5G target
let isWorkerActive = false;

// Mocked check for available storage (Termux df command)
export const checkAvailableStorage = async (requiredBytes: number): Promise<boolean> => {
  try {
    return true; // Skipping complex space check for mobile stability
  } catch {
    return true; 
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

const prepareCookies = (userId: string): string | null => {
  const user = db.data.users.find(u => u.id === userId);
  if (!user || !user.cookies || user.cookies.trim() === '') return null;

  try {
    const cookiePath = path.join(process.cwd(), `cookies_${userId}.txt`);
    
    // Convert raw document.cookie into Netscape format
    let netscapeCookies = "# Netscape HTTP Cookie File\n# https://curl.haxx.se/rfc/cookie_spec.html\n# This is a generated file!  Do not edit.\n\n";
    
    const pairs = user.cookies.split(';');
    for (const pair of pairs) {
      const parts = pair.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        // Domain / Path / Secure / Expiry / Name / Value
        netscapeCookies += `.twitter.com\tTRUE\t/\tTRUE\t2147483647\t${key}\t${val}\n`;
        netscapeCookies += `.x.com\tTRUE\t/\tTRUE\t2147483647\t${key}\t${val}\n`;
      }
    }
    
    fs.writeFileSync(cookiePath, netscapeCookies, 'utf8');
    return cookiePath;
  } catch (err) {
    console.error('Failed to parse cookies:', err);
    return null;
  }
};

export const extractMediaMetadata = async (url: string, userId: string) => {
  const cookiePath = prepareCookies(userId);
  let cookieArg = '';
  if (cookiePath) cookieArg = `--cookies "${cookiePath}"`;

  try {
    // Run yt-dlp to get JSON dump
    const { stdout } = await execAsync(`yt-dlp --dump-json ${cookieArg} "${url}"`);
    const data = JSON.parse(stdout);

    if (cookiePath && fs.existsSync(cookiePath)) {
      fs.unlinkSync(cookiePath);
    }

    return {
      title: data.title || 'X Video',
      duration: data.duration || 0,
      qualities: ['360p', '480p', '720p', '1080p'], // Fixed set for UI consistency
      estimatedSizeBytes: data.filesize_approx || data.filesize || (25 * 1024 * 1024), // Fallback to 25MB
    };
  } catch (error: any) {
    if (cookiePath && fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath);
    throw new Error('Failed to extract metadata. Twitter might be blocking guest access or cookies are invalid.');
  }
};

export const processDownloadJob = async (jobId: string, url: string, quality: string, userId: string) => {
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

    const cookiePath = prepareCookies(userId);
    let cookieArg = '';
    if (cookiePath) cookieArg = `--cookies "${cookiePath}"`;

    // Map quality string to yt-dlp format
    let formatArg = '';
    const heightMatch = quality.match(/(\d+)p/);
    if (heightMatch) {
      const h = heightMatch[1];
      formatArg = `-f "bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best"`;
    } else {
      formatArg = `-f "best"`;
    }

    console.log(`[Downloader] Starting download for ${url} at ${quality}`);
    
    // Download using yt-dlp
    await execAsync(`yt-dlp ${formatArg} ${cookieArg} --merge-output-format mp4 -o "${finalPath}" "${url}"`);

    if (cookiePath && fs.existsSync(cookiePath)) {
      fs.unlinkSync(cookiePath);
    }

    if (!fs.existsSync(finalPath)) {
      throw new Error('yt-dlp finished but file was not found.');
    }

    return finalPath;
  } catch (error: any) {
    console.error('[FFmpeg/yt-dlp] Error processing video:', error.message);
    throw new Error('Failed to process video: ' + (error.message || 'Unknown error'));
  } finally {
    // Cooldown applied for thermal management
    setTimeout(() => {
      isWorkerActive = false;
    }, 2000); 
  }
};
