import React from 'react';
import { Users, Database, Server, Settings } from 'lucide-react';

export const Admin = () => {
  return (
    <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6">System Administration</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[var(--text-muted)] text-sm">Total Users</div>
            <div className="text-2xl font-bold">1,248</div>
          </div>
        </div>
        
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] flex items-center gap-4">
          <div className="p-4 bg-green-500/10 text-green-500 rounded-full">
            <Database size={24} />
          </div>
          <div>
            <div className="text-[var(--text-muted)] text-sm">SQLite Size</div>
            <div className="text-2xl font-bold">14.2 MB</div>
          </div>
        </div>
        
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] flex items-center gap-4">
          <div className="p-4 bg-purple-500/10 text-purple-500 rounded-full">
            <Server size={24} />
          </div>
          <div>
            <div className="text-[var(--text-muted)] text-sm">FFmpeg Workers</div>
            <div className="text-2xl font-bold">1 / 1 (Max)</div>
          </div>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] flex items-center gap-4 cursor-pointer hover:bg-[var(--border)] transition-colors">
          <div className="p-4 bg-gray-500/10 text-gray-500 rounded-full">
            <Settings size={24} />
          </div>
          <div>
            <div className="text-xl font-bold">Platform Settings</div>
          </div>
        </div>
      </div>
    </div>
  );
};
