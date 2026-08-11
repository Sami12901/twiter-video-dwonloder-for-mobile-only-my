import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Download, TerminalSquare, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

export const Downloader = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState('');
  
  // Cookie Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [cookiesStr, setCookiesStr] = useState('');
  const [hasCookies, setHasCookies] = useState(false);
  const [isSavingCookies, setIsSavingCookies] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/downloader/jobs');
      setJobs(response.data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  const checkCookies = async () => {
    try {
      const res = await api.get('/downloader/cookies');
      setHasCookies(res.data.hasCookies);
    } catch (err) {
      console.error('Failed to check cookies', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    checkCookies();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveCookies = async () => {
    if (!cookiesStr.trim()) return;
    setIsSavingCookies(true);
    try {
      await api.post('/downloader/cookies', { cookies: cookiesStr });
      setCookiesStr('');
      setShowSettings(false);
      checkCookies();
      alert('Cookies saved successfully!');
    } catch (err) {
      alert('Failed to save cookies');
    } finally {
      setIsSavingCookies(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setError('');
    setMetadata(null);
    setIsAnalyzing(true);
    
    try {
      const response = await api.post('/downloader/analyze', { url });
      setMetadata(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze URL');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async (quality: string) => {
    try {
      await api.post('/downloader/jobs', {
        url,
        quality,
        estimatedSizeBytes: metadata.estimatedSizeBytes
      });
      setMetadata(null);
      setUrl('');
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to queue download');
    }
  };

  const handleDownloadFile = async (jobId: string) => {
    try {
      const response = await api.get(`/downloader/download/${jobId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nexus_video_${jobId.substring(0, 8)}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Failed to download file to device');
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'QUEUED': return <Clock size={16} className="text-yellow-500" />;
      case 'PROCESSING': return <Download size={16} className="text-blue-500 animate-bounce" />;
      case 'COMPLETED': return <CheckCircle size={16} className="text-green-500" />;
      case 'FAILED': return <XCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TerminalSquare className="text-[var(--color-primary)]" size={28} />
          <h1 className="text-2xl font-bold">X Video Downloader</h1>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)] transition-colors flex items-center gap-2"
        >
          {hasCookies ? <span className="text-green-500">● Cookies Active</span> : <span className="text-yellow-500">● No Cookies</span>}
          Settings
        </button>
      </div>

      {showSettings && (
        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] mb-6 shadow-lg z-10 relative">
          <h2 className="text-xl font-bold mb-3">Twitter Cookie Collector</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Twitter often blocks guest downloads. To fix this, provide your Twitter cookies.
          </p>
          
          <div className="bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)] mb-4">
            <h3 className="font-bold text-sm mb-2 text-yellow-500">Mobile Trick (Bookmarklet)</h3>
            <ol className="text-xs text-[var(--text-muted)] list-decimal pl-4 space-y-1 mb-2">
              <li>Copy the code below</li>
              <li>Create a new bookmark in Chrome and paste the code into the URL field</li>
              <li>Go to <strong>x.com</strong> and click the bookmark</li>
              <li>Your cookies will be copied! Come back here and paste them below.</li>
            </ol>
            <textarea 
              readOnly 
              className="w-full text-xs font-mono bg-black/50 text-green-400 p-2 rounded border border-[var(--border)] h-16 cursor-text"
              value={`javascript:(function(){navigator.clipboard.writeText(document.cookie).then(()=>alert('Cookies copied!')).catch(()=>prompt('Copy this:',document.cookie));})();`}
            />
          </div>

          <label className="block text-sm font-medium mb-2">Paste Raw Cookies</label>
          <textarea
            value={cookiesStr}
            onChange={(e) => setCookiesStr(e.target.value)}
            placeholder="auth_token=...; ct0=...;"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors mb-3 h-24"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 rounded-lg font-medium text-sm border border-[var(--border)] hover:bg-[var(--bg)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCookies}
              disabled={isSavingCookies || !cookiesStr.trim()}
              className="px-4 py-2 rounded-lg font-bold text-sm bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {isSavingCookies ? 'Saving...' : 'Save Cookies'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] mb-6 shadow-sm">
        <form onSubmit={handleAnalyze}>
          <label className="block text-sm font-medium mb-2 text-[var(--text)]">Paste X/Twitter Video URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://x.com/user/status/..."
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isAnalyzing || !url}
              className="bg-[var(--color-primary)] text-white font-bold px-6 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2 text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {metadata && (
          <div className="mt-4 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
            <h3 className="font-bold text-lg mb-1">{metadata.title}</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">Estimated Size: {(metadata.estimatedSizeBytes / 1024 / 1024).toFixed(1)} MB</p>
            
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {metadata.qualities.map((q: string) => (
                <button
                  key={q}
                  onClick={() => handleDownload(q)}
                  className="py-2 px-4 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition-colors font-medium text-sm"
                >
                  Download {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">Download History</h2>
      
      <div className="space-y-3 flex-1 overflow-y-auto pb-20">
        {jobs.length === 0 ? (
          <p className="text-[var(--text-muted)] text-center py-8">No downloads yet.</p>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="truncate flex-1">
                <div className="text-sm font-medium truncate">{job.url}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2">
                  <span>{job.quality}</span>
                  <span>·</span>
                  <span>{new Date(job.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">{job.status}</span>
                  {getStatusIcon(job.status)}
                </div>
                {job.status === 'COMPLETED' && (
                  <button
                    onClick={() => handleDownloadFile(job.id)}
                    className="text-xs font-bold bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
                  >
                    Save to Device
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
